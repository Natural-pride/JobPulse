export interface ParsedInterview {
  company_name: string;
  position_name: string;
  salary_range: string;
  first_interview_at: string;
  format: 'online_video' | 'onsite' | 'phone' | '';
  contact_info: string;
  province: string;
  city: string;
  district: string;
  address: string;
  notes: string;
  source: string;
}

interface ParseResponse {
  parsed: ParsedInterview;
  meta: { bytes: number; mime: string };
}

const BASE = '/api';

export async function parseScreenshot(file: File): Promise<ParsedInterview> {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${BASE}/parse-screenshot`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `解析失败：HTTP ${res.status}`);
  }
  const data = (await res.json()) as ParseResponse;
  return data.parsed;
}
