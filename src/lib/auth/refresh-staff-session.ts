import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { extractTokens, type SessionTokens } from "@/lib/auth/session-cookies";

/**
 * Server-side staff token refresh — the single source of truth for exchanging a
 * refresh token with the backend, called by the `/api/auth/staff/refresh` route
 * so the delicate "never retry" semantics live in exactly one place. (The chat
 * `socket-token` route deliberately does NOT refresh — see its route doc.)
 *
 * Single-flight is owned by the CLIENT (ADR-0004); this performs one backend
 * refresh per call and NEVER retries: the backend rotates refresh tokens and
 * detects reuse, so resubmitting a possibly-already-rotated token would trip
 * `TOKEN_REUSE_DETECTED` and revoke the whole session. Callers apply the
 * returned tokens to their own response cookies.
 */

export type StaffRefreshResult =
  | { data: unknown; tokens: SessionTokens }
  | { error: string }
  | null;

export async function refreshStaffSession(
  refreshToken: string,
): Promise<StaffRefreshResult> {
  const controller = new AbortController();
  // 60s is generous for a refresh round-trip; on timeout we give up rather than
  // retry (the backend may already have rotated the token — see below).
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(API_ENDPOINTS.staffAuth.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (errorData.code === "TOKEN_REUSE_DETECTED") {
        console.error(
          "[STAFF REFRESH] Token reuse detected by backend. Session must be revoked.",
        );
        return { error: "TOKEN_REUSE_DETECTED" };
      }

      // IMPORTANT: do NOT retry on 5xx. The backend may have already rotated the
      // refresh token before the 5xx was returned. Resubmitting the same token
      // would then look like reuse and revoke the session.
      console.warn(`[STAFF REFRESH] Backend returned ${response.status}.`);
      return null;
    }

    const data = await response.json();
    const payload = (data.data || {}) as Record<string, unknown>;
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    const tokens = extractTokens(payload, setCookieHeaders);
    if (!tokens) return null;

    return { data, tokens };
  } catch (error) {
    clearTimeout(timeoutId);

    // IMPORTANT: do NOT retry on timeout/abort. A timeout doesn't mean the
    // request didn't reach the backend — it means we didn't receive the response
    // in time. The backend may already have rotated the token; resubmitting
    // would trigger TOKEN_REUSE_DETECTED.
    console.error(
      "[STAFF REFRESH] Failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
