import { useEffect, useState } from 'react';

type Mode = 'empty' | 'negotiable' | 'range';

interface Parsed {
  mode: Mode;
  min: string;
  max: string;
  unit: 'K' | '万';
  months: string;
}

const EMPTY: Parsed = { mode: 'empty', min: '', max: '', unit: 'K', months: '' };

/**
 * Parse a stored salary string into structured fields for editing.
 * Returns `mode: 'empty'` if the string can't be parsed — caller falls back
 * to a free-text input so legacy data is never lost.
 */
export function parseSalary(stored: string | null | undefined): Parsed {
  const s = (stored ?? '').trim();
  if (!s) return { ...EMPTY };
  if (s === '面议') return { mode: 'negotiable', min: '', max: '', unit: 'K', months: '' };
  // Match "min[unit] - max[unit] [* months]"
  // Examples: 10K-12K, 10-12K, 25-40, 10K-12K*13, 1万-2万
  const re = /^(\d+(?:\.\d+)?)(K|万)?\s*[-—~到至]\s*(\d+(?:\.\d+)?)(K|万)?(?:\*(\d+))?$/i;
  const m = s.match(re);
  if (m) {
    return {
      mode: 'range',
      min: m[1],
      max: m[3],
      unit: (m[2] || m[4] || 'K') as 'K' | '万',
      months: m[5] ?? '',
    };
  }
  // Fallback: free-text mode, preserve the original string in `min`
  return { ...EMPTY, mode: 'empty', min: s };
}

/** Serialize structured fields back to the canonical string format. */
export function serializeSalary(p: Parsed): string {
  if (p.mode === 'empty') return p.min.trim(); // free-text fallback keeps the user's literal input
  if (p.mode === 'negotiable') return '面议';
  // range
  const min = p.min.trim();
  const max = p.max.trim();
  if (!min && !max) return '';
  if (min && !max) return `${min}${p.unit}`;
  if (!min && max) return `${max}${p.unit}`;
  const months = p.months.trim();
  return months ? `${min}${p.unit}-${max}${p.unit}*${months}` : `${min}${p.unit}-${max}${p.unit}`;
}

export default function SalaryInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const [parsed, setParsed] = useState<Parsed>(() => parseSalary(value));

  // Keep internal state in sync when the parent updates the value (e.g. on load).
  useEffect(() => {
    setParsed(parseSalary(value));
  }, [value]);

  function update(next: Parsed) {
    setParsed(next);
    onChange(serializeSalary(next));
  }

  const fullInputClass =
    'w-full border border-slate-300 rounded px-3 py-1.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition';

  // Range-mode inputs sit in a horizontal flex row, so they must not be `w-full`.
  const inlineInputClass =
    'border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition';

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {/* Mode selector */}
      <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-sm">
        {(
          [
            { key: 'empty', label: '不填' },
            { key: 'negotiable', label: '面议' },
            { key: 'range', label: '范围' },
          ] as { key: Mode; label: string }[]
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              // Switching into 'range' from empty/negotiable: prefill with 10-20
              if (opt.key === 'range' && parsed.mode !== 'range') {
                update({
                  mode: 'range',
                  min: parsed.min && parsed.mode === 'empty' ? '' : '10',
                  max: parsed.max && parsed.mode === 'empty' ? '' : '20',
                  unit: 'K',
                  months: '',
                });
                return;
              }
              update({ ...parsed, mode: opt.key });
            }}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              parsed.mode === opt.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Body */}
      {parsed.mode === 'empty' && (
        <input
          value={parsed.min}
          onChange={(e) => update({ ...parsed, min: e.target.value })}
          className={fullInputClass}
          placeholder="例：10K-12K*13 / 25-40K / 面议"
        />
      )}

      {parsed.mode === 'negotiable' && (
        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600">
          薪资待沟通
        </div>
      )}

      {parsed.mode === 'range' && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={parsed.min}
            onChange={(e) => update({ ...parsed, min: e.target.value })}
            className={`${inlineInputClass} w-20 tabular-nums`}
            placeholder="下限"
            aria-label="薪资下限"
          />
          <span className="text-slate-400 select-none">—</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={parsed.max}
            onChange={(e) => update({ ...parsed, max: e.target.value })}
            className={`${inlineInputClass} w-20 tabular-nums`}
            placeholder="上限"
            aria-label="薪资上限"
          />
          <select
            value={parsed.unit}
            onChange={(e) => update({ ...parsed, unit: e.target.value as 'K' | '万' })}
            className={`${inlineInputClass} w-16`}
            aria-label="薪资单位"
          >
            <option value="K">K</option>
            <option value="万">万</option>
          </select>
          <span className="text-slate-300 select-none">|</span>
          <span className="text-slate-500 text-xs whitespace-nowrap">
            年薪
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={36}
              value={parsed.months}
              onChange={(e) => update({ ...parsed, months: e.target.value })}
              className={`${inlineInputClass} w-14 tabular-nums mx-1.5`}
              placeholder="13"
              aria-label="每年发几个月薪资（选填）"
            />
            薪（选填）
          </span>
        </div>
      )}
    </div>
  );
}
