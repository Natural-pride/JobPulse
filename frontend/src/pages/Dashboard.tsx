import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ActionItem as ApiActionItem } from '../api/client';
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
import ActionItems from '../components/dashboard/ActionItems';

interface DashboardData {
  opportunity: Opportunity;
  rounds: InterviewRound[];
}

export default function Dashboard() {
  useDocumentTitle('概览');
  const [data, setData] = useState<DashboardData[]>([]);
  const [actionItems, setActionItems] = useState<ApiActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [opps, actionRes] = await Promise.all([
          api.opportunities.list(),
          api.actionItems.list().catch(() => ({ items: [] as ApiActionItem[] })),
        ]);
        const all = await Promise.all(
          opps.map(async (opp) => ({
            opportunity: opp,
            rounds: await api.rounds.list(opp.id),
          }))
        );
        setData(all);
        setActionItems(actionRes.items);
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
  // All "终态" that mean "did not result in a job": rejected / declined / withdrawn
  // / accepted_then_left. Keep them as a single bucket on the 4-card stats; the
  // filter chips on the list page break them out individually.
  const notPassed = data.filter(
    (d) =>
      d.opportunity.status === 'rejected' ||
      d.opportunity.status === 'declined' ||
      d.opportunity.status === 'withdrawn' ||
      d.opportunity.status === 'accepted_then_left'
  ).length;

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
    4
  );
  const heatmap = buildHeatmap(roundsByOpp, 12);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">仪表盘</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/opportunities/import"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>截图导入</span>
          </Link>
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
      </div>

      {/* Row 0: Action items (needs attention) */}
      <div className="mb-4">
        <ActionItems items={actionItems} />
      </div>

      {/* Row 1: 4 stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard label="进行中" value={inProgress} color="text-blue-700" accent />
        <StatCard label="已 Offer" value={offered} color="text-emerald-700" />
        <StatCard label="未通过" value={notPassed} color="text-rose-700" />
        <StatCard label="总计" value={data.length} color="text-indigo-700" />
      </div>

      {/* Row 2: Funnel + Source distribution */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <ConversionFunnel stages={funnel} />
        <SourceDistribution buckets={sourceDistribution} />
      </div>

      {/* Row 3: Upcoming + Recent activity */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-900">即将到来 · 7 天内</h2>
            <span className="text-xs text-neutral-500">{upcoming.length} 场</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-xs text-neutral-500 py-6 text-center">
              暂无即将到来的面试
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {upcoming.map(({ round, opportunity }) => (
                <Link
                  key={round.id}
                  to={`/opportunities/${opportunity.id}`}
                  className="block bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-900 truncate">
                        {opportunity.company_name} · {opportunity.position_name}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                        {ROUND_TYPE_META[round.round_type]} · {formatDateTime(round.scheduled_at)} · {FORMAT_META[round.format]}
                        {round.location ? ` · ${round.location}` : ''}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-700" aria-hidden />
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
  );
}
