import { useCallback, useState } from "react";
import type { MediaLike } from "./types";

export interface UseLightboxOptions<T extends MediaLike> {
  items: T[];
  initialIndex: number;
  onClose: () => void;
  onIndexChange?: (item: T, index: number) => void;
}

export interface UseLightboxResult<T extends MediaLike> {
  currentItem: T;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  prev: () => void;
  /** Spread onto a <Modal {...getModalProps()} />. */
  getModalProps: () => { visible: true; animationType: "fade"; onRequestClose: () => void };
  getCloseButtonProps: () => { onPress: () => void; accessibilityLabel: string };
  getNextButtonProps: () => { onPress: () => void; disabled: boolean; accessibilityLabel: string };
  getPrevButtonProps: () => { onPress: () => void; disabled: boolean; accessibilityLabel: string };
}

/**
 * RN's Modal + hardware back button (onRequestClose) stands in for the web
 * version's Escape key + focus trap — same job (a controllable, closeable
 * full-screen surface), platform-appropriate mechanism.
 */
export function useLightbox<T extends MediaLike>({
  items,
  initialIndex,
  onClose,
  onIndexChange,
}: UseLightboxOptions<T>): UseLightboxResult<T> {
  const [index, setIndex] = useState(initialIndex);
  const currentItem = items[index];
  const isFirst = index === 0;
  const isLast = index === items.length - 1;

  const next = useCallback(() => {
    setIndex((i) => {
      const n = Math.min(i + 1, items.length - 1);
      if (items[n]) onIndexChange?.(items[n], n);
      return n;
    });
  }, [items, onIndexChange]);

  const prev = useCallback(() => {
    setIndex((i) => {
      const p = Math.max(i - 1, 0);
      if (items[p]) onIndexChange?.(items[p], p);
      return p;
    });
  }, [items, onIndexChange]);

  const getModalProps = useCallback(
    () => ({ visible: true as const, animationType: "fade" as const, onRequestClose: onClose }),
    [onClose]
  );
  const getCloseButtonProps = useCallback(
    () => ({ onPress: onClose, accessibilityLabel: "Close" }),
    [onClose]
  );
  const getNextButtonProps = useCallback(
    () => ({ onPress: next, disabled: isLast, accessibilityLabel: "Next" }),
    [next, isLast]
  );
  const getPrevButtonProps = useCallback(
    () => ({ onPress: prev, disabled: isFirst, accessibilityLabel: "Previous" }),
    [prev, isFirst]
  );

  return {
    currentItem,
    index,
    isFirst,
    isLast,
    next,
    prev,
    getModalProps,
    getCloseButtonProps,
    getNextButtonProps,
    getPrevButtonProps,
  };
}
