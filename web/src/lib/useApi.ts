"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ApiState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/**
 * Fetch-on-mount hook. `key` identifies the request — when it changes the
 * fetcher runs again. `reload()` re-runs it, keeping old data visible.
 */
export function useApi<T>(fetcher: () => Promise<T>, key = "") {
  const [state, setState] = useState<ApiState<T>>({ data: undefined, error: undefined, loading: true });
  const [version, setVersion] = useState(0);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => (prev.loading ? prev : { ...prev, loading: true }));
    fetcherRef.current().then(
      (data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false });
      },
      (error: unknown) => {
        if (cancelled) return;
        setState((prev) => ({
          data: prev.data,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, reload };
}
