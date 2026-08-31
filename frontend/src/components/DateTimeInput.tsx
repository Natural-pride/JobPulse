import { useRef } from 'react';
import { formatDateTime } from '../lib/format';

export default function DateTimeInput({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const isEmpty = !value;
  const display = isEmpty ? '点击选择日期时间' : formatDateTime(value);

  function handleClick() {
    const input = hiddenRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // fall through
      }
    }
    input.focus();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full text-left border rounded px-3 py-1.5 transition bg-white ${
          isEmpty
            ? 'border-slate-300 text-slate-400 hover:border-brand-500 hover:text-slate-600'
            : 'border-slate-300 text-slate-900 hover:border-brand-500'
        }`}
      >
        {display}
      </button>
      <input
        ref={hiddenRef}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        required={required}
      />
    </>
  );
}
