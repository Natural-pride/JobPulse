# JobPulse

个人面试进度追踪工具。本地 Web 应用，数据存在本地 SQLite 文件。

## 启动

```bash
npm install
npm run dev:all
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001

数据库文件：`data/jobpulse.db`（首次启动自动创建）。

## 备份

复制 `data/jobpulse.db` 到安全位置即可。停止服务后复制最安全。

## 开发

```bash
# 只跑后端
npm run dev:backend

# 只跑前端
npm run dev:frontend

# 跑后端测试
npm test
```

## 项目结构

- `backend/` — Express + SQLite + vitest
- `frontend/` — Vite + React + TS + Tailwind
- `docs/superpowers/` — 设计文档 + 实现计划

## 手动冒烟测试

按顺序验证：

1. 打开 http://localhost:5173 → 仪表盘 4 个统计卡都是 0
2. 仪表盘点"+ 新建面试机会" → 跳到表单
3. 展开「基本信息」，填「测试公司」「测试岗位」，点保存
4. 跳到详情页，应该看到 4 张概览卡片（薪资/工时/福利/双休都是 "—"）
5. 点"+ 添加轮次" → 填时间，保存
6. 轮次显示在时间轴
7. 仪表盘 4 张卡 +1 出现在"即将到来"
8. 回到详情，把状态改成"已拒绝"
9. 仪表盘"已拒绝"卡 +1
10. 重启服务，数据还在

如果某一步失败，看 `backend` 控制台 + 浏览器 devtools console。
