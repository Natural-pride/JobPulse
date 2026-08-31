import { STATUS_META } from '../lib/status';
import type { OpportunityStatus } from '../types';

export default function StatusBadge({ status }: { status: OpportunityStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${meta.color} ${meta.bgColor}`}>
      {meta.label}
    </span>
  );
}
