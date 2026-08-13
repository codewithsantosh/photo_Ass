import { useCallback, useState } from "react";
import { MediaProvider, useSearch, useVideoSearch, useCurated, useMediaTracking, useMediaEvents } from "media-react";
import { Grid, Lightbox, ReelSwiper } from "media-ui-react";
import type { Photo, Video } from "media-react";
import { SearchBar } from "./components/SearchBar";
import { useDebouncedValue } from "./useDebouncedValue";
import "./styles/app.css";

const API_KEY = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;
console.log("API_KEY", API_KEY);

export default function App() {
  if (!API_KEY) {
    return (
      <div className="config-warning">
        <h1>Missing API key</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env</code> and add a free Pexels API key from{" "}
          <a href="https://www.pexels.com/api/">pexels.com/api</a>.
        </p>
      </div>
    );
  }

  return (
    <MediaProvider apiKey={API_KEY}>
      <MediaApp />
    </MediaProvider>
  );
}

function MediaApp() {
  const [rawQuery, setRawQuery] = useState("");
  const [mode, setMode] = useState<"photos" | "videos">("photos");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const query = useDebouncedValue(rawQuery, 350);

  const { trackView, trackDownload } = useMediaTracking();
  const [activity, setActivity] = useState<string[]>([]);
  useMediaEvents((event) => {
    const label =
      event.type === "search"
        ? `searched “${event.query}” — ${event.resultCount} results`
        : event.type === "view"
        ? `viewed ${event.kind} #${event.itemId}`
        : event.type === "download"
        ? `downloaded ${event.kind} #${event.itemId}`
        : `error: ${event.message}`;
    setActivity((prev) => [label, ...prev].slice(0, 5));
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wander</h1>
        <p className="tagline">A small window built on the Pexels catalog.</p>
        <SearchBar value={rawQuery} onChange={setRawQuery} mode={mode} onModeChange={setMode} />
      </header>

      <main>
        {mode === "photos" ? (
          <PhotoBrowser query={query} openIndex={openIndex} onOpenIndex={setOpenIndex} trackView={trackView} trackDownload={trackDownload} />
        ) : (
          <VideoReels query={query} trackView={trackView} />
        )}
      </main>

      {activity.length > 0 && (
        <aside className="activity-strip" aria-live="polite">
          <span className="activity-label">activity</span>
          <ul>
            {activity.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

function PhotoBrowser({
  query,
  openIndex,
  onOpenIndex,
  trackView,
  trackDownload,
}: {
  query: string;
  openIndex: number | null;
  onOpenIndex: (i: number | null) => void;
  trackView: (id: number, kind: "photo" | "video") => void;
  trackDownload: (id: number, kind: "photo" | "video") => void;
}) {
  const searchResult = useSearch(query, { perPage: 24 });
  const curatedResult = useCurated(24);
  const { items, loading, hasNextPage, loadMore, error } = query.trim() ? searchResult : curatedResult;

  const openLightboxAt = useCallback(
    (index: number) => {
      onOpenIndex(index);
      const item = items[index];
      if (item) trackView(item.id, "photo");
    },
    [items, onOpenIndex, trackView]
  );

  if (error) return <ErrorState message={error.message} />;

  return (
    <>
      {!query.trim() && <h2 className="section-label">Curated</h2>}

      <Grid<Photo>
        items={items}
        onLoadMore={loadMore}
        hasNextPage={hasNextPage}
        loading={loading}
        className="photo-grid"
        renderLoadingIndicator={() => <div className="loading-row">Loading more…</div>}
        renderItem={(photo, index, itemProps) => (
          <div {...itemProps} className="photo-tile" style={{ backgroundColor: photo.avgColor }}>
            <button className="photo-tile-btn" onClick={() => openLightboxAt(index)} aria-label={photo.alt}>
              <img src={photo.src.medium} alt={photo.alt} loading="lazy" />
            </button>
          </div>
        )}
      />

      {items.length === 0 && !loading && <EmptyState query={query} />}

      {openIndex !== null && items[openIndex] && (
        <Lightbox<Photo>
          items={items}
          initialIndex={openIndex}
          onClose={() => onOpenIndex(null)}
          onIndexChange={(item) => trackView(item.id, "photo")}
          className="lightbox-overlay"
          renderItem={(photo) => (
            <figure className="lightbox-figure">
              <img src={photo.src.large} alt={photo.alt} />
              <figcaption>
                Photo by{" "}
                <a href={photo.photographerUrl} target="_blank" rel="noreferrer">
                  {photo.photographer}
                </a>
                <button
                  className="download-btn"
                  onClick={() => {
                    trackDownload(photo.id, "photo");
                    window.open(photo.src.original, "_blank");
                  }}
                >
                  Download original
                </button>
              </figcaption>
            </figure>
          )}
        />
      )}
    </>
  );
}

function VideoReels({ query, trackView }: { query: string; trackView: (id: number, kind: "photo" | "video") => void }) {
  const { items, loading, error } = useVideoSearch(query.trim() ? query : "nature", { perPage: 12 });

  if (error) return <ErrorState message={error.message} />;
  if (loading && items.length === 0) return <div className="loading-row">Loading reels…</div>;
  if (items.length === 0) return <EmptyState query={query} />;

  return (
    <ReelSwiper<Video>
      items={items}
      className="reel-container"
      itemClassName="reel-item"
      onActiveChange={(video) => trackView(video.id, "video")}
      renderItem={(video, _index, isActive) => {
        const file = video.files.find((f) => f.quality === "hd") ?? video.files[0];
        return (
          <div className="reel-video-wrap">
            <video
              src={file?.url}
              poster={video.image}
              muted
              loop
              playsInline
              autoPlay={isActive}
              className="reel-video"
            />
            <div className="reel-caption">
              by{" "}
              <a href={video.userUrl} target="_blank" rel="noreferrer">
                {video.user}
              </a>
            </div>
          </div>
        );
      }}
    />
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="empty-state">
      <p>Nothing found for “{query}”.</p>
      <p className="empty-hint">Try a broader word — “ocean” tends to work better than “blue ocean sunset”.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state" role="alert">
      <p>Something went wrong: {message}</p>
    </div>
  );
}
