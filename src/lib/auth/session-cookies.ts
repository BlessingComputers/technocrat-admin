import { getTokenLifetime } from "@/lib/auth/jwt-helper";

/**
 * Session-cookie translation (staff-only).
 *
 * Converts between the backend's token representation (JSON payload +
 * `Set-Cookie` headers) and the admin app's cookies. Pure: these functions
 * return cookie *specs* (or names) and never touch `next/headers` — callers
 * apply the result to a `cookies()` store or a `NextResponse`. That keeps the
 * interface the test surface: feed plain objects in, assert on specs out.
 *
 * Slimmed from the dual-audience (customer + staff) module in the main app.
 * The admin app has one audience — staff — so the `audience` parameter, the
 * customer config, and the `hasCustomerSession` presence flag are all gone.
 * See CONTEXT.md → "Session-cookie translation", "Cookie spec".
 */

export interface SessionTokens {
  accessToken: string;
  refreshToken?: string;
  /** Backend-provided lifetime hint, seconds. Overridden by Set-Cookie Max-Age. */
  expiresIn?: number;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
}

export interface CookieSpec {
  name: string;
  value: string;
  options: CookieOptions;
}

const WEEK_SECS = 7 * 24 * 60 * 60;
const DAY_SECS = 86400;

const ACCESS_COOKIE = "staffAccessToken";
const REFRESH_COOKIE = "staffRefreshToken";
/** Generic names the backend may use instead of the staff-specific ones. */
const ACCESS_ALIASES = ["accessToken"];
const REFRESH_ALIASES = ["refreshToken"];
const ACCESS_FALLBACK_SECS = DAY_SECS;
const REFRESH_FALLBACK_SECS = WEEK_SECS;
/** Legacy cookie names that must also be cleared on logout. */
const CLEAR_EXTRA = ["saAccessToken", "saRefreshToken"];

function httpOnlyOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

function pickString(
  payload: Record<string, unknown>,
  names: string[],
): string | undefined {
  for (const name of names) {
    const v = payload[name];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function parseSetCookie(
  header: string,
): { name: string; value: string; maxAge: number | null } | null {
  const [pair, ...attributes] = header.split(";").map((s) => s.trim());
  const eqIndex = pair.indexOf("=");
  if (eqIndex === -1) return null;

  const name = pair.substring(0, eqIndex);
  const value = pair.substring(eqIndex + 1);

  const maxAgeAttr = attributes.find((a) =>
    a.toLowerCase().startsWith("max-age"),
  );
  const parsed = maxAgeAttr ? parseInt(maxAgeAttr.split("=")[1], 10) : NaN;
  return { name, value, maxAge: Number.isNaN(parsed) ? null : parsed };
}

/**
 * Read the staff access/refresh tokens out of a backend auth response.
 * JSON payload first (specific name, then generic alias), then `Set-Cookie`
 * headers override (the backend's default behaviour). Returns null when no
 * access token is present.
 */
export function extractTokens(
  payload: Record<string, unknown> | null | undefined,
  setCookieHeaders: string[],
): SessionTokens | null {
  const p = payload ?? {};

  let accessToken = pickString(p, [ACCESS_COOKIE, ...ACCESS_ALIASES]);
  let refreshToken = pickString(p, [REFRESH_COOKIE, ...REFRESH_ALIASES]);
  let expiresIn =
    typeof p.expiresIn === "number" ? (p.expiresIn as number) : undefined;

  const accessNames = new Set([ACCESS_COOKIE, ...ACCESS_ALIASES]);
  const refreshNames = new Set([REFRESH_COOKIE, ...REFRESH_ALIASES]);

  for (const header of setCookieHeaders) {
    const cookie = parseSetCookie(header);
    if (!cookie) continue;
    if (accessNames.has(cookie.name)) {
      accessToken = cookie.value;
      if (cookie.maxAge != null) expiresIn = cookie.maxAge;
    } else if (refreshNames.has(cookie.name)) {
      refreshToken = cookie.value;
    }
  }

  if (!accessToken) return null;
  return { accessToken, refreshToken, expiresIn };
}

/**
 * Cookie specs to set for a freshly minted/refreshed staff session. Lifetimes
 * come from the JWT (`getTokenLifetime`), falling back to the staff defaults.
 */
export function sessionCookieSpecs(tokens: SessionTokens): CookieSpec[] {
  const specs: CookieSpec[] = [
    {
      name: ACCESS_COOKIE,
      value: tokens.accessToken,
      options: httpOnlyOptions(
        getTokenLifetime(
          tokens.accessToken,
          tokens.expiresIn ?? ACCESS_FALLBACK_SECS,
        ),
      ),
    },
  ];

  if (tokens.refreshToken) {
    specs.push({
      name: REFRESH_COOKIE,
      value: tokens.refreshToken,
      options: httpOnlyOptions(
        getTokenLifetime(tokens.refreshToken, REFRESH_FALLBACK_SECS),
      ),
    });
  }

  return specs;
}

/** Every cookie name to delete when ending the staff session. */
export function clearedCookieNames(): string[] {
  return [ACCESS_COOKIE, REFRESH_COOKIE, ...CLEAR_EXTRA];
}

/** The only cookies ever forwarded to the backend. */
const FORWARDED_COOKIES = new Set([ACCESS_COOKIE, REFRESH_COOKIE]);

/**
 * Serialize ONLY the staff session cookies into an outbound `Cookie:` header.
 *
 * Never forward the whole jar: the apex domain the admin runs under carries
 * third-party cookies (GA, the cPanel server's Mixpanel cookie) whose
 * decoded values can contain newlines — `fetch` rejects those as invalid
 * header values and the request never leaves the server (production incident,
 * 2026-06-12: SSR profile read as "unauthenticated", logout 500). The backend
 * has no business seeing those cookies anyway.
 */
export function buildCookieHeader(
  cookies: { name: string; value: string }[],
): string {
  return cookies
    .filter((c) => FORWARDED_COOKIES.has(c.name))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}
