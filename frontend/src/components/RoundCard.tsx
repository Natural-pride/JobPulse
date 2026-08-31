import type { InterviewRound } from '../types';
import { ROUND_TYPE_META, FORMAT_META, OUTCOME_META } from '../lib/status';
import { formatDateTime } from '../lib/format';

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
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">
            第 {round.round_number} 轮 · {ROUND_TYPE_META[round.round_type]}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {formatDateTime(round.scheduled_at)} · {FORMAT_META[round.format]}
            {round.location ? ` · ${round.location}` : ''}
            {round.duration_minutes ? ` · ${round.duration_minutes} 分钟` : ''}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs ${outcomeMeta.color} ${outcomeMeta.bgColor}`}>
          {outcomeMeta.label}
        </span>
      </div>
      {(round.questions || round.my_performance) && (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {round.questions && (
            <div>
              <span className="text-slate-500">问题：</span>
              <span className="whitespace-pre-wrap">{round.questions}</span>
            </div>
          )}
          {round.my_performance && (
            <div>
              <span className="text-slate-500">表现：</span>
              <span className="whitespace-pre-wrap">{round.my_performance}</span>
            </div>
          )}
        </div>
      )}
      {round.notes && (
        <div className="mt-3 text-sm text-slate-600 border-t border-slate-100 pt-2">
          {round.notes}
        </div>
      )}
      <div className="mt-3 flex gap-2 text-sm">
        <button onClick={onEdit} className="text-brand-600 hover:underline">
          编辑
        </button>
        <button onClick={onDelete} className="text-red-600 hover:underline">
          删除
        </button>
      </div>
    </div>
  );
}
