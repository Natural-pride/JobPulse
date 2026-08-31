# JobPulse

> 个人面试流水线追踪工具 · 简历投出去那一刻到入职那天，每一步都不漏

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933)](https://nodejs.org)
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20SQLite-4338ca)](#技术栈)
[![Tests](https://img.shields.io/badge/tests-55%20passing-22c55e)](#测试)

本机跑的轻量 Web 应用。投递了哪些公司、卡在哪一轮、HR 已读未回还是已约面——一页看完。
没有云端依赖，没有账号系统，所有数据就一个 `data/jobpulse.db` 文件，随时备份随时搬走。

<!-- SCREENSHOT_PLACEHOLDER: 替换为仪表盘截图 -->
![仪表盘预览](docs/screenshot-dashboard.png)

## 目录

- [为什么做这个](#为什么做这个)
- [核心特性](#核心特性)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [功能详解](#功能详解)
- [数据存储与备份](#数据存储与备份)
- [环境变量](#环境变量)
- [开发与测试](#开发与测试)
- [Roadmap](#roadmap)
- [贡献](#贡献)
- [许可](#许可)

## 为什么做这个

求职期间用过 Excel、Notion 表格、各类 SaaS 工具，最后都因为「要么太重、要么数据锁在云端、要么不符合中文招聘流程」而放弃。JobPulse 解决三个问题：

1. **中文招聘流程有它自己的状态**：BOSS 聊完投了简历、HR 说"等回音"、被默拒、拿到 offer 拒掉、干了两个月又跳——这些状态英文工具 cover 不到
2. **数据属于用户**：单机 SQLite，复制一份 `.db` 文件 = 完整备份，不需要导出/导入
3. **截图即录入**：BOSS/拉勾的面试邀约截图，Ctrl+V 粘贴，AI 自动识别填充字段

## 核心特性

- **📊 仪表盘**：转化漏斗（投递 → 一面 → 通过一面 → Offer）、来源分布、近期动态、12 周面试热力图、Action Items 待办
- **📋 机会列表**：按"最近一次面试时间"排序，分页（10 条/页），状态/来源/筛选 chip，搜索（公司名/岗位名）
- **📅 详情页**：轮次卡片（按 `round_number` 排序）、逻辑顺序时间线（含回填日期补录提示）、Offer 内联编辑、快速状态切换按钮
- **🤖 截图导入**：拖拽 / 点击 / **Ctrl+V 剪贴板粘贴**三选一，智谱 GLM-4V 解析字段，可二次编辑
- **🗓️ 面试日历**：月视图，按公司哈希配色 chip
- **🟢 8 种状态完整覆盖**：`in_progress` / `awaiting_response` / `offered` / `accepted` / `rejected` / `withdrawn` / `declined` / `accepted_then_left`
- **🧠 智能提醒**（Action Items）：
  - 等待回复 3 天黄、5 天红（"大概率已被默拒"）
  - in_progress 7 天黄、14 天红（"建议跟进"）
  - pending 轮次过期 1 天红（"补录面试结果"）
  - 通过但未添加下一轮（蓝）
  - Offer/接受缺薪资（红）
- **🎨 信息编码卡片**：薪资按档染色（slate/blue/indigo/emerald）、周末制度按质量分色、公司首字色块哈希、内推/猎聘/拉勾/脉脉 来源 tag
- **🔗 漏斗 / 来源分布可下钻**：点任何一根条 → 跳到筛选好的列表页
- **🌏 城市级联选择**：内置 ~3000 条省/市/区数据（china-area-data）
- **💰 薪资结构化输入**：范围模式（X - Y K · 13薪）/ 面议 / 自由文本，三态切换

## 快速开始

环境要求：**Node.js 20+**（better-sqlite3 需要 Node 20 的 prebuilt binaries）。

```bash
# 1. 克隆
git clone https://github.com/Natural-pride/JobPulse.git
cd JobPulse

# 2. 安装依赖（使用 workspaces，根目录 install 会装好前后端）
npm install

# 3. 启动前后端（并发）
npm run dev:all
```

打开浏览器访问 **http://localhost:5173**。

- 前端 dev server：5173
- 后端 API：3001
- 数据库文件：首次启动自动创建于 `backend/data/jobpulse.db`

> **截图导入功能需要 LLM**：在 `backend/.env` 填入 `ZHIPU_API_KEY=...` 后才可用。详见 [环境变量](#环境变量)。其他功能不依赖任何外部服务。

## 项目结构

```
JobPulse/
├── backend/                    # Express + SQLite + Zod
│   ├── src/
│   │   ├── db.ts               # SQLite 初始化 + 一次性 schema 迁移
│   │   ├── types.ts            # 共享类型 (OpportunityStatus / RoundType / ...)
│   │   ├── validate.ts         # Zod schemas (POST/PUT 入参校验)
│   │   ├── app.ts              # Express 装配
│   │   ├── routes/
│   │   │   ├── opportunities.ts    # 列表分页/筛选/排序/CRUD
│   │   │   ├── rounds.ts           # 轮次 CRUD
│   │   │   ├── parse.ts            # 截图上传 + 智谱 GLM-4V 解析
│   │   │   └── actionItems.ts      # 5 条 Action Items 规则
│   │   └── lib/
│   │       └── zhipu.ts            # 智谱 OpenAI-兼容客户端
│   ├── tests/                  # 55 个 vitest 用例
│   └── data/                   # SQLite 文件 (默认 jobpulse.db)
├── frontend/                   # Vite + React 19 + TS + Tailwind v3
│   ├── src/
│   │   ├── pages/              # Dashboard / OpportunityList / OpportunityDetail / Form / Import / Calendar
│   │   ├── components/         # 业务组件 (RoundCard, CityPicker, SalaryInput, ...)
│   │   ├── components/dashboard/   # 仪表盘子组件 (ConversionFunnel, RecentActivity, ...)
│   │   ├── lib/                # 纯函数工具 (status, format, timelineUtils, cardStyle, ...)
│   │   ├── hooks/              # useDocumentTitle, useCustomSources, useAllSourceSuggestions
│   │   ├── api/client.ts       # fetch 封装 + 类型
│   │   └── types.ts            # 共享类型 (镜像后端)
│   └── dist/                   # 生产构建产物
└── docs/                       # 设计文档（可选）
```

## 功能详解

### 仪表盘（`/`）

4 个区域：

1. **转化漏斗**：4 段水平条，宽度 = 上一段的转化率。点任意条跳转到对应的筛选列表。
2. **来源分布**：每根条对应一个 source 值，宽度 = 该 source 的机会数。同样可点。
3. **近期动态**：最近 4 条活动（按面试时间倒序），按 `round.outcome` 着色。
4. **Action Items**：5 条规则触发后聚合的待办，按 severity (red > yellow > blue) 排序。

### 机会列表（`/opportunities`）

- 排序：`ORDER BY COALESCE(最近一次面试时间, created_at) DESC`
- 分页：每页 10 条，URL 参数 `?page=N`
- 筛选 chip：8 个状态；URL 参数 `?status=in_progress`
- 搜索：按 `company_name` / `position_name` LIKE 匹配
- URL 参数支持：
  - `?source=BOSS` — 来自 BOSS 的所有机会
  - `?funnel=interviewed` — 至少有一轮
  - `?funnel=passed` — 至少有一轮通过
  - `?funnel=offer` — Offer 状态

### 详情页（`/opportunities/:id`）

- **概览卡片**：薪资 / 工时 / 福利 / 周末制度（**周末制度** = 周末休息安排，不是单字段）
- **时间线**：逻辑顺序 = 创建 → 轮次（按 round_number）→ Offer/接受
  - 历史日期自动标注「补录于 MM-dd」
- **轮次列表**：每轮一张卡片，包含格式、地点、问题、自我评价、结果
- **快速操作条**：根据当前状态显示一键切换按钮（接受 Offer / 拒 offer / 入职后离职 / 标记为等待回复 / 重新激活）
- **Offer 详情卡**：状态为 offered/accepted/accepted_then_left 时显示，薪资和福利可点击空白处直接编辑

### 截图导入（`/opportunities/import`）

- 3 种输入方式：拖拽 / 点击文件 / **Ctrl+V 粘贴**（Win+Shift+S 截图后直接 Ctrl+V）
- 智谱 GLM-4V（`glm-4v-plus`）解析，自动填充：公司、岗位、联系人、来源、薪资、城市、面试时间
- 解析后进入可编辑的 review 页面，未点保存前不会写入 DB
- 截图仅在内存中临时存在，**不持久化任何图片文件**

### 面试日历（`/calendar`）

月视图，42 格（Mon-start），每个有面试的日期显示公司色块 chip。配色按公司名 hash 稳定（不闪烁）。

## 数据存储与备份

**所有数据都在这一个文件里：`backend/data/jobpulse.db`**

```bash
# 备份
cp backend/data/jobpulse.db ~/backups/jobpulse-$(date +%Y%m%d).db

# 还原
cp ~/backups/jobpulse-20260831.db backend/data/jobpulse.db
```

建议在服务**停止时**复制（避免 SQLite WAL 写入中复制导致数据不完整）。

迁移数据库可以简单地把 `.db` 文件复制到新机器 + 重新 `npm install`，不需要额外步骤。

## 环境变量

可选。`backend/.env`（参考 `backend/.env.example`）：

```env
# 端口（默认 3001）
PORT=3001

# 智谱 GLM-4V API key（不填则截图导入功能不可用，其他功能不受影响）
# 申请：https://open.bigmodel.cn/usercenter/apikeys
ZHIPU_API_KEY=your_key_here
ZHIPU_MODEL=glm-4v-plus

# 自定义数据库路径（默认 backend/data/jobpulse.db）
# DB_PATH=/path/to/your.db
```

`.env` 已被 `.gitignore` 忽略，**不要把含真实 key 的 `.env` 提交到仓库**。

## 开发与测试

```bash
# 跑测试（55 个用例，覆盖 4 个测试文件）
npm test

# 生产构建
npm run build
# 产物：backend/dist (后端编译) + frontend/dist (前端静态资源)

# 单独跑某一端
npm run dev:backend    # 仅后端，端口 3001
npm run dev:frontend   # 仅前端，端口 5173
```

### 测试覆盖

```
backend/tests/
├── actionItems.test.ts (16)   # 5 条 Action Items 规则 + 边界
├── db.test.ts          (5)    # 迁移 / DROP COLUMN / DEFAULT
├── opportunities.test.ts (29) # CRUD / 分页 / 排序 / 筛选 / 来源
└── rounds.test.ts      (5)    # 轮次 CRUD
```

### 数据库迁移

`backend/src/db.ts` 的 `initDb()` 在启动时检查 `PRAGMA table_info(opportunities)`，
对老库执行一次性 `ALTER TABLE ADD COLUMN` / `DROP COLUMN`。已迁移过的列不会被重复添加。

**目前所有迁移是 idempotent 的**，可以反复重启而不出问题。

## Roadmap

正在规划 / 进行中的方向（按优先级）：

- [ ] **Action Items snooze**：把"暂时不跟进"的提醒延后 7 天
- [ ] **仪表盘时间范围**：7d / 30d / 90d / 全部，漏斗和热力图按区间计算
- [ ] **Round 0 = "已投简历" 时间线事件**：从 `resume_submitted_at` 派生
- [ ] **来源转化率分析**：BOSS / 内推 / 拉勾 各自的 投递→Offer 转化率
- [ ] **沟通记录**：每条 opportunity 的 HR 沟通日志（日期、渠道、内容）
- [ ] **导出 Markdown 简历**：把已通过的轮次整理成 markdown
- [ ] **AI 模拟面试**（评估中）：基于 JD 和公司生成面试问题
- [ ] **JD 链接解析**：粘贴拉勾/BOSS URL 自动 fetch + 解析

## 贡献

欢迎 PR 和 issue。提交前请：

1. `npm test` 全绿
2. 前端代码符合现有 TypeScript strict + Tailwind 风格（看 `frontend/src/components/OpportunityCard.tsx` 作为参考）
3. 后端新接口必带 Zod 校验 + 至少一个测试用例
4. 提交信息用中文或英文都行，描述清楚改了什么

## 许可

[MIT](LICENSE) © 2026 JobPulse Contributors

---

如果这个工具帮到你了，给个 ⭐ 鼓励一下作者继续维护 :)
