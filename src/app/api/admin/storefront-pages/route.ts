import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env";
import {
  FALLBACK_STOREFRONT_PAGES,
  type StorefrontPage,
} from "@/lib/storefront-pages";

/**
 * Which pages a promotion banner may link to, asked of the storefront.
 *
 * `GET /api/admin/storefront-pages` → `{ pages: StorefrontPage[], source }`
 *
 * **Why this proxy exists rather than a direct browser fetch.** The storefront
 * sets no CORS headers on `/api/link-targets`, on purpose — it is not a public
 * browser API and giving it an `access-control-allow-origin` would make it
 * readable from any page. Server-to-server, that restriction does not apply.
 *
 * **Why not read the list from a shared package.** The two apps deploy
 * separately from separate repos, so anything committed here is a snapshot of
 * the storefront as it was the day someone remembered to update it. That is
 * exactly the failure this replaces: `/preorders` shipped on the storefront and
 * the admin's hardcoded list never learnt about it, so managers had no chip for
 * a page that had been live for weeks. Asking at runtime is the only version of
 * this that cannot drift.
 *
 * **Failure is not an error.** If `STOREFRONT_URL` is unset, or the storefront
 * is down, or it answers something unrecognisable, this returns the built-in
 * fallback with a 200 and says so in `source`. The alternative is a slide
 * editor whose page picker is empty during an unrelated outage, and the picker
 * has a free-text field beside it anyway — a short list is a degraded editor,
 * not a broken one.
 *
 * IMPORTANT: static path on purpose. A `[param]` segment here would be
 * swallowed by the catch-all `/api/*` backend rewrite (afterFiles ordering),
 * the same constraint the promotion slide-upload route documents.
 */

export const runtime = "nodejs";

/** How long to wait on the storefront before falling back. */
const TIMEOUT_MS = 4000;

interface Payload {
  pages: StorefrontPage[];
  /** Where the list came from, so the UI can say when it is showing a stub. */
  source: "storefront" | "fallback";
}

function fallback(): NextResponse {
  return NextResponse.json<Payload>(
    { pages: FALLBACK_STOREFRONT_PAGES, source: "fallback" },
    // Short cache: a fallback response is a symptom, and we want the next
    // request after the storefront recovers to get the real list quickly.
    { headers: { "cache-control": "private, max-age=60" } },
  );
}

/**
 * Trust the shape, not the sender's word for it. This is another app's payload
 * crossing a deployment boundary, and a malformed entry here becomes a `<button>`
 * that writes a junk path onto a live banner.
 */
function parsePages(body: unknown): StorefrontPage[] | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = (body as { pages?: unknown }).pages;
  if (!Array.isArray(raw)) return null;

  const pages = raw.filter(
    (p): p is StorefrontPage =>
      typeof p === "object" &&
      p !== null &&
      typeof (p as StorefrontPage).path === "string" &&
      typeof (p as StorefrontPage).label === "string" &&
      // A destination that is not an internal path has no business arriving
      // from this endpoint, whatever the storefront thinks it is offering.
      (p as StorefrontPage).path.startsWith("/") &&
      !(p as StorefrontPage).path.startsWith("//"),
  );

  return pages.length > 0 ? pages : null;
}

export async function GET() {
  const origin = serverEnv().storefrontUrl?.replace(/\/+$/, "");
  if (!origin) return fallback();

  try {
    const res = await fetch(`${origin}/api/link-targets`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Next would otherwise cache this in the Data Cache keyed to whatever
      // request first ran it. The response's own cache-control below is the
      // caching story; one layer is enough to reason about.
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!res.ok) return fallback();

    const pages = parsePages(await res.json());
    if (!pages) return fallback();

    return NextResponse.json<Payload>(
      { pages, source: "storefront" },
      {
        // The storefront's own answer only changes on its deploy, so an hour is
        // generous. `private` because this is behind staff auth and has no
        // business sitting in a shared cache.
        headers: { "cache-control": "private, max-age=3600" },
      },
    );
  } catch {
    // Timeout, DNS, TLS, unparseable JSON. All the same outcome to the editor.
    return fallback();
  }
}
