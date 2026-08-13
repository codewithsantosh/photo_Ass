import React, { useCallback, useEffect, useRef, useState } from "react";
import type { MediaLike, WithDataAttrs } from "./types";

export interface UseReelSwiperOptions<T extends MediaLike> {
  items: T[];
  /** Fires whenever the item most visible in the viewport changes (e.g. to autoplay its video / fire a `view` event). */
  onActiveChange?: (item: T, index: number) => void;
  /** Fraction of an item that must be visible to count as "active". Default 0.6. */
  threshold?: number;
}

export interface UseReelSwiperResult<T extends MediaLike> {
  activeIndex: number;
  /** Spread onto the scroll container. Sets up snap-scroll semantics via data attrs — CSS (scroll-snap-type, overflow-y) is the consumer's job. */
  getContainerProps: () => React.HTMLAttributes<HTMLDivElement> & { ref: React.RefObject<HTMLDivElement> };
  /** Spread onto each full-viewport item wrapper. Registers it for active-item observation. */
  getItemProps: (
    item: T,
    index: number
  ) => WithDataAttrs<React.HTMLAttributes<HTMLDivElement>> & { ref: React.RefCallback<HTMLDivElement> };
}

/**
 * Headless vertical "Reels" pager. We don't do the scrolling ourselves —
 * native CSS scroll-snap handles paging far better than JS ever will. What
 * this hook adds is the part CSS *can't* do: knowing which item is
 * currently the active one, via IntersectionObserver watching each item
 * inside the scroll container.
 */
export function useReelSwiper<T extends MediaLike>({
  items,
  onActiveChange,
  threshold = 0.6,
}: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const containerRef = useRef<HTMLDivElement>(null!);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the greatest visible ratio above threshold —
        // during a fast swipe multiple items can be simultaneously
        // "intersecting" for a frame, and we want the one dominating the view.
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.mediaReelIndex);
          if (entry.intersectionRatio >= threshold && (!best || entry.intersectionRatio > best.ratio)) {
            best = { index: idx, ratio: entry.intersectionRatio };
          }
        }
        if (best) {
          setActiveIndex(best.index);
          const item = items[best.index];
          if (item) onActiveChangeRef.current?.(item, best.index);
        }
      },
      { root, threshold: [0, threshold, 1] }
    );

    for (const el of itemRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, threshold]);

  const getContainerProps = useCallback(
    () => ({
      ref: containerRef,
      "data-media-reel-container": "",
      role: "list" as const,
    }),
    []
  );

  const getItemProps = useCallback(
    (item: T, index: number) => ({
      role: "listitem" as const,
      "data-media-reel-item": "",
      "data-media-reel-index": index,
      "data-media-item-id": String(item.id),
      // Registration ref — a callback ref keeps this a plain attributes
      // object so getItemProps stays spreadable like every other prop-getter.
      ref: ((el: HTMLDivElement | null) => {
        if (el) itemRefs.current.set(index, el);
        else itemRefs.current.delete(index);
      }) as React.RefCallback<HTMLDivElement>,
    }),
    []
  );

  return { activeIndex, getContainerProps, getItemProps };
}

export interface ReelSwiperProps<T extends MediaLike> extends UseReelSwiperOptions<T> {
  renderItem: (item: T, index: number, isActive: boolean) => React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function ReelSwiper<T extends MediaLike>({
  items,
  onActiveChange,
  threshold,
  renderItem,
  className,
  itemClassName,
}: ReelSwiperProps<T>) {
  const { activeIndex, getContainerProps, getItemProps } = useReelSwiper({ items, onActiveChange, threshold });

  return (
    <div {...getContainerProps()} className={className}>
      {items.map((item, index) => (
        <div key={item.id} {...getItemProps(item, index)} className={itemClassName}>
          {renderItem(item, index, index === activeIndex)}
        </div>
      ))}
    </div>
  );
}
