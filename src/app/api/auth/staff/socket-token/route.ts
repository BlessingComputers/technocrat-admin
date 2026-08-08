import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isJwtExpired } from "@/lib/auth/jwt-helper";
import { BASE_URL } from "@/lib/api/endpoints";

/**
 * Same-origin bridge that hands client JS a token for the chat Socket.IO
 * handshake (the socket connects cross-origin, so the HttpOnly cookie can't
 * ride along; the backend reads `handshake.auth.token`).
 *
 * The access token is exchanged SERVER-SIDE for a 60-second socket-scoped
 * token (GET /api/auth/socket-token on the backend). The long-lived access
 * token never reaches browser JS — a stolen socket token can only perform
 * the handshake, never call the REST API, and dies within a minute.
 *
 * Fallback: if the backend doesn't expose the exchange yet (older deploy),
 * the raw access token is returned as before, so the two repos can deploy
 * in either order.
 *
 * This route deliberately does NOT refresh: an expired/absent token returns
 * 401 and `fetchSocketToken` returns null (the socket backs off and
 * reconnects later). Refresh is owned solely by the REST client's
 * single-flight path (ADR-0004). Never cached.
 */
export async function GET() {
  const cookieStore = await cookies();
  // ACCESS_COOKIE in lib/auth/session-cookies.ts (kept private there).
  const accessToken = cookieStore.get("staffAccessToken")?.value;

  if (!accessToken || isJwtExpired(accessToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/socket-token`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      const body = (await res.json()) as { data?: { token?: string } };
      if (body.data?.token) {
        return NextResponse.json(
          { token: body.data.token },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    // 404 = exchange endpoint not deployed yet → legacy fallback below.
    // Any authenticated failure (401/403) means the session is bad.
    if (res.status !== 404) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    // Network failure reaching the backend — fall back rather than kill chat.
  }

  return NextResponse.json(
    { token: accessToken },
    { headers: { "Cache-Control": "no-store" } },
  );
}
