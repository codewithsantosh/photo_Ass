import React, { createContext, useContext, useMemo } from "react";
import { MediaClient, type MediaClientConfig } from "media-core";

const MediaClientContext = createContext<MediaClient | null>(null);

export interface MediaProviderProps extends MediaClientConfig {
  children: React.ReactNode;
  client?: MediaClient;
}

/**
 * RN version of the provider. Deliberately near-identical to media-react's —
 * that symmetry is the point: an app switching from web to native shouldn't
 * have to relearn the data layer, only the components rendering it.
 */
export function MediaProvider({ children, client, ...config }: MediaProviderProps) {
  const instance = useMemo(() => client ?? new MediaClient(config), [client]);
  return <MediaClientContext.Provider value={instance}>{children}</MediaClientContext.Provider>;
}

export function useMediaClient(): MediaClient {
  const client = useContext(MediaClientContext);
  if (!client) {
    throw new Error("useMediaClient (and every media-native hook) must be used inside a <MediaProvider>.");
  }
  return client;
}
