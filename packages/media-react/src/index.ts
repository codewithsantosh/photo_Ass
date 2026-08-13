export { MediaProvider, useMediaClient } from "./MediaProvider";
export type { MediaProviderProps } from "./MediaProvider";
export { useSearch, useCurated, useVideoSearch, useMediaEvents, useMediaTracking } from "./hooks";
export type { PaginatedListState } from "./usePaginatedList";

// Re-export the domain types consumers will need without forcing them to
// also depend on media-core directly.
export type { Photo, Video, MediaItem, MediaEvent, SearchOptions, Page } from "media-core";
export { MediaError } from "media-core";
