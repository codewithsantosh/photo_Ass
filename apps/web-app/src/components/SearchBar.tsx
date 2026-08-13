interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  mode: "photos" | "videos";
  onModeChange: (mode: "photos" | "videos") => void;
}

export function SearchBar({ value, onChange, mode, onModeChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Pexels — try “rain”, “tokyo”, “dog”…"
        aria-label="Search media"
        className="search-input"
      />
      <div className="mode-toggle" role="tablist" aria-label="Media type">
        <button
          role="tab"
          aria-selected={mode === "photos"}
          className={mode === "photos" ? "mode-btn is-active" : "mode-btn"}
          onClick={() => onModeChange("photos")}
        >
          Photos
        </button>
        <button
          role="tab"
          aria-selected={mode === "videos"}
          className={mode === "videos" ? "mode-btn is-active" : "mode-btn"}
          onClick={() => onModeChange("videos")}
        >
          Reels
        </button>
      </div>
    </div>
  );
}
