import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, InterviewRound } from '../types';
import StatCard from '../components/StatCard';
import { ROUND_TYPE_META, FORMAT_META } from '../lib/status';
import { formatDateTime } from '../lib/format';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface DashboardData {
  opportunity: Opportunity;
  rounds: InterviewRound[];
}

const OUTCOME_DOT: Record<string, string> = {
  pending: 'bg-blue-800',
  passed: 'bg-green-700',
  failed: 'bg-red-700',
  cancelled: 'bg-neutral-500',
};

export default function Dashboard() {
  useDocumentTitle('概览');
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const opps = await api.opportunities.list();
        const all = await Promise.all(
          opps.map(async (opp) => ({
            opportunity: opp,
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

  if (loading) return <div className="text-neutral-500 text-sm">加载中…</div>;
  if (error) return <div className="text-red-700 text-sm">{error}</div>;

  const inProgress = data.filter((d) => d.opportunity.status === 'in_progress').length;
  const offered = data.filter(
    (d) => d.opportunity.status === 'offered' || d.opportunity.status === 'accepted'
  ).length;
  const notPassed = data.filter((d) => d.opportunity.status === 'rejected').length;

  const now = Date.now();
  const sevenDays = now + 7 * 24 * 60 * 60 * 1000;
  const upcoming = data
    .flatMap((d) =>
      d.rounds
        .filter((r) => r.outcome === 'pending')
        .map((r) => ({ round: r, opportunity: d.opportunity }))
    )
    .filter((x) => {
      const t = new Date(x.round.scheduled_at).getTime();
      return t >= now && t <= sevenDays;
    })
    .sort((a, b) => a.round.scheduled_at.localeCompare(b.round.scheduled_at));

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">仪表盘</h1>
        <Link
          to="/opportunities/new"
          className="inline-flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-800 active:bg-indigo-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>新建面试</span>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <StatCard label="进行中" value={inProgress} color="text-blue-800" accent />
        <StatCard label="已 Offer" value={offered} color="text-green-700" />
        <StatCard label="未通过" value={notPassed} color="text-red-700" />
        <StatCard label="总计" value={data.length} />
      </div>

      <h2 className="text-sm font-medium text-neutral-900 mb-3">即将到来 · 7 天内</h2>
      {upcoming.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs text-sm text-neutral-500">
          暂无即将到来的面试
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map(({ round, opportunity }) => (
            <Link
              key={round.id}
              to={`/opportunities/${opportunity.id}`}
              className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-neutral-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900 truncate">
                    {opportunity.company_name} · {opportunity.position_name}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1.5 tabular-nums">
                    {ROUND_TYPE_META[round.round_type]} · {formatDateTime(round.scheduled_at)} · {FORMAT_META[round.format]}
                    {round.location ? ` · ${round.location}` : ''}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm text-blue-800 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${OUTCOME_DOT[round.outcome]}`} aria-hidden />
                  待面试
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
