import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Opportunity, InterviewRound, OpportunityStatus } from '../types';
import { STATUS_META } from '../lib/status';
import RoundCard from '../components/RoundCard';
import RoundModal from '../components/RoundModal';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null);

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

  async function handleMarkOutcome(r: InterviewRound, outcome: 'passed' | 'failed') {
    await api.rounds.update(r.id, { outcome });
    if (outcome === 'failed') {
      const ok = window.confirm('是否同时把机会标记为"已拒绝"？');
      if (ok && opp) {
        await api.opportunities.update(opp.id, { status: 'rejected' });
      }
    } else {
      const ok = window.confirm(`是否添加第 ${nextRoundNumber} 轮（占位）？`);
      if (ok) {
        setEditingRound(null);
        setModalOpen(true);
      }
    }
    await load();
  }

  if (loading) return <div className="text-slate-500">加载中…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!opp) return null;

  const nextRoundNumber =
    rounds.length === 0 ? 1 : Math.max(...rounds.map((r) => r.round_number)) + 1;
  const showOfferBlock = opp.status === 'offered' || opp.status === 'accepted';
  const offerMissing = showOfferBlock && (!opp.final_salary || !opp.final_benefits);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link to="/opportunities" className="text-slate-500 hover:text-slate-700 text-sm">
          ← 返回列表
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/opportunities/${opp.id}/edit`}
            className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-sm"
          >
            编辑
          </Link>
          <button
            onClick={handleDeleteOpp}
            className="px-3 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm"
          >
            删除
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {opp.company_name} · {opp.position_name}
          </h1>
          <div className="text-sm text-slate-500 mt-1">{opp.city || '—'}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">状态：</span>
          <select
            value={opp.status}
            onChange={(e) => handleStatusChange(e.target.value as OpportunityStatus)}
            className="border border-slate-300 rounded px-2 py-1"
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
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="text-green-800">🎉 录入 offer 详情（最终薪资、最终福利）</div>
          <Link
            to={`/opportunities/${opp.id}/edit`}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            去填写
          </Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-6">
        <OverviewCard label="薪资" value={opp.salary_range || '—'} />
        <OverviewCard label="工时" value={opp.work_hours || '—'} />
        <OverviewCard label="福利" value={opp.benefits || '—'} />
        <OverviewCard label="双休" value={opp.has_weekends_off ? '✓ 双休' : '—'} />
      </div>

      {opp.jd_text && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">岗位 JD</h2>
          <pre className="bg-white border border-slate-200 rounded p-4 text-sm whitespace-pre-wrap font-mono text-slate-800">
            {opp.jd_text}
          </pre>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">面试轮次</h2>
        <button
          onClick={() => {
            setEditingRound(null);
            setModalOpen(true);
          }}
          className="px-3 py-1.5 bg-brand-500 text-white rounded text-sm hover:bg-brand-600"
        >
          + 添加轮次
        </button>
      </div>

      {rounds.length === 0 ? (
        <div className="text-slate-500 text-sm">还没有面试轮次</div>
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
                <div className="flex gap-2 text-sm pl-2">
                  <button
                    onClick={() => handleMarkOutcome(r, 'passed')}
                    className="text-green-600 hover:underline"
                  >
                    ✓ 标记为已通过
                  </button>
                  <button
                    onClick={() => handleMarkOutcome(r, 'failed')}
                    className="text-red-600 hover:underline"
                  >
                    ✗ 标记为未通过
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
        opportunityId={opp.id}
        initial={editingRound}
        defaultRoundNumber={nextRoundNumber}
      />
    </div>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-900 break-words">{value}</div>
    </div>
  );
}
