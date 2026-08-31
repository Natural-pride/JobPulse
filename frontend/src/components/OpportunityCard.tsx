import { Link } from 'react-router-dom';
import type { Opportunity, InterviewRound } from '../types';
import { ROUND_TYPE_META } from '../lib/status';
import { formatDateTime } from '../lib/format';
import StatusBadge from './StatusBadge';

const STATUS_DOT: Record<string, string> = {
  in_progress: 'bg-blue-800',
  offered: 'bg-green-700',
  accepted: 'bg-teal-700',
  rejected: 'bg-red-700',
  withdrawn: 'bg-neutral-600',
};

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
      className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-neutral-300 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold text-neutral-900 truncate">
            {opportunity.company_name} · {opportunity.position_name}
          </div>
          <div className="text-sm text-neutral-500 mt-1 truncate">
            {[opportunity.salary_range, opportunity.city, opportunity.work_hours]
              .filter(Boolean)
              .join(' · ')}
            {opportunity.has_weekends_off ? ' · 双休' : ''}
          </div>
        </div>
        <StatusBadge status={opportunity.status} />
      </div>
      {nextRound && (
        <div className="mt-3 pt-3 border-t border-neutral-100 text-sm text-neutral-600 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[nextRound.outcome] || 'bg-neutral-400'}`} />
          <span>下轮：{ROUND_TYPE_META[nextRound.round_type]}</span>
          <span className="text-neutral-300">·</span>
          <span className="tabular-nums">{formatDateTime(nextRound.scheduled_at)}</span>
        </div>
      )}
      {opportunity.status === 'offered' && opportunity.final_salary && (
        <div className="mt-3 pt-3 border-t border-neutral-100 text-sm text-green-700 font-medium">
          最终：{opportunity.final_salary}
        </div>
      )}
    </Link>
  );
}
