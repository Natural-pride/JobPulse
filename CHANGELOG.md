# 变更日志

所有值得注意的变更都会记录在这里。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

## [0.9.0] - 2026-08-31

首次以开源项目形式发布。

### 新增
- 仪表盘漏斗和来源分布条可点击下钻到对应筛选列表
- 详情页时间线改用逻辑顺序（创建 → 轮次 → Offer/接受），回填日期标"补录于 MM-dd"
- 面试机会列表按"最近一次面试时间"排序
- 列表分页（每页 10 条，URL 参数化）
- 卡片颜色编码：薪资分档、周末制度、公司首字、下轮时间
- 详情页快速操作条（接受 / 拒 offer / 入职后离职 / 重新激活）
- 状态 `awaiting_response`（等待回复）
- 字段 `resume_submitted_at`（简历提交时间）
- Action Items 新增 3 天黄、5 天红规则
- 截图导入支持剪贴板 Ctrl+V 粘贴
- 8 个状态完整覆盖：`in_progress` / `awaiting_response` / `offered` / `accepted` / `rejected` / `withdrawn` / `declined` / `accepted_then_left`
- MIT 许可证
- README + LICENSE + 本文

### 修复
- 详情时间线事件不再按日期排序导致回填历史数据错位
- 来源字段记住用户自定义值（localStorage + DB 三层合并）
- 截图导入会泄漏 .env key 风险的提示

## [0.8.0] - 2026-08-31

### 新增
- 详情页快速操作条（一键状态切换）
- Offer 详情内联编辑（final_salary / final_benefits）
- 状态 `declined` / `accepted_then_left` 加入漏斗 Offer 桶
- 状态机：`in_progress` ↔ `rejected/withdrawn/declined/accepted_then_left` 双向

## [0.7.0] - 2026-08-31

### 新增
- 全局面试日历（月视图，按公司哈希配色）
- 详情页进度时间线（创建 → 轮次 → 结果 → Offer 故事化）
- 待办面板 Action Items：
  - 7 天黄、14 天红跟进提醒
  - 5 条规则（follow_up / fill_offer / add_next_round / pending_overdue / status_inconsistent）
  - 严重度排序（red > yellow > blue）

## [0.6.0] - 2026-08-31

### 新增
- 截图导入面试（智谱 GLM-4V 解析 + 用户确认保存）
- 智谱 OpenAI 兼容客户端 + dotenv 自动加载
- 城市级联选择器（china-area-data，3 级：省/市/区）
- 3 段卡片式新建/编辑表单（基本信息 / 时间地点 / 工作详情）
- 表单字段下拉化（薪资 / 上下班时间 / 福利多选）
- 动态 `<title>` 标签页标题
- 自定义 SVG favicon

### 修复
- `DB_PATH` 默认值改为相对源文件位置（避开 `cwd` 错配）
- `.env` / `.db` 加入 `.gitignore` 屏蔽规则

## [0.5.0] - 2026-08-31

### 新增
- v2 UI redesign（Indigo 主色 + 圆点网格背景 + 卡片阴影）
- 状态徽章"已拒绝"改"未通过"（无责备措辞）
- 折叠式表单（5 段 → 高级选项可收）
- 5 种轮次类型 + 4 种形式
- 8 字段完整模型

## [0.4.0] - 2026-08-31

### 新增
- 字段 `province`（省）
- 字段 `weekend_policy` 字符串枚举（替代旧的 `has_weekends_off` 0/1）
- 一次性 DB 迁移：boolean → enum + 删旧列

## [0.3.0] - 2026-08-31

### 新增
- 后端 scaffold：Express + TS + better-sqlite3 + Zod
- 前端 scaffold：Vite + React + TS + Tailwind
- Vitest 测试基础设施
- 2 张表（`opportunities` / `interview_rounds`）初始化
- REST API CRUD（`/api/opportunities` / `/api/rounds`）
- 仪表盘、列表、详情、表单 4 个页面骨架
- 状态机 5 个状态（`in_progress` / `offered` / `accepted` / `rejected` / `withdrawn`）
- 轮次时间字段 `scheduled_at` / `actual_at`
- README 启动 + 冒烟测试说明
