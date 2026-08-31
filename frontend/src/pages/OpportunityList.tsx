import { useCallback, useEffect, useRef, useState } from 'react';
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
  declined: 'bg-slate-500',
  accepted_then_left: 'bg-amber-500',
};

const PAGE_SIZE = 20;

export default function OpportunityList() {
  useDocumentTitle('面试机会');
  const [items, setItems] = useState<{ opp: Opportunity; rounds: InterviewRound[] }[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loadingPage, setLoadingPage] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  // Refs to keep the latest filter/search in the loader without re-creating it.
  const filterRef = useRef(filter);
  const searchRef = useRef(search);
  filterRef.current = filter;
  searchRef.current = search;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /**
   * Build the visible page-number list with ellipsis for many pages.
   * Always shows first, last, current ±1, and uses '…' for skipped ranges.
   */
  const pageNumbers: (number | '…')[] = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set<number>([1, totalPages, page, page - 1, page + 1]);
    const sorted = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const out: (number | '…')[] = [];
    let prev = 0;
    for (const p of sorted) {
      if (p - prev > 1) out.push('…');
      out.push(p);
      prev = p;
    }
    return out;
  })();

  const loadPage = useCallback(
    async (pageToLoad: number) => {
      setLoadingPage(true);
      setError(null);
      try {
        const result = await api.opportunities.listPaged({
          page: pageToLoad,
          pageSize: PAGE_SIZE,
          status: filterRef.current === 'all' ? undefined : filterRef.current,
          search: searchRef.current.trim() || undefined,
        });
        const withRounds = await Promise.all(
          result.items.map(async (opp) => ({
            opp,
            rounds: await api.rounds.list(opp.id),
          }))
        );
        setItems(withRounds);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoadingPage(false);
        setInitialLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // Reset on filter/search change
  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  if (initialLoading) {
    return <div className="text-neutral-500 text-sm py-12 text-center">加载中…</div>;
  }
  if (error) {
    return <div className="text-red-700 text-sm py-12 text-center">{error}</div>;
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">面试机会</h1>
          <p className="text-xs text-neutral-500 mt-1 tabular-nums">
            共 {total} 条 · 按最近一次面试时间排序
          </p>
        </div>
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

      {items.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 shadow-xs text-center">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-200" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
            </svg>
          </div>
          <div className="text-sm text-neutral-500">
            {total === 0 ? '还没有面试机会，点右上角"新建"开始。' : '没有匹配的结果。'}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map(({ opp, rounds }) => (
              <OpportunityCard key={opp.id} opportunity={opp} rounds={rounds} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav
              aria-label="分页"
              className="mt-6 flex items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={() => loadPage(page - 1)}
                disabled={page <= 1 || loadingPage}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                上一页
              </button>
              {pageNumbers.map((p, idx) =>
                p === '…' ? (
                  <span
                    key={`gap-${idx}`}
                    className="px-1 text-neutral-400 text-sm select-none"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => loadPage(p)}
                    disabled={loadingPage}
                    aria-current={p === page ? 'page' : undefined}
                    className={`min-w-[2.25rem] px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      p === page
                        ? 'bg-indigo-700 text-white'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                    } disabled:cursor-not-allowed`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => loadPage(page + 1)}
                disabled={page >= totalPages || loadingPage}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <span className="ml-3 text-xs text-neutral-500 tabular-nums">
                第 {page} / {totalPages} 页
              </span>
            </nav>
          )}
          {totalPages <= 1 && items.length > 0 && (
            <div className="mt-6 text-center text-xs text-neutral-400">
              — 已显示全部 {total} 条 —
            </div>
          )}
        </>
      )}
    </div>
  );
}
