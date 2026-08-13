/**
 * Very small in-memory cache with a TTL, plus in-flight request de-dupe.
 *
 * We're not reaching for a library here — the whole point of media-core is
 * that it has ~zero dependencies, so anyone can drop it into a CLI, a worker,
 * whatever, without dragging in a dependency tree.
 */
export class MemoryCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  private inflight = new Map<string, Promise<T>>();

  constructor(private ttlMs: number = 5 * 60 * 1000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Wraps a fetcher so that concurrent calls for the same key share one
   * network request instead of firing N identical requests (e.g. the same
   * search query triggered twice from a fast double-click).
   */
  async dedupe(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = fetcher()
      .then((value) => {
        this.set(key, value);
        this.inflight.delete(key);
        return value;
      })
      .catch((err) => {
        this.inflight.delete(key);
        throw err;
      });

    this.inflight.set(key, promise);
    return promise;
  }

  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }
}
