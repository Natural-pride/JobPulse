import { Link } from 'react-router-dom';
import type { ActivityEvent } from '../../lib/dashboardUtils';
import {
  ROUND_DOT,
  ROUND_OUTCOME_BADGE,
  ROUND_OUTCOME_TEXT,
  ROUND_RING_CLASS,
  formatActivityTime,
} from '../../lib/dashboardUtils';

export default function RecentActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-200">近期动态</h2>
        <span className="text-xs text-slate-500">最近 {events.length} 条</span>
      </div>
      {events.length === 0 ? (
        <div className="text-xs text-slate-500 py-6 text-center">暂无记录</div>
      ) : (
        <ol className="relative pl-6">
          {/* Vertical gradient rail */}
          <span
            aria-hidden
            className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/60 via-blue-500/40 to-slate-600/30"
          />
          {events.map((e) => (
            <li key={e.id} className="relative pb-4 last:pb-0">
              <span
                aria-hidden
                className={`absolute -left-[14px] top-1 w-3 h-3 rounded-full ${ROUND_DOT(e.outcome)} ring-4 ${ROUND_RING_CLASS(e.outcome)}`}
              />
              <Link
                to={`/opportunities/${e.opportunityId}`}
                className="block group"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium text-slate-100 truncate group-hover:text-white">
                    {e.company} · {e.position}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums shrink-0">
                    {formatActivityTime(e.occurredAt)}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{e.roundLabel}</span>
                  <span>·</span>
                  <span>{e.formatLabel}</span>
                  <span
                    className={`ml-auto text-[11px] font-semibold ${ROUND_OUTCOME_BADGE(e.outcome)}`}
                  >
                    {ROUND_OUTCOME_TEXT(e.outcome)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
