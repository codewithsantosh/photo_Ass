/**
 * These components don't know Pexels or media-core exist. `MediaLike` is
 * the only thing they require of an item: something identifiable. A
 * consumer could hand these components photos from a completely different
 * API and nothing here would need to change.
 */
export interface MediaLike {
  id: string | number;
}

export type ItemProps = React.HTMLAttributes<HTMLElement> & {
  role?: string;
  tabIndex?: number;
};

/**
 * Every prop-getter that emits `data-media-*` attributes intersects with
 * this so TypeScript's excess-property check doesn't reject them on object
 * literals with an explicit HTMLAttributes return type.
 */
export type WithDataAttrs<T> = T & { [key: `data-${string}`]: string | number | boolean | undefined };
