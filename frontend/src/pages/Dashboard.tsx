import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, InterviewRound } from '../types';
import StatCard from '../components/StatCard';
import { ROUND_TYPE_META, FORMAT_META } from '../lib/status';
import { formatDateTime } from '../lib/format';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  buildFunnel,
  buildHeatmap,
  buildRecentActivity,
  buildSourceDistribution,
} from '../lib/dashboardUtils';
import ConversionFunnel from '../components/dashboard/ConversionFunnel';
import SourceDistribution from '../components/dashboard/SourceDistribution';
import RecentActivity from '../components/dashboard/RecentActivity';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';

interface DashboardData {
  opportunity: Opportunity;
  rounds: InterviewRound[];
}

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">
        加载中…
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-rose-400 text-sm">
        {error}
      </div>
    );
  }

  const inProgress = data.filter((d) => d.opportunity.status === 'in_progress').length;
  const offered = data.filter(
    (d) =>
      d.opportunity.status === 'offered' || d.opportunity.status === 'accepted'
  ).length;
  const notPassed = data.filter((d) => d.opportunity.status === 'rejected').length;

  const opps = data.map((d) => d.opportunity);
  const roundsByOpp = new Map<number, InterviewRound[]>(
    data.map((d) => [d.opportunity.id, d.rounds])
  );

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

  const funnel = buildFunnel(opps, roundsByOpp);
  const sourceDistribution = buildSourceDistribution(opps);
  const recentActivity = buildRecentActivity(
    opps,
    roundsByOpp,
    (k) => ROUND_TYPE_META[k as keyof typeof ROUND_TYPE_META] ?? k,
    (k) => FORMAT_META[k as keyof typeof FORMAT_META] ?? k,
    10
  );
  const heatmap = buildHeatmap(roundsByOpp, 12);

  return (
    <div className="bg-slate-950 -mx-10 -my-8 px-10 py-8 text-slate-100 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">仪表盘</h1>
          <Link
            to="/opportunities/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 active:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>新建面试</span>
          </Link>
        </div>

        {/* Row 1: 4 stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="进行中" value={inProgress} color="text-blue-400" accent variant="dark" />
          <StatCard label="已 Offer" value={offered} color="text-emerald-400" variant="dark" />
          <StatCard label="未通过" value={notPassed} color="text-rose-400" variant="dark" />
          <StatCard label="总计" value={data.length} color="text-indigo-300" variant="dark" />
        </div>

        {/* Row 2: Funnel + Source distribution */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <ConversionFunnel stages={funnel} />
          <SourceDistribution buckets={sourceDistribution} />
        </div>

        {/* Row 3: Upcoming + Recent activity */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-200">即将到来 · 7 天内</h2>
              <span className="text-xs text-slate-500">{upcoming.length} 场</span>
            </div>
            {upcoming.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                暂无即将到来的面试
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map(({ round, opportunity }) => (
                  <Link
                    key={round.id}
                    to={`/opportunities/${opportunity.id}`}
                    className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-100 truncate">
                          {opportunity.company_name} · {opportunity.position_name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          {ROUND_TYPE_META[round.round_type]} · {formatDateTime(round.scheduled_at)} · {FORMAT_META[round.format]}
                          {round.location ? ` · ${round.location}` : ''}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden />
                        待面试
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <RecentActivity events={recentActivity} />
        </div>

        {/* Row 4: Heatmap (full width) */}
        <ActivityHeatmap data={heatmap} />
      </div>
    </div>
  );
}
