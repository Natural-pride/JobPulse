import { format, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { TimelineEvent } from '../lib/timelineUtils';
import { formatTimelineLabel } from '../lib/timelineUtils';

function ICON_CREATED() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function ICON_ROUND() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ICON_CHECK() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ICON_X() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function ICON_CANCEL() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}
function ICON_GIFT() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
function ICON_CHECK_DOUBLE() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const EVENT_ICON: Record<TimelineEvent['type'], () => JSX.Element> = {
  created: ICON_CREATED,
  round_scheduled: ICON_ROUND,
  round_pending: ICON_ROUND,
  round_passed: ICON_CHECK,
  round_failed: ICON_X,
  round_cancelled: ICON_CANCEL,
  status_offered: ICON_GIFT,
  status_accepted: ICON_CHECK_DOUBLE,
};

const EVENT_TEXT_COLOR: Record<TimelineEvent['type'], string> = {
  created: 'text-indigo-700',
  round_scheduled: 'text-blue-700',
  round_pending: 'text-blue-700',
  round_passed: 'text-emerald-700',
  round_failed: 'text-rose-700',
  round_cancelled: 'text-slate-600',
  status_offered: 'text-amber-700',
  status_accepted: 'text-emerald-700',
};

export default function OpportunityTimeline({
  events,
  emptyHint,
}: {
  events: TimelineEvent[];
  emptyHint?: string;
}) {
  if (events.length === 0) {
    return (
      <div className="text-sm text-neutral-500 italic">
        {emptyHint ?? '暂无时间线事件'}
      </div>
    );
  }

  const now = new Date();

  return (
    <ol className="relative pl-6">
      {/* Vertical gradient rail */}
      <span
        aria-hidden
        className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-200 via-blue-200 to-emerald-200"
      />
      {events.map((e) => {
        const Icon = EVENT_ICON[e.type];
        const d = parseISO(e.date);
        const leftLabel = isValid(d) ? formatTimelineLabel(d) : e.dateLabel;
        return (
          <li
            key={e.id}
            className="relative pb-4 last:pb-0"
          >
            <span
              aria-hidden
              className={`absolute -left-[14px] top-1 w-3 h-3 rounded-full ${e.dotClass} ring-4 ${e.ringClass} flex items-center justify-center text-white`}
            >
              <Icon />
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <div
                className={`text-sm font-medium ${EVENT_TEXT_COLOR[e.type]}`}
              >
                {e.title}
              </div>
              <div className="text-[11px] text-neutral-500 tabular-nums shrink-0">
                {leftLabel}
              </div>
            </div>
            {e.subtitle && (
              <div className="text-xs text-neutral-500 mt-0.5">
                {e.roundId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`round-${e.roundId}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-indigo-300');
                        setTimeout(() => {
                          el.classList.remove('ring-2', 'ring-indigo-300');
                        }, 1500);
                      }
                    }}
                    className="text-left hover:text-indigo-600 transition-colors"
                  >
                    {e.subtitle}
                  </button>
                ) : (
                  e.subtitle
                )}
              </div>
            )}
          </li>
        );
      })}
      {/* Future marker */}
      <li className="relative">
        <span
          aria-hidden
          className="absolute -left-[14px] top-1 w-3 h-3 rounded-full bg-white border-2 border-slate-300"
        />
        <div className="text-xs text-slate-400 italic">现在 · 持续关注</div>
        <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
          {format(now, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
        </div>
      </li>
    </ol>
  );
}
