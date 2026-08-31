# 部署到腾讯云 CVM

从 0 到能在浏览器远程访问的完整流程。**预计 1-2 小时**（含 CVM 启动等待）。

## 架构

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────┐
│   Browser       │    │   Cloudflare     │    │  Tencent CVM │
│   (你)          │◀──▶│   Tunnel         │◀──▶│  (Ubuntu)    │
│                 │    │  (公网入口)       │    │              │
│                 │    │  自动 HTTPS       │    │  3001: 后端  │
│                 │    │  免费             │    │   80: nginx  │
└─────────────────┘    └──────────────────┘    └──────────────┘
```

端口规划：
- 22 (SSH)：公网开放（仅密钥认证）
- 80 (HTTP)：Cloudflare Tunnel 反代到这里
- 3001 (后端)：**只绑 127.0.0.1**，不暴露公网

## 前置条件

- 一个腾讯云账号
- 本地能 SSH（Mac/Linux 终端 / Windows PowerShell + OpenSSH）
- 项目已经在 GitHub 公开

## 阶段 1：买并初始化 CVM

### 1.1 买轻量应用服务器

腾讯云控制台 → 轻量应用服务器 → 新建：

| 配置 | 推荐 |
|---|---|
| 镜像 | Ubuntu 22.04 LTS（24.04 也行） |
| 套餐 | 2 核 2GB |
| 带宽 | 3 Mbps 够用 |
| 地区 | 广州 / 上海 / 北京 / 南京（国内，便宜） |
| 购买时长 | 至少 1 个月 |

记下：
- **公网 IP**（控制台会显示）
- **root 密码**（首次登录用）

### 1.2 防火墙规则

腾讯云控制台 → 防火墙 → 添加规则：

| 端口 | 协议 | 来源 | 备注 |
|---|---|---|---|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP（给 cloudflared 用） |

**只开这两个**。后端 3001 不开——Cloudflare Tunnel 走本地连接。

### 1.3 SSH 密钥登录

在本地：

```bash
# 生成密钥（如果还没有）
ssh-keygen -t ed25519 -C "your@email.com"

# 复制公钥到服务器
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<CVM_PUBLIC_IP>

# 验证
ssh root@<CVM_PUBLIC_IP>  # 不应该再问密码
```

服务器上关掉密码登录：

```bash
sudo sed -i 's/^#\?PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

## 阶段 2：装基础软件

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl ufw

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node -v    # v20.x
npm -v     # 10.x
nginx -v
```

### 系统防火墙（ufw）

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status
```

## 阶段 3：拉代码并构建

```bash
# 创建普通用户
sudo useradd -m -s /bin/bash jobpulse
sudo usermod -aG sudo jobpulse
sudo -u jobpulse -i

# 拉代码
git clone https://github.com/Natural-pride/JobPulse.git
cd JobPulse
npm install
npm run build
```

### 环境变量

```bash
cat > backend/.env << 'EOF'
PORT=3001
ZHIPU_API_KEY=your_zhipu_key_here
EOF

chmod 600 backend/.env
```

### 数据目录

```bash
mkdir -p backend/data
```

## 阶段 4：systemd 守护后端

把 `deploy/systemd/jobpulse.service` 复制到 `/etc/systemd/system/`：

```bash
sudo cp deploy/systemd/jobpulse.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable jobpulse
sudo systemctl start jobpulse
sudo systemctl status jobpulse    # 应该是 active (running)
```

测试：

```bash
curl http://127.0.0.1:3001/api/opportunities
# 应该返回 [] 或者你已有的数据
```

## 阶段 5：nginx 配静态 + 反代

```bash
sudo cp deploy/nginx/jobpulse.conf /etc/nginx/sites-available/jobpulse
sudo ln -s /etc/nginx/sites-available/jobpulse /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t                              # 测语法
sudo systemctl reload nginx
```

测试：

```bash
curl -I http://127.0.0.1
# 应该返回 200，前端 index.html
```

## 阶段 6：Cloudflare Tunnel

### 6.1 安装 cloudflared

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install -y cloudflared
cloudflared --version
```

### 6.2 登录 + 创建隧道

```bash
cloudflared tunnel login
# 浏览器打开打印的 URL，登录 Cloudflare 账号授权
# 授权完生成 ~/.cloudflared/cert.pem

cloudflared tunnel create jobpulse
# 打印 UUID，生成 ~/.cloudflared/<UUID>.json
# 记下 UUID
```

### 6.3 写配置

直接用 `deploy/scripts/install-cloudflared.sh` 脚本：

```bash
# 替换里面的 <UUID> 占位符
sed -i 's/<UUID>/你的实际 UUID/g' deploy/scripts/install-cloudflared.sh

# 跑脚本
sudo bash deploy/scripts/install-cloudflared.sh

# 启动
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo journalctl -u cloudflared -f
# 日志会显示 https://xxx.trycloudflare.com 的 URL
```

**在浏览器打开那个 URL**，应该能看到 JobPulse 界面。

## 阶段 7：自动备份

```bash
# 复制备份脚本
cp deploy/scripts/backup.sh /home/jobpulse/backup.sh
chmod +x /home/jobpulse/backup.sh

# 手动测一次
/home/jobpulse/backup.sh
ls -la /home/jobpulse/backups/
# 应该看到 backup-YYYYMMDD.db

# 加 cron
crontab -e
# 加一行：每天凌晨 3 点备份
0 3 * * * /home/jobpulse/backup.sh >> /home/jobpulse/backup.log 2>&1
```

## 阶段 8：访问验证清单

打开 `https://xxx.trycloudflare.com`：

- [ ] 看到仪表盘
- [ ] 创建一个新机会
- [ ] 试上传截图（如果有 ZHIPU_API_KEY）
- [ ] 在手机浏览器打开同一个 URL
- [ ] 数据库 `backend/data/jobpulse.db` 在服务器上确实存在

## 阶段 9：维护

### 升级代码

```bash
ssh root@<CVM_IP>
sudo -u jobpulse -i
cd JobPulse
git pull
npm install
npm run build
exit
sudo systemctl restart jobpulse
```

### 查看日志

```bash
sudo journalctl -u jobpulse -f
sudo journalctl -u cloudflared -f
sudo tail -f /var/log/nginx/access.log
```

### 备份还原

```bash
sudo systemctl stop jobpulse
ls -la /home/jobpulse/backups/
cp /home/jobpulse/backups/backup-20260831.db /home/jobpulse/JobPulse/backend/data/jobpulse.db
sudo chown jobpulse:jobpulse /home/jobpulse/JobPulse/backend/data/jobpulse.db
sudo systemctl start jobpulse
```

## 已知问题

| 现象 | 原因 | 解决 |
|---|---|---|
| Tunnel 启动后没 URL | config.yml 路径错 | 检查 `/etc/cloudflared/config.yml` |
| nginx 502 | 后端没启动 | `sudo systemctl status jobpulse` |
| 前端 404 | build 没跑 | `ls /home/jobpulse/JobPulse/frontend/dist/index.html` |
| 智谱 502 | key 没配 | `cat /home/jobpulse/JobPulse/backend/.env` |
| 磁盘满 | 备份没清 | 删 `/home/jobpulse/backups/` 老的 |

## 下一步（不在本次范围）

- 邮件提醒（QQ SMTP + cron）
- 自己的域名（替换 trycloudflare URL）
- 腾讯云 COS 异地备份
