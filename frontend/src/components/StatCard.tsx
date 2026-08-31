export default function StatCard({
  label,
  value,
  color = 'text-neutral-900',
  accent = false,
  variant = 'light',
}: {
  label: string;
  value: number;
  color?: string;
  accent?: boolean;
  variant?: 'light' | 'dark';
}) {
  const dark = variant === 'dark';
  const wrapper = dark
    ? `bg-slate-900 border border-slate-800 rounded-xl p-6 ${accent ? 'border-l-[3px] border-l-indigo-500' : ''}`
    : `relative bg-white border border-neutral-200 rounded-xl p-6 shadow-xs ${accent ? 'border-l-[3px] border-l-indigo-700' : ''}`;
  const labelClass = dark
    ? 'text-xs font-medium text-slate-400 tracking-wide uppercase mt-2'
    : 'text-xs font-medium text-neutral-500 tracking-wide uppercase mt-2';
  return (
    <div className={wrapper}>
      <div className={`text-4xl font-semibold tabular-nums tracking-tight ${color}`}>{value}</div>
      <div className={labelClass}>{label}</div>
    </div>
  );
}
