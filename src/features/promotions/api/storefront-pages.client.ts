import {
  FALLBACK_STOREFRONT_PAGES,
  type StorefrontPage,
} from "@/lib/storefront-pages";

/**
 * The storefront's page list, for a slide's "page" destination picker.
 *
 * Goes to our own route handler rather than through `lib/api` — that client is
 * for the backend API, and this is neither the backend nor its envelope. See
 * `app/api/admin/storefront-pages/route.ts` for why the hop through a server
 * route is required at all.
 */

export interface StorefrontPagesResult {
  pages: StorefrontPage[];
  /**
   * `"fallback"` means the storefront could not be reached and these are the
   * built-in stubs. The editor tells the manager, because the difference
   * matters: a page missing from a fallback list still exists and can be typed
   * into the field by hand.
   */
  source: "storefront" | "fallback";
}

function isStorefrontPage(value: unknown): value is StorefrontPage {
  if (typeof value !== "object" || value === null) return false;
  return (
    "path" in value &&
    typeof value.path === "string" &&
    "label" in value &&
    typeof value.label === "string" &&
    (!("description" in value) ||
      value.description === undefined ||
      typeof value.description === "string")
  );
}

function parseStorefrontPagesResult(value: unknown): StorefrontPagesResult {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid storefront pages response");
  }
  const pages = "pages" in value ? value.pages : undefined;
  const source = "source" in value ? value.source : undefined;
  if (
    !Array.isArray(pages) ||
    !pages.every(isStorefrontPage) ||
    (source !== "storefront" && source !== "fallback")
  ) {
    throw new Error("Invalid storefront pages response");
  }
  return { pages, source };
}

export async function fetchStorefrontPages(): Promise<StorefrontPagesResult> {
  try {
    const res = await fetch("/api/admin/storefront-pages", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body: unknown = await res.json();
    return parseStorefrontPagesResult(body);
  } catch {
    // The route handler already degrades to the fallback internally, so getting
    // here means the admin's own request failed. Same answer, no error state:
    // the picker is an accelerator for a free-text field, and an error banner
    // over a list of shortcuts would be louder than the problem.
    return { pages: FALLBACK_STOREFRONT_PAGES, source: "fallback" };
  }
}
