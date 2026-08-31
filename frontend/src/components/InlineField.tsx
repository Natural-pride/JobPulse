import { useEffect, useRef, useState } from 'react';

export default function InlineField({
  value,
  onSave,
  placeholder = '点击填写',
  emptyText = '—',
  inputClassName,
  displayClassName,
  type = 'text',
  rows = 2,
}: {
  value: string | null | undefined;
  onSave: (next: string) => Promise<void> | void;
  placeholder?: string;
  emptyText?: string;
  inputClassName?: string;
  displayClassName?: string;
  type?: 'text' | 'textarea';
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      // Defer to next tick so the input is mounted.
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        if (inputRef.current && 'select' in inputRef.current) {
          (inputRef.current as HTMLInputElement | HTMLTextAreaElement).select();
        }
      });
    }
  }, [editing]);

  function startEdit() {
    setDraft(value ?? '');
    setEditing(true);
  }

  async function commit() {
    const next = draft.trim();
    if (next === (value ?? '').trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      // Keep the editing state on error so user can retry
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value ?? '');
    setEditing(false);
  }

  if (editing) {
    if (type === 'textarea') {
      return (
        <textarea
          ref={(el) => (inputRef.current = el)}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancel();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
          }}
          disabled={saving}
          rows={rows}
          placeholder={placeholder}
          className={
            inputClassName ||
            'w-full text-sm border border-slate-300 rounded px-2 py-1 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20'
          }
        />
      );
    }
    return (
      <input
        ref={(el) => (inputRef.current = el)}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') cancel();
        }}
        disabled={saving}
        placeholder={placeholder}
        className={
          inputClassName ||
          'w-full text-sm border border-slate-300 rounded px-2 py-1 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20'
        }
      />
    );
  }

  const isEmpty = !value || !value.trim();
  return (
    <button
      type="button"
      onClick={startEdit}
      className={
        displayClassName ||
        `group w-full text-left text-sm px-2 py-1 -mx-2 -my-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1.5 ${
          isEmpty ? 'text-neutral-400 italic' : 'text-neutral-900'
        }`
      }
      title="点击编辑"
    >
      <span className="flex-1 min-w-0 truncate">
        {isEmpty ? emptyText : value}
      </span>
      <svg
        className="w-3 h-3 text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    </button>
  );
}
