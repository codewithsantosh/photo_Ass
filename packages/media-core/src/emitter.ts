import type { MediaEvent, MediaEventListener, Unsubscribe } from "./types";

/**
 * Minimal typed pub/sub. Deliberately not using Node's EventEmitter so this
 * stays portable to any JS runtime (browser, RN, edge, whatever).
 */
export class MediaEmitter {
  private listeners = new Set<MediaEventListener>();

  on(listener: MediaEventListener): Unsubscribe {
    this.listeners.add(listener);
    return () => this.off(listener);
  }

  off(listener: MediaEventListener): void {
    this.listeners.delete(listener);
  }

  emit(event: MediaEvent): void {
    // Copy to an array first — a listener unsubscribing itself mid-emit
    // shouldn't skip other listeners.
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch (err) {
        // A misbehaving listener should never break the SDK's own flow.
        // eslint-disable-next-line no-console
        console.error("[media-core] event listener threw", err);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
