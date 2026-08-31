import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, OpportunityStatus, RoundFormat } from '../types';
import DateTimeInput from '../components/DateTimeInput';

type FormState = Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'has_weekends_off'> & {
  has_weekends_off: boolean;
};

const empty: FormState = {
  company_name: '',
  position_name: '',
  city: '',
  address: '',
  salary_range: '',
  benefits: '',
  has_weekends_off: false,
  work_hours: '',
  jd_text: '',
  jd_url: '',
  source: '',
  contact_info: '',
  status: 'in_progress',
  final_salary: '',
  final_benefits: '',
  notes: '',
};

const SALARY_RANGES = [
  { value: '', label: '（不填）' },
  { value: '8-10K', label: '8-10K' },
  { value: '10-12K', label: '10-12K' },
  { value: '12-15K', label: '12-15K' },
  { value: '15-20K', label: '15-20K' },
  { value: '20-25K', label: '20-25K' },
  { value: '25-30K', label: '25-30K' },
  { value: '30-40K', label: '30-40K' },
  { value: '40-50K', label: '40-50K' },
  { value: '50K+', label: '50K+' },
  { value: '__custom__', label: '自定义...' },
];

const SALARY_MONTHS = [
  { value: '', label: '（不填）' },
  { value: '12', label: '12 薪' },
  { value: '13', label: '13 薪' },
  { value: '14', label: '14 薪' },
  { value: '15', label: '15 薪' },
  { value: '16', label: '16 薪' },
];

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

const BENEFIT_TAGS = [
  '五险一金', '六险一金', '补充医疗', '年终奖', '股票期权',
  '餐补', '房补', '交通补', '弹性工作', '远程办公',
  '体检', '团建', '培训', '带薪年假', '加班费',
  '节日福利', '健身房', '免费零食',
];

function parseSalary(s: string | null): { preset: string; custom: string; months: string } {
  if (!s) return { preset: '', custom: '', months: '' };
  const m = s.match(/^(.+?)\*(\d+)$/);
  if (m) {
    const range = m[1];
    const months = m[2];
    const match = SALARY_RANGES.find((r) => r.value === range);
    return {
      preset: match ? match.value : '__custom__',
      custom: match ? '' : range,
      months,
    };
  }
  const match = SALARY_RANGES.find((r) => r.value === s);
  return {
    preset: match ? match.value : '__custom__',
    custom: match ? '' : s,
    months: '',
  };
}

function buildSalary(preset: string, custom: string, months: string): string | null {
  const range = preset === '__custom__' ? custom.trim() : preset;
  if (!range) return null;
  return months ? `${range}*${months}` : range;
}

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

export default function OpportunityForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  // Quick-add fields (only used when creating)
  const [location, setLocation] = useState('');
  const [firstInterviewAt, setFirstInterviewAt] = useState('');
  const [firstInterviewFormat, setFirstInterviewFormat] = useState<RoundFormat>('online_video');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Structured-field state (replaces free-text inputs for salary/work_hours/benefits)
  const [salaryPreset, setSalaryPreset] = useState('');
  const [salaryCustom, setSalaryCustom] = useState('');
  const [salaryMonths, setSalaryMonths] = useState('');
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
          has_weekends_off: Boolean(opp.has_weekends_off),
        });
        setLocation(opp.city ?? '');
        const s = parseSalary(opp.salary_range);
        setSalaryPreset(s.preset);
        setSalaryCustom(s.custom);
        setSalaryMonths(s.months);
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
      const trimmedLocation = location.trim();
      const payload = {
        ...form,
        has_weekends_off: form.has_weekends_off ? 1 : 0,
        city: trimmedLocation || null,
        address: null,
        salary_range: buildSalary(salaryPreset, salaryCustom, salaryMonths),
        benefits: buildBenefits(selectedBenefits, benefitsOther),
        work_hours: buildWorkHours(workHoursPreset, workHoursCustom),
        jd_text: form.jd_text || null,
        jd_url: form.jd_url || null,
        source: form.source || null,
        contact_info: form.contact_info || null,
        final_salary: form.final_salary || null,
        final_benefits: form.final_benefits || null,
        notes: form.notes || null,
      };
      let opportunityId: number;
      if (isEdit) {
        const updated = await api.opportunities.update(Number(id), payload);
        opportunityId = updated.id;
      } else {
        const created = await api.opportunities.create(payload);
        opportunityId = created.id;
        if (firstInterviewAt) {
          try {
            await api.rounds.create(opportunityId, {
              round_number: 1,
              round_type: 'tech_1',
              format: firstInterviewFormat,
              scheduled_at: firstInterviewAt.length === 16 ? firstInterviewAt + ':00' : firstInterviewAt,
              location: trimmedLocation || null,
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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isEdit ? '编辑面试机会' : '新建面试'}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="space-y-4">
        <Field label="公司名称" required>
          <input
            value={form.company_name}
            onChange={(e) => update('company_name', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
            placeholder="例：字节跳动"
          />
        </Field>
        <Field label="岗位名称" required>
          <input
            value={form.position_name}
            onChange={(e) => update('position_name', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
            placeholder="例：后端开发工程师"
          />
        </Field>

        {!isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="第一次面试时间">
              <DateTimeInput value={firstInterviewAt} onChange={setFirstInterviewAt} />
            </Field>
            <Field label="形式">
              <select
                value={firstInterviewFormat}
                onChange={(e) => setFirstInterviewFormat(e.target.value as RoundFormat)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
                disabled={!firstInterviewAt}
              >
                <option value="online_video">线上视频</option>
                <option value="onsite">线下</option>
                <option value="phone">电话</option>
              </select>
            </Field>
          </div>
        )}

        <Field label="地点">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
            placeholder="例：广州海珠智通广场"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="联系人 / HR">
            <input
              value={form.contact_info ?? ''}
              onChange={(e) => update('contact_info', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-1.5"
              placeholder="例：张老师"
            />
          </Field>
          <Field label="来源">
            <select
              value={form.source ?? ''}
              onChange={(e) => update('source', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-1.5"
            >
              <option value="">（不填）</option>
              <option value="Boss直聘">Boss直聘</option>
              <option value="拉勾">拉勾</option>
              <option value="内推">内推</option>
              <option value="猎头">猎头</option>
              <option value="公司官网">公司官网</option>
              <option value="其他">其他</option>
            </select>
          </Field>
        </div>

        <Field label="薪资范围">
          <div className="flex gap-2">
            <select
              value={salaryPreset}
              onChange={(e) => setSalaryPreset(e.target.value)}
              className="flex-1 border border-slate-300 rounded px-3 py-1.5"
            >
              {SALARY_RANGES.map((r) => (
                <option key={r.value || 'empty'} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <select
              value={salaryMonths}
              onChange={(e) => setSalaryMonths(e.target.value)}
              className="w-28 border border-slate-300 rounded px-3 py-1.5"
            >
              {SALARY_MONTHS.map((m) => (
                <option key={m.value || 'empty'} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          {salaryPreset === '__custom__' && (
            <input
              value={salaryCustom}
              onChange={(e) => setSalaryCustom(e.target.value)}
              className="w-full mt-2 border border-slate-300 rounded px-3 py-1.5"
              placeholder="例：30-50K / 18-25K / 面议"
            />
          )}
        </Field>
      </div>

      <div className="mt-6 border border-slate-200 rounded">
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full px-4 py-2.5 text-left font-medium flex items-center justify-between hover:bg-slate-50"
        >
          <span>高级选项</span>
          <span className="text-slate-400">{advancedOpen ? '▼' : '▶'}</span>
        </button>
        {advancedOpen && (
          <div className="px-4 py-3 border-t border-slate-200 space-y-3">
            <Field label="福利待遇">
              <div className="flex flex-wrap gap-2">
                {BENEFIT_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded cursor-pointer text-sm transition ${
                      selectedBenefits.has(tag)
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 hover:bg-slate-50'
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
                className="w-full mt-2 border border-slate-300 rounded px-3 py-1.5"
                rows={2}
                placeholder="其他福利（用顿号或逗号分隔）"
              />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="上下班时间">
                <select
                  value={workHoursPreset}
                  onChange={(e) => setWorkHoursPreset(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5"
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
                    className="w-full mt-2 border border-slate-300 rounded px-3 py-1.5"
                    placeholder="自定义时间"
                  />
                )}
              </Field>
              <Field label="">
                <label className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={form.has_weekends_off}
                    onChange={(e) => update('has_weekends_off', e.target.checked)}
                  />
                  <span>是否双休</span>
                </label>
              </Field>
            </div>
            <Field label="JD 链接">
              <input
                value={form.jd_url ?? ''}
                onChange={(e) => update('jd_url', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
                placeholder="https://"
              />
            </Field>
            <Field label="岗位 JD">
              <textarea
                value={form.jd_text ?? ''}
                onChange={(e) => update('jd_text', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-sm"
                rows={6}
                placeholder="粘贴岗位 JD…"
              />
            </Field>
            <Field label="备注">
              <textarea
                value={form.notes ?? ''}
                onChange={(e) => update('notes', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
                rows={2}
              />
            </Field>
            {isEdit && (
              <Field label="状态">
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as OpportunityStatus)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5"
                >
                  <option value="in_progress">进行中</option>
                  <option value="offered">已 Offer</option>
                  <option value="accepted">已接受</option>
                  <option value="rejected">未通过</option>
                  <option value="withdrawn">我已撤回</option>
                </select>
              </Field>
            )}
            {(form.status === 'offered' || form.status === 'accepted') && (
              <>
                <Field label="最终薪资（如 11K*13）">
                  <input
                    value={form.final_salary ?? ''}
                    onChange={(e) => update('final_salary', e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </Field>
                <Field label="最终福利">
                  <textarea
                    value={form.final_benefits ?? ''}
                    onChange={(e) => update('final_benefits', e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                    rows={2}
                  />
                </Field>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}
