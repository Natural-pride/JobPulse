import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, InterviewRound, OpportunityStatus } from '../types';
import { STATUS_META, WEEKEND_POLICY_META } from '../lib/status';
import RoundCard from '../components/RoundCard';
import RoundModal from '../components/RoundModal';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null);
  useDocumentTitle(opp ? `${opp.company_name} · ${opp.position_name}` : '面试详情');

  async function load() {
    if (!id) return;
    const oppId = Number(id);
    const o = await api.opportunities.get(oppId);
    const r = await api.rounds.list(oppId);
    setOpp(o);
    setRounds(r);
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleStatusChange(s: OpportunityStatus) {
    if (!opp) return;
    const updated = await api.opportunities.update(opp.id, { status: s });
    setOpp(updated);
  }

  async function handleDeleteOpp() {
    if (!opp) return;
    const ok = window.confirm(
      `将删除「${opp.company_name} · ${opp.position_name}」及 ${rounds.length} 轮面试记录，确定？`
    );
    if (!ok) return;
    await api.opportunities.remove(opp.id);
    navigate('/opportunities');
  }

  async function handleDeleteRound(r: InterviewRound) {
    const ok = window.confirm('确定删除这一轮面试？');
    if (!ok) return;
    await api.rounds.remove(r.id);
    await load();
  }

  async function handleMarkOutcome(
    r: InterviewRound,
    outcome: 'passed' | 'failed' | 'cancelled'
  ) {
    await api.rounds.update(r.id, { outcome });
    if (outcome === 'failed' && opp?.status === 'in_progress') {
      const ok = window.confirm('是否同时把机会标记为"未通过"？');
      if (ok && opp) {
        await api.opportunities.update(opp.id, { status: 'rejected' });
      }
    } else if (outcome === 'cancelled' && opp?.status === 'in_progress') {
      const remainingPending = rounds.filter(
        (x) => x.id !== r.id && x.outcome === 'pending'
      );
      if (remainingPending.length === 0) {
        const ok = window.confirm(
          '本轮是最后一轮还未决定的面试，是否同时把机会标记为"我已撤回"？'
        );
        if (ok && opp) {
          await api.opportunities.update(opp.id, { status: 'withdrawn' });
        }
      }
    } else if (outcome === 'passed') {
      const ok = window.confirm(`是否添加第 ${nextRoundNumber} 轮（占位）？`);
      if (ok) {
        setEditingRound(null);
        setModalOpen(true);
      }
    }
    await load();
  }

  if (loading) return <div className="text-neutral-500 text-sm">加载中…</div>;
  if (error) return <div className="text-red-700 text-sm">{error}</div>;
  if (!opp) return null;

  const nextRoundNumber =
    rounds.length === 0 ? 1 : Math.max(...rounds.map((r) => r.round_number)) + 1;
  const showOfferBlock = opp.status === 'offered' || opp.status === 'accepted';
  const offerMissing = showOfferBlock && (!opp.final_salary || !opp.final_benefits);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <Link to="/opportunities" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>返回列表</span>
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/opportunities/${opp.id}/edit`}
            className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            编辑
          </Link>
          <button
            onClick={handleDeleteOpp}
            className="text-red-700 hover:text-red-900 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            删除
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between mb-8 gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 truncate">
            {opp.company_name} · {opp.position_name}
          </h1>
          {(opp.city || opp.address) && (
            <div className="text-sm text-neutral-500 mt-1.5">
              {opp.city}
              {opp.city && opp.address ? ' · ' : ''}
              {opp.address}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-neutral-500 tracking-wide uppercase">状态</span>
          <select
            value={opp.status}
            onChange={(e) => handleStatusChange(e.target.value as OpportunityStatus)}
            className="bg-white border border-neutral-300 rounded-lg pl-3 pr-8 py-1.5 text-sm hover:border-neutral-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 transition appearance-none bg-no-repeat bg-right"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundPosition: "right 8px center",
              paddingRight: "28px",
            }}
          >
            {(Object.keys(STATUS_META) as OpportunityStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {offerMissing && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
          <div className="text-sm text-indigo-900">录入 offer 详情（最终薪资、最终福利）</div>
          <Link
            to={`/opportunities/${opp.id}/edit`}
            className="inline-flex items-center px-3 py-1.5 bg-indigo-700 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 transition-colors"
          >
            去填写
          </Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-8">
        <OverviewCard label="薪资" value={opp.salary_range || '—'} />
        <OverviewCard label="工时" value={opp.work_hours || '—'} />
        <OverviewCard label="福利" value={opp.benefits || '—'} />
        <OverviewCard
          label="双休"
          value={opp.weekend_policy ? WEEKEND_POLICY_META[opp.weekend_policy] : '—'}
        />
      </div>

      {opp.jd_text && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">岗位 JD</h2>
          <pre className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs text-sm whitespace-pre-wrap font-mono text-neutral-800">
            {opp.jd_text}
          </pre>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-neutral-900">面试轮次</h2>
        <button
          onClick={() => {
            setEditingRound(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-800 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>添加轮次</span>
        </button>
      </div>

      {rounds.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 shadow-xs text-center text-sm text-neutral-500">
          还没有面试轮次
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((r) => (
            <div key={r.id} className="space-y-2">
              <RoundCard
                round={r}
                onEdit={() => {
                  setEditingRound(r);
                  setModalOpen(true);
                }}
                onDelete={() => handleDeleteRound(r)}
              />
              {r.outcome === 'pending' && (
                <div className="flex flex-wrap items-center gap-2 pl-1">
                  <span className="text-xs text-neutral-500 mr-1">标记结果：</span>
                  <button
                    onClick={() => handleMarkOutcome(r, 'passed')}
                    className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    通过
                  </button>
                  <button
                    onClick={() => handleMarkOutcome(r, 'failed')}
                    className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    未通过
                  </button>
                  <button
                    onClick={() => handleMarkOutcome(r, 'cancelled')}
                    className="inline-flex items-center gap-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    取消本轮
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RoundModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => load()}
        onOutcomeChange={(_oldOutcome, newOutcome) => {
          // Reuse the same prompt logic as the inline quick-action buttons.
          if (newOutcome === 'cancelled' && opp?.status === 'in_progress') {
            const remainingPending = rounds.filter((x) => x.outcome === 'pending');
            if (remainingPending.length === 0) {
              const ok = window.confirm(
                '本轮是最后一轮还未决定的面试，是否同时把机会标记为"我已撤回"？'
              );
              if (ok && opp) {
                void api.opportunities.update(opp.id, { status: 'withdrawn' });
              }
            }
          }
        }}
        opportunityId={opp.id}
        initial={editingRound}
        defaultRoundNumber={nextRoundNumber}
      />
    </div>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
      <div className="text-xs font-medium text-neutral-500 tracking-wide uppercase mb-1.5">{label}</div>
      <div className="text-sm font-medium text-neutral-900 break-words">{value}</div>
    </div>
  );
}
