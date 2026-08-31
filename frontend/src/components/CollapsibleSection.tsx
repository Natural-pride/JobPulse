import { useState } from 'react';

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 text-left font-medium flex items-center justify-between hover:bg-slate-50"
      >
        <span>{title}</span>
        <span className="text-slate-400">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="px-4 py-3 border-t border-slate-200 space-y-3">{children}</div>}
    </div>
  );
}
