# media-core SDK reference

## Install

```bash
npm install media-core
```

## Quick start

```ts
import { MediaClient } from "media-core";

const client = new MediaClient({ apiKey: process.env.PEXELS_API_KEY! });

const page = await client.searchPhotos("mountains", { perPage: 24 });
console.log(page.items[0].src.medium);
```

## `MediaClient`

| Method | Returns | Notes |
|---|---|---|
| `searchPhotos(query, opts?)` | `Promise<Page<Photo>>` | cached + de-duped per query/page |
| `curatedPhotos(page?, perPage?)` | `Promise<Page<Photo>>` | Pexels' curated feed |
| `getPhoto(id)` | `Promise<Photo>` | single item, uncached |
| `searchVideos(query, opts?)` | `Promise<Page<Video>>` | |
| `popularVideos(page?, perPage?)` | `Promise<Page<Video>>` | |
| `getVideo(id)` | `Promise<Video>` | |
| `trackView(id, kind)` | `void` | emits a `view` event |
| `trackDownload(id, kind)` | `void` | emits a `download` event |
| `clearCache()` | `void` | drops all cached pages |

## Events

```ts
const unsubscribe = client.events.on((event) => {
  // event.type: "view" | "download" | "search" | "error"
});
```

A default console-logging listener is attached automatically; pass
`logToConsole: false` in the constructor config to disable it.

## Errors

All request failures reject with a `MediaError`, which carries a `code`:
`missing_api_key`, `unauthorized`, `rate_limited`, `not_found`,
`network_error`, `unknown`.

```ts
try {
  await client.searchPhotos("x");
} catch (err) {
  if (err instanceof MediaError && err.code === "rate_limited") {
    // back off and retry
  }
}
```
