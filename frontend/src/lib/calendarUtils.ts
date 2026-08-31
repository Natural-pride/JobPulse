import {
  addDays,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  isValid,
  isSameDay,
} from 'date-fns';
import type { InterviewRound, Opportunity } from '../types';
import { ROUND_TYPE_META, FORMAT_META } from './status';

export interface CalendarEntry {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  rounds: CalendarRoundWithOpp[];
}

export interface CalendarRoundWithOpp extends InterviewRound {
  opportunityId: number;
  company: string;
  position: string;
}

const CALENDAR_PALETTE = [
  { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
  { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
];

/** Stable hash → palette index. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface CompanyColor {
  bg: string;
  text: string;
  dot: string;
}

const colorCache = new Map<string, CompanyColor>();

export function colorForCompany(company: string): CompanyColor {
  const cached = colorCache.get(company);
  if (cached) return cached;
  const c = CALENDAR_PALETTE[hashString(company) % CALENDAR_PALETTE.length];
  colorCache.set(company, c);
  return c;
}

/**
 * Build a 6-week (42-day) calendar grid starting from the Monday of the week
 * containing the 1st of the given month, so the layout is stable.
 */
export function buildCalendarGrid(
  year: number,
  month: number, // 0-indexed
  entries: CalendarRoundWithOpp[],
  today: Date = new Date()
): CalendarEntry[] {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Mon
  const cells: CalendarEntry[] = [];
  const roundsByDate = groupRoundsByDate(entries);
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    const key = format(date, 'yyyy-MM-dd');
    cells.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
      rounds: roundsByDate.get(key) ?? [],
    });
  }
  return cells;
}

function groupRoundsByDate(
  entries: CalendarRoundWithOpp[]
): Map<string, CalendarRoundWithOpp[]> {
  const map = new Map<string, CalendarRoundWithOpp[]>();
  for (const e of entries) {
    const iso = e.actual_at || e.scheduled_at;
    const d = parseISO(iso);
    if (!isValid(d)) continue;
    const key = format(d, 'yyyy-MM-dd');
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }
  // Sort by time within each day
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      const ak = a.actual_at || a.scheduled_at;
      const bk = b.actual_at || b.scheduled_at;
      return ak.localeCompare(bk);
    });
  }
  return map;
}

export function collectEntries(
  opportunities: Opportunity[],
  roundsByOpp: Map<number, InterviewRound[]>
): CalendarRoundWithOpp[] {
  const out: CalendarRoundWithOpp[] = [];
  const oppMap = new Map(opportunities.map((o) => [o.id, o]));
  for (const [oppId, rounds] of roundsByOpp) {
    const opp = oppMap.get(oppId);
    if (!opp) continue;
    for (const r of rounds) {
      out.push({
        ...r,
        opportunityId: oppId,
        company: opp.company_name,
        position: opp.position_name,
      });
    }
  }
  return out;
}

export function formatRoundLabel(r: CalendarRoundWithOpp): string {
  const t = ROUND_TYPE_META[r.round_type] ?? r.round_type;
  const f = FORMAT_META[r.format] ?? r.format;
  return `${t} · ${f}`;
}

export const WEEKDAY_HEADERS = ['一', '二', '三', '四', '五', '六', '日'];

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}
