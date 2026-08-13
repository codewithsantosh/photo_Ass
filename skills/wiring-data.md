---
name: wiring-media-data
description: Use when connecting a React (or React Native) app to the Pexels-backed media SDK — setting up MediaProvider, calling data hooks (useSearch, useCurated, useVideoSearch), or subscribing to SDK activity events. Do NOT use for styling or rendering components — see using-media-components.md for that.
---

# Wiring media-react / media-native data

This SDK is split into layers on purpose: `media-core` (no React), a thin
platform wrapper (`media-react` or `media-native`), and a separate headless
component library. When an AI tool is asked to "add a search feature" or
"hook up the API," it tends to reach for `fetch` directly, or to invent a new
hook next to the ones that already exist. Don't do either. This doc is the
contract.

## 1. There is exactly one provider, mounted once

```tsx
import { MediaProvider } from "media-react";

<MediaProvider apiKey={import.meta.env.VITE_PEXELS_API_KEY}>
  <App />
</MediaProvider>
```

- The API key is only ever read here, from an env var. **Never** hardcode a
  key, pass it as a prop through multiple components, or read it inside a
  hook/component below the provider.
- Do not construct a second `MediaClient` anywhere else in the app. If you
  need the raw client for something the hooks don't cover, use
  `useMediaClient()` from inside the provider tree — don't `new MediaClient()`
  again.
- If a component needs data but isn't inside `<MediaProvider>`, the fix is to
  move the provider up, not to add a second one.

## 2. Use the existing hooks — don't write new fetch logic

| Need | Hook | Notes |
|---|---|---|
| Search photos | `useSearch(query, opts?)` | Debounce `query` yourself before passing it in — the hook re-fetches on every change to `query`. |
| Trending/default photos | `useCurated(perPage?)` | Use this for the empty/pre-search state instead of an empty grid. |
| Search videos | `useVideoSearch(query, opts?)` | Same shape as `useSearch`. |
| Fire a view/download event | `useMediaTracking()` → `{ trackView, trackDownload }` | Call `trackView` when a lightbox/reel item becomes the active one, `trackDownload` only on an actual save/download action — not on hover. |
| Listen to SDK activity | `useMediaEvents(listener)` | For app-level telemetry, logging UI, etc. This is independent of the SDK's own built-in console logger — both fire. |

All list hooks (`useSearch`, `useCurated`, `useVideoSearch`) return the same
shape:

```ts
{ items, loading, loadingMore, error, hasNextPage, loadMore, reload }
```

If you're about to write your own `useState`/`useEffect` pair to fetch media
data, stop — one of these hooks already does it, including de-dupe,
stale-response guarding, and pagination. Adding a parallel data-fetching path
is the single most common mistake here.

## 3. Debouncing is the app's job, not the hook's

```tsx
const [rawQuery, setRawQuery] = useState("");
const query = useDebouncedValue(rawQuery, 350); // app-level hook, not from the SDK
const { items } = useSearch(query);
```

Don't debounce inside a wrapper hook — different screens want different
delays, and the SDK staying unopinionated here is deliberate.

## 4. Error and loading states are not optional

Every list hook returns `error` and `loading` — if you render `items` without
checking both, you'll ship a blank screen on the first slow network request
or API error. Minimum acceptable handling:

```tsx
if (error) return <ErrorState message={error.message} />;
if (loading && items.length === 0) return <LoadingState />;
```

## 5. Boundary check before you commit

Before finishing any task in this area, confirm:
- [ ] Only one `<MediaProvider>` exists in the tree
- [ ] No component imports `media-core` directly — only `media-react` /
      `media-native`
- [ ] No new hand-rolled `fetch(...)` calls to the Pexels API anywhere in app code
- [ ] `trackView` / `trackDownload` are called at the right moments, not on
      every render
