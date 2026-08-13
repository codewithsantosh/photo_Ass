import { useCallback, useEffect } from "react";
import type { MediaEvent, MediaEventListener, SearchOptions } from "media-core";
import { useMediaClient } from "./MediaProvider";
import { usePaginatedList, type PaginatedListState } from "./usePaginatedList";
import type { Photo, Video } from "media-core";

/**
 * Search Pexels photos. Debounce the `query` yourself before passing it in
 * (media-react stays unopinionated about input timing) — a plain
 * useDeferredValue or a small debounce hook in the app is enough.
 */
export function useSearch(query: string, opts: SearchOptions = {}): PaginatedListState<Photo> {
  const client = useMediaClient();
  const fetchPage = useCallback(
    (page: number) => client.searchPhotos(query, { ...opts, page }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, query, opts.perPage, opts.orientation]
  );
  return usePaginatedList(fetchPage, [query, opts.perPage, opts.orientation]);
}

/** Pexels' curated/trending photo feed — good as a default before any search. */
export function useCurated(perPage = 20): PaginatedListState<Photo> {
  const client = useMediaClient();
  const fetchPage = useCallback((page: number) => client.curatedPhotos(page, perPage), [client, perPage]);
  return usePaginatedList(fetchPage, [perPage]);
}

/** Search Pexels videos — same shape as useSearch, for the Reels view. */
export function useVideoSearch(query: string, opts: SearchOptions = {}): PaginatedListState<Video> {
  const client = useMediaClient();
  const fetchPage = useCallback(
    (page: number) => client.searchVideos(query, { ...opts, page }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, query, opts.perPage]
  );
  return usePaginatedList(fetchPage, [query, opts.perPage]);
}

/**
 * Subscribe to raw SDK activity events (view/download/search/error).
 * The console logger from MediaClient's config runs independently — this
 * is for the *app* to hook its own analytics/telemetry on top.
 */
export function useMediaEvents(listener: MediaEventListener): void {
  const client = useMediaClient();
  useEffect(() => client.events.on(listener), [client, listener]);
}

/** Fire-and-forget helpers for the two required event types. */
export function useMediaTracking() {
  const client = useMediaClient();
  return {
    trackView: useCallback((id: number, kind: "photo" | "video") => client.trackView(id, kind), [client]),
    trackDownload: useCallback(
      (id: number, kind: "photo" | "video") => client.trackDownload(id, kind),
      [client]
    ),
  };
}

export type { MediaEvent };
