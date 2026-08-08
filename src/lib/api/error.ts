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
