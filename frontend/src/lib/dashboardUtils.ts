import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
  isValid,
} from 'date-fns';
import type { InterviewRound, Opportunity } from '../types';

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  /** Width percentage relative to the top (widest) stage. */
  width: number;
  /** Conversion rate from the previous stage, 0-1. */
  rate: number;
  /** Bar color classes. */
  barClass: string;
  /** Text color class. */
  textClass: string;
}

const STAGE_COLORS: Array<{ bar: string; text: string }> = [
  { bar: 'bg-slate-500', text: 'text-slate-200' },
  { bar: 'bg-blue-600', text: 'text-blue-100' },
  { bar: 'bg-emerald-600', text: 'text-emerald-100' },
  { bar: 'bg-amber-500', text: 'text-amber-50' },
];

const STAGE_LABELS = ['投递', '一面', '通过一面', 'Offer'];

export function buildFunnel(
  opps: Opportunity[],
  roundsByOpp: Map<number, InterviewRound[]>
): FunnelStage[] {
  const total = opps.length;
  const interviewed = opps.filter(
    (o) => (roundsByOpp.get(o.id) ?? []).length > 0
  ).length;
  const passedFirst = opps.filter((o) =>
    (roundsByOpp.get(o.id) ?? []).some((r) => r.outcome === 'passed')
  ).length;
  const offered = opps.filter(
    (o) => o.status === 'offered' || o.status === 'accepted'
  ).length;

  const counts = [total, interviewed, passedFirst, offered];
  return counts.map((count, i) => ({
    key: ['applied', 'interviewed', 'passed_first', 'offer'][i],
    label: STAGE_LABELS[i],
    count,
    width: total ? (count / total) * 100 : 0,
    rate: i === 0 ? 1 : counts[i - 1] ? count / counts[i - 1] : 0,
    barClass: STAGE_COLORS[i].bar,
    textClass: STAGE_COLORS[i].text,
  }));
}

const SOURCE_BAR_COLORS = [
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-slate-500',
];

export interface SourceBucket {
  source: string;
  count: number;
  /** Bar width as percentage of the leading source. */
  width: number;
  barClass: string;
}

export function buildSourceDistribution(
  opps: Opportunity[],
  topN = 6
): SourceBucket[] {
  const counts = new Map<string, number>();
  for (const o of opps) {
    const key = (o.source ?? '').trim() || '未填';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
  const max = sorted[0]?.[1] ?? 0;
  return sorted.map(([source, count], i) => ({
    source,
    count,
    width: max ? (count / max) * 100 : 0,
    barClass: SOURCE_BAR_COLORS[i % SOURCE_BAR_COLORS.length],
  }));
}

export interface ActivityEvent {
  id: number;
  opportunityId: number;
  company: string;
  position: string;
  roundType: string;
  roundLabel: string;
  formatLabel: string;
  outcome: string;
  occurredAt: Date;
  occurredAtLabel: string;
}

const ROUND_COLORS: Record<string, string> = {
  pending: 'bg-blue-500',
  passed: 'bg-emerald-500',
  failed: 'bg-rose-500',
  cancelled: 'bg-slate-400',
};

const ROUND_RING: Record<string, string> = {
  pending: 'ring-blue-500/30',
  passed: 'ring-emerald-500/30',
  failed: 'ring-rose-500/30',
  cancelled: 'ring-slate-400/30',
};

const ROUND_OUTCOME_LABEL: Record<string, string> = {
  pending: '待面试',
  passed: '已通过',
  failed: '未通过',
  cancelled: '已取消',
};

const ROUND_OUTCOME_TEXT_COLOR: Record<string, string> = {
  pending: 'text-blue-300',
  passed: 'text-emerald-300',
  failed: 'text-rose-300',
  cancelled: 'text-slate-400',
};

export function ROUND_DOT(outcome: string): string {
  return ROUND_COLORS[outcome] ?? 'bg-slate-400';
}
export function ROUND_RING_CLASS(outcome: string): string {
  return ROUND_RING[outcome] ?? 'ring-slate-400/30';
}
export function ROUND_OUTCOME_BADGE(outcome: string): string {
  return ROUND_OUTCOME_TEXT_COLOR[outcome] ?? 'text-slate-400';
}
export function ROUND_OUTCOME_TEXT(outcome: string): string {
  return ROUND_OUTCOME_LABEL[outcome] ?? outcome;
}

export function buildRecentActivity(
  opps: Opportunity[],
  roundsByOpp: Map<number, InterviewRound[]>,
  roundTypeLabel: (k: string) => string,
  formatLabel: (k: string) => string,
  limit = 10
): ActivityEvent[] {
  const oppMap = new Map(opps.map((o) => [o.id, o]));
  const all: ActivityEvent[] = [];
  for (const [oppId, rounds] of roundsByOpp) {
    const opp = oppMap.get(oppId);
    if (!opp) continue;
    for (const r of rounds) {
      const iso = r.actual_at ?? r.scheduled_at;
      const d = parseISO(iso);
      if (!isValid(d)) continue;
      all.push({
        id: r.id,
        opportunityId: oppId,
        company: opp.company_name,
        position: opp.position_name,
        roundType: r.round_type,
        roundLabel: roundTypeLabel(r.round_type),
        formatLabel: formatLabel(r.format),
        outcome: r.outcome,
        occurredAt: d,
        occurredAtLabel: format(d, 'MM-dd HH:mm'),
      });
    }
  }
  all.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  return all.slice(0, limit);
}

export interface HeatmapCell {
  /** Date for this cell. */
  date: Date;
  /** Number of rounds (interviews) that happened on this date. */
  count: number;
  /** 0-based column index (0 = oldest week). */
  col: number;
  /** 0-based row index (0 = Monday). */
  row: number;
  /** Intensity bucket 0..4 (0 = empty, 4 = 4+). */
  intensity: number;
  /** Tailwind bg class for this cell. */
  bgClass: string;
}

const HEAT_BG = [
  'bg-neutral-100',
  'bg-emerald-200',
  'bg-emerald-400',
  'bg-emerald-600',
  'bg-emerald-800',
];

const HEAT_TEXT = ['text-neutral-500', 'text-emerald-900', 'text-emerald-50', 'text-white', 'text-white'];

export function HEAT_CELL_BG(intensity: number): string {
  return HEAT_BG[Math.min(intensity, 4)];
}
export function HEAT_CELL_TEXT(intensity: number): string {
  return HEAT_TEXT[Math.min(intensity, 4)];
}

export interface HeatmapData {
  cells: HeatmapCell[];
  weekLabels: string[]; // one per column, format MM-dd
  maxCount: number;
  totalCount: number;
  startDate: Date;
  endDate: Date;
}

export function buildHeatmap(
  roundsByOpp: Map<number, InterviewRound[]>,
  weeks = 12,
  today: Date = new Date()
): HeatmapData {
  // Use actual_at when available, fall back to scheduled_at.
  const counts = new Map<string, number>();
  for (const rounds of roundsByOpp.values()) {
    for (const r of rounds) {
      const iso = r.actual_at ?? r.scheduled_at;
      const d = parseISO(iso);
      if (!isValid(d)) continue;
      const key = format(d, 'yyyy-MM-dd');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  // Build the 12-week grid. Each column is a week (Mon-Sun), oldest at left.
  // End column is the week containing `today`.
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const firstWeekStart = subWeeks(currentWeekStart, weeks - 1);
  const cells: HeatmapCell[] = [];
  const weekLabels: string[] = [];
  let maxCount = 0;
  let totalCount = 0;

  for (let c = 0; c < weeks; c++) {
    const weekStart = addDays(firstWeekStart, c * 7);
    weekLabels.push(format(weekStart, 'MM-dd'));
    for (let r = 0; r < 7; r++) {
      const date = addDays(weekStart, r);
      const key = format(date, 'yyyy-MM-dd');
      const count = counts.get(key) ?? 0;
      if (count > maxCount) maxCount = count;
      if (count > 0) totalCount += count;
      // Skip future cells (after today)
      if (differenceInCalendarDays(date, today) > 0) {
        cells.push({ date, count, col: c, row: r, intensity: 0, bgClass: 'bg-neutral-50' });
        continue;
      }
      const intensity =
        count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;
      cells.push({
        date,
        count,
        col: c,
        row: r,
        intensity,
        bgClass: HEAT_CELL_BG(intensity),
      });
    }
  }

  return {
    cells,
    weekLabels,
    maxCount,
    totalCount,
    startDate: firstWeekStart,
    endDate: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  };
}

/** Format a date as "今天 14:00" / "昨天 09:30" / "08-30 11:00" for activity items. */
export function formatActivityTime(d: Date, today: Date = new Date()): string {
  const days = differenceInCalendarDays(today, d);
  const time = format(d, 'HH:mm');
  if (days === 0) return `今天 ${time}`;
  if (days === 1) return `昨天 ${time}`;
  if (days >= 2 && days < 7) return `${days} 天前 ${time}`;
  return format(d, 'MM-dd HH:mm');
}

/** Map a heatmap date to a short Chinese weekday label (e.g. "一", "二", "日"). */
export const WEEKDAY_LABELS: readonly string[] = ['一', '二', '三', '四', '五', '六', '日'];
