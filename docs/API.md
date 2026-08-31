# API 参考

REST 风格，全部 JSON。所有路径以前缀 `/api` 开头。

## 通用约定

- **Content-Type**：`application/json`（截图上传是 `multipart/form-data`）
- **字符编码**：UTF-8
- **错误响应**：HTTP 4xx/5xx + body `{ "error": "..." }`
- **时间格式**：ISO 8601 字符串
- **状态字段**：8 状态之一，详见 [数据模型 §状态字段 enum](./数据模型.md#状态字段-enum)

## Opportunities

基础路径：`/api/opportunities`

### `GET /api/opportunities`

无参：返回所有机会的扁平数组（**给仪表盘用，保持向后兼容**）。

带分页参数：返回分页结构。**前端 OpportunityList 走这个**。

查询参数（任一存在即触发分页）：

| 参数 | 类型 | 说明 |
|---|---|---|
| `page` | integer ≥ 1，默认 1 | 页码 |
| `pageSize` | integer 1-100，默认 20 | 每页条数（前端硬编码 10） |
| `status` | enum | 8 状态之一 |
| `search` | string | 按 `company_name` / `position_name` 模糊匹配 |
| `source` | string | 精确匹配，trim 容忍 |
| `has_rounds` | boolean | true = 至少有一轮（漏斗"一面"） |
| `has_passed_round` | boolean | true = 至少有一轮通过（漏斗"通过一面"） |

**分页响应**：

```json
{
  "items": [
    {
      "id": 6,
      "company_name": "极光信息",
      "position_name": "Java 开发工程师",
      "status": "in_progress",
      "salary_range": "12-16K",
      ...
    }
  ],
  "total": 19,
  "page": 1,
  "pageSize": 10,
  "hasMore": true
}
```

**扁平响应**（无参）：

```json
[
  { "id": 1, "company_name": "...", ... },
  { "id": 2, "company_name": "...", ... }
]
```

示例：

```bash
# 扁平（仪表盘用）
curl http://localhost:3001/api/opportunities

# 分页
curl 'http://localhost:3001/api/opportunities?page=1&pageSize=10'

# 筛选：在 Boss 上投的、至少有一轮的
curl 'http://localhost:3001/api/opportunities?source=Boss&has_rounds=true&pageSize=10'
```

### `GET /api/opportunities/sources`

返回所有用过的不重复 source 值，按使用频次降序。

**响应**：

```json
["BOSS", "朋友内推", "V2EX"]
```

表单用，给"建议来源"chip 列表。

### `GET /api/opportunities/:id`

单条机会详情。`404` 如果不存在。

```json
{
  "id": 6,
  "company_name": "极光信息",
  "position_name": "Java 开发工程师",
  "province": "广东省",
  "city": "广州市南沙区",
  "address": null,
  "salary_range": "12-16K",
  "benefits": "五险一金",
  "weekend_policy": "double_off",
  "work_hours": "9:00-18:00",
  "jd_text": null,
  "jd_url": null,
  "source": "BOSS",
  "contact_info": "何小姐",
  "status": "in_progress",
  "final_salary": null,
  "final_benefits": null,
  "notes": null,
  "resume_submitted_at": null,
  "created_at": "2026-08-31 06:08:14",
  "updated_at": "2026-08-31 08:09:07"
}
```

### `POST /api/opportunities`

新建。所有字段都可选（除了 `company_name` 和 `position_name` 必填）。

```json
{
  "company_name": "字节跳动",
  "position_name": "后端开发工程师",
  "province": "北京市",
  "city": "北京市海淀区",
  "address": "中关村",
  "salary_range": "25-40K*13",
  "weekend_policy": "double_off",
  "work_hours": "10:00-19:00",
  "source": "BOSS",
  "status": "in_progress",
  "resume_submitted_at": "2026-08-30"
}
```

**响应 201**：完整的新建记录（同上）。

入参过 Zod，缺必填字段返回 `400`：

```json
{ "error": "..." }
```

### `PUT /api/opportunities/:id`

全量更新（PATCH 风格：传什么改什么，传 null 也清空该字段）。

请求体同上结构。`404` 如果 id 不存在。

### `DELETE /api/opportunities/:id`

删除。**级联删除所有关联的 `interview_rounds`**（ON DELETE CASCADE）。

`204 No Content` 成功；`404` 不存在。

## Rounds

挂在 opportunity 下。

### `GET /api/opportunities/:id/rounds`

返回某条机会的所有轮次，**按 `round_number` 升序**。

```json
[
  {
    "id": 1,
    "opportunity_id": 6,
    "round_number": 1,
    "round_type": "tech_1",
    "format": "onsite",
    "location": "广州南沙区越秀国际金融中心 A 塔",
    "scheduled_at": "2026-09-01T15:00:00",
    "actual_at": null,
    "duration_minutes": null,
    "questions": null,
    "my_performance": null,
    "outcome": "pending",
    "next_round_date": null,
    "notes": null,
    "created_at": "2026-08-31 06:08:14",
    "updated_at": "2026-08-31 06:08:14"
  }
]
```

### `POST /api/opportunities/:id/rounds`

新建轮次。

```json
{
  "round_number": 1,
  "round_type": "tech_1",
  "format": "online_video",
  "scheduled_at": "2026-09-01T15:00:00",
  "location": "腾讯会议",
  "outcome": "pending"
}
```

**响应 201**：完整新轮次。`400` 入参不合法。

### `PUT /api/rounds/:id`

更新轮次。同 PUT 机会的语义（传什么改什么）。

### `DELETE /api/rounds/:id`

删除单轮。`204` / `404`。

## Action Items

### `GET /api/action-items`

聚合的待办列表，按严重度（red > yellow > blue）排序。

**响应**：

```json
{
  "items": [
    {
      "type": "follow_up",
      "severity": "red",
      "opportunity_id": 6,
      "company": "极光信息",
      "position": "Java 开发工程师",
      "message": "5 天没更新了",
      "hint": "大概率已被默拒，建议标为「未通过」",
      "days_idle": 5
    },
    {
      "type": "add_next_round",
      "severity": "blue",
      "opportunity_id": 7,
      "company": "扬名娱乐",
      "position": "Agent 开发工程师",
      "message": "第 1 轮已通过，未添加下一轮",
      "hint": "可补下一轮，或改成 Offer 状态"
    }
  ]
}
```

5 条规则（`computeActionItems` 纯函数）：

| type | severity | 触发 |
|---|---|---|
| `follow_up` | yellow / red | 等待回复 3/5 天、in_progress 7/14 天没动静 |
| `fill_offer` | red | offered/accepted 状态但缺 `final_salary` |
| `add_next_round` | blue | 最近一轮通过但没加下一轮 |
| `pending_overdue` | red | 轮次计划时间已过 1 天还没补 outcome |
| `status_inconsistent` | - | 预留 |

## Screenshot Parse

### `POST /api/parse-screenshot`

上传面试邀约截图，AI 解析字段。**仅截图导入功能用，依赖 `ZHIPU_API_KEY`**。

请求：`multipart/form-data`，字段名 `image`，文件类型 `image/png` / `image/jpeg` / `image/webp`，最大 10MB。

```bash
curl -X POST http://localhost:3001/api/parse-screenshot \
  -F "image=@/path/to/screenshot.png"
```

**响应 200**：

```json
{
  "company_name": "字节跳动",
  "position_name": "后端开发工程师",
  "format": "online_video",
  "address": "中关村",
  "city": "北京",
  "district": "海淀区",
  "first_interview_at": "2026-09-05T14:30:00",
  "contact_info": "张老师",
  "source": "BOSS",
  "salary_range": null,
  "notes": null
}
```

**错误码**：

- `400`：没有文件 / 文件类型不对 / 文件 > 10MB
- `502`：智谱 API 失败（key 无效 / 网络 / 解析失败）
- `500`：未配置 `ZHIPU_API_KEY`

## CORS

后端默认允许所有来源（`cors()` 无参）。生产部署建议收紧：

```ts
// backend/src/app.ts
app.use(cors({ origin: 'https://your-domain.com' }));
```

## 错误响应格式

所有错误统一：

```json
{ "error": "具体错误信息" }
```

常见情况：
- `400` 入参过 Zod 失败：`{ "error": "Zod 错误详情..." }`
- `404` 资源不存在
- `500` 服务器内部错误（查看后端 console 日志）
- `502` 上游服务（智谱）失败
