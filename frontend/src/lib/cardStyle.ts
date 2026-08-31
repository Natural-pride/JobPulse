/**
 * Color helpers for OpportunityCard. Designed to be scannable at a glance
 * without being garish — every color carries a piece of meaning.
 */
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';

/** Salary tier: parses a string like "10-15K", "10K-12K*13", "1万-2万" and
 *  picks a tier based on the lower bound. Returns null for free-text / face-to-face. */
export function salaryTier(
  raw: string | null | undefined
): { tier: 'low' | 'mid' | 'high' | 'premium' | 'unknown'; numeric: number | null } {
  if (!raw) return { tier: 'unknown', numeric: null };
  const s = raw.trim();
  if (!s || s === '面议') return { tier: 'unknown', numeric: null };
  // Match the first number (with optional decimal + unit K/万)
  const m = s.match(/(\d+(?:\.\d+)?)\s*(K|万)?/i);
  if (!m) return { tier: 'unknown', numeric: null };
  let n = parseFloat(m[1]);
  const unit = (m[2] || 'K').toLowerCase();
  if (unit === '万') n *= 10; // 1万 ≈ 10K for comparison
  if (n < 8) return { tier: 'low', numeric: n };
  if (n < 15) return { tier: 'low', numeric: n };
  if (n < 25) return { tier: 'mid', numeric: n };
  if (n < 40) return { tier: 'high', numeric: n };
  return { tier: 'premium', numeric: n };
}

/** Tailwind classes for each salary tier. Background is light, text is bold-ish. */
export const SALARY_TIER_CLASSES: Record<
  ReturnType<typeof salaryTier>['tier'],
  { bg: string; text: string; dot: string }
> = {
  low: { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' },
  mid: { bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-500' },
  high: { bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  premium: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  unknown: { bg: 'bg-neutral-50', text: 'text-neutral-500', dot: 'bg-neutral-300' },
};

/** Weekend policy chip colors. Double-off is the "good" baseline (emerald),
 *  other policies are amber warnings so they stand out. */
export const WEEKEND_CHIP: Record<
  string,
  { label: string; cls: string } | null
> = {
  double_off: { label: '双休', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  single_off: { label: '单休', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  alternating: { label: '大小周', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  compensatory: { label: '调休', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  unknown: { label: '?', cls: 'bg-neutral-50 text-neutral-500 border-neutral-200' },
};

/** Source color hint. "内推" is the only one we treat as a positive signal
 *  (worth tracking more carefully). Everything else gets a neutral soft color. */
export const SOURCE_CHIP: Record<string, { label: string; cls: string } | null> = {
  内推: { label: '内推', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  猎聘: { label: '猎聘', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  拉勾: { label: '拉勾', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  脉脉: { label: '脉脉', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  BOSS: null, // default, no chip
  '': null,
};

/** Company-name → color. Hashes the first non-space character into one of 8
 *  light backgrounds. Stable per company, so re-renders don't flicker. */
const COMPANY_PALETTE = [
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-sky-100', text: 'text-sky-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
];

export function companyAvatar(name: string): { char: string; cls: { bg: string; text: string } } {
  const trimmed = (name || '?').trim();
  const char = trimmed.charAt(0).toUpperCase() || '?';
  // Simple string hash → palette index
  let h = 0;
  for (let i = 0; i < trimmed.length; i++) {
    h = (h * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  const cls = COMPANY_PALETTE[h % COMPANY_PALETTE.length];
  return { char, cls };
}

/** Next-round date coloring. Today → amber (urgent), tomorrow → blue (soon),
 *  within a week → indigo, else neutral slate. */
export function upcomingDateColor(iso: string): { text: string; prefix: string } {
  const d = parseISO(iso);
  if (!isValid(d)) return { text: 'text-slate-500', prefix: '' };
  const days = differenceInCalendarDays(d, new Date());
  if (days <= 0) return { text: 'text-amber-700 font-semibold', prefix: '今天' };
  if (days === 1) return { text: 'text-blue-700 font-medium', prefix: '明天' };
  if (days <= 7) return { text: 'text-indigo-700', prefix: `${days} 天后` };
  return { text: 'text-slate-500', prefix: '' };
}
