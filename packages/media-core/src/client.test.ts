import { describe, it, expect, vi, beforeEach } from "vitest";
import { MediaClient } from "./client";
import { MediaError } from "./errors";

const mockPhotoResponse = {
  photos: [
    {
      id: 1,
      width: 100,
      height: 100,
      photographer: "Jane Doe",
      photographer_url: "https://example.com/jane",
      avg_color: "#abcabc",
      alt: "A mountain",
      src: { original: "o.jpg", large: "l.jpg", medium: "m.jpg", tiny: "t.jpg" },
    },
  ],
  page: 1,
  per_page: 20,
  total_results: 1,
  next_page: undefined,
};

describe("MediaClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws at construction time if apiKey is missing", () => {
    // @ts-expect-error - intentionally omitting apiKey to test the guard
    expect(() => new MediaClient({})).toThrow(MediaError);
  });

  it("maps a search response into domain Photo objects", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPhotoResponse,
    }) as any;

    const client = new MediaClient({ apiKey: "test-key", logToConsole: false });
    const result = await client.searchPhotos("mountains");

    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe("photo");
    expect(result.items[0].photographer).toBe("Jane Doe");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("de-dupes concurrent identical requests into a single fetch call", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPhotoResponse,
    });
    globalThis.fetch = fetchMock as any;

    const client = new MediaClient({ apiKey: "test-key", logToConsole: false });
    await Promise.all([client.searchPhotos("beach"), client.searchPhotos("beach")]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("emits a view event when trackView is called", () => {
    const client = new MediaClient({ apiKey: "test-key", logToConsole: false });
    const events: string[] = [];
    client.events.on((e) => events.push(e.type));

    client.trackView(42, "photo");

    expect(events).toContain("view");
  });

  it("maps a 401 response to an unauthorized MediaError", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "bad key",
    }) as any;

    const client = new MediaClient({ apiKey: "wrong-key", logToConsole: false });

    await expect(client.searchPhotos("x")).rejects.toMatchObject({ code: "unauthorized" });
  });
});
