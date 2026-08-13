# media-ui-react component reference

Three headless components. None of them ship CSS; none of them know
Pexels or media-core exist — they only require items shaped like `{ id }`.

## Grid

```tsx
<Grid
  items={photos}
  onLoadMore={loadMore}
  hasNextPage={hasNextPage}
  loading={loading}
  renderItem={(photo, index, itemProps) => (
    <div {...itemProps}><img src={photo.src.medium} /></div>
  )}
/>
```

Infinite scroll is automatic via an internal IntersectionObserver sentinel —
no manual scroll listener needed.

## Lightbox

```tsx
<Lightbox
  items={photos}
  initialIndex={index}
  onClose={() => setIndex(null)}
  onIndexChange={(item) => trackView(item.id)}
  renderItem={(photo) => <img src={photo.src.large} />}
/>
```

Built in: arrow-key navigation, Escape to close, a focus trap that restores
focus to whatever triggered the lightbox on close.

## ReelSwiper

```tsx
<ReelSwiper
  items={videos}
  className="reel-container"   // apply scroll-snap-type: y mandatory here
  itemClassName="reel-item"    // apply scroll-snap-align: start here
  onActiveChange={(video) => trackView(video.id)}
  renderItem={(video, i, isActive) => (
    <video src={video.files[0].url} autoPlay={isActive} muted loop />
  )}
/>
```

Paging is CSS scroll-snap; the component only tells you which item is
currently dominant in the viewport.

## The hooks underneath

Each component is a thin wrapper around a hook (`useGrid`, `useLightbox`,
`useReelSwiper`) that returns prop-getters instead of JSX, for consumers who
want to build fully custom markup instead of using the wrapper component.
