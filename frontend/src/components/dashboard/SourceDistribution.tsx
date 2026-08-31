import type { SourceBucket } from '../../lib/dashboardUtils';

export default function SourceDistribution({ buckets }: { buckets: SourceBucket[] }) {
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-neutral-900">来源分布</h2>
        <span className="text-xs text-neutral-500">{total} 条</span>
      </div>
      {buckets.length === 0 ? (
        <div className="text-xs text-neutral-500 py-6 text-center">暂无来源数据</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {buckets.map((b) => (
            <div key={b.source} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-xs text-neutral-700 truncate" title={b.source}>
                {b.source}
              </div>
              <div className="flex-1 h-6 bg-neutral-100 rounded overflow-hidden">
                <div
                  className={`${b.barClass} h-full rounded flex items-center justify-end px-2 transition-all`}
                  style={{ width: `${Math.max(b.width, 6)}%` }}
                >
                  <span className="text-[11px] font-semibold text-white tabular-nums">
                    {b.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
