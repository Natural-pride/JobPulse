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
    <div className="border border-neutral-200 rounded-xl mb-2 bg-white shadow-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3 text-left text-sm font-medium text-neutral-900 flex items-center justify-between hover:bg-neutral-50 rounded-xl transition-colors"
      >
        <span>{title}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-5 py-4 border-t border-neutral-100 space-y-3">{children}</div>}
    </div>
  );
}
