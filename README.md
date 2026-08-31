# JobPulse

记录求职全过程的小工具。从在 BOSS 上发出一条消息到入职那天的 offer 对比，都在一个本地 SQLite 文件里。

<!-- 放一张仪表盘截图 -->

## 它能干什么

- 把投出去的所有公司记在一张表里，按"最近一次面试时间"排序
- 给每条记录加多轮面试（一面、二面、HR 面、终面……），记录形式、地点、自我评价、结果
- 收到面试邀约截图后，Ctrl+V 粘贴进去，AI 自动填好公司名/岗位/时间/地点，你确认一下就能保存
- 仪表盘上看转化漏斗（投递 → 一面 → 通过一面 → Offer）、来源分布（BOSS / 内推 / 拉勾的占比）、最近 4 条活动
- 一个待办区叫"Action Items"：等你回复 3 天会标黄、5 天会标红提醒你可能已被默拒；其他规则有 7/14 天没动静、面试过期 1 天没补录、收到 offer 没填薪资……
- 日历视图看本月所有面试
- 详情页时间线：创建 → 轮次（按 round_number）→ 收到 Offer → 接受，回填的历史日期会自动标"补录于 MM-dd"
- 列表卡片按薪资分档染色、按公司首字配色、内推/猎聘/拉勾/脉脉等来源打 tag
- 漏斗和来源分布的每根条都能点，跳到对应筛选好的列表

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

直接 PR 或者 issue 都可以。提交前跑一下 `npm test`，后端新接口记得带 Zod 校验和测试。

## License

[MIT](LICENSE)
