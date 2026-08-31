import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useCustomSources } from './useCustomSources';

/**
 * Combines three layers of source suggestions for the form:
 *  1. Built-in suggestions (BOSS, 智联招聘, etc.) — passed in.
 *  2. Distinct sources actually used in the DB (system-wide) — fetched.
 *  3. User-typed custom values saved to localStorage (per-browser) — remembered.
 *
 * Dedupes (case-insensitive) and returns a stable order: built-in first, then
 * DB-sourced by frequency, then localStorage custom.
 */
export function useAllSourceSuggestions(
  builtIn: readonly string[]
): { suggestions: string[]; customFromStorage: string[]; addCustom: (v: string) => void; removeCustom: (v: string) => void } {
  const [dbSources, setDbSources] = useState<string[]>([]);
  const { custom: localCustom, add, remove } = useCustomSources();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.opportunities.listSources();
        if (!cancelled) setDbSources(list);
      } catch {
        // network/db error — just fall back to built-in + localStorage
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const seen = new Set<string>();
  const suggestions: string[] = [];
  // Layer 1: built-in
  for (const s of builtIn) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push(s);
    }
  }
  // Layer 2: DB-sourced, sorted by frequency (already sorted by backend)
  for (const s of dbSources) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push(s);
    }
  }
  // Layer 3: localStorage custom (may overlap with DB; dedupe)
  for (const s of localCustom) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push(s);
    }
  }

  return { suggestions, customFromStorage: localCustom, addCustom: add, removeCustom: remove };
}
