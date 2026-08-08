import { ApiError } from "@/lib/api/error";

interface GetErrorMessageOptions {
  /**
   * Skip 5xx/technical sanitization and return the raw server/error message.
   * Use when the literal message is needed (e.g. control-flow inspection).
   */
  raw?: boolean;
}

const TECHNICAL_HINTS = ["prisma", "database", "connection"];
const GENERIC = "Something went wrong on our end. Please try again.";

/**
 * Human-readable defaults per HTTP status, used only when the backend didn't
 * send a usable `message`. The backend (AppError subclasses) almost always
 * sends a specific one — these are the safety net so a bare 401/403/409/429
 * still reads clearly instead of "Request failed with status …".
 */
function fallbackForStatus(status: number, data: unknown): string | null {
  switch (status) {
    case 400:
      return "That request wasn't valid. Please check the highlighted fields and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "That item no longer exists or was moved.";
    case 409:
      return "This conflicts with existing data (e.g. a duplicate SKU or part number).";
    case 422:
      return "Some fields need attention. Please review and try again.";
    case 429: {
      const retryAfter = retryAfterFromData(data);
      return retryAfter
        ? `Too many requests. Please wait ${retryAfter}s and try again.`
        : "Too many requests. Please wait a moment and try again.";
    }
    case 408:
    case 0:
      return "Network problem. Check your connection and try again.";
    default:
      return null;
  }
}

/** Pull a `message` string out of an ApiError's unknown `data` payload. */
function messageFromData(data: unknown): string {
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

/** Seconds to wait, from a 429 body's `retryAfter` field (if numeric). */
function retryAfterFromData(data: unknown): number | null {
  if (data && typeof data === "object" && "retryAfter" in data) {
    const r = (data as { retryAfter?: unknown }).retryAfter;
    if (typeof r === "number" && Number.isFinite(r) && r > 0) {
      return Math.round(r);
    }
  }
  return null;
}

/**
 * Compose a readable summary from a 422 validation body's `errors` array
 * (`{ field, message }[]`), e.g. "SKU already taken; Price must be > 0".
 * Caps at 3 fields so the toast stays short. Returns "" when absent/empty.
 */
function messagesFromValidation(data: unknown): string {
  if (!data || typeof data !== "object" || !("errors" in data)) return "";
  const errors = (data as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return "";

  const parts = errors
    .map((e) => {
      if (!e || typeof e !== "object") return "";
      const msg = "message" in e ? String((e as { message?: unknown }).message ?? "") : "";
      if (!msg) return "";
      const field = "field" in e ? String((e as { field?: unknown }).field ?? "") : "";
      // Prefix the field only when the message doesn't already name it.
      return field && !msg.toLowerCase().includes(field.toLowerCase())
        ? `${labelizeField(field)}: ${msg}`
        : msg;
    })
    .filter(Boolean);

  if (parts.length === 0) return "";
  const shown = parts.slice(0, 3).join("; ");
  const extra = parts.length - 3;
  return extra > 0 ? `${shown} …and ${extra} more` : shown;
}

/** Turn a dotted field path into a friendlier label ("variants.0.sku" → "Sku"). */
function labelizeField(field: string): string {
  const leaf = field.split(".").filter((seg) => !/^\d+$/.test(seg)).pop() ?? field;
  return leaf.charAt(0).toUpperCase() + leaf.slice(1);
}

/**
 * Turn any thrown value into a user-facing message.
 *
 * Priority:
 *   1. 422 validation — compose the per-field `errors` into one line.
 *   2. The backend `message` (4xx pass straight through).
 *   3. A clear status-specific default (401/403/409/429/…) when no message.
 *   4. The caller's `fallback`.
 *
 * By default, 5xx responses and technical/database errors are sanitized to a
 * friendly generic message so server internals never reach the user. Pass
 * `{ raw: true }` to skip sanitization.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
  options: GetErrorMessageOptions = {},
): string {
  const status = error instanceof ApiError ? error.status : undefined;
  const data = error instanceof ApiError ? error.data : undefined;

  // 1. Field-level validation detail (422) is the most useful — surface it.
  if (!options.raw && status === 422) {
    const composed = messagesFromValidation(data);
    if (composed) return composed;
  }

  const baseMessage =
    error instanceof ApiError
      ? messageFromData(error.data)
      : error instanceof Error
        ? error.message
        : "";

  if (!options.raw) {
    const isTechnical = TECHNICAL_HINTS.some((hint) =>
      baseMessage.toLowerCase().includes(hint),
    );
    if ((status !== undefined && status >= 500) || isTechnical) {
      return GENERIC;
    }
    // 2/3. Prefer the backend message; otherwise a status-specific default.
    // A generic transport message ("Request failed with status 409") is
    // treated as "no message" so the friendlier status default wins.
    const genericTransport = /^request failed with status/i.test(baseMessage);
    if ((!baseMessage || genericTransport) && status !== undefined) {
      const statusFallback = fallbackForStatus(status, data);
      if (statusFallback) return statusFallback;
    }
  }

  return baseMessage || fallback;
}
