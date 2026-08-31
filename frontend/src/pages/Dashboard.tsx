import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, InterviewRound } from '../types';
import StatCard from '../components/StatCard';
import { ROUND_TYPE_META, FORMAT_META } from '../lib/status';
import { formatDateTime } from '../lib/format';

interface DashboardData {
  opportunity: Opportunity;
  rounds: InterviewRound[];
}

export default function Dashboard() {
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

  if (loading) return <div className="text-slate-500">加载中…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const inProgress = data.filter((d) => d.opportunity.status === 'in_progress').length;
  const offered = data.filter(
    (d) => d.opportunity.status === 'offered' || d.opportunity.status === 'accepted'
  ).length;
  const rejected = data.filter((d) => d.opportunity.status === 'rejected').length;

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <Link
          to="/opportunities/new"
          className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
        >
          + 新建面试机会
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="进行中" value={inProgress} color="text-blue-600" />
        <StatCard label="已 Offer" value={offered} color="text-green-600" />
        <StatCard label="已拒绝" value={rejected} color="text-red-600" />
        <StatCard label="总计" value={data.length} />
      </div>

      <h2 className="text-lg font-semibold mb-3">即将到来（7 天内）</h2>
      {upcoming.length === 0 ? (
        <div className="text-slate-500 text-sm">暂无即将到来的面试</div>
      ) : (
        <div className="flex flex-col gap-2">
          {upcoming.map(({ round, opportunity }) => (
            <Link
              key={round.id}
              to={`/opportunities/${opportunity.id}`}
              className="block bg-white rounded-lg border border-slate-200 p-3 hover:border-brand-500 transition"
            >
              <div className="font-medium text-slate-900">
                {opportunity.company_name} · {opportunity.position_name}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {ROUND_TYPE_META[round.round_type]} · {formatDateTime(round.scheduled_at)} · {FORMAT_META[round.format]}
                {round.location ? ` (${round.location})` : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
