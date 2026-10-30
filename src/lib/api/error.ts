/**
 * Structured error thrown by the API client.
 *
 * Every rejected call from `api.get/post/patch/put/delete` is an instance
 * of this, so consumers can check `error instanceof ApiError` and read
 * `.status` / `.data` for structured error handling.
 */
export class ApiError extends Error {
  status: number;
  data: unknown;
  response: { status: number; data: unknown };

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.response = { status, data };
  }
}

/**
 * The backend's 400 for a bulk-upload file that passed the MIME filter but
 * can't be decoded (backend 2395bf7). A retry sends the same bytes, so the
 * bulk views skip that file and keep going.
 */
export function isUnreadableImage(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.status === 400 &&
    (err.data as { code?: string } | null)?.code === "INVALID_IMAGE"
  );
}
