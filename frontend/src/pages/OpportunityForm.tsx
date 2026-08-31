import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, OpportunityStatus, RoundFormat, WeekendPolicy } from '../types';
import DateTimeInput from '../components/DateTimeInput';
import CityPicker, { type CityValue } from '../components/CityPicker';
import SalaryInput from '../components/SalaryInput';
import { getCities, findProvinceForCity } from '../lib/cityData';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useCustomSources } from '../hooks/useCustomSources';

type FormState = Omit<
  Opportunity,
  'id' | 'created_at' | 'updated_at' | 'weekend_policy' | 'province'
> & {
  weekend_policy: WeekendPolicy | '';
};

const empty: FormState = {
  company_name: '',
  position_name: '',
  city: '',
  address: '',
  salary_range: '',
  benefits: '',
  weekend_policy: '',
  work_hours: '',
  jd_text: '',
  jd_url: '',
  source: 'BOSS',
  contact_info: '',
  status: 'in_progress',
  final_salary: '',
  final_benefits: '',
  notes: '',
  resume_submitted_at: new Date().toISOString().slice(0, 10),
};

const WORK_HOURS_PRESETS = [
  { value: '', label: '（不填）' },
  { value: '9:00-18:00', label: '9:00-18:00' },
  { value: '9:30-18:30', label: '9:30-18:30' },
  { value: '10:00-19:00', label: '10:00-19:00' },
  { value: '9:00-17:30', label: '9:00-17:30' },
  { value: '弹性工作', label: '弹性工作' },
  { value: '955', label: '955' },
  { value: '996', label: '996' },
  { value: '007', label: '007' },
  { value: '__custom__', label: '自定义...' },
];

const WEEKEND_POLICY_OPTIONS: Array<{ value: WeekendPolicy; label: string }> = [
  { value: 'double_off', label: '双休' },
  { value: 'single_off', label: '单休' },
  { value: 'alternating', label: '大小周' },
  { value: 'compensatory', label: '调休' },
  { value: 'unknown', label: '不清楚' },
];

const SOURCE_SUGGESTIONS = [
  'BOSS',
  '智联招聘',
  '前程无忧',
  '猎聘',
  '58同城',
  '脉脉',
  '其他',
];

const BENEFIT_TAGS = [
  '五险一金', '六险一金', '补充医疗', '年终奖', '股票期权',
  '餐补', '房补', '交通补', '弹性工作', '远程办公',
  '体检', '团建', '培训', '带薪年假', '加班费',
  '节日福利', '健身房', '免费零食',
];

function parseWorkHours(s: string | null): { preset: string; custom: string } {
  if (!s) return { preset: '', custom: '' };
  const match = WORK_HOURS_PRESETS.find((p) => p.value === s);
  return {
    preset: match ? match.value : '__custom__',
    custom: match ? '' : s,
  };
}

function buildWorkHours(preset: string, custom: string): string | null {
  const value = preset === '__custom__' ? custom.trim() : preset;
  return value || null;
}

function parseBenefits(s: string | null): { selected: Set<string>; other: string } {
  const selected = new Set<string>();
  let other = '';
  if (!s) return { selected, other };
  const parts = s.split(/[、,,;；\s]+/).filter(Boolean);
  const otherParts: string[] = [];
  for (const p of parts) {
    if (BENEFIT_TAGS.includes(p)) {
      selected.add(p);
    } else {
      otherParts.push(p);
    }
  }
  other = otherParts.join('、');
  return { selected, other };
}

function buildBenefits(selected: Set<string>, other: string): string | null {
  const parts: string[] = [];
  selected.forEach((t) => parts.push(t));
  const trimmedOther = other.trim();
  if (trimmedOther) parts.push(trimmedOther);
  return parts.length ? parts.join('、') : null;
}

/**
 * Best-effort parse of stored province + city strings into picker state.
 * Returns empty values if the data doesn't match — the user can re-pick.
 */
function parseStoredLocation(
  storedProvince: string | null,
  storedCity: string | null
): CityValue {
  const empty: CityValue = { province: '', city: '', district: '' };
  const stored = storedCity ?? '';
  if (!stored && !storedProvince) return empty;

  const cities = getCities();
  for (const c of cities) {
    if (stored === c.name) {
      return { province: storedProvince ?? c.province, city: c.name, district: '' };
    }
    for (const d of c.districts) {
      if (stored === `${c.name}${d}`) {
        return { province: storedProvince ?? c.province, city: c.name, district: d };
      }
    }
  }
  // City didn't match the dataset; keep whatever province we have, leave the rest.
  if (storedProvince) {
    return { province: storedProvince, city: stored, district: '' };
  }
  // Last resort: try to derive province from the city name alone.
  const guessed = findProvinceForCity(stored);
  if (guessed) return { province: guessed, city: stored, district: '' };
  return empty;
}

export default function OpportunityForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(isEdit ? (form.company_name ? `编辑 · ${form.company_name}` : '编辑面试') : '新建面试');

  // Quick-add fields (only used when creating)
  const [cityValue, setCityValue] = useState<CityValue>({
    province: '',
    city: '',
    district: '',
  });
  const [addressDetail, setAddressDetail] = useState('');
  const [firstInterviewAt, setFirstInterviewAt] = useState('');
  const [firstInterviewFormat, setFirstInterviewFormat] = useState<RoundFormat>('online_video');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Custom "来源" suggestions: remembered across sessions via localStorage.
  const { custom: customSources, add: addCustomSource, remove: removeCustomSource } =
    useCustomSources();
  const [customSourceInput, setCustomSourceInput] = useState('');

  // Structured-field state (work_hours uses dropdown; benefits multi-select)
  const [workHoursPreset, setWorkHoursPreset] = useState('');
  const [workHoursCustom, setWorkHoursCustom] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState<Set<string>>(new Set());
  const [benefitsOther, setBenefitsOther] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const opp = await api.opportunities.get(Number(id));
        setForm({
          ...opp,
          weekend_policy: opp.weekend_policy ?? '',
          // API returns ISO datetime; <input type="date"> wants YYYY-MM-DD.
          resume_submitted_at: (opp.resume_submitted_at ?? '').slice(0, 10),
        });
        // Try to split the stored city string into province/city/district. The
        // legacy single-string format may not match, in which case we leave the
        // picker empty and the user re-picks.
        const parsed = parseStoredLocation(opp.province ?? null, opp.city ?? null);
        setCityValue(parsed);
        setAddressDetail(opp.address ?? '');
        const w = parseWorkHours(opp.work_hours);
        setWorkHoursPreset(w.preset);
        setWorkHoursCustom(w.custom);
        const b = parseBenefits(opp.benefits);
        setSelectedBenefits(b.selected);
        setBenefitsOther(b.other);
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.company_name.trim() || !form.position_name.trim()) {
      setError('公司名称和岗位名称必填');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const trimmedDetail = addressDetail.trim();
      const fullCity = cityValue.district
        ? `${cityValue.city}${cityValue.district}`
        : cityValue.city;
      const payload = {
        ...form,
        weekend_policy: form.weekend_policy || null,
        province: cityValue.province || null,
        city: fullCity || null,
        address: trimmedDetail || null,
        salary_range: form.salary_range?.trim() || null,
        benefits: buildBenefits(selectedBenefits, benefitsOther),
        work_hours: buildWorkHours(workHoursPreset, workHoursCustom),
        jd_text: form.jd_text || null,
        jd_url: form.jd_url || null,
        source: form.source || null,
        contact_info: form.contact_info || null,
        final_salary: form.final_salary || null,
        final_benefits: form.final_benefits || null,
        notes: form.notes || null,
        resume_submitted_at: form.resume_submitted_at || null,
      };
      let opportunityId: number;
      if (isEdit) {
        const updated = await api.opportunities.update(Number(id), payload);
        opportunityId = updated.id;
      } else {
        const created = await api.opportunities.create(payload);
        opportunityId = created.id;
        if (firstInterviewAt) {
          const roundLocation = [fullCity, trimmedDetail].filter(Boolean).join(' ');
          try {
            await api.rounds.create(opportunityId, {
              round_number: 1,
              round_type: 'tech_1',
              format: firstInterviewFormat,
              scheduled_at: firstInterviewAt.length === 16 ? firstInterviewAt + ':00' : firstInterviewAt,
              location: roundLocation || null,
              outcome: 'pending',
            });
          } catch (roundErr) {
            // Round creation failure shouldn't fail the whole save
            console.error('Failed to auto-create first round:', roundErr);
          }
        }
      }
      navigate(`/opportunities/${opportunityId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-500">加载中…</div>;

  // Required fields for the progress bar
  const requiredChecks = [
    { label: '公司名称', filled: Boolean(form.company_name.trim()) },
    { label: '岗位名称', filled: Boolean(form.position_name.trim()) },
  ];
  const filledCount = requiredChecks.filter((c) => c.filled).length;
  const totalCount = requiredChecks.length;

  return (
    <div className="-mx-10 -my-8 bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            aria-label="返回"
          >
            <IconArrowLeft />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
              {isEdit ? '编辑面试机会' : '新建面试机会'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">填写岗位详情，开始跟踪你的面试进程</p>
          </div>
        </div>
        <ProgressBar filled={filledCount} total={totalCount} />
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-6">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-3">
            <span className="text-rose-500 mt-0.5 shrink-0">
              <IconAlert />
            </span>
            <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Section 1: Basic info */}
        <SectionCard
          icon={<IconBriefcase />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          title="基本信息"
          description="明确面试的公司、职位及信息来源"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="公司名称" required>
              <input
                value={form.company_name}
                onChange={(e) => update('company_name', e.target.value)}
                className={INPUT_CLASS}
                placeholder="例：字节跳动"
              />
            </Field>
            <Field label="岗位名称" required>
              <input
                value={form.position_name}
                onChange={(e) => update('position_name', e.target.value)}
                className={INPUT_CLASS}
                placeholder="例：后端开发工程师"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="来源">
                <div className="space-y-2">
                  {/* Row 1: built-in suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update('source', s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          form.source === s
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <input
                      value={
                        SOURCE_SUGGESTIONS.includes(form.source ?? '') &&
                        !customSourceInput
                          ? ''
                          : customSourceInput || form.source || ''
                      }
                      onChange={(e) => {
                        setCustomSourceInput(e.target.value);
                        update('source', e.target.value);
                      }}
                      onBlur={() => {
                        const v = customSourceInput.trim();
                        if (v && !SOURCE_SUGGESTIONS.includes(v)) {
                          addCustomSource(v);
                        }
                        setCustomSourceInput('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const v = customSourceInput.trim();
                          if (v) {
                            if (!SOURCE_SUGGESTIONS.includes(v)) addCustomSource(v);
                            update('source', v);
                            setCustomSourceInput('');
                          }
                        }
                      }}
                      className="flex-1 min-w-[120px] rounded-full border border-slate-200 px-3 py-1 text-xs outline-none focus:border-slate-400"
                      placeholder="其他来源…"
                    />
                  </div>
                  {/* Row 2: remembered custom sources (localStorage) */}
                  {customSources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pl-1">
                      <span className="text-[11px] text-slate-400 mr-0.5">最近用过：</span>
                      {customSources.map((s) => (
                        <span
                          key={s}
                          className={`inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-[11px] border ${
                            form.source === s
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 bg-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => update('source', s)}
                            className="hover:text-indigo-700 transition-colors"
                          >
                            {s}
                          </button>
                          <button
                            type="button"
                            aria-label={`移除 ${s}`}
                            onClick={() => removeCustomSource(s)}
                            className="w-4 h-4 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Save reminder: when user types a new value, persist it. */}
                  {customSourceInput && !SOURCE_SUGGESTIONS.includes(customSourceInput) && (
                    <p className="text-[11px] text-slate-400 pl-1">
                      按 Enter 或失焦后自动保存到"最近用过"
                    </p>
                  )}
                </div>
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Time & place */}
        <SectionCard
          icon={<IconCalendar />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          title="时间与地点"
          description="安排第一次面试的详细信息"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Field
              label="简历提交日期"
              hint={form.status === 'awaiting_response' ? '等待回复状态下，用于提醒"已等 N 天"' : '可选；选择"等待回复"状态时会用此日期算天数'}
            >
              <input
                type="date"
                value={form.resume_submitted_at ?? ''}
                onChange={(e) => update('resume_submitted_at', e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            {!isEdit ? (
              <>
                <Field label="第一次面试时间">
                  <DateTimeInput value={firstInterviewAt} onChange={setFirstInterviewAt} />
                </Field>
                <Field label="形式">
                  <select
                    value={firstInterviewFormat}
                    onChange={(e) =>
                      setFirstInterviewFormat(e.target.value as RoundFormat)
                    }
                    className={`${INPUT_CLASS} disabled:bg-slate-50 disabled:text-slate-400`}
                    disabled={!firstInterviewAt}
                  >
                    <option value="online_video">线上视频</option>
                    <option value="onsite">线下</option>
                    <option value="phone">电话</option>
                  </select>
                  {!firstInterviewAt && (
                    <p className="mt-1 text-xs text-slate-400">先填写左侧的面试时间</p>
                  )}
                </Field>
              </>
            ) : (
              <div className="md:col-span-2 text-xs text-slate-500 italic">
                编辑模式不支持修改首次面试时间，请到详情页调整轮次
              </div>
            )}
            <Field label="城市">
              <CityPicker value={cityValue} onChange={setCityValue} />
            </Field>
            <Field label="详细地址">
              <input
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className={INPUT_CLASS}
                placeholder="例：枫信科创中心 4 楼 466 室"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Section 3: Work details */}
        <SectionCard
          icon={<IconFileText />}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          title="工作详情"
          description="待遇、时间以及联系人信息"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="联系人 / HR">
              <input
                value={form.contact_info ?? ''}
                onChange={(e) => update('contact_info', e.target.value)}
                className={INPUT_CLASS}
                placeholder="例：张老师"
              />
            </Field>
            <Field label="薪资范围">
              <SalaryInput
                value={form.salary_range ?? ''}
                onChange={(v) => update('salary_range', v)}
              />
            </Field>
            <Field label="上下班时间">
              <select
                value={workHoursPreset}
                onChange={(e) => setWorkHoursPreset(e.target.value)}
                className={INPUT_CLASS}
              >
                {WORK_HOURS_PRESETS.map((p) => (
                  <option key={p.value || 'empty'} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {workHoursPreset === '__custom__' && (
                <input
                  value={workHoursCustom}
                  onChange={(e) => setWorkHoursCustom(e.target.value)}
                  className={`${INPUT_CLASS} mt-2`}
                  placeholder="自定义时间"
                />
              )}
            </Field>
            <Field label="周末制度">
              <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => update('weekend_policy', '')}
                  className={`flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-colors ${
                    form.weekend_policy === ''
                      ? 'bg-white shadow-sm text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  不填
                </button>
                {WEEKEND_POLICY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('weekend_policy', opt.value)}
                    className={`flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-colors ${
                      form.weekend_policy === opt.value
                        ? 'bg-white shadow-sm text-indigo-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Section 4: Advanced options (collapsible) */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                <IconPlus />
              </span>
              <span className="text-sm font-medium">
                高级选项（福利标签、JD 链接、备注等）
              </span>
            </div>
            <span
              className={`text-slate-400 transition-transform ${
                advancedOpen ? 'rotate-180' : ''
              }`}
            >
              <IconChevronDown />
            </span>
          </button>
          {advancedOpen && (
            <div className="px-6 py-5 border-t border-slate-200 space-y-4">
              <Field label="福利待遇">
                <div className="flex flex-wrap gap-2">
                  {BENEFIT_TAGS.map((tag) => (
                    <label
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded-full cursor-pointer text-sm transition ${
                        selectedBenefits.has(tag)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedBenefits.has(tag)}
                        onChange={(e) => {
                          setSelectedBenefits((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(tag);
                            else next.delete(tag);
                            return next;
                          });
                        }}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
                <textarea
                  value={benefitsOther}
                  onChange={(e) => setBenefitsOther(e.target.value)}
                  className={`${INPUT_CLASS} mt-2`}
                  rows={2}
                  placeholder="其他福利（用顿号或逗号分隔）"
                />
              </Field>
              <Field label="JD 链接">
                <input
                  value={form.jd_url ?? ''}
                  onChange={(e) => update('jd_url', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="https://"
                />
              </Field>
              <Field label="岗位 JD">
                <textarea
                  value={form.jd_text ?? ''}
                  onChange={(e) => update('jd_text', e.target.value)}
                  className={`${INPUT_CLASS} font-mono text-sm`}
                  rows={6}
                  placeholder="粘贴岗位 JD…"
                />
              </Field>
              <Field label="备注">
                <textarea
                  value={form.notes ?? ''}
                  onChange={(e) => update('notes', e.target.value)}
                  className={INPUT_CLASS}
                  rows={2}
                />
              </Field>
              {isEdit && (
                <Field label="状态">
                  <select
                    value={form.status}
                    onChange={(e) => update('status', e.target.value as OpportunityStatus)}
                    className={INPUT_CLASS}
                  >
                    <option value="in_progress">进行中</option>
                    <option value="awaiting_response">等待回复</option>
                    <option value="offered">已 Offer</option>
                    <option value="accepted">已接受</option>
                    <option value="rejected">未通过</option>
                    <option value="withdrawn">我已撤回</option>
                    <option value="declined">已拒 offer</option>
                    <option value="accepted_then_left">入职后离职</option>
                  </select>
                </Field>
              )}
              {(form.status === 'offered' || form.status === 'accepted') && (
                <>
                  <Field label="最终薪资（如 11K*13）">
                    <input
                      value={form.final_salary ?? ''}
                      onChange={(e) => update('final_salary', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="最终福利">
                    <textarea
                      value={form.final_benefits ?? ''}
                      onChange={(e) => update('final_benefits', e.target.value)}
                      className={INPUT_CLASS}
                      rows={2}
                    />
                  </Field>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 z-40 mt-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400 hidden md:block">
            所有数据将存储在本地 SQLite 数据库中
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm shadow-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              {saving ? '保存中…' : isEdit ? '保存修改' : '保存机会'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

const INPUT_CLASS =
  'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm placeholder-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition';

function SectionCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="bg-slate-50/60 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ProgressBar({ filled, total }: { filled: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((filled / total) * 100));
  return (
    <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
      <div className="flex justify-between w-full text-[10px] font-medium uppercase tracking-wider text-slate-500">
        <span>表单完成度</span>
        <span className="tabular-nums">必填 {filled}/{total}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function IconBriefcase() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg {...ICON_PROPS}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg {...ICON_PROPS}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg {...ICON_PROPS}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
