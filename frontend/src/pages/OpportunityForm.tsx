import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, OpportunityStatus } from '../types';
import CollapsibleSection from '../components/CollapsibleSection';

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

export default function OpportunityForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const opp = await api.opportunities.get(Number(id));
        setForm({
          ...opp,
          has_weekends_off: Boolean(opp.has_weekends_off),
        });
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
      const payload = {
        ...form,
        has_weekends_off: form.has_weekends_off ? 1 : 0,
        city: form.city || null,
        address: form.address || null,
        salary_range: form.salary_range || null,
        benefits: form.benefits || null,
        work_hours: form.work_hours || null,
        jd_text: form.jd_text || null,
        jd_url: form.jd_url || null,
        source: form.source || null,
        contact_info: form.contact_info || null,
        final_salary: form.final_salary || null,
        final_benefits: form.final_benefits || null,
        notes: form.notes || null,
      };
      if (isEdit) {
        await api.opportunities.update(Number(id), payload);
        navigate(`/opportunities/${id}`);
      } else {
        const created = await api.opportunities.create(payload);
        navigate(`/opportunities/${created.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-500">加载中…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isEdit ? '编辑面试机会' : '新建面试机会'}</h1>
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

      <CollapsibleSection title="基本信息" defaultOpen>
        <Field label="公司名称" required>
          <input
            value={form.company_name}
            onChange={(e) => update('company_name', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
          />
        </Field>
        <Field label="岗位名称" required>
          <input
            value={form.position_name}
            onChange={(e) => update('position_name', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
          />
        </Field>
        <Field label="城市">
          <input
            value={form.city ?? ''}
            onChange={(e) => update('city', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
          />
        </Field>
        <Field label="详细地点">
          <input
            value={form.address ?? ''}
            onChange={(e) => update('address', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
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
        <Field label="状态">
          <select
            value={form.status}
            onChange={(e) => update('status', e.target.value as OpportunityStatus)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
          >
            <option value="in_progress">进行中</option>
            <option value="offered">已 Offer</option>
            <option value="accepted">已接受</option>
            <option value="rejected">已拒绝</option>
            <option value="withdrawn">我已撤回</option>
          </select>
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="薪资福利">
        <Field label="薪资范围（如 10K-12K*13）">
          <input
            value={form.salary_range ?? ''}
            onChange={(e) => update('salary_range', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
          />
        </Field>
        <Field label="福利待遇">
          <textarea
            value={form.benefits ?? ''}
            onChange={(e) => update('benefits', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
            rows={3}
          />
        </Field>
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
      </CollapsibleSection>

      <CollapsibleSection title="工作时间">
        <Field label="上下班时间（如 9:00-18:00）">
          <input
            value={form.work_hours ?? ''}
            onChange={(e) => update('work_hours', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
          />
        </Field>
        <Field label="">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.has_weekends_off}
              onChange={(e) => update('has_weekends_off', e.target.checked)}
            />
            <span>是否双休</span>
          </label>
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="岗位 JD">
        <Field label="">
          <textarea
            value={form.jd_text ?? ''}
            onChange={(e) => update('jd_text', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-sm"
            rows={10}
            placeholder="粘贴岗位 JD…"
          />
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="联系信息">
        <Field label="来源（Boss/拉勾/内推/猎头）">
          <input
            value={form.source ?? ''}
            onChange={(e) => update('source', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
          />
        </Field>
        <Field label="联系方式">
          <input
            value={form.contact_info ?? ''}
            onChange={(e) => update('contact_info', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
          />
        </Field>
        <Field label="备注">
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5"
            rows={3}
          />
        </Field>
      </CollapsibleSection>
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
