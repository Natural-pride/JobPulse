import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, OpportunityStatus, RoundFormat, WeekendPolicy } from '../types';
import DateTimeInput from '../components/DateTimeInput';
import useDocumentTitle from '../hooks/useDocumentTitle';

type FormState = Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'weekend_policy'> & {
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
  source: '',
  contact_info: '',
  status: 'in_progress',
  final_salary: '',
  final_benefits: '',
  notes: '',
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
  const [location, setLocation] = useState('');
  const [firstInterviewAt, setFirstInterviewAt] = useState('');
  const [firstInterviewFormat, setFirstInterviewFormat] = useState<RoundFormat>('online_video');
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
        });
        setLocation(opp.city ?? '');
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
        weekend_policy: form.weekend_policy || null,
        city: trimmedLocation || null,
        address: null,
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{isEdit ? '编辑面试机会' : '新建面试'}</h1>
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
                className="w-full border border-slate-300 rounded px-3 py-1.5 disabled:bg-slate-50 disabled:text-slate-400"
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
          <input
            value={form.salary_range ?? ''}
            onChange={(e) => update('salary_range', e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-sm placeholder-neutral-400 hover:border-neutral-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 transition"
            placeholder="例：10K-12K*13 / 25-40K / 面议"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
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
          <Field label="双休">
            <select
              value={form.weekend_policy}
              onChange={(e) => update('weekend_policy', e.target.value as WeekendPolicy | '')}
              className="w-full border border-slate-300 rounded px-3 py-1.5"
            >
              <option value="">（不填）</option>
              {WEEKEND_POLICY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
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
                        ? 'border-indigo-700 bg-indigo-700 text-white shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
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

      <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-white text-neutral-700 border border-neutral-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-800 active:bg-indigo-900 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
        >
          {saving ? '保存中…' : isEdit ? '保存修改' : '保存'}
        </button>
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
