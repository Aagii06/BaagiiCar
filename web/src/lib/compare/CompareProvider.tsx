"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "baagii_car_compare";

/** More columns than this stop fitting side by side on a laptop. */
export const COMPARE_MAX = 4;

interface CompareValue {
  /** In the order they were added — the compare table keeps it. */
  ids: number[];
  ready: boolean;
  isCompared: (id: number) => boolean;
  full: boolean;
  toggle: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareValue | null>(null);

function readStored(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isInteger(n)).slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
}

function writeStored(ids: number[]) {
  try {
    if (ids.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked — the list still works for this visit
  }
}

/** Cars picked for side-by-side comparison; kept in this browser like the saved list. */
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  // Read after mount so the server render and first client render match.
  useEffect(() => {
    const load = () => setIds(readStored());
    Promise.resolve().then(() => {
      load();
      setReady(true);
    });
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (prev: number[]) => number[]) => {
    setIds((prev) => {
      const next = fn(prev);
      writeStored(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (id: number) =>
      update((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= COMPARE_MAX ? prev : [...prev, id])),
    [update]
  );
  const remove = useCallback((id: number) => update((prev) => prev.filter((x) => x !== id)), [update]);
  const clear = useCallback(() => update(() => []), [update]);

  const value = useMemo(
    () => ({ ids, ready, isCompared: (id: number) => ids.includes(id), full: ids.length >= COMPARE_MAX, toggle, remove, clear }),
    [ids, ready, toggle, remove, clear]
  );
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside <CompareProvider>");
  return ctx;
}
