# 贡献指南

想给 JobPulse 提 PR？先看这里。

## 提 issue

- 提 bug：用 [Bug 报告模板]（如果有）
- 提功能请求：先在 [issues](https://github.com/Natural-pride/JobPulse/issues) 搜过再说，别重复
- 提问题：用 [Discussions](https://github.com/Natural-pride/JobPulse/discussions) 比 issue 更合适

## 提 PR

1. Fork 仓库，从 `master` 切新分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. 本地跑测试确认是绿的：
   ```bash
   npm install
   npm test
   ```
3. 改完代码，加测试用例
4. 提交，commit message 用中文或英文都行，描述清楚"为什么改"而不是"改了什么"
5. 推到你 fork 的分支
6. 提 PR，**title 写明目的**（不要写"fix typo"），body 里贴上关联的 issue 编号

## 开发环境

- Node.js 20+（better-sqlite3 需要 Node 20 的 prebuilt binaries）
- 操作系统：开发在 Windows 11 上跑过，理论上 macOS / Linux 都能跑
- 浏览器：Chrome / Edge / Firefox 任一现代浏览器

## 代码规范

### 后端
- TypeScript strict
- 入参必须过 Zod 校验（看 `backend/src/validate.ts`）
- 新增 API 端点必须带 Vitest 测试
- 数据库迁移只能加列、不能破坏老数据（看 `backend/src/db.ts` 的迁移函数）

### 前端
- TypeScript strict
- 组件命名 PascalCase
- 工具函数放 `frontend/src/lib/`，纯函数，方便单元测试
- 避免组件超过 300 行；超过就拆
- 状态颜色：参考 `frontend/src/lib/cardStyle.ts` 和 `frontend/src/lib/status.ts`，不要临时造配色

## 测试

后端用 Vitest，55 个用例：

```bash
npm test                # 跑全部
npm test -- --watch     # 监听文件变化
```

新功能至少加 1 个测试覆盖 happy path；如果有边界情况，每个边界 1 个。

## 目录速查

```
backend/
  src/
    db.ts              # SQLite 初始化 + 迁移
    types.ts           # 共享类型
    validate.ts        # Zod schemas
    routes/            # REST handlers
    lib/               # 工具（智谱客户端等）
  tests/               # Vitest 用例

frontend/
  src/
    pages/             # 路由级页面
    components/        # 业务组件
    components/dashboard/   # 仪表盘子组件
    lib/               # 纯函数
    hooks/             # 自定义 hooks
    api/               # fetch 封装
    types.ts           # 共享类型（镜像后端）

docs/                  # 项目文档（架构 / 数据模型 / API / 开发 / 路线图）
```

## 提 PR 前 checklist

- [ ] `npm test` 全绿
- [ ] 后端改了 `db.ts` 的 schema，本地数据库有迁移过、能起来
- [ ] 前端改了组件，在浏览器手动过了一遍
- [ ] 没有把 `.env` / `.db` / `node_modules` / `dist` 提交进 git（`.gitignore` 应该挡住，但 PR 之前 `git status` 看一眼）
- [ ] commit message 描述了"为什么"
- [ ] 如果改了 README / docs，更新对应章节

## 不接受的 PR 类型

- **大改 UI 风格**：项目有自己的设计语言（Indigo + 单色 + 卡片化），不要重做配色 / 字体 / 布局
- **加 SaaS 化功能**：本项目坚持本地优先，不接账号系统、不上云同步
- **加 AI 模拟面试**：之前评估过，离"追踪面试"这个核心目标太远
- **加移动端原生支持**：工作量是 3-5 倍，先把桌面端打磨好
- **引入新的重型依赖**：每加一个 `package.json` 依赖都要在 PR 描述里说明为什么

## 第一次贡献

没找到可以从哪里下手？这些是好入口：

- 在 [issues](https://github.com/Natural-pride/JobPulse/issues) 里找 `good first issue` 标签
- 修文档的错别字或写得不清楚的地方（PR 可以只改一个文件）
- 加 Vitest 用例（后端 `tests/` 目录有现成模板）
- 翻译 README 到其他语言

## 行为准则

互相尊重。技术问题对事不对人。如果觉得某个 PR 的设计不对，直接说出你的理由，不要人身攻击。

[Bug 报告模板]: #（如果有 GitHub Issue 模板，链接过去）
