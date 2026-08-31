import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, OpportunityStatus, InterviewRound } from '../types';
import OpportunityCard from '../components/OpportunityCard';
import { STATUS_META } from '../lib/status';
import useDocumentTitle from '../hooks/useDocumentTitle';

type FilterValue = OpportunityStatus | 'all';

const STATUS_DOT: Record<OpportunityStatus, string> = {
  in_progress: 'bg-blue-800',
  offered: 'bg-green-700',
  accepted: 'bg-teal-700',
  rejected: 'bg-red-700',
  withdrawn: 'bg-neutral-600',
};

export default function OpportunityList() {
  useDocumentTitle('面试机会');
  const [data, setData] = useState<{ opp: Opportunity; rounds: InterviewRound[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const opps = await api.opportunities.list();
      const withRounds = await Promise.all(
        opps.map(async (opp) => ({ opp, rounds: await api.rounds.list(opp.id) }))
      );
      setData(withRounds);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return data.filter(({ opp }) => {
      if (filter !== 'all' && opp.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!opp.company_name.toLowerCase().includes(q) && !opp.position_name.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [data, filter, search]);

  if (loading) return <div className="text-neutral-500 text-sm">加载中…</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">面试机会</h1>
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
            className="inline-flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-800 active:bg-indigo-900 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>新建</span>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索公司或岗位"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-sm placeholder-neutral-400 hover:border-neutral-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 transition"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-700 text-white'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300'
          }`}
        >
          全部
        </button>
        {(Object.keys(STATUS_META) as OpportunityStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-indigo-700 text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filter === s ? 'bg-white/80' : STATUS_DOT[s]}`} aria-hidden />
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 shadow-xs text-center">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-200" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
            </svg>
          </div>
          <div className="text-sm text-neutral-500">
            {data.length === 0 ? '还没有面试机会，点右上角"新建"开始。' : '没有匹配的结果。'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ opp, rounds }) => (
            <OpportunityCard key={opp.id} opportunity={opp} rounds={rounds} />
          ))}
        </div>
      )}
    </div>
  );
}
