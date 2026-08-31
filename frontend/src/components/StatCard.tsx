export default function StatCard({
  label,
  value,
  color = 'text-slate-900',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}
