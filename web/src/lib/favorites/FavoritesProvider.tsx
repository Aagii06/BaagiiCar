"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "baagii_car_saved";

/** The list is dropped this long after the last ad was added; each add restarts the clock. */
const SAVED_TTL_DAYS = 30;
const TTL_MS = SAVED_TTL_DAYS * 24 * 60 * 60 * 1000;

interface Stored {
  ids: number[];
  /** When an ad was last added (ms). */
  addedAt: number;
}

interface FavoritesValue {
  ids: Set<number>;
  /** True once the saved list has been read from this browser. */
  ready: boolean;
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

function readStored(): Stored {
  const empty = { ids: [], addedAt: Date.now() };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Stored> | null;
    const ids = Array.isArray(parsed?.ids) ? parsed.ids.filter((n): n is number => Number.isInteger(n)) : [];
    const addedAt = typeof parsed?.addedAt === "number" ? parsed.addedAt : 0;
    if (!ids.length || Date.now() - addedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return empty;
    }
    return { ids, addedAt };
  } catch {
    return empty;
  }
}

function writeStored(value: Stored) {
  try {
    if (value.ids.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked — the heart still works for this visit
  }
}

/** Saved ads live in this browser only — the site has no sign-in — and expire after SAVED_TTL_DAYS. */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const addedAt = useRef(0);
  const [ready, setReady] = useState(false);

  // Read after mount so the server render and first client render match.
  useEffect(() => {
    const load = () => {
      const stored = readStored();
      addedAt.current = stored.addedAt;
      setIds(new Set(stored.ids));
    };
    Promise.resolve().then(() => {
      load();
      setReady(true);
    });
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: number) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        addedAt.current = Date.now();
      }
      writeStored({ ids: [...next], addedAt: addedAt.current });
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
