import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'jobpulse:custom-sources';
const MAX_ENTRIES = 8;

/**
 * Persist user-typed "来源" values in localStorage so the form can offer them
 * as quick-pick chips on subsequent entries. No DB schema needed — these are
 * tiny, per-user, and the source field is just a free-text column.
 *
 * Returns the current list (most-recent first), an `add` function, and a
 * `remove` function. Reads happen on mount; writes update both state and
 * localStorage synchronously.
 */
export function useCustomSources(): {
  custom: string[];
  add: (value: string) => void;
  remove: (value: string) => void;
} {
  const [custom, setCustom] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustom(parsed.filter((v) => typeof v === 'string').slice(0, MAX_ENTRIES));
        }
      }
    } catch {
      // localStorage may be unavailable (e.g. private mode) or corrupted;
      // fall back to an empty list.
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)));
    } catch {
      // ignore quota / unavailable errors — in-memory state still works
    }
  }, []);

  const add = useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value) return;
      setCustom((prev) => {
        // Move to front (most recent), dedupe, cap.
        const next = [value, ...prev.filter((v) => v !== value)].slice(0, MAX_ENTRIES);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const remove = useCallback(
    (value: string) => {
      setCustom((prev) => {
        const next = prev.filter((v) => v !== value);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return { custom, add, remove };
}
