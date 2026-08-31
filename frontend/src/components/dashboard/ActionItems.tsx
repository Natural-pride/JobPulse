import { Link } from 'react-router-dom';
import type { ActionItem as ApiActionItem } from '../../api/client';

const TYPE_META: Record<
  ApiActionItem['type'],
  { icon: React.ReactNode; label: string }
> = {
  follow_up: {
    label: '跟进一下',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  add_next_round: {
    label: '加下一轮',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  fill_offer: {
    label: '补最终薪资',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  pending_overdue: {
    label: '超时未面试',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  status_inconsistent: {
    label: '状态不一致',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
      </svg>
    ),
  },
};

const SEVERITY_STYLE: Record<
  ApiActionItem['severity'],
  { dot: string; text: string; label: string }
> = {
  red: { dot: 'bg-rose-500', text: 'text-rose-700', label: '紧急' },
  yellow: { dot: 'bg-amber-500', text: 'text-amber-700', label: '注意' },
  blue: { dot: 'bg-indigo-500', text: 'text-indigo-700', label: '提示' },
};

export default function ActionItems({ items }: { items: ApiActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
          <h2 className="text-sm font-medium text-neutral-900">没有待办事项</h2>
        </div>
        <p className="text-xs text-neutral-500 mt-1">所有机会都在正常推进 👍</p>
      </div>
    );
  }

  const counts = items.reduce(
    (acc, i) => ({ ...acc, [i.severity]: (acc[i.severity] ?? 0) + 1 }),
    {} as Record<ApiActionItem['severity'], number>
  );

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
            aria-hidden
          />
          <h2 className="text-sm font-medium text-neutral-900">
            待办事项
            <span className="ml-2 text-xs text-neutral-500 tabular-nums">
              {items.length} 项
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {(['red', 'yellow', 'blue'] as const).map((sev) =>
            counts[sev] ? (
              <span
                key={sev}
                className="inline-flex items-center gap-1 text-neutral-500"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${SEVERITY_STYLE[sev].dot}`}
                />
                {SEVERITY_STYLE[sev].label} {counts[sev]}
              </span>
            ) : null
          )}
        </div>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const meta = TYPE_META[item.type];
          const sev = SEVERITY_STYLE[item.severity];
          return (
            <li key={`${item.opportunity_id}-${item.type}`}>
              <Link
                to={`/opportunities/${item.opportunity_id}`}
                className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <span
                  className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${sev.text} bg-opacity-10 ${
                    item.severity === 'red'
                      ? 'bg-rose-50'
                      : item.severity === 'yellow'
                      ? 'bg-amber-50'
                      : 'bg-indigo-50'
                  }`}
                >
                  {meta.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-neutral-900 truncate">
                      {item.company} · {item.position}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${sev.text} bg-slate-100 shrink-0`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    {item.message}
                    <span className="text-neutral-400"> · {item.hint}</span>
                  </div>
                </div>
                <svg
                  className="mt-2 text-neutral-300 group-hover:text-neutral-500 transition-colors"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
