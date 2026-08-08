import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

/**
 * Admin app middleware.
 *
 * No /admin prefix — this app IS the admin, served at root on
 * admin.blessingcomputers.com. Every route except /login is staff-protected.
 *
 * Customer block from the original proxy.ts lives in the main app, not here.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static, public, and Next.js internal paths — let them through.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/staff/refresh") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/icon.png"
  ) {
    return NextResponse.next();
  }

  const staffToken = request.cookies.get("staffAccessToken");
  const staffRefreshToken = request.cookies.get("staffRefreshToken");

  // Login page: bounce to the dashboard (home) if already authenticated.
  if (pathname === "/login") {
    if (staffToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Forgot/reset password — public.
  if (
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return NextResponse.next();
  }

  // Everything else needs a session.
  if (!staffToken) {
    if (staffRefreshToken) {
      // Don't redirect to the server-side refresh endpoint here.
      // That creates a race condition with the client-side fetch interceptor —
      // both try to use the same refresh token, the backend detects reuse,
      // and the entire session gets revoked (TOKEN_REUSE_DETECTED).
      // Let the page load; the client-side interceptor handles the
      // 401 → refresh → retry cycle on its own.
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except Next.js internals and static files.
  // (Internals are also short-circuited at the top of `proxy` for safety.)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
