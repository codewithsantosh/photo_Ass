---
name: using-media-components
description: Use when rendering or styling media UI with Grid, Lightbox, or ReelSwiper from media-ui-react / media-ui-native — building the grid layout, wiring the lightbox, or building the vertical reel view. Do NOT use for data-fetching or auth — see wiring-media-data.md for that.
---

# Using media-ui-react / media-ui-native components

These components ship **zero CSS and no baked-in markup**. An AI tool that
hasn't seen this doc will typically either (a) assume there's a default
look and skip styling entirely, producing an unstyled page, or (b) try to
pass a `photo` or `apiKey` prop directly into `Grid`, assuming it talks to
the SDK. Neither is correct. Read this first.

## 1. These components have never heard of Pexels

`Grid`, `Lightbox`, and `ReelSwiper` only know about `{ id }` — they don't
import `media-core` or `media-react`, and they never will. Data always comes
in as plain props from whatever hook you called in the parent (see
`wiring-media-data.md`). If you find yourself trying to import `useSearch`
*inside* a file that also imports `Grid`, that's fine — but the import
boundary is: **the app wires them together, the components never wire
themselves.**

```tsx
// Correct: app-level component imports both, wires data → UI
import { useSearch } from "media-react";
import { Grid } from "media-ui-react";

function PhotoBrowser() {
  const { items, loadMore, hasNextPage, loading } = useSearch(query);
  return (
    <Grid
      items={items}
      onLoadMore={loadMore}
      hasNextPage={hasNextPage}
      loading={loading}
      renderItem={(photo, index, itemProps) => (
        <div {...itemProps} className="photo-tile">
          <img src={photo.src.medium} alt={photo.alt} />
        </div>
      )}
    />
  );
}
```

## 2. Every component is headless: markup and styles are yours

- `renderItem` (Grid, ReelSwiper) / `renderItem` (Lightbox) are **required**
  — there is no default rendering to fall back to. Don't call these
  components without a render function and expect something to appear.
- Every prop-getter (`getItemProps`, `getContainerProps`,
  `getCloseButtonProps`, etc.) returns a plain props object — always spread
  it: `<div {...getItemProps(item, index)}>`. Don't cherry-pick individual
  fields off it; the object may include ARIA attributes, refs, or data
  attributes you shouldn't drop.
- Styling hook: every structural element carries a `data-media-*` attribute
  (`data-media-grid-item`, `data-media-lightbox-overlay`,
  `data-media-reel-container`, etc.) specifically so you can target it in
  CSS without the library imposing a class-naming scheme. Prefer styling off
  those, or off a `className` you pass in yourself — never assume a default
  visual style exists to override.

## 3. Component-specific contracts

**Grid** — infinite scroll is automatic via an internal sentinel element;
you do not need to add a scroll listener or a "Load more" button unless you
want one instead of auto-loading. Required: `items`, `onLoadMore`,
`hasNextPage`. Optional: `loading` (prevents duplicate load-more calls).

**Lightbox** — owns keyboard nav (←/→ to move, Esc to close) and a focus
trap already; do not add your own `keydown` listener for the same keys, it
will double-fire. `onIndexChange` is where you should call `trackView` from
`media-react`, not on initial open alone — a user paging through the
lightbox is viewing each item.

**ReelSwiper** — vertical snap-scrolling is CSS's job
(`scroll-snap-type: y mandatory` on the container, `scroll-snap-align: start`
on each item) — the component does not scroll anything with JavaScript.
`onActiveChange` tells you which item is currently dominant in the viewport;
use it to autoplay/pause video and to call `trackView`, not a manual
`IntersectionObserver` of your own.

## 4. Accessibility is already wired — don't remove it

`Lightbox`'s overlay has `role="dialog"` and `aria-modal`, and its buttons
have `aria-label`s baked into the prop-getters. If you're customizing the
close/next/prev buttons, spread the prop-getter first, then add your own
props after — don't replace `aria-label` with nothing:

```tsx
// Good — keeps the built-in aria-label, adds a custom class
<button {...getCloseButtonProps()} className="my-close-btn" />

// Bad — drops accessibility attributes the getter provided
<button onClick={onClose} className="my-close-btn">×</button>
```

## 5. Boundary check before you commit

- [ ] No component in `media-ui-react`/`media-ui-native` imports `media-core`
      or `media-react`/`media-native`
- [ ] Every `Grid`/`Lightbox`/`ReelSwiper` usage supplies its own
      `renderItem` and its own styling (className or CSS targeting the
      `data-media-*` attributes) — nothing relies on a default appearance
- [ ] Prop-getters are spread wholesale (`{...getX()}`), not destructured
      field-by-field
