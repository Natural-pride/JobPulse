import { useEffect, useState } from 'react';
import type { InterviewRound, RoundType, RoundFormat, RoundOutcome } from '../types';
import { ROUND_TYPE_META, FORMAT_META, OUTCOME_META } from '../lib/status';
import { api } from '../api/client';
import DateTimeInput from './DateTimeInput';

type FormState = {
  round_number: number;
  round_type: RoundType;
  format: RoundFormat;
  location: string;
  scheduled_at: string;
  actual_at: string;
  duration_minutes: string;
  questions: string;
  my_performance: string;
  outcome: RoundOutcome;
  next_round_date: string;
  notes: string;
};

const empty: FormState = {
  round_number: 1,
  round_type: 'tech_1',
  format: 'online_video',
  location: '',
  scheduled_at: '',
  actual_at: '',
  duration_minutes: '',
  questions: '',
  my_performance: '',
  outcome: 'pending',
  next_round_date: '',
  notes: '',
};

function fromRound(r: InterviewRound): FormState {
  return {
    round_number: r.round_number,
    round_type: r.round_type,
    format: r.format,
    location: r.location ?? '',
    scheduled_at: r.scheduled_at,
    actual_at: r.actual_at ?? '',
    duration_minutes: r.duration_minutes?.toString() ?? '',
    questions: r.questions ?? '',
    my_performance: r.my_performance ?? '',
    outcome: r.outcome,
    next_round_date: r.next_round_date ?? '',
    notes: r.notes ?? '',
  };
}

export default function RoundModal({
  open,
  onClose,
  onSaved,
  opportunityId,
  initial,
  defaultRoundNumber,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  opportunityId: number;
  initial: InterviewRound | null;
  defaultRoundNumber?: number;
}) {
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? fromRound(initial)
          : { ...empty, round_number: defaultRoundNumber ?? empty.round_number }
      );
      setError(null);
    }
  }, [open, initial, defaultRoundNumber]);

  if (!open) return null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.scheduled_at) {
      setError('计划时间必填');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        round_number: form.round_number,
        round_type: form.round_type,
        format: form.format,
        location: form.location || null,
        scheduled_at: form.scheduled_at,
        actual_at: form.actual_at || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        questions: form.questions || null,
        my_performance: form.my_performance || null,
        outcome: form.outcome,
        next_round_date: form.next_round_date || null,
        notes: form.notes || null,
      };
      if (initial) {
        await api.rounds.update(initial.id, payload);
      } else {
        await api.rounds.create(opportunityId, payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">
            {initial ? '编辑面试轮次' : '添加面试轮次'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="第几轮">
              <input
                type="number"
                min={1}
                value={form.round_number}
                onChange={(e) => update('round_number', Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
              />
            </Field>
            <Field label="轮次类型">
              <select
                value={form.round_type}
                onChange={(e) => update('round_type', e.target.value as RoundType)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
              >
                {(Object.keys(ROUND_TYPE_META) as RoundType[]).map((k) => (
                  <option key={k} value={k}>
                    {ROUND_TYPE_META[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="形式">
              <select
                value={form.format}
                onChange={(e) => update('format', e.target.value as RoundFormat)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
              >
                {(Object.keys(FORMAT_META) as RoundFormat[]).map((k) => (
                  <option key={k} value={k}>
                    {FORMAT_META[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="计划时间" required>
              <DateTimeInput
                value={form.scheduled_at}
                onChange={(v) => update('scheduled_at', v)}
                required
              />
            </Field>
            <Field label="地点">
              <input
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
              />
            </Field>
            <Field label="时长（分钟）">
              <input
                type="number"
                min={1}
                value={form.duration_minutes}
                onChange={(e) => update('duration_minutes', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
              />
            </Field>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="text-sm text-slate-500 mb-2">面试后填写（可后补）</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="实际时间">
                <DateTimeInput
                  value={form.actual_at}
                  onChange={(v) => update('actual_at', v)}
                />
              </Field>
              <Field label="结果">
                <select
                  value={form.outcome}
                  onChange={(e) => update('outcome', e.target.value as RoundOutcome)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5"
                >
                  {(Object.keys(OUTCOME_META) as RoundOutcome[]).map((k) => (
                    <option key={k} value={k}>
                      {OUTCOME_META[k].label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="下轮时间">
                <DateTimeInput
                  value={form.next_round_date}
                  onChange={(v) => update('next_round_date', v)}
                />
              </Field>
            </div>
            <Field label="问题">
              <textarea
                value={form.questions}
                onChange={(e) => update('questions', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
                rows={3}
              />
            </Field>
            <Field label="我的表现">
              <textarea
                value={form.my_performance}
                onChange={(e) => update('my_performance', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
                rows={3}
              />
            </Field>
            <Field label="备注">
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-1.5"
                rows={2}
              />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
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
