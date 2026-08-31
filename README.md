# JobPulse

**JobPulse** 是一个本地优先的个人面试追踪工具，写给自己用的。

找工作那阵用过 Notion、Excel、几个 SaaS，都不太合适：Notion 太重、Excel 不会主动提醒、主流 SaaS 又覆盖不到"HR 说等回音"这种中文招聘流程里特有的状态。这个工具就是当时为了解决这些才动手写的。

主要做的事：

- 把投出去的每家公司、每场面试、每次结果都记在一张表里
- Ctrl+V 粘贴面试邀约截图，AI 自动识别公司、岗位、时间、地点
- 漏斗和来源分布一眼看到投递 → Offer 的转化、各招聘渠道占比
- 等 HR 超过 3 天变黄、5 天变红，提醒你可能被默拒

数据全在一个本地 SQLite 文件里，复制走就是完整备份，换台电脑接着用。

<!-- 放一张仪表盘截图 -->

## 它能干什么

- 把投出去的每家公司、每场面试、每次结果都记在表里，按最近一次面试时间排序
- 收到面试邀约截图，Ctrl+V 粘贴进去，AI 自动识别公司、岗位、时间、地点
- 仪表盘上看投递 → 一面 → Offer 的转化漏斗，以及各招聘渠道（Boss / 内推 / 拉勾 / 猎聘）的占比
- "待办"区自动提醒：等 HR 超过 3 天会标黄、超过 5 天会标红（多半已被默拒）；面试过期没补录也会提示
- 日历视图看本月所有面试
- 列表卡片上，薪资高低、周末制度、公司名用不同颜色区分；来源（内推/猎聘/拉勾/脉脉）打标签
- 漏斗和来源分布的彩色条可以点，跳到对应筛选好的列表

需要 Node.js 20+。除了"截图导入"需要智谱 GLM-4V 的 key（自己申请），其他功能离线可用。

## 运行

```bash
git clone https://github.com/Natural-pride/JobPulse.git
cd JobPulse
npm install
npm run dev:all
```

打开 http://localhost:5173。数据库会创建在 `backend/data/jobpulse.db`。

想要截图导入功能：在 `backend/.env` 填 `ZHIPU_API_KEY=xxx`（参考 `backend/.env.example`）。不填也能用，只是个"图片解析"不可用而已。

## 备份

数据就是一个文件。停止服务后复制走就行：

```bash
cp backend/data/jobpulse.db ~/backups/
```

要搬机器就把这个文件复制到新机器的同一位置，重启服务即用。

## 技术栈

| 端 | 用的 |
|---|---|
| 前端 | React 19 + Vite + TypeScript + Tailwind v3 |
| 后端 | Express + better-sqlite3 + Zod |
| 截图 OCR | 智谱 GLM-4V（OpenAI 兼容接口） |
| 测试 | Vitest（55 个用例） |
| 状态字段 | `in_progress` / `awaiting_response` / `offered` / `accepted` / `rejected` / `withdrawn` / `declined` / `accepted_then_left` |

## 项目结构

```
backend/
  src/
    db.ts              # SQLite 初始化 + 一次性 schema 迁移
    types.ts validate.ts
    routes/
      opportunities.ts # 列表分页/筛选/排序 + 6 个 REST 接口
      rounds.ts
      parse.ts         # multer 内存 + 智谱 GLM-4V
      actionItems.ts   # 5 条提醒规则的纯函数
    lib/zhipu.ts
  tests/               # 55 个 vitest
  data/                # SQLite 文件

frontend/
  src/
    pages/             # Dashboard / OpportunityList / Detail / Form / Import / Calendar
    components/        # OpportunityCard, RoundCard, CityPicker, SalaryInput, InlineField ...
    components/dashboard/
    lib/               # status, format, timelineUtils, cardStyle, dashboardUtils, calendarUtils ...
    hooks/             # useDocumentTitle, useCustomSources, useAllSourceSuggestions
    api/client.ts
    types.ts
```

## 几条设计决策

- **状态里加 `awaiting_response`（等待回复）**：BOSS 聊完投了简历，HR 说"等回音"——这种既不是 in_progress 也不算被拒，独立成第 8 个状态
- **`resume_submitted_at` 字段**：跟 `created_at` 区分开。比如 8/20 投的简历，8/31 才录入系统，Action Items 按真实投递时间算"等了多少天"
- **截图只解析、不存盘**：multer memoryStorage，请求结束就 GC，避免数据库塞一堆 base64
- **DB path 锚到源文件位置**而不是 `process.cwd()`：从别的目录启动也不会创出野生的空 DB
- **漏斗/来源条都做成 `<Link>`**：点哪根跳到对应筛选好的列表页，不光是看个数字

## 还没做的

诚实清单：

- 没做用户系统（单用户本地工具）
- 没做云同步/多设备（自己复制 .db 文件搬）
- 没做 AI 模拟面试（之前评估过，离"追踪面试"这个核心有点远）
- 没做移动端适配（手机上看列表会糊）
- 浏览器扩展、JD 链接自动 fetch、邮件解析 都没做
- 漏斗的"Offer"桶在列表页只显示 `status=offered`（不代表 accepted/declined/accepted_then_left 全部 4 个状态），要看完整体手动选

## 测试

```bash
npm test
```

55 个用例覆盖 actionItems / opportunities / rounds / db 迁移。

## 贡献

直接 PR 或者 issue 都可以。提交前跑一下 `npm test`，后端新接口记得带 Zod 校验和测试。详细规范看 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 文档

| 文档 | 内容 |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | 每个版本改了什么 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 怎么参与开发 |
| [docs/架构.md](docs/架构.md) | 前后端结构、模块划分、设计决策 |
| [docs/数据模型.md](docs/数据模型.md) | 两张表的字段、索引、迁移历史 |
| [docs/API.md](docs/API.md) | REST 端点、参数、响应、错误码 |
| [docs/开发.md](docs/开发.md) | 环境、命令、目录约定、调试技巧 |
| [docs/路线图.md](docs/路线图.md) | 状态、限制、短期/长期计划 |
| [docs/README.md](docs/README.md) | 文档目录 |

## License

[MIT](LICENSE)
