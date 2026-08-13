import { MediaEmitter } from "./emitter";
import { MemoryCache } from "./cache";
import { MediaError } from "./errors";
import { mapPhotoPage, mapVideoPage, mapPhoto, mapVideo } from "./mappers";
import type { Photo, Video, Page, SearchOptions, MediaEvent } from "./types";

// This file uses `fetch`, `URL`, and `console` — all standard WHATWG/ES
// globals available in browsers, Node 18+, and React Native alike, not DOM
// APIs in the "document/window" sense. "No DOM" in this SDK means no
// `document`, no `window`, no rendering — not "no fetch."
const PEXELS_BASE_URL = "https://api.pexels.com";

export interface MediaClientConfig {
  apiKey: string;
  /** Override for tests or a proxy — defaults to the real Pexels base URL. */
  baseUrl?: string;
  /** How long search results stay cached, in ms. Defaults to 5 minutes. */
  cacheTtlMs?: number;
  /** Subscribe your own default listener at init time (in addition to console logging). */
  onEvent?: (event: MediaEvent) => void;
  /** Set false to disable the built-in console logger. Defaults to true. */
  logToConsole?: boolean;
}

/**
 * Framework-agnostic client for the Pexels API.
 *
 * This is the only place in the SDK that knows the API key exists. Wrappers
 * (media-react, media-native) never see the raw key — they're handed a
 * configured client instance and call methods on it.
 */
export class MediaClient {
  readonly events = new MediaEmitter();

  private apiKey: string;
  private baseUrl: string;
  private photoCache: MemoryCache<Page<Photo>>;
  private videoCache: MemoryCache<Page<Video>>;

  constructor(config: MediaClientConfig) {
    if (!config.apiKey) {
      // Fail loudly at construction time rather than on first request —
      // easier to catch in app startup / CI than three network hops deep.
      throw new MediaError(
        "MediaClient requires an apiKey. Get one free at https://www.pexels.com/api/",
        "missing_api_key"
      );
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? PEXELS_BASE_URL;
    this.photoCache = new MemoryCache<Page<Photo>>(config.cacheTtlMs);
    this.videoCache = new MemoryCache<Page<Video>>(config.cacheTtlMs);

    if (config.logToConsole !== false) {
      this.events.on((e) => {
        // eslint-disable-next-line no-console
        console.log(`[media-core] ${e.type}`, e);
      });
    }
    if (config.onEvent) {
      this.events.on(config.onEvent);
    }
  }

  // ---- Photos -----------------------------------------------------------

  async searchPhotos(query: string, opts: SearchOptions = {}): Promise<Page<Photo>> {
    const page = opts.page ?? 1;
    const perPage = opts.perPage ?? 20;
    const cacheKey = `photos:${query}:${page}:${perPage}:${opts.orientation ?? ""}`;

    const result = await this.photoCache.dedupe(cacheKey, async () => {
      const url = this.buildUrl("/v1/search", {
        query,
        page: String(page),
        per_page: String(perPage),
        ...(opts.orientation ? { orientation: opts.orientation } : {}),
      });
      const raw = await this.request(url);
      return mapPhotoPage(raw);
    });

    this.events.emit({ type: "search", query, resultCount: result.items.length, at: Date.now() });
    return result;
  }

  async curatedPhotos(page = 1, perPage = 20): Promise<Page<Photo>> {
    const cacheKey = `curated:${page}:${perPage}`;
    return this.photoCache.dedupe(cacheKey, async () => {
      const url = this.buildUrl("/v1/curated", { page: String(page), per_page: String(perPage) });
      const raw = await this.request(url);
      return mapPhotoPage(raw);
    });
  }

  async getPhoto(id: number): Promise<Photo> {
    const url = this.buildUrl(`/v1/photos/${id}`);
    const raw = await this.request(url);
    return mapPhoto(raw);
  }

  // ---- Videos -------------------------------------------------------------

  async searchVideos(query: string, opts: SearchOptions = {}): Promise<Page<Video>> {
    const page = opts.page ?? 1;
    const perPage = opts.perPage ?? 20;
    const cacheKey = `videos:${query}:${page}:${perPage}`;

    const result = await this.videoCache.dedupe(cacheKey, async () => {
      const url = this.buildUrl("/videos/search", {
        query,
        page: String(page),
        per_page: String(perPage),
      });
      const raw = await this.request(url);
      return mapVideoPage(raw);
    });

    this.events.emit({ type: "search", query, resultCount: result.items.length, at: Date.now() });
    return result;
  }

  async popularVideos(page = 1, perPage = 20): Promise<Page<Video>> {
    const cacheKey = `popular-videos:${page}:${perPage}`;
    return this.videoCache.dedupe(cacheKey, async () => {
      const url = this.buildUrl("/videos/popular", { page: String(page), per_page: String(perPage) });
      const raw = await this.request(url);
      return mapVideoPage(raw);
    });
  }

  async getVideo(id: number): Promise<Video> {
    const url = this.buildUrl(`/videos/videos/${id}`);
    const raw = await this.request(url);
    return mapVideo(raw);
  }

  // ---- Activity tracking --------------------------------------------------

  /** Call when a user views an item full-screen (opens the lightbox / reel). */
  trackView(itemId: number, kind: "photo" | "video"): void {
    this.events.emit({ type: "view", itemId, kind, at: Date.now() });
  }

  /** Call when a user actually saves/downloads an item. */
  trackDownload(itemId: number, kind: "photo" | "video"): void {
    this.events.emit({ type: "download", itemId, kind, at: Date.now() });
  }

  clearCache(): void {
    this.photoCache.clear();
    this.videoCache.clear();
  }

  // ---- Internals ------------------------------------------------------------

  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async request(url: string): Promise<any> {
    let res: Response;
    try {
      res = await fetch(url, { headers: { Authorization: this.apiKey } });
    } catch (err) {
      const error = new MediaError("Network request failed", "network_error");
      this.events.emit({ type: "error", message: error.message, context: url, at: Date.now() });
      throw error;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => undefined);
      const error = MediaError.fromResponse(res.status, body);
      this.events.emit({ type: "error", message: error.message, context: url, at: Date.now() });
      throw error;
    }

    return res.json();
  }
}
