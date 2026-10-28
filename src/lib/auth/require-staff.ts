import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { isJwtExpired } from "@/lib/auth/jwt-helper";

/**
 * Guard for route handlers that do work here instead of forwarding to the
 * backend (the AI parse, lookup and image routes). `proxy.ts` only checks that
 * a `staffAccessToken` cookie exists, and routes that forward are covered
 * because the backend checks the token. These routes spend money and fetch
 * outside URLs without ever reaching the backend, so they ask it directly:
 * `/auth/staff/profile` runs the backend's `authenticate` + `requireStaff`, so
 * a forged or customer token fails.
 *
 * Returns the response to send when the caller isn't signed-in staff, or null
 * to carry on.
 */

/** Tokens the backend accepted recently. The image proxy runs ~12 times per product. */
const verified = new Map<string, number>();
const VERIFIED_FOR_MS = 60_000;

export async function requireStaff(): Promise<NextResponse | null> {
  // ACCESS_COOKIE in lib/auth/session-cookies.ts (kept private there).
  const token = (await cookies()).get("staffAccessToken")?.value;
  if (!token || isJwtExpired(token)) return unauthorized();

  const now = Date.now();
  if ((verified.get(token) ?? 0) > now) return null;

  let res: Response;
  try {
    res = await fetch(API_ENDPOINTS.staffAuth.profile, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't check your session. Try again." },
      { status: 503 },
    );
  }
  if (!res.ok) return unauthorized();

  for (const [t, until] of verified) if (until <= now) verified.delete(t);
  verified.set(token, now + VERIFIED_FOR_MS);
  return null;
}

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
