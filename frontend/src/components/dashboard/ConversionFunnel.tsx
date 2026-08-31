import type { FunnelStage } from '../../lib/dashboardUtils';

export default function ConversionFunnel({ stages }: { stages: FunnelStage[] }) {
  const total = stages[0]?.count ?? 0;
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-neutral-900">转化漏斗</h2>
        <span className="text-xs text-neutral-500">总投递 {total}</span>
      </div>
      <div className="flex flex-col items-stretch gap-2.5">
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-xs text-neutral-600">{s.label}</div>
              <div className="flex-1 flex justify-center">
                <div
                  className={`${s.barClass} h-8 rounded-md flex items-center justify-between px-3 transition-all shadow-xs`}
                  style={{ width: `${Math.max(s.width, isLast ? 6 : 12)}%` }}
                >
                  <span className="text-sm font-semibold tabular-nums text-white">
                    {s.count}
                  </span>
                  {i > 0 && total > 0 && (
                    <span className="text-[11px] tabular-nums text-white/90">
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
