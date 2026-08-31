import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseScreenshot, type ParsedInterview } from '../api/parse';
import { api } from '../api/client';
import { findProvinceForCity } from '../lib/cityData';
import CityPicker, { type CityValue } from '../components/CityPicker';
import SalaryInput from '../components/SalaryInput';
import useDocumentTitle from '../hooks/useDocumentTitle';

type FormatValue = 'online_video' | 'onsite' | 'phone' | '';
type OutcomeValue = 'pending' | 'passed' | 'failed' | 'cancelled';
type WeekendValue = '' | 'double_off' | 'single_off' | 'alternating' | 'compensatory' | 'unknown';

const FORMAT_OPTIONS: { value: FormatValue; label: string }[] = [
  { value: '', label: '（不填）' },
  { value: 'online_video', label: '线上视频' },
  { value: 'onsite', label: '线下' },
  { value: 'phone', label: '电话' },
];

const OUTCOME_OPTIONS: { value: OutcomeValue; label: string }[] = [
  { value: 'pending', label: '待面试' },
  { value: 'passed', label: '已通过' },
  { value: 'failed', label: '未通过' },
  { value: 'cancelled', label: '已取消' },
];

const WEEKEND_OPTIONS: { value: WeekendValue; label: string }[] = [
  { value: '', label: '（不填）' },
  { value: 'double_off', label: '双休' },
  { value: 'single_off', label: '单休' },
  { value: 'alternating', label: '大小周' },
  { value: 'compensatory', label: '调休' },
  { value: 'unknown', label: '不清楚' },
];

interface FormState {
  company_name: string;
  position_name: string;
  contact_info: string;
  source: string;
  salary_range: string;
  weekend_policy: WeekendValue;
  cityValue: CityValue;
  address: string;
  notes: string;
  first_interview_at: string;
  first_interview_format: FormatValue;
  first_interview_outcome: OutcomeValue;
  first_interview_type: 'tech_1' | 'hr_screen' | 'tech_2' | 'other';
}

const EMPTY_FORM: FormState = {
  company_name: '',
  position_name: '',
  contact_info: '',
  source: 'BOSS',
  salary_range: '',
  weekend_policy: '',
  cityValue: { province: '', city: '', district: '' },
  address: '',
  notes: '',
  first_interview_at: '',
  first_interview_format: '',
  first_interview_outcome: 'pending',
  first_interview_type: 'tech_1',
};

const INPUT_CLASS =
  'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm placeholder-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition';

const LABEL_CLASS =
  'block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

function applyParsed(form: FormState, p: ParsedInterview): FormState {
  const next: FormState = { ...form };
  if (p.company_name) next.company_name = p.company_name;
  if (p.position_name) next.position_name = p.position_name;
  if (p.contact_info) next.contact_info = p.contact_info;
  if (p.source) next.source = p.source;
  if (p.salary_range) next.salary_range = p.salary_range;
  if (p.notes) next.notes = p.notes;
  if (p.address) next.address = p.address;
  if (p.format) next.first_interview_format = p.format as FormatValue;
  if (p.first_interview_at) next.first_interview_at = p.first_interview_at;

  // City: try to backfill province if 智谱 only gave us city
  let province = p.province;
  let city = p.city;
  if (city && !province) {
    const guessed = findProvinceForCity(city);
    if (guessed) province = guessed;
  }
  next.cityValue = {
    province: province || '',
    city: city || '',
    district: p.district || '',
  };
  return next;
}

export default function OpportunityImport() {
  useDocumentTitle('导入面试');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [rawParsed, setRawParsed] = useState<ParsedInterview | null>(null);

  // Revoke object URL when preview changes/unmounts to avoid memory leak
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  // Listen for paste events anywhere on the page so users can Ctrl+V a
  // screenshot directly from the clipboard (Windows Snip / macOS Screenshot /
  // QQ / WeChat etc.). Ignore pastes that don't contain an image.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      // Don't hijack pastes inside form fields (those are for text input).
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) return;
          const ext = item.type.split('/')[1] || 'png';
          const file = new File([blob], `粘贴截图-${Date.now()}.${ext}`, {
            type: item.type,
          });
          pickFile(file);
          return;
        }
      }
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
    // pickFile is stable (closure over setState setters), safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickFile(f: File | null) {
    setFile(f);
    setParseError(null);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
      setRawParsed(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    setParseError(null);
    try {
      const parsed = await parseScreenshot(file);
      setRawParsed(parsed);
      setForm((f) => applyParsed(f, parsed));
    } catch (e) {
      setParseError(e instanceof Error ? e.message : '解析失败');
    } finally {
      setParsing(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.company_name.trim() || !form.position_name.trim()) {
      setSaveError('公司名称和岗位名称必填');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const fullCity = form.cityValue.district
        ? `${form.cityValue.city}${form.cityValue.district}`
        : form.cityValue.city;
      const created = await api.opportunities.create({
        company_name: form.company_name.trim(),
        position_name: form.position_name.trim(),
        contact_info: form.contact_info || null,
        source: form.source || null,
        salary_range: form.salary_range || null,
        weekend_policy: form.weekend_policy || null,
        province: form.cityValue.province || null,
        city: fullCity || null,
        address: form.address || null,
        notes: form.notes || null,
        status: 'in_progress',
      });
      // Auto-create first round if time is provided
      if (form.first_interview_at) {
        const location = [fullCity, form.address].filter(Boolean).join(' ');
        try {
          await api.rounds.create(created.id, {
            round_number: 1,
            round_type: form.first_interview_type,
            format: form.first_interview_format || 'online_video',
            scheduled_at:
              form.first_interview_at.length === 16
                ? form.first_interview_at + ':00'
                : form.first_interview_at,
            location: location || null,
            outcome: form.first_interview_outcome,
          });
        } catch (roundErr) {
          console.error('Failed to auto-create first round:', roundErr);
        }
      }
      navigate(`/opportunities/${created.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存失败');
      setSaving(false);
    }
  }

  return (
    <div className="-mx-10 -my-8 bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/opportunities"
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            aria-label="返回"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
              截图导入面试
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              上传面试邀约截图，AI 自动识别字段，确认后保存
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-6">
        {/* Upload + preview */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50/60 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">上传截图</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                支持 PNG / JPG / WebP，最大 10MB
              </p>
            </div>
          </div>
          <div className="p-6">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors text-center ${
                file
                  ? 'border-indigo-300 bg-indigo-50/30'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
              }`}
            >
              {preview ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={preview}
                    alt="screenshot preview"
                    className="max-h-72 rounded shadow-sm border border-slate-200"
                  />
                  <p className="text-xs text-slate-500">{file?.name}</p>
                </div>
              ) : (
                <div className="py-8 text-slate-500">
                  <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm">拖拽图片到此处、点击选择文件，或直接 <kbd className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-700">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-700">V</kbd> 从剪贴板粘贴</p>
                  <p className="text-[11px] text-slate-400 mt-1.5">支持 Windows 截图工具、macOS 截图、QQ / 微信等任意来源</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                截图仅用于解析，不会保存
              </div>
              <div className="flex items-center gap-2">
                {file && !parsing && (
                  <button
                    type="button"
                    onClick={() => pickFile(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    清除
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!file || parsing}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
                >
                  {parsing ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span>解析中…</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                      <span>开始解析</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {parseError && (
              <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2">
                <svg className="text-rose-500 mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-rose-700">{parseError}</p>
              </div>
            )}
          </div>
        </section>

        {/* Edit form (shown after parse) */}
        {rawParsed && (
          <>
            <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50/60 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="15" y2="17" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-slate-900">确认并编辑</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    AI 识别结果可手动修改，所有字段在保存前不会生效
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showRaw ? '隐藏' : '查看'} 原始 JSON
                </button>
              </div>
              <div className="p-6 space-y-5">
                {showRaw && (
                  <pre className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(rawParsed, null, 2)}
                  </pre>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className={LABEL_CLASS}>
                      公司名称 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={form.company_name}
                      onChange={(e) => update('company_name', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="例：字节跳动"
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>
                      岗位名称 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={form.position_name}
                      onChange={(e) => update('position_name', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="例：后端开发工程师"
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>联系人 / HR</label>
                    <input
                      value={form.contact_info}
                      onChange={(e) => update('contact_info', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="例：张老师"
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>来源</label>
                    <input
                      value={form.source}
                      onChange={(e) => update('source', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="BOSS / 拉勾 / 内推 / 自填"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>薪资范围</label>
                    <SalaryInput
                      value={form.salary_range}
                      onChange={(v) => update('salary_range', v)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>城市（省 / 市 / 区）</label>
                    <CityPicker
                      value={form.cityValue}
                      onChange={(v) => update('cityValue', v)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>详细地址</label>
                    <input
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="街道、楼栋、门牌号"
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>双休</label>
                    <select
                      value={form.weekend_policy}
                      onChange={(e) => update('weekend_policy', e.target.value as WeekendValue)}
                      className={INPUT_CLASS}
                    >
                      {WEEKEND_OPTIONS.map((o) => (
                        <option key={o.value || 'empty'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>备注</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => update('notes', e.target.value)}
                      className={`${INPUT_CLASS} font-sans`}
                      rows={2}
                      placeholder="如'无需自备简历'、'提前 15 分钟到达'等"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* First interview block (only shown if time was extracted) */}
            {(form.first_interview_at || rawParsed.first_interview_at) && (
              <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-50/60 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">第一轮面试</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      将随机会一起创建
                    </p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className={LABEL_CLASS}>轮次类型</label>
                    <select
                      value={form.first_interview_type}
                      onChange={(e) =>
                        update(
                          'first_interview_type',
                          e.target.value as FormState['first_interview_type']
                        )
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="hr_screen">HR 筛选</option>
                      <option value="tech_1">技术一面</option>
                      <option value="tech_2">技术二面</option>
                      <option value="comprehensive">综合面</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>结果</label>
                    <select
                      value={form.first_interview_outcome}
                      onChange={(e) =>
                        update(
                          'first_interview_outcome',
                          e.target.value as OutcomeValue
                        )
                      }
                      className={INPUT_CLASS}
                    >
                      {OUTCOME_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>时间</label>
                    <input
                      type="datetime-local"
                      value={
                        form.first_interview_at
                          ? form.first_interview_at.slice(0, 16)
                          : ''
                      }
                      onChange={(e) => update('first_interview_at', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>形式</label>
                    <select
                      value={form.first_interview_format}
                      onChange={(e) =>
                        update(
                          'first_interview_format',
                          e.target.value as FormatValue
                        )
                      }
                      className={INPUT_CLASS}
                    >
                      {FORMAT_OPTIONS.map((o) => (
                        <option key={o.value || 'empty'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}

            {saveError && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-3">
                <svg className="text-rose-500 mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-rose-700">{saveError}</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky footer (only after parse) */}
      {rawParsed && (
        <footer className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 z-40 mt-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <p className="text-xs text-slate-400 hidden md:block">
              解析结果仅供参考，所有字段以你最终保存的为准
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <Link
                to="/opportunities"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                取消
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm shadow-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              >
                {saving ? '保存中…' : '保存机会'}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
