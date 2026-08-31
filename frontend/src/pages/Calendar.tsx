import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { api } from '../api/client';
import type { InterviewRound, Opportunity } from '../types';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  buildCalendarGrid,
  collectEntries,
  colorForCompany,
  formatRoundLabel,
  shiftMonth,
  WEEKDAY_HEADERS,
} from '../lib/calendarUtils';

export default function Calendar() {
  useDocumentTitle('面试日历');
  const [data, setData] = useState<{ opp: Opportunity; rounds: InterviewRound[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    (async () => {
      try {
        const opps = await api.opportunities.list();
        const all = await Promise.all(
          opps.map(async (opp) => ({
            opp,
            rounds: await api.rounds.list(opp.id),
          }))
        );
        setData(all);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const entries = useMemo(() => {
    const roundsByOpp = new Map<number, InterviewRound[]>(
      data.map((d) => [d.opp.id, d.rounds])
    );
    return collectEntries(data.map((d) => d.opp), roundsByOpp);
  }, [data]);

  const grid = useMemo(
    () => buildCalendarGrid(year, month, entries, today),
    [year, month, entries, today]
  );

  const monthTotal = grid
    .filter((c) => c.isCurrentMonth)
    .reduce((sum, c) => sum + c.rounds.length, 0);

  function go(delta: number) {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  if (loading) {
    return (
      <div className="text-neutral-500 text-sm py-12 text-center">加载中…</div>
    );
  }
  if (error) {
    return (
      <div className="text-rose-700 text-sm py-12 text-center">{error}</div>
    );
  }

  const monthLabel = format(new Date(year, month, 1), 'yyyy 年 MM 月', { locale: zhCN });

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">面试日历</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {monthLabel} · 共 {monthTotal} 场面试
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors"
            aria-label="上一月"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-3 h-9 text-sm font-medium rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            今天
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors"
            aria-label="下一月"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border border-neutral-200 rounded-t-xl bg-neutral-50 text-xs font-medium text-neutral-500">
        {WEEKDAY_HEADERS.map((w) => (
          <div key={w} className="text-center py-2">
            周{w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 border-l border-r border-b border-neutral-200 rounded-b-xl bg-white">
        {grid.map((cell) => (
          <div
            key={cell.date.toISOString()}
            className={`min-h-[110px] border-t border-r border-neutral-100 p-1.5 ${
              cell.isCurrentMonth ? '' : 'bg-neutral-50/40 text-neutral-400'
            } ${cell.isToday ? 'bg-indigo-50/30' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-xs tabular-nums ${
                  cell.isToday
                    ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-semibold'
                    : cell.isCurrentMonth
                    ? 'text-neutral-700 font-medium'
                    : 'text-neutral-400'
                }`}
              >
                {cell.date.getDate()}
              </span>
              {cell.rounds.length > 0 && cell.isCurrentMonth && (
                <span className="text-[10px] text-neutral-500 tabular-nums">
                  {cell.rounds.length} 场
                </span>
              )}
            </div>
            <div className="space-y-1">
              {cell.rounds.slice(0, 3).map((r) => {
                const c = colorForCompany(r.company);
                const time = format(
                  parseISO(r.actual_at || r.scheduled_at),
                  'HH:mm',
                  { locale: zhCN }
                );
                return (
                  <Link
                    key={r.id}
                    to={`/opportunities/${r.opportunityId}`}
                    className={`block px-1.5 py-1 rounded text-[10px] leading-tight ${c.bg} ${c.text} hover:brightness-95 transition`}
                    title={`${r.company} · ${r.position} · ${formatRoundLabel(r)}`}
                  >
                    <div className="flex items-center gap-1 font-medium truncate">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`}
                        aria-hidden
                      />
                      <span className="truncate">{time}</span>
                      <span className="truncate">{r.company}</span>
                    </div>
                  </Link>
                );
              })}
              {cell.rounds.length > 3 && (
                <div className="text-[10px] text-neutral-500 px-1.5">
                  +{cell.rounds.length - 3} 更多
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend / tip */}
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            同色 = 同一公司
          </span>
          <span>点击 chip 跳详情</span>
        </div>
        <span>
          共 <span className="text-neutral-700 font-medium tabular-nums">{entries.length}</span> 条面试记录
        </span>
      </div>
    </div>
  );
}
