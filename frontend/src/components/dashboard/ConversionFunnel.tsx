import type { FunnelStage } from '../../lib/dashboardUtils';

export default function ConversionFunnel({ stages }: { stages: FunnelStage[] }) {
  const total = stages[0]?.count ?? 0;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-200">转化漏斗</h2>
        <span className="text-xs text-slate-500">总投递 {total}</span>
      </div>
      <div className="flex flex-col items-stretch gap-2">
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-xs text-slate-400">{s.label}</div>
              <div className="flex-1 flex justify-center">
                <div
                  className={`${s.barClass} h-9 rounded-md flex items-center justify-between px-3 transition-all`}
                  style={{ width: `${Math.max(s.width, isLast ? 6 : 12)}%` }}
                >
                  <span className={`text-sm font-semibold tabular-nums ${s.textClass}`}>
                    {s.count}
                  </span>
                  {i > 0 && total > 0 && (
                    <span className={`text-[11px] tabular-nums ${s.textClass} opacity-80`}>
                      {(s.rate * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
