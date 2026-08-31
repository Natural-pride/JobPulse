export default function StatCard({
  label,
  value,
  color = 'text-neutral-900',
  accent = false,
}: {
  label: string;
  value: number;
  color?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative bg-white border border-neutral-200 rounded-xl p-6 shadow-xs ${
        accent ? 'border-l-[3px] border-l-indigo-700' : ''
      }`}
    >
      <div className={`text-4xl font-semibold tabular-nums tracking-tight ${color}`}>{value}</div>
      <div className="text-xs font-medium text-neutral-500 tracking-wide uppercase mt-2">{label}</div>
    </div>
  );
}
