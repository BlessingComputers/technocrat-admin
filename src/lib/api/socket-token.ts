import { api } from "./client";

/**
 * Fetch the staff JWT for a Socket.IO handshake from the same-origin bridge
 * route (returns null when the caller has no valid session).
 *
 * Sockets connect cross-origin, so the HttpOnly `staffAccessToken` cookie can't
 * ride along; the backend instead reads the token from `handshake.auth`.
 * Resolve it fresh on every (re)connection so a rotated token is picked up.
 *
 * Goes through the shared api client so a bridge 401 triggers exactly ONE
 * single-flight refresh (ADR-0004 — coalesced in-tab, Web Locks across tabs)
 * followed by one retry — never a refresh per reconnect attempt. If the refresh
 * itself fails the client hard-redirects to /login, so a dead session can't turn
 * reconnection backoff into a refresh storm on the rotating refresh token (which
 * could trip reuse detection → TOKEN_REVOKED).
 *
 * Lives in `lib/` rather than a feature because more than one realtime surface
 * (live chat, the WhatsApp inbox) needs it, and features may not import from
 * each other.
 */
export async function fetchSocketToken(): Promise<string | null> {
  try {
    const data = await api.get<{ token?: string }>(
      "/api/auth/staff/socket-token",
    );
    return data?.token ?? null;
  } catch {
    return null;
  }
}
