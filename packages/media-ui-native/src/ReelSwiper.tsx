import { useCallback, useRef, useState } from "react";
import type { MediaLike } from "./types";

export interface UseReelSwiperOptions<T extends MediaLike> {
  items: T[];
  onActiveChange?: (item: T, index: number) => void;
  /** Percent of item that must be visible to count as active. Default 60. */
  viewAreaCoveragePercentThreshold?: number;
}

export interface UseReelSwiperResult<T extends MediaLike> {
  activeIndex: number;
  /** Spread onto <FlatList {...getListProps()} pagingEnabled vertical />. */
  getListProps: () => {
    data: T[];
    keyExtractor: (item: T) => string;
    pagingEnabled: true;
    horizontal: false;
    showsVerticalScrollIndicator: false;
    onViewableItemsChanged: (info: { viewableItems: { index: number | null }[] }) => void;
    viewabilityConfig: { itemVisiblePercentThreshold: number };
  };
}

/**
 * RN's FlatList with pagingEnabled + onViewableItemsChanged gives us both
 * the snap-paging and the active-item detection natively — no
 * IntersectionObserver equivalent needed, unlike the web version.
 */
export function useReelSwiper<T extends MediaLike>({
  items,
  onActiveChange,
  viewAreaCoveragePercentThreshold = 60,
}: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const [activeIndex, setActiveIndex] = useState(0);
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: { index: number | null }[] }) => {
      const first = info.viewableItems[0];
      if (first?.index != null) {
        setActiveIndex(first.index);
        const item = items[first.index];
        if (item) onActiveChangeRef.current?.(item, first.index);
      }
    },
    [items]
  );

  const getListProps = useCallback(
    () => ({
      data: items,
      keyExtractor: (item: T) => String(item.id),
      pagingEnabled: true as const,
      horizontal: false as const,
      showsVerticalScrollIndicator: false as const,
      onViewableItemsChanged,
      viewabilityConfig: { itemVisiblePercentThreshold: viewAreaCoveragePercentThreshold },
    }),
    [items, onViewableItemsChanged, viewAreaCoveragePercentThreshold]
  );

  return { activeIndex, getListProps };
}
