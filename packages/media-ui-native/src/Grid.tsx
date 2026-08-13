import { useCallback } from "react";
import type { MediaLike } from "./types";

export interface UseGridOptions<T extends MediaLike> {
  items: T[];
  onLoadMore: () => void;
  hasNextPage: boolean;
  loading?: boolean;
  numColumns?: number;
}

export interface UseGridResult<T extends MediaLike> {
  /** Spread directly onto a <FlatList {...getListProps()} />. */
  getListProps: () => {
    data: T[];
    keyExtractor: (item: T) => string;
    numColumns: number;
    onEndReached: () => void;
    onEndReachedThreshold: number;
  };
}

/**
 * Headless grid for RN. FlatList already does virtualization and
 * onEndReached-driven pagination far better than a hand-rolled scroll
 * listener would, so this hook's job is just to shape props for it
 * correctly and guard against duplicate onLoadMore calls — no rendering,
 * no styling, that's entirely the consumer's <FlatList renderItem>.
 */
export function useGrid<T extends MediaLike>({
  items,
  onLoadMore,
  hasNextPage,
  loading = false,
  numColumns = 2,
}: UseGridOptions<T>): UseGridResult<T> {
  const handleEndReached = useCallback(() => {
    if (!loading && hasNextPage) onLoadMore();
  }, [loading, hasNextPage, onLoadMore]);

  const getListProps = useCallback(
    () => ({
      data: items,
      keyExtractor: (item: T) => String(item.id),
      numColumns,
      onEndReached: handleEndReached,
      onEndReachedThreshold: 0.5,
    }),
    [items, numColumns, handleEndReached]
  );

  return { getListProps };
}
