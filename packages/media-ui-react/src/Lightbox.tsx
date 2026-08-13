import React, { useCallback, useEffect, useRef, useState } from "react";
import type { MediaLike, WithDataAttrs } from "./types";

export interface UseLightboxOptions<T extends MediaLike> {
  items: T[];
  initialIndex: number;
  onClose: () => void;
  /** Called whenever the visible index changes, e.g. to fire a `view` event. */
  onIndexChange?: (item: T, index: number) => void;
}

export interface UseLightboxResult<T extends MediaLike> {
  currentItem: T;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  prev: () => void;
  /** Spread onto the full-screen overlay/backdrop element. */
  getOverlayProps: () => React.HTMLAttributes<HTMLDivElement> & { ref: React.RefObject<HTMLDivElement> };
  /** Spread onto the close (×) button. */
  getCloseButtonProps: () => WithDataAttrs<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  /** Spread onto the "next" control. Omit rendering it entirely when isLast. */
  getNextButtonProps: () => WithDataAttrs<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  /** Spread onto the "prev" control. Omit rendering it entirely when isFirst. */
  getPrevButtonProps: () => WithDataAttrs<React.ButtonHTMLAttributes<HTMLButtonElement>>;
}

/**
 * Headless lightbox: owns index state, keyboard nav (←/→/Esc), and a focus
 * trap (focus moves into the overlay on open, restores to the trigger
 * element on close). Renders nothing — Lightbox below is the thin
 * convenience wrapper that actually puts pixels on screen.
 */
export function useLightbox<T extends MediaLike>({
  items,
  initialIndex,
  onClose,
  onIndexChange,
}: UseLightboxOptions<T>): UseLightboxResult<T> {
  const [index, setIndex] = useState(initialIndex);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const currentItem = items[index];
  const isFirst = index === 0;
  const isLast = index === items.length - 1;

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, items.length - 1)), [items.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    if (currentItem) onIndexChange?.(currentItem, index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Focus trap: remember what had focus, move focus in, restore on unmount.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    overlayRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  // Keyboard handling lives on the overlay via onKeyDown (see getOverlayProps)
  // rather than a global document listener, so multiple lightboxes never
  // fight over key events and consumers can compose it with their own
  // handlers if needed.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Tab") {
        // Minimal trap: keep focus inside the overlay.
        const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose, next, prev]
  );

  const getOverlayProps = useCallback(
    () => ({
      ref: overlayRef,
      role: "dialog" as const,
      "aria-modal": true,
      tabIndex: -1,
      onKeyDown: handleKeyDown,
      "data-media-lightbox-overlay": "",
    }),
    [handleKeyDown]
  );

  const getCloseButtonProps = useCallback(
    (): WithDataAttrs<React.ButtonHTMLAttributes<HTMLButtonElement>> => ({
      onClick: onClose,
      "aria-label": "Close",
      "data-media-lightbox-close": "",
    }),
    [onClose]
  );

  const getNextButtonProps = useCallback(
    (): WithDataAttrs<React.ButtonHTMLAttributes<HTMLButtonElement>> => ({
      onClick: next,
      disabled: isLast,
      "aria-label": "Next",
      "data-media-lightbox-next": "",
    }),
    [next, isLast]
  );

  const getPrevButtonProps = useCallback(
    (): WithDataAttrs<React.ButtonHTMLAttributes<HTMLButtonElement>> => ({
      onClick: prev,
      disabled: isFirst,
      "aria-label": "Previous",
      "data-media-lightbox-prev": "",
    }),
    [prev, isFirst]
  );

  return {
    currentItem,
    index,
    isFirst,
    isLast,
    next,
    prev,
    getOverlayProps,
    getCloseButtonProps,
    getNextButtonProps,
    getPrevButtonProps,
  };
}

export interface LightboxProps<T extends MediaLike> extends UseLightboxOptions<T> {
  /** Render the current item however you like — img, video, custom viewer. */
  renderItem: (item: T, state: UseLightboxResult<T>) => React.ReactNode;
  className?: string;
}

export function Lightbox<T extends MediaLike>({ renderItem, className, ...opts }: LightboxProps<T>) {
  const state = useLightbox(opts);
  if (!state.currentItem) return null;

  return (
    <div {...state.getOverlayProps()} className={className}>
      <button {...state.getCloseButtonProps()}>×</button>
      {!state.isFirst && <button {...state.getPrevButtonProps()}>‹</button>}
      {renderItem(state.currentItem, state)}
      {!state.isLast && <button {...state.getNextButtonProps()}>›</button>}
    </div>
  );
}
