export type MediaErrorCode =
  | "missing_api_key"
  | "unauthorized"
  | "rate_limited"
  | "not_found"
  | "network_error"
  | "unknown";

export class MediaError extends Error {
  code: MediaErrorCode;
  status?: number;

  constructor(message: string, code: MediaErrorCode, status?: number) {
    super(message);
    this.name = "MediaError";
    this.code = code;
    this.status = status;
  }

  static fromResponse(status: number, body?: string): MediaError {
    if (status === 401 || status === 403) {
      return new MediaError("Pexels rejected the API key", "unauthorized", status);
    }
    if (status === 429) {
      return new MediaError("Pexels rate limit hit — back off and retry", "rate_limited", status);
    }
    if (status === 404) {
      return new MediaError("Requested item not found", "not_found", status);
    }
    return new MediaError(body || `Request failed with status ${status}`, "unknown", status);
  }
}
