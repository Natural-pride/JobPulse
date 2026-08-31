import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, OpportunityStatus, InterviewRound } from '../types';
import OpportunityCard from '../components/OpportunityCard';
import { STATUS_META } from '../lib/status';

type FilterValue = OpportunityStatus | 'all';

export default function OpportunityList() {
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

  if (loading) return <div className="text-slate-500">加载中…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">面试机会</h1>
        <Link
          to="/opportunities/new"
          className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
        >
          + 新建
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterValue)}
          className="border border-slate-300 rounded px-3 py-1.5"
        >
          <option value="all">全部</option>
          {(Object.keys(STATUS_META) as OpportunityStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="搜索公司或岗位"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-slate-300 rounded px-3 py-1.5"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-slate-500 text-sm">
          {data.length === 0 ? '还没有面试机会，点右上角"新建"开始。' : '没有匹配的结果。'}
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
