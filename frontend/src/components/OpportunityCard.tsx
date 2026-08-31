import { Link } from 'react-router-dom';
import type { Opportunity, InterviewRound } from '../types';
import { ROUND_TYPE_META } from '../lib/status';
import { formatDateTime } from '../lib/format';

export default function OpportunityCard({
  opportunity,
  rounds,
}: {
  opportunity: Opportunity;
  rounds: InterviewRound[];
}) {
  const nextRound = rounds
    .filter((r) => r.outcome === 'pending')
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];

  return (
    <Link
      to={`/opportunities/${opportunity.id}`}
      className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-brand-500 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-slate-900">
            {opportunity.company_name} · {opportunity.position_name}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {opportunity.salary_range || '—'} · {opportunity.city || '—'} · {opportunity.work_hours || '—'}
            {opportunity.has_weekends_off ? ' · 双休' : ''}
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-xs ${
            opportunity.status === 'offered' || opportunity.status === 'accepted'
              ? 'bg-green-100 text-green-700'
              : opportunity.status === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {{
            in_progress: '进行中',
            offered: '已 Offer',
            accepted: '已接受',
            rejected: '未通过',
            withdrawn: '已撤回',
          }[opportunity.status]}
        </span>
      </div>
      {nextRound && (
        <div className="mt-2 text-sm text-slate-600">
          下轮: {ROUND_TYPE_META[nextRound.round_type]} · {formatDateTime(nextRound.scheduled_at)}
        </div>
      )}
      {opportunity.status === 'offered' && opportunity.final_salary && (
        <div className="mt-2 text-sm text-green-700">最终: {opportunity.final_salary}</div>
      )}
    </Link>
  );
}
