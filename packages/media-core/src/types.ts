/**
 * Domain types for media-core.
 *
 * These mirror the shape of the Pexels API responses closely enough to stay
 * predictable, but we don't just re-export Pexels' raw types wholesale —
 * consumers of this SDK shouldn't need to know it's Pexels under the hood.
 * If we ever swap the backing provider, this file is the seam.
 */

export type MediaKind = "photo" | "video";

export interface PhotoSize {
  /** Original resolution */
  original: string;
  /** Good default for grids */
  medium: string;
  /** Good default for lightbox / full view */
  large: string;
  /** Tiny placeholder, useful for blur-up loading */
  tiny: string;
}

export interface VideoFile {
  quality: "sd" | "hd" | "uhd";
  width: number;
  height: number;
  url: string;
}

export interface Photo {
  kind: "photo";
  id: number;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  alt: string;
  avgColor: string;
  src: PhotoSize;
}

export interface Video {
  kind: "video";
  id: number;
  width: number;
  height: number;
  duration: number;
  user: string;
  userUrl: string;
  image: string; // poster frame
  files: VideoFile[];
}

export type MediaItem = Photo | Video;

export interface Page<T> {
  items: T[];
  page: number;
  perPage: number;
  totalResults: number;
  hasNextPage: boolean;
}

export interface SearchOptions {
  page?: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "square";
}

export type MediaEvent =
  | { type: "view"; itemId: number; kind: MediaKind; at: number }
  | { type: "download"; itemId: number; kind: MediaKind; at: number }
  | { type: "search"; query: string; resultCount: number; at: number }
  | { type: "error"; message: string; context?: string; at: number };

export type MediaEventListener = (event: MediaEvent) => void;

export type Unsubscribe = () => void;
