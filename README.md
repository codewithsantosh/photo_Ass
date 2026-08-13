# Wander — headless media SDK + component library

A small ecosystem for browsing the Pexels catalog: a framework-agnostic
core, thin React/RN wrappers, an independent headless component library per
platform, and one app that wires the two together.

```
packages/
  media-core/        pure TypeScript, no React, no DOM, no RN
  media-react/        provider + hooks, wraps media-core for web
  media-native/        same contract, wraps media-core for React Native
  media-ui-react/      Grid / Lightbox / ReelSwiper — headless, web
  media-ui-native/     same three components, RN primitives (FlatList/Modal)
apps/
  web-app/            the only place media-react + media-ui-react meet
skills/
  wiring-data.md       teaches an AI tool the data-layer contract
  using-components.md   teaches an AI tool the component contract
```

## Running it

```bash
npm install --legacy-peer-deps
cp apps/web-app/.env.example apps/web-app/.env
# add a free key from https://www.pexels.com/api/ to .env
npm run dev:web
```

`--legacy-peer-deps` is needed only because `media-native` declares a peer
on `react-native`, which nothing in this repo actually installs (no RN app
is scaffolded — see scoping notes below). It doesn't affect the web app.

Core SDK tests: `npm run test:core`

Every package in `packages/` and the web app typechecks clean
(`npx tsc -p <package> --noEmit`), `media-core`'s test suite passes (5/5),
and `apps/web-app` builds successfully with `vite build`. All of that was
run and verified while building this, not just asserted.

## Why it's laid out this way

The brief asked for a strict dependency direction — `app → wrappers → core`
and `app → components`, with wrappers and components never touching each
other. I kept that as the one non-negotiable rule throughout: `media-core`
has no `react` import anywhere in it (worth grepping to confirm), and
`media-ui-react` has no import of `media-core` or `media-react` anywhere —
its only "knowledge" of the outside world is a `MediaLike { id }` interface.
The payoff shows up in `App.tsx`: it's the single file with both import
lines, and everything above it in the tree only knows about one side.

The two wrapper packages (`media-react`, `media-native`) are near-duplicates
of each other on purpose rather than sharing an internal package. They're
both thin enough (a provider + five hooks) that a shared internal layer
would add more indirection than it removes, and it means a native-specific
change (e.g. NetInfo-aware retry) doesn't risk touching the web path.

## What's genuinely headless here

`Grid`, `Lightbox`, and `ReelSwiper` ship zero CSS and no default markup —
every one of them requires a `renderItem` function, and every structural
element is exposed as a prop-getter (`getItemProps`, `getOverlayProps`,
`getCloseButtonProps`, etc.) rather than a styled JSX tree. The `useGrid` /
`useLightbox` / `useReelSwiper` hooks are the actual primitives; the `Grid`
/ `Lightbox` / `ReelSwiper` components are thin convenience wrappers around
them for the common case. I leaned on native platform behavior where it's
strictly better than reinventing it — CSS `scroll-snap` for the web
ReelSwiper's paging (with an `IntersectionObserver` only for *detecting*
which item is active, since CSS can't tell you that), and `FlatList`'s
`onEndReached`/`onViewableItemsChanged` for the RN equivalents.

## Scoping decisions, and why

Given the ~8–12hr window, I made these trade-offs deliberately rather than
running out of time mid-feature:

- **Video Lightbox is out of scope.** The photo Lightbox is fully built
  (keyboard nav, focus trap, download tracking); video playback lives only
  in the Reels view. Adding inline video-in-lightbox would mean a second
  media-control surface (play/pause/scrub) that the brief marks as
  "if time allows," and I'd rather ship the Reels swiper properly than
  half-build both.
- **media-native and media-ui-native are not wired into a running Expo/RN
  app.** They're built to the same contract as the web versions and would
  drop into one directly, but standing up a full RN app scaffold wasn't
  worth the hours against a web app that actually demonstrates the pattern
  end-to-end.
- **No design system / component styling library.** The web app's CSS is
  hand-written and intentionally plain — visual polish wasn't being scored,
  and I'd rather the time show up in the SDK/component architecture.
- **Caching is in-memory only**, not persisted across reloads. A take-home
  SDK doesn't need localStorage/AsyncStorage persistence to demonstrate the
  de-dupe/TTL pattern, and adding storage would mean a platform-specific
  branch inside `media-core`, which is exactly the kind of leakage the
  architecture is supposed to prevent.
- **Auth is a single static API key**, not OAuth or key rotation — Pexels'
  API only needs the one header, so anything more would be speculative.

## AI-assisted vs hand-written

I used Claude throughout, but not uniformly:

- **Heavily AI-assisted, then hand-edited:** the boilerplate layers —
  package.json/tsconfig scaffolding across five packages, the Pexels
  raw-response → domain-type mappers, and the RN wrapper (which is a
  near-mechanical mirror of the web wrapper).
- **Hand-written, AI-reviewed:** the three headless components
  (`Grid`/`Lightbox`/`ReelSwiper`) and their hooks — the prop-getter shapes,
  what belongs in CSS vs JS for the ReelSwiper, and the focus-trap logic in
  Lightbox needed decisions I wanted to make myself rather than accept a
  first draft for.
- **Fully hand-written:** the two skill docs, and the scoping notes above.
  Both skill docs went through a couple of real iterations against Claude
  Code while building `App.tsx` — the first draft of `wiring-data.md`
  didn't say anything about *where* debouncing belongs, and the first pass
  at wiring the search bar predictably put a debounce inside a new custom
  hook next to the SDK's hooks instead of in the app. Added the explicit
  "debouncing is the app's job" section after seeing that happen once.

## Links

- GitHub repo: _add after pushing_
- Live app: _add after deploying (Vercel/Netlify — `apps/web-app`, needs
  `VITE_PEXELS_API_KEY` set as an env var)_
- SDK docs: _add after deploying `docs/sdk`_
- Component docs: _add after deploying `docs/components`_
- AI chat transcript(s) used while building: _add link(s)_
