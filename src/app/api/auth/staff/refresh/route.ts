import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  sessionCookieSpecs,
  clearedCookieNames,
} from "@/lib/auth/session-cookies";
import { refreshStaffSession } from "@/lib/auth/refresh-staff-session";

/**
 * Staff token-refresh route handler.
 *
 * Single-flight is owned by the CLIENT (ADR-0004); this handler just performs
 * one backend refresh per call (via the shared `refreshStaffSession`) and
 * rewrites the session cookies. Middleware never calls this.
 *
 * Ported from the main app: the session-cookie helpers are the staff-only
 * no-argument variants, and the GET fallback redirects to the root `/login`.
 */

async function performRefresh() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("staffRefreshToken")?.value;

  if (!refreshToken) {
    return null;
  }

  return refreshStaffSession(refreshToken);
}

export async function POST() {
  const result = await performRefresh();

  if (!result || "error" in result) {
    const response = NextResponse.json(
      { error: result?.error || "Unauthorized" },
      { status: 401 },
    );

    // Any refresh failure means the session is dead — clear the stale cookies,
    // not just on reuse detection. Middleware gates on cookie *presence*, so a
    // present-but-invalid staffAccessToken makes the client's redirect to /login
    // bounce straight back to / (the dashboard home), looping forever
    // (refresh 401 → /login → 307 / → refresh 401 → …). Deleting the
    // cookies here lets /login finally stick.
    for (const name of clearedCookieNames()) {
      response.cookies.delete(name);
    }

    return response;
  }

  const response = NextResponse.json(result.data);
  for (const spec of sessionCookieSpecs(result.tokens)) {
    response.cookies.set(spec.name, spec.value, spec.options);
  }
  return response;
}

export async function GET(request: Request) {
  // The GET refresh endpoint is no longer used by the proxy/middleware.
  // All token refresh is handled by the client-side interceptor via POST.
  // If someone hits this URL directly, redirect them to login.
  const { searchParams } = new URL(request.url);
  const nextPath = searchParams.get("next") || "/";

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", nextPath);
  return NextResponse.redirect(loginUrl);
}
