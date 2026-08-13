import React, { createContext, useContext, useMemo } from "react";
import { MediaClient, type MediaClientConfig } from "media-core";

const MediaClientContext = createContext<MediaClient | null>(null);

export interface MediaProviderProps extends MediaClientConfig {
  children: React.ReactNode;
  /**
   * Pass an already-constructed client instead of a config, e.g. if you
   * want to build it once outside React (tests, SSR, storybook).
   */
  client?: MediaClient;
}

/**
 * Owns one MediaClient for the subtree. This is the *only* place in
 * media-react that touches media-core's constructor — every hook below
 * just reads the client back out of context.
 */
export function MediaProvider({ children, client, ...config }: MediaProviderProps) {
  const instance = useMemo(() => client ?? new MediaClient(config), [client]);

  return <MediaClientContext.Provider value={instance}>{children}</MediaClientContext.Provider>;
}

/** Internal — hooks use this. Exported too, for advanced/escape-hatch use. */
export function useMediaClient(): MediaClient {
  const client = useContext(MediaClientContext);
  if (!client) {
    throw new Error(
      "useMediaClient (and every media-react hook) must be used inside a <MediaProvider>."
    );
  }
  return client;
}
