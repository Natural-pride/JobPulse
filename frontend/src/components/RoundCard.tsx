import type { InterviewRound } from '../types';
import { ROUND_TYPE_META, FORMAT_META, OUTCOME_META } from '../lib/status';
import { formatDateTime } from '../lib/format';

const OUTCOME_DOT: Record<string, string> = {
  pending: 'bg-blue-800',
  passed: 'bg-green-700',
  failed: 'bg-red-700',
  cancelled: 'bg-neutral-500',
};

export default function RoundCard({
  round,
  onEdit,
  onDelete,
}: {
  round: InterviewRound;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const outcomeMeta = OUTCOME_META[round.outcome];
  const dotColor = OUTCOME_DOT[round.outcome];
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-neutral-300 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium text-neutral-900">
            第 {round.round_number} 轮 · {ROUND_TYPE_META[round.round_type]}
          </div>
          <div className="text-sm text-neutral-500 mt-1.5 tabular-nums">
            {formatDateTime(round.scheduled_at)} · {FORMAT_META[round.format]}
            {round.location ? ` · ${round.location}` : ''}
            {round.duration_minutes ? ` · ${round.duration_minutes} 分钟` : ''}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-sm ${outcomeMeta.color}`}>
          <span className={`w-2 h-2 rounded-full ${dotColor}`} aria-hidden />
          {outcomeMeta.label}
        </span>
      </div>
      {(round.questions || round.my_performance) && (
        <div className="mt-4 space-y-2 text-sm text-neutral-700">
          {round.questions && (
            <div>
              <span className="text-neutral-500">问题：</span>
              <span className="whitespace-pre-wrap">{round.questions}</span>
            </div>
          )}
          {round.my_performance && (
            <div>
              <span className="text-neutral-500">表现：</span>
              <span className="whitespace-pre-wrap">{round.my_performance}</span>
            </div>
          )}
        </div>
      )}
      {round.notes && (
        <div className="mt-3 pt-3 border-t border-neutral-100 text-sm text-neutral-600">
          {round.notes}
        </div>
      )}
      <div className="mt-4 flex gap-3 text-sm">
        <button onClick={onEdit} className="text-indigo-700 hover:text-indigo-900 font-medium transition-colors">
          编辑
        </button>
        <button onClick={onDelete} className="text-red-700 hover:text-red-900 font-medium transition-colors">
          删除
        </button>
      </div>
    </div>
  );
}
