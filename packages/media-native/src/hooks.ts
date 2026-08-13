import { useCallback, useEffect } from "react";
import type { MediaEventListener, SearchOptions, Photo, Video } from "media-core";
import { useMediaClient } from "./MediaProvider";
import { usePaginatedList, type PaginatedListState } from "./usePaginatedList";

export function useSearch(query: string, opts: SearchOptions = {}): PaginatedListState<Photo> {
  const client = useMediaClient();
  const fetchPage = useCallback(
    (page: number) => client.searchPhotos(query, { ...opts, page }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, query, opts.perPage, opts.orientation]
  );
  return usePaginatedList(fetchPage, [query, opts.perPage, opts.orientation]);
}

export function useCurated(perPage = 20): PaginatedListState<Photo> {
  const client = useMediaClient();
  const fetchPage = useCallback((page: number) => client.curatedPhotos(page, perPage), [client, perPage]);
  return usePaginatedList(fetchPage, [perPage]);
}

export function useVideoSearch(query: string, opts: SearchOptions = {}): PaginatedListState<Video> {
  const client = useMediaClient();
  const fetchPage = useCallback(
    (page: number) => client.searchVideos(query, { ...opts, page }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, query, opts.perPage]
  );
  return usePaginatedList(fetchPage, [query, opts.perPage]);
}

export function useMediaEvents(listener: MediaEventListener): void {
  const client = useMediaClient();
  useEffect(() => client.events.on(listener), [client, listener]);
}

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
