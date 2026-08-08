/**
 * Native Fetch API Client — ADMIN APP VERSION
 *
 * Slimmed from the dual-mode (customer + staff) client. Everything is staff
 * now, so the `isStaffRequest` heuristic, customer refresh queue, customer
 * lock key, and customer 401 branch are all gone.
 *
 * Handles:
 * - Automatic JSON serialization
 * - Query parameter serialization
 * - Cookie-based auth (credentials: 'include')
 * - 401 token refresh with request queuing
 * - Cross-tab refresh single-flight via Web Locks
 * - IP-blocked event dispatching
 */

import { BASE_URL } from "./endpoints";
import { ApiError } from "./error";

// Re-export so existing code that imports ApiError from the client still works
export { ApiError } from "./error";

// ─── Types ───────────────────────────────────────────────────────────

interface RequestConfig {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string | undefined>;
  data?: unknown;
  timeout?: number;
  signal?: AbortSignal;
  /**
   * Bypass envelope unwrapping and return the raw parsed body. For the rare
   * caller that genuinely needs the full `{ success, data, message }` envelope
   * (e.g. mutations whose useful info is the envelope's `message`). See ADR-0007.
   */
  raw?: boolean;
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

// ─── Response Envelope Unwrapping (ADR-0007) ────────────────────────
//
// The backend wraps responses in `{ success, data, message }`. We unwrap in
// THIS one place so services and codegen types speak inner payloads only — the
// envelope never leaks into features. Robust to two unconfirmed backend facts:
//   1. Trust the `success` flag, not just HTTP status — a `success: false`
//      envelope throws ApiError EVEN ON HTTP 200 (some backends ride failures
//      on a 200).
//   2. Pass through non-envelope bodies unchanged (bare arrays, raw objects,
//      plain text), so a non-conforming endpoint doesn't break.
//
// KNOWN RISK to verify once codegen lands (ADR-0006): if list endpoints put
// pagination metadata as a SIBLING of `data` (`{ success, data: [...], total }`)
// rather than nested, unwrapping to `.data` drops `total`. Those endpoints must
// then return the sibling meta too, or use the `{ raw: true }` hatch.

interface ResponseEnvelope {
  success: boolean;
  data?: unknown;
  message?: string;
}

function isEnvelope(body: unknown): body is ResponseEnvelope {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    typeof (body as { success: unknown }).success === "boolean"
  );
}

function unwrapEnvelope<T>(body: unknown, status: number): T {
  if (isEnvelope(body)) {
    if (!body.success) {
      throw new ApiError(body.message || "Request failed", status, body);
    }
    return body.data as T;
  }
  // Non-envelope body — return as-is.
  return body as T;
}

// ─── Refresh single-flight (cross-tab) ──────────────────────────────
//
// When the access token expires, exactly ONE refresh should fire across all
// tabs: the backend rotates refresh tokens and revokes the whole session if it
// sees a token reused (TOKEN_REUSE_DETECTED). Two simple layers:
//   1. Same-tab — `currentRefreshPromise` coalesces concurrent 401s in one tab
//      onto a single in-flight refresh.
//   2. Cross-tab — the Web Locks API serializes a named lock across every
//      same-origin tab and releases it automatically when the holder settles or
//      the tab dies (no stale locks, no timing hacks). The `recentlyRefreshed()`
//      timestamp then lets a tab that acquires the lock right after a sibling
//      refreshed reuse the fresh cookies instead of refreshing again.
// Web Locks is universal on modern browsers; the rare environment without it
// falls back to the timestamp guard alone (best-effort).

const REFRESH_LOCK = "auth_refresh_lock_staff";
const REFRESH_TS_KEY = "auth_refresh_ts_staff";
// How long a completed refresh stays "fresh" — a tab waking within this window
// skips its own refresh and reuses the sibling's rotated cookies.
const REFRESH_FRESH_MS = 10_000;

const supportsWebLocks =
  typeof navigator !== "undefined" && "locks" in navigator;

// Same-tab coalescing: concurrent 401s in one tab await a single promise.
let currentRefreshPromise: Promise<void> | null = null;

function markRefreshed(): void {
  try {
    localStorage.setItem(REFRESH_TS_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — only loses the cross-tab "skip" optimization */
  }
}

function recentlyRefreshed(): boolean {
  try {
    const ts = Number(localStorage.getItem(REFRESH_TS_KEY) || 0);
    return Date.now() - ts < REFRESH_FRESH_MS;
  } catch {
    return false;
  }
}

// ─── Core Fetch Helper ──────────────────────────────────────────────

function buildUrl(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  let fullUrl = url;
  if (!url.startsWith("http")) {
    if (typeof window === "undefined") {
      fullUrl = url.startsWith(BASE_URL) ? url : `${BASE_URL}${url}`;
    }
    // Client-side: URL already includes /api prefix from endpoints.ts,
    // which the Next.js rewrite in next.config.ts forwards to the backend.
  }

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      fullUrl += (fullUrl.includes("?") ? "&" : "?") + qs;
    }
  }

  return fullUrl;
}

async function baseFetch<T = unknown>(
  url: string,
  method: string,
  body?: unknown,
  config?: RequestConfig,
  _isRetry?: boolean,
): Promise<ApiResponse<T>> {
  const fullUrl = buildUrl(url, config?.params);

  const headers: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
  };

  if (config?.headers) {
    for (const [key, value] of Object.entries(config.headers)) {
      if (value !== undefined) {
        headers[key] = value;
      }
    }
  }

  let fetchBody: BodyInit | undefined;
  if (body instanceof FormData) {
    fetchBody = body;
    delete headers["Content-Type"];
  } else if (body !== undefined && body !== null) {
    fetchBody = JSON.stringify(body);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  let controller: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = config?.timeout ?? 15_000;

  if (!config?.signal) {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller!.abort(), timeout);
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: fetchBody,
      credentials: "include",
      signal: config?.signal ?? controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    let data: unknown;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errData = data as { code?: string; message?: string } | null;

      if (errData?.code === "IP_BLOCKED") {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("api:ip-blocked"));
        }
      }

      if (response.status === 401 && !_isRetry) {
        if (url.includes("/refresh")) {
          throw new ApiError(errData?.message || "Unauthorized", 401, data);
        }
        return handle401(url, method, body, config) as Promise<ApiResponse<T>>;
      }

      // Non-401 failures bypass the refresh flow entirely — log them so a
      // production incident (403 block, 404 proxy path, 5xx) is visible
      // instead of presenting as a silent "unauthenticated" state.
      console.error(
        `[API] ${method} ${fullUrl} → ${response.status}`,
        errData?.code ?? errData?.message ?? "",
      );

      throw new ApiError(
        errData?.message || `Request failed with status ${response.status}`,
        response.status,
        data,
      );
    }

    return { data: data as T, status: response.status, ok: true };
  } catch (error: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;

    const err = error as { name?: string; message?: string };
    // Network-level failures (DNS, reset, timeout) never reach the status
    // branches above — log them with the target URL for diagnosability.
    console.error(
      `[API] ${method} ${fullUrl} → ${err.name === "AbortError" ? "timeout" : "network failure"}:`,
      err.message,
    );
    if (err.name === "AbortError") {
      throw new ApiError("Request timeout", 408, null);
    }
    throw new ApiError(err.message || "Network error", 0, null);
  }
}

// ─── Refresh orchestration ──────────────────────────────────────────

/** Guarded section: skip if a sibling tab just refreshed, else refresh once. */
async function refreshCriticalSection(): Promise<void> {
  if (recentlyRefreshed()) return;
  await doRefresh();
  markRefreshed();
}

async function doRefresh(): Promise<void> {
  const response = await fetch("/api/auth/staff/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (response.ok) return;

  const errorData = await response.json().catch(() => null);

  // Refresh failed → the session is gone. Hard-bounce to /login (a full reload
  // clears stale client state on an auth death). This is the single redirect
  // authority for a failed refresh; `SessionProvider` covers the case where the
  // session is absent without any request having triggered a refresh.
  // `markRefreshed()` is intentionally NOT reached, so sibling tabs don't treat
  // a failed refresh as "fresh".
  if (typeof window !== "undefined") {
    const isReuse =
      (errorData as { error?: string } | null)?.error ===
      "TOKEN_REUSE_DETECTED";
    const errorParam = isReuse ? "session_revoked" : "unauthorized";
    const currentPath = window.location.pathname;
    // Admin app: login is at root, not /admin/login
    window.location.href = `/login?redirect=${encodeURIComponent(
      currentPath,
    )}&error=${errorParam}`;
  }

  throw new ApiError("Refresh failed", response.status, errorData);
}

/** Refresh once, serialized across tabs by Web Locks (timestamp-guard fallback). */
async function runRefresh(): Promise<void> {
  if (supportsWebLocks) {
    await navigator.locks.request(REFRESH_LOCK, refreshCriticalSection);
    return;
  }
  await refreshCriticalSection();
}

/**
 * One refresh per tab (coalesced via `currentRefreshPromise`) and one across
 * tabs (serialized in `runRefresh`). The `recentlyRefreshed` guard inside
 * `refreshCriticalSection` skips redundant work after a sibling refresh and
 * covers the no-Web-Locks fallback.
 */
function acquireAndRefresh(): Promise<void> {
  if (currentRefreshPromise) return currentRefreshPromise;
  currentRefreshPromise = runRefresh().finally(() => {
    currentRefreshPromise = null;
  });
  return currentRefreshPromise;
}

// ─── 401 Handler ────────────────────────────────────────────────────

async function handle401(
  url: string,
  method: string,
  body: unknown,
  config?: RequestConfig,
): Promise<ApiResponse> {
  // Exactly one refresh across all tabs (coalesced within this tab); then
  // replay the original request with the rotated cookies.
  await acquireAndRefresh();
  return baseFetch(url, method, body, config, true);
}

// ─── Request + Unwrap ───────────────────────────────────────────────
//
// `baseFetch` owns transport (the `{ data, status, ok }` wrapper + 401/refresh).
// `request` peels BOTH layers: the transport wrapper here, the business envelope
// in `unwrapEnvelope`. So `api.get<Order>()` returns an `Order` — not the client
// wrapper, not the backend envelope (ADR-0007). `{ raw: true }` keeps the
// envelope for callers that need it.

async function request<T>(
  url: string,
  method: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const response = await baseFetch<unknown>(url, method, body, config);
  if (config?.raw) return response.data as T;
  return unwrapEnvelope<T>(response.data, response.status);
}

// ─── Public API ─────────────────────────────────────────────────────

export const api = {
  get: <T = unknown>(url: string, config?: RequestConfig): Promise<T> =>
    request<T>(url, "GET", undefined, config),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> => request<T>(url, "POST", data, config),

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> => request<T>(url, "PATCH", data, config),

  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> => request<T>(url, "PUT", data, config),

  delete: <T = unknown>(url: string, config?: RequestConfig): Promise<T> =>
    request<T>(url, "DELETE", config?.data, config),
};
