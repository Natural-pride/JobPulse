import { format, parseISO, formatDistanceToNow, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return format(d, 'yyyy-MM-dd');
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return format(d, 'yyyy-MM-dd HH:mm');
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function formatSalary(s: string | null | undefined): string {
  return s || '—';
}
