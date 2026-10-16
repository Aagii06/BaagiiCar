"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Settled<T> {
  data: T | undefined;
  error: Error | undefined;
  /** Request id this result belongs to. */
  id: string | null;
}

/**
 * Fetch-on-mount hook. `key` identifies the request — when it changes the
 * fetcher runs again. `reload()` re-runs it, keeping old data visible.
 * `loading` is true until the current request settles.
 */
export function useApi<T>(fetcher: () => Promise<T>, key = "") {
  const [settled, setSettled] = useState<Settled<T>>({ data: undefined, error: undefined, id: null });
  const [version, setVersion] = useState(0);
  const requestId = `${key}\u0000${version}`;

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef.current().then(
      (data) => {
        if (!cancelled) setSettled({ data, error: undefined, id: requestId });
      },
      (error: unknown) => {
        if (cancelled) return;
        setSettled((prev) => ({
          data: prev.data,
          error: error instanceof Error ? error : new Error(String(error)),
          id: requestId,
        }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const loading = settled.id !== requestId;

  return { data: settled.data, error: loading ? undefined : settled.error, loading, reload };
}
