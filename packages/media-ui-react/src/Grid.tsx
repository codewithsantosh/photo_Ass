import React, { useCallback, useEffect, useRef } from "react";
import type { MediaLike, WithDataAttrs } from "./types";

export interface UseGridOptions<T extends MediaLike> {
  items: T[];
  onLoadMore: () => void;
  hasNextPage: boolean;
  /** Prevents onLoadMore firing again while a page is already loading. */
  loading?: boolean;
  /** How far from the bottom (px) the sentinel triggers loadMore. Default 300. */
  rootMargin?: string;
}

export interface UseGridResult<T extends MediaLike> {
  /** Spread onto the scrollable/grid container element. */
  getContainerProps: () => WithDataAttrs<React.HTMLAttributes<HTMLDivElement>>;
  /** Spread onto each rendered item's wrapper. Purely structural — no visual styling. */
  getItemProps: (item: T, index: number) => WithDataAttrs<React.HTMLAttributes<HTMLDivElement>>;
  /**
   * Spread onto an empty element placed after the last item. When it enters
   * the viewport, onLoadMore fires. This is what makes scrolling "infinite"
   * without the consumer wiring up their own scroll listener.
   */
  sentinelRef: React.RefObject<HTMLDivElement>;
}

/**
 * Headless grid logic: layout and infinite-scroll triggering, no markup and
 * no styles. `useGrid` is the primitive; `Grid` below is a small convenience
 * wrapper around it for consumers who don't need the raw hook.
 */
export function useGrid<T extends MediaLike>({
  items,
  onLoadMore,
  hasNextPage,
  loading = false,
  rootMargin = "300px",
}: UseGridOptions<T>): UseGridResult<T> {
  const sentinelRef = useRef<HTMLDivElement>(null!);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, loading, rootMargin]);

  const getContainerProps = useCallback(
    (): WithDataAttrs<React.HTMLAttributes<HTMLDivElement>> => ({
      role: "grid",
      "aria-busy": loading || undefined,
      "data-media-grid": "",
    }),
    [loading]
  );

  const getItemProps = useCallback(
    (item: T, index: number): WithDataAttrs<React.HTMLAttributes<HTMLDivElement>> => ({
      role: "gridcell",
      "data-media-grid-item": "",
      "data-media-item-id": String(item.id),
      "data-media-item-index": index,
    }),
    []
  );

  return { getContainerProps, getItemProps, sentinelRef };
}

export interface GridProps<T extends MediaLike> extends UseGridOptions<T> {
  renderItem: (item: T, index: number, itemProps: React.HTMLAttributes<HTMLDivElement>) => React.ReactNode;
  /** Rendered where the load-more sentinel lives; use to show a spinner. */
  renderLoadingIndicator?: () => React.ReactNode;
  className?: string;
}

/**
 * Convenience wrapper around useGrid for the common case. Ships zero CSS —
 * `className` is the only styling hook, and every item gets a
 * `data-media-grid-item` attribute to hang your own CSS grid/flex rules off.
 */
export function Grid<T extends MediaLike>({
  items,
  onLoadMore,
  hasNextPage,
  loading,
  rootMargin,
  renderItem,
  renderLoadingIndicator,
  className,
}: GridProps<T>) {
  const { getContainerProps, getItemProps, sentinelRef } = useGrid({
    items,
    onLoadMore,
    hasNextPage,
    loading,
    rootMargin,
  });

  return (
    <div {...getContainerProps()} className={className}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>{renderItem(item, index, getItemProps(item, index))}</React.Fragment>
      ))}
      <div ref={sentinelRef} data-media-grid-sentinel="" aria-hidden="true" />
      {loading && renderLoadingIndicator?.()}
    </div>
  );
}
