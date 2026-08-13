import type { Photo, Video, Page } from "./types";

// Raw shapes, kept private to this file — nothing outside media-core should
// ever see "Pexels" field names like `src.large2x` or `video_files`.
interface RawPexelsPhoto {
  id: number;
  width: number;
  height: number;
  photographer: string;
  photographer_url: string;
  avg_color: string;
  alt: string;
  src: { original: string; large: string; medium: string; tiny: string };
}

interface RawPexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  user: { name: string; url: string };
  image: string;
  video_files: { quality: string; width: number; height: number; link: string }[];
}

interface RawPhotoSearchResponse {
  photos: RawPexelsPhoto[];
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
}

interface RawVideoSearchResponse {
  videos: RawPexelsVideo[];
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
}

export function mapPhoto(raw: RawPexelsPhoto): Photo {
  return {
    kind: "photo",
    id: raw.id,
    width: raw.width,
    height: raw.height,
    photographer: raw.photographer,
    photographerUrl: raw.photographer_url,
    alt: raw.alt || `Photo by ${raw.photographer}`,
    avgColor: raw.avg_color,
    src: {
      original: raw.src.original,
      large: raw.src.large,
      medium: raw.src.medium,
      tiny: raw.src.tiny,
    },
  };
}

export function mapVideo(raw: RawPexelsVideo): Video {
  const qualityRank: Record<string, "sd" | "hd" | "uhd"> = {
    sd: "sd",
    hd: "hd",
    uhd: "uhd",
  };
  return {
    kind: "video",
    id: raw.id,
    width: raw.width,
    height: raw.height,
    duration: raw.duration,
    user: raw.user.name,
    userUrl: raw.user.url,
    image: raw.image,
    files: raw.video_files.map((f) => ({
      quality: qualityRank[f.quality] ?? "sd",
      width: f.width,
      height: f.height,
      url: f.link,
    })),
  };
}

export function mapPhotoPage(raw: RawPhotoSearchResponse): Page<Photo> {
  return {
    items: raw.photos.map(mapPhoto),
    page: raw.page,
    perPage: raw.per_page,
    totalResults: raw.total_results,
    hasNextPage: Boolean(raw.next_page),
  };
}

export function mapVideoPage(raw: RawVideoSearchResponse): Page<Video> {
  return {
    items: raw.videos.map(mapVideo),
    page: raw.page,
    perPage: raw.per_page,
    totalResults: raw.total_results,
    hasNextPage: Boolean(raw.next_page),
  };
}
