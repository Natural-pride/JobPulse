import { format, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { InterviewRound, Opportunity } from '../types';
import { ROUND_TYPE_META, FORMAT_META, OUTCOME_META } from './status';

export type TimelineEventType =
  | 'created'
  | 'round_scheduled'
  | 'round_passed'
  | 'round_failed'
  | 'round_cancelled'
  | 'round_pending'
  | 'status_offered'
  | 'status_accepted';

export interface TimelineEvent {
  id: string;
  /** ISO date string for sorting. */
  date: string;
  /** Display date label, e.g. "今天 15:00" or "2026-08-30 11:00". */
  dateLabel: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  /** Tailwind color tokens. */
  dotClass: string;
  ringClass: string;
  /** Round ID, when the event references a specific round. */
  roundId?: number;
}

const TYPE_META: Record<
  TimelineEventType,
  { dot: string; ring: string; title: (ctx: EventCtx) => string; subtitle?: (ctx: EventCtx) => string | undefined }
> = {
  created: {
    dot: 'bg-indigo-500',
    ring: 'ring-indigo-100',
    title: () => '机会创建',
  },
  round_scheduled: {
    dot: 'bg-blue-500',
    ring: 'ring-blue-100',
    title: () => '已安排面试',
  },
  round_pending: {
    dot: 'bg-blue-500',
    ring: 'ring-blue-100',
    title: () => '待面试',
  },
  round_passed: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-100',
    title: () => '轮次已通过',
  },
  round_failed: {
    dot: 'bg-rose-500',
    ring: 'ring-rose-100',
    title: () => '轮次未通过',
  },
  round_cancelled: {
    dot: 'bg-slate-400',
    ring: 'ring-slate-100',
    title: () => '轮次已取消',
  },
  status_offered: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-100',
    title: () => '收到 Offer',
  },
  status_accepted: {
    dot: 'bg-emerald-600',
    ring: 'ring-emerald-100',
    title: () => '已接受 Offer',
  },
};

interface EventCtx {
  round?: InterviewRound;
  opp: Opportunity;
}

function fmtDate(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, 'yyyy-MM-dd HH:mm');
}

function buildRoundSubtitle(round: InterviewRound): string {
  const type = ROUND_TYPE_META[round.round_type] ?? round.round_type;
  const fmt = FORMAT_META[round.format] ?? round.format;
  const parts = [type, fmt];
  if (round.location) parts.push(round.location);
  return parts.join(' · ');
}

export function buildTimeline(
  opp: Opportunity,
  rounds: InterviewRound[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const ctx: EventCtx = { opp };

  // 1. Opportunity created
  events.push({
    id: 'created',
    date: opp.created_at,
    dateLabel: fmtDate(opp.created_at),
    type: 'created',
    title: TYPE_META.created.title(ctx),
    subtitle: `添加了「${opp.company_name} · ${opp.position_name}」`,
    dotClass: TYPE_META.created.dot,
    ringClass: TYPE_META.created.ring,
  });

  // 2. For each round, emit events
  const sortedRounds = [...rounds].sort((a, b) => {
    // Order by scheduled_at first, then actual_at
    const ak = a.actual_at || a.scheduled_at;
    const bk = b.actual_at || b.scheduled_at;
    return ak.localeCompare(bk);
  });

  for (const round of sortedRounds) {
    // If the round has an outcome of passed/failed/cancelled, emit a single
    // event on the actual_at date (or scheduled_at if no actual).
    if (round.outcome === 'passed' || round.outcome === 'failed' || round.outcome === 'cancelled') {
      const dateIso = round.actual_at || round.scheduled_at;
      const eventType: TimelineEventType =
        round.outcome === 'passed'
          ? 'round_passed'
          : round.outcome === 'failed'
          ? 'round_failed'
          : 'round_cancelled';
      events.push({
        id: `round-${round.id}-${eventType}`,
        date: dateIso,
        dateLabel: fmtDate(dateIso),
        type: eventType,
        title: `${ROUND_TYPE_META[round.round_type] ?? '轮次'} ${OUTCOME_META[round.outcome]?.label ?? round.outcome}`,
        subtitle: buildRoundSubtitle(round),
        dotClass: TYPE_META[eventType].dot,
        ringClass: TYPE_META[eventType].ring,
        roundId: round.id,
      });
    } else {
      // Pending outcome: show "scheduled" event on scheduled_at.
      events.push({
        id: `round-${round.id}-scheduled`,
        date: round.scheduled_at,
        dateLabel: fmtDate(round.scheduled_at),
        type: 'round_scheduled',
        title: `${ROUND_TYPE_META[round.round_type] ?? '轮次'} 已安排`,
        subtitle: buildRoundSubtitle(round),
        dotClass: TYPE_META.round_scheduled.dot,
        ringClass: TYPE_META.round_scheduled.ring,
        roundId: round.id,
      });
    }
  }

  // 3. Status milestones (offered / accepted)
  if (opp.status === 'offered' || opp.status === 'accepted') {
    // We don't track the exact status-change timestamp, so use updated_at.
    events.push({
      id: 'status-offered',
      date: opp.updated_at,
      dateLabel: fmtDate(opp.updated_at),
      type: 'status_offered',
      title: TYPE_META.status_offered.title(ctx),
      subtitle: opp.final_salary ? `最终薪资：${opp.final_salary}` : '待补充最终薪资',
      dotClass: TYPE_META.status_offered.dot,
      ringClass: TYPE_META.status_offered.ring,
    });
  }
  if (opp.status === 'accepted') {
    events.push({
      id: 'status-accepted',
      date: opp.updated_at,
      dateLabel: fmtDate(opp.updated_at),
      type: 'status_accepted',
      title: TYPE_META.status_accepted.title(ctx),
      subtitle: opp.final_salary ? `最终薪资：${opp.final_salary}` : undefined,
      dotClass: TYPE_META.status_accepted.dot,
      ringClass: TYPE_META.status_accepted.ring,
    });
  }

  // Sort by date asc (timeline reads top → bottom, oldest first)
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

/** Compact date label for the left rail of the timeline. */
export function formatTimelineLabel(d: Date): string {
  return format(d, 'MM-dd HH:mm', { locale: zhCN });
}
