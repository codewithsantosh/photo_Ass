import { useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "media-core";

export interface PaginatedListState<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasNextPage: boolean;
  loadMore: () => void;
  reload: () => void;
}

/**
 * Shared plumbing behind useSearch / useVideoSearch / useCurated.
 * Not exported from the package's public entry point on purpose — it's an
 * implementation detail wrappers use to stay consistent, not part of the
 * contract consumers rely on.
 */
export function usePaginatedList<T>(
  fetchPage: (page: number) => Promise<Page<T>>,
  deps: unknown[]
): PaginatedListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Guards against a slow page-1 response landing after the query changed
  // again and clobbering fresher results.
  const requestId = useRef(0);

  const load = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      const thisRequest = ++requestId.current;
      mode === "replace" ? setLoading(true) : setLoadingMore(true);
      setError(null);

      try {
        const result = await fetchPage(targetPage);
        if (thisRequest !== requestId.current) return; // stale, ignore

        setItems((prev) => (mode === "replace" ? result.items : [...prev, ...result.items]));
        setPage(result.page);
        setHasNextPage(result.hasNextPage);
      } catch (err) {
        if (thisRequest !== requestId.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (thisRequest === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage]
  );

  // Re-run from page 1 whenever the caller's deps (e.g. search query) change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load(1, "replace");
  }, deps);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasNextPage) return;
    load(page + 1, "append");
  }, [load, loading, loadingMore, hasNextPage, page]);

  const reload = useCallback(() => load(1, "replace"), [load]);

  return { items, loading, loadingMore, error, hasNextPage, loadMore, reload };
}
