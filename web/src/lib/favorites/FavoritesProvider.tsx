"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "baagii_car_saved";

interface FavoritesValue {
  ids: Set<number>;
  /** True once the saved list has been read from this browser. */
  ready: boolean;
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

function readStored(): number[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

/** Saved ads live in this browser only — the site has no sign-in. */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState(false);

  // Read after mount so the server render and first client render match.
  useEffect(() => {
    Promise.resolve().then(() => {
      setIds(new Set(readStored()));
      setReady(true);
    });
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setIds(new Set(readStored()));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: number) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // storage blocked — the heart still works for this visit
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ids, ready, isFavorite: (id: number) => ids.has(id), toggle }), [ids, ready, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
