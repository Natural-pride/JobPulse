# 部署文件

把 JobPulse 部署到腾讯云 CVM + Cloudflare Tunnel 需要的全部文件。

**完整步骤在根目录 [`CLOUD.md`](../CLOUD.md) 里。**

## 目录

```
deploy/
├── README.md                       # 本文件
├── systemd/
│   └── jobpulse.service            # 后端进程守护（systemd unit）
├── nginx/
│   └── jobpulse.conf               # nginx 站点配置（静态 + 反代）
└── scripts/
    ├── backup.sh                   # 每日 SQLite 备份
    └── install-cloudflared.sh      # cloudflared 配置 + 安装为服务
```

## 部署流程

1. 买 CVM（Ubuntu 22.04）
2. 装 Node 20 + nginx + cloudflared
3. 拉代码 + `npm install` + `npm run build`
4. 复制本目录的文件到对应位置（`/etc/systemd/system/`, `/etc/nginx/sites-available/`, `~/`）
5. 启动：`systemctl enable --now jobpulse cloudflared`

详细命令、文件位置、验证清单见 [`CLOUD.md`](../CLOUD.md)。

## 各文件用途

### `systemd/jobpulse.service`

后端 Express 进程的守护单元。  
- 用户：`jobpulse`（不要用 root 跑）
- 工作目录：`/home/jobpulse/JobPulse`
- 启动命令：`node backend/dist/server.js`
- 环境变量从 `backend/.env` 加载
- 失败自动重启
- 日志进 journald（`journalctl -u jobpulse -f`）

### `nginx/jobpulse.conf`

nginx 站点配置。  
- 监听 80 端口
- `/` → `frontend/dist/` 静态托管（SPA fallback 到 `index.html`）
- `/api/` → 反代到 `127.0.0.1:3001`（后端）
- `/assets/` → 1 年缓存（Vite 输出的 hash 文件名）
- 阻止 `.` 开头文件访问（防源码泄漏）

### `scripts/backup.sh`

每日 0 3 点跑的 cron 脚本。  
- 用 SQLite 的 `.backup` 命令做热备（不需要停服务）
- 输出到 `/home/jobpulse/backups/backup-YYYYMMDD.db.gz`
- 自动删除 7 天前的备份
- 压缩后约节省 10x 空间

### `scripts/install-cloudflared.sh`

Cloudflare Tunnel 配置 + systemd 化。  
- 把 `<UUID>` 替换成 `cloudflared tunnel create jobpulse` 输出的实际 UUID
- 写 `/etc/cloudflared/config.yml`
- 用 `cloudflared service install` 注册为 systemd 服务
- 日志：`journalctl -u cloudflared -f`

## 安全注意

- 后端 3001 端口只绑 127.0.0.1，不要在腾讯云防火墙开放
- 腾讯云安全组只开 22 (SSH) + 80 (HTTP)
- 关闭 SSH 密码登录（用密钥）
- `backend/.env` 权限设为 600
- 定期 `apt upgrade` 修漏洞
- 数据库文件 + 备份不要传到公网对象（如果以后接 COS，配私有 bucket）
