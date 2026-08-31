import { format } from 'date-fns';
import type { HeatmapData } from '../../lib/dashboardUtils';
import { HEAT_CELL_BG, HEAT_CELL_TEXT, WEEKDAY_LABELS } from '../../lib/dashboardUtils';

export default function ActivityHeatmap({ data }: { data: HeatmapData }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-200">12 周活动</h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            共 <span className="text-slate-200 font-semibold tabular-nums">{data.totalCount}</span> 场
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-500">少</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-3 h-3 rounded-sm ${HEAT_CELL_BG(i)}`}
                aria-hidden
              />
            ))}
            <span className="text-slate-500">多</span>
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Weekday labels */}
        <div className="grid grid-rows-7 gap-1 pt-5 text-[10px] text-slate-500">
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={w} className="h-4 leading-4 text-right pr-1" style={{ visibility: i % 2 === 0 ? 'visible' : 'hidden' }}>
              {w}
            </div>
          ))}
        </div>

        {/* Grid: 12 cols × 7 rows */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-12 gap-1 mb-1 text-[10px] text-slate-500 tabular-nums">
              {data.weekLabels.map((label, i) => (
                <div
                  key={i}
                  className="text-center truncate"
                  title={label}
                >
                  {i % 2 === 0 ? label : ''}
                </div>
              ))}
            </div>
            <div className="grid grid-rows-7 grid-flow-col gap-1">
              {data.cells.map((c) => (
                <div
                  key={`${c.col}-${c.row}`}
                  className={`w-full h-4 rounded-sm ${c.bgClass} ${c.count > 0 ? 'ring-1 ring-emerald-300/10' : ''}`}
                  title={`${format(c.date, 'yyyy-MM-dd')} · ${c.count} 场`}
                >
                  {c.count > 0 && (
                    <div
                      className={`text-[9px] text-center leading-4 tabular-nums ${HEAT_CELL_TEXT(c.intensity)}`}
                    >
                      {c.count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
