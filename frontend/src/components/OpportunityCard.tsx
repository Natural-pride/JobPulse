import { Link } from 'react-router-dom';
import type { Opportunity, InterviewRound } from '../types';
import { ROUND_TYPE_META } from '../lib/status';
import { formatDateTime } from '../lib/format';
import {
  SALARY_TIER_CLASSES,
  WEEKEND_CHIP,
  SOURCE_CHIP,
  companyAvatar,
  upcomingDateColor,
  salaryTier,
} from '../lib/cardStyle';
import StatusBadge from './StatusBadge';

const STATUS_DOT: Record<string, string> = {
  in_progress: 'bg-blue-800',
  awaiting_response: 'bg-amber-500',
  offered: 'bg-green-700',
  accepted: 'bg-teal-700',
  rejected: 'bg-red-700',
  withdrawn: 'bg-neutral-600',
  declined: 'bg-slate-500',
  accepted_then_left: 'bg-amber-600',
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

  // Salary chip
  const salary = opportunity.salary_range?.trim();
  const tier = salaryTier(salary);
  const salaryCls = SALARY_TIER_CLASSES[tier.tier];

  // Weekend policy chip (only show if non-default)
  const weekendChip = opportunity.weekend_policy
    ? WEEKEND_CHIP[opportunity.weekend_policy] ?? null
    : null;

  // Source tag
  const sourceTag = SOURCE_CHIP[(opportunity.source ?? '').trim()] ?? null;

  // Company initial avatar
  const avatar = companyAvatar(opportunity.company_name);

  // Next round date coloring
  const nextRoundDate = nextRound ? upcomingDateColor(nextRound.scheduled_at) : null;

  return (
    <Link
      to={`/opportunities/${opportunity.id}`}
      className="block bg-white border border-neutral-200 rounded-xl p-4 shadow-xs hover:border-neutral-300 hover:shadow-sm transition"
    >
      {/* Title row: avatar + company · position + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg ${avatar.cls.bg} ${avatar.cls.text} flex items-center justify-center text-sm font-semibold shrink-0`}
            aria-hidden
          >
            {avatar.char}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-neutral-900 truncate">
              {opportunity.company_name} · {opportunity.position_name}
            </div>
            {/* Meta row: salary chip + location + work hours + weekend chip */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs">
              {salary && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${salaryCls.bg} ${salaryCls.text} font-medium tabular-nums`}
                >
                  <span className={`w-1 h-1 rounded-full ${salaryCls.dot}`} aria-hidden />
                  {salary}
                </span>
              )}
              {opportunity.city && (
                <span className="text-neutral-500 truncate">
                  {[opportunity.province, opportunity.city].filter(Boolean).join(' ')}
                </span>
              )}
              {opportunity.work_hours && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-neutral-500">{opportunity.work_hours}</span>
                </>
              )}
              {weekendChip && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-medium ${weekendChip.cls}`}
                >
                  {weekendChip.label}
                </span>
              )}
              {sourceTag && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-medium ${sourceTag.cls}`}
                >
                  {sourceTag.label}
                </span>
              )}
            </div>
          </div>
        </div>
        <StatusBadge status={opportunity.status} />
      </div>

      {/* Next round line */}
      {nextRound && nextRoundDate && (
        <div className="mt-3 pt-3 border-t border-neutral-100 text-sm text-neutral-600 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[nextRound.outcome] || 'bg-neutral-400'}`} />
          <span>下轮：{ROUND_TYPE_META[nextRound.round_type]}</span>
          <span className="text-neutral-300">·</span>
          <span className={`tabular-nums ${nextRoundDate.text}`}>
            {nextRoundDate.prefix ? `${nextRoundDate.prefix} ` : ''}
            {formatDateTime(nextRound.scheduled_at)}
          </span>
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
