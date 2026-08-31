import { STATUS_META } from '../lib/status';
import type { OpportunityStatus } from '../types';

const STATUS_DOT_COLOR: Record<OpportunityStatus, string> = {
  in_progress: 'bg-blue-800',
  awaiting_response: 'bg-amber-500',
  offered: 'bg-green-700',
  accepted: 'bg-teal-700',
  rejected: 'bg-red-700',
  withdrawn: 'bg-neutral-600',
  declined: 'bg-slate-500',
  accepted_then_left: 'bg-amber-600',
};

export default function StatusBadge({ status }: { status: OpportunityStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-700">
      <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLOR[status]}`} aria-hidden />
      {STATUS_META[status].label}
    </span>
  );
}
