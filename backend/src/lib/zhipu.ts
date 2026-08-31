import OpenAI from 'openai';

const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ZHIPU_API_KEY is not set. Add it to backend/.env (e.g. ZHIPU_API_KEY=...) and restart the server.'
    );
  }
  client = new OpenAI({ apiKey, baseURL: ZHIPU_BASE_URL });
  return client;
}

const PARSE_SYSTEM_PROMPT = `你是一个面试信息提取助手。用户会给你一张中国求职APP（如BOSS直聘、拉勾、智联招聘）的面试邀约截图。
请仔细阅读图中文字，并以严格的 JSON 格式返回以下字段，不要包含任何其他文字或 markdown 代码块：

{
  "company_name": "公司名称（必填）",
  "position_name": "岗位名称（必填）",
  "salary_range": "薪资范围字符串（如 '15K-20K'；若是 '12-18K' 补全为 '12K-18K'；若是 '1-2万' 写成 '1万-2万'；无则空字符串）",
  "first_interview_at": "第一次面试时间（ISO 格式 yyyy-MM-ddTHH:mm:ss，例如 '2026-08-28T15:30:00'；无则空字符串）",
  "format": "面试形式（'online_video' 线上视频 / 'onsite' 线下 / 'phone' 电话；无法判断则空字符串）",
  "contact_info": "联系人姓名（HR/面试官；无则空字符串）",
  "province": "省份（如'广东省'；无则空字符串）",
  "city": "城市（如'广州市'；无则空字符串）",
  "district": "区/县（如'黄埔区'；无则空字符串）",
  "address": "详细地址（街道、楼栋、门牌号；不含省市；无则空字符串）",
  "notes": "备注（如'无需自备简历'；无则空字符串）",
  "source": "来源APP名（'BOSS直聘'/'拉勾'/'智联招聘'/'猎聘'等；无则空字符串）"
}

注意：
- 公司名与岗位名必须准确照抄图中文本，不要臆测
- 城市地址按 省/市/区 + 详细地址 拆分
- 薪资数字保留原样，K/万单位统一（如 '12-18K' → '12K-18K'）
- 图中没有的字段返回空字符串，不要编造`;

const MODEL = process.env.ZHIPU_MODEL || 'glm-4v-plus';

export interface ParsedInterview {
  company_name: string;
  position_name: string;
  salary_range: string;
  first_interview_at: string;
  format: string;
  contact_info: string;
  province: string;
  city: string;
  district: string;
  address: string;
  notes: string;
  source: string;
}

export async function parseInterviewScreenshot(
  imageBase64: string,
  mimeType: string
): Promise<ParsedInterview> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: PARSE_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          {
            type: 'text',
            text: '请从这张截图中提取面试信息，返回 JSON。',
          },
        ],
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('智谱返回内容为空');
  }

  let parsed: Partial<ParsedInterview>;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`智谱返回的不是合法 JSON: ${(e as Error).message}`);
  }

  // Defensive: fill in missing keys with empty strings
  return {
    company_name: parsed.company_name ?? '',
    position_name: parsed.position_name ?? '',
    salary_range: parsed.salary_range ?? '',
    first_interview_at: parsed.first_interview_at ?? '',
    format: parsed.format ?? '',
    contact_info: parsed.contact_info ?? '',
    province: parsed.province ?? '',
    city: parsed.city ?? '',
    district: parsed.district ?? '',
    address: parsed.address ?? '',
    notes: parsed.notes ?? '',
    source: parsed.source ?? '',
  };
}
