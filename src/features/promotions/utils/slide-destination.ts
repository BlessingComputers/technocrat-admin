/**
 * What a slide's link points at, and how that survives a round trip through a
 * backend that only stores `productSlug` and `externalUrl`.
 *
 * The slide model has exactly two link columns. A product link uses
 * `productSlug`; *everything else* — a category listing, a brand listing, a
 * storefront page, a genuine off-site URL — rides in `externalUrl`, because
 * there is no third column and asking for one would block this on the backend
 * repo's schedule. The discriminator is the value itself:
 *
 * - starts with a single `/` → an internal storefront path, same tab
 * - `http://` or `https://`  → off-site, new tab
 * - anything else            → not a destination we will render
 *
 * That last rule is the security seam. `//evil.com` starts with a slash and is
 * *not* internal, and `javascript:` is a live XSS vector the moment it reaches
 * an anchor's href. Both are rejected here rather than at the render site, so
 * the storefront's mirror of this rule has one thing to check.
 *
 * Category and brand destinations are stored as resolved paths, not slugs,
 * which means the storefront needs no vocabulary at all: it renders what it is
 * given. The cost is that renaming the catalog's query params would strand
 * saved links, which is why `CATALOG_PARAM` below is the one place they appear.
 */

/** Which kind of destination the editor is currently authoring. */
export type DestinationKind =
  | "none"
  | "product"
  | "category"
  | "brand"
  | "page"
  | "external";

/**
 * The storefront's catalog route and its filter keys, mirrored from
 * `blessingcomputers/src/features/catalog/lib/catalog-filter-config.ts`. Two
 * repos, one contract; changing a key there is a data migration here.
 */
const CATALOG_PATH = "/product";
const CATALOG_PARAM = { category: "category", brand: "brand", page: "page" };

export function buildCategoryPath(slug: string): string {
  return `${CATALOG_PATH}?${CATALOG_PARAM.page}=1&${CATALOG_PARAM.category}=${encodeURIComponent(slug)}`;
}

export function buildBrandPath(slug: string): string {
  return `${CATALOG_PATH}?${CATALOG_PARAM.page}=1&${CATALOG_PARAM.brand}=${encodeURIComponent(slug)}`;
}

// Quick picks for "page" mode used to live here as a hardcoded array, and went
// stale the first time the storefront shipped a page nobody mirrored across.
// They now come from the storefront at runtime: `lib/storefront-pages.ts` holds
// the outage fallback, `api/storefront-pages.client.ts` does the fetch.

/** An internal path: one leading slash, and not a protocol-relative host. */
export function isInternalPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

/** An off-site URL we are willing to put in an href. */
export function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Whether a stored `externalUrl` is renderable at all. Anything that is neither
 * an internal path nor an http(s) URL is treated as no link rather than being
 * handed to an anchor.
 */
export function isSafeDestination(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && (isInternalPath(v) || isExternalUrl(v));
}

/**
 * Accept what staff actually paste. A full storefront URL becomes the path it
 * names (so copying an address out of the browser works), a path typed without
 * its slash gains one, and an off-site URL is left alone.
 *
 * `storefrontOrigin` is optional because it is only known from configuration.
 * Without it the full-URL case is not recognised and the value stays external,
 * which is a worse link rather than a broken one.
 */
export function normalizeDestination(
  raw: string,
  storefrontOrigin?: string,
): string {
  const value = raw.trim();
  if (!value) return "";
  if (isExternalUrl(value)) {
    if (storefrontOrigin) {
      try {
        const url = new URL(value);
        const origin = new URL(storefrontOrigin);
        if (url.host === origin.host) {
          return `${url.pathname}${url.search}${url.hash}`;
        }
      } catch {
        // Unparseable origin or URL: leave the value as typed.
      }
    }
    return value;
  }
  // Left as-is on purpose: validation rejects it rather than rewriting a
  // protocol-relative host into something that looks internal.
  if (value.startsWith("/")) return value;
  // A path typed without its slash. Only rescue what cannot be a bare host —
  // "example.com/x" is far likelier a forgotten "https://" than a path.
  return value.includes(".") ? value : `/${value}`;
}

/**
 * The two link columns as they will be written. They are mutually exclusive by
 * construction here, so no caller has to remember the precedence rule.
 */
export interface SlideLinkColumns {
  productSlug: string | null;
  externalUrl: string | null;
}

export interface ParsedDestination {
  kind: DestinationKind;
  /** Category or brand slug, for those two kinds. */
  slug: string | null;
  /** The raw stored path or URL, for `page` and `external`. */
  value: string;
}

/**
 * Read stored columns back into the mode the editor should open in.
 *
 * This is what keeps the encoding invisible to staff: a slide saved as "a
 * category" reopens on the category tab with that category selected, not as a
 * URL they have to decode by eye. An internal path matching neither the
 * category nor the brand shape falls through to `page`, the mode that can
 * represent anything.
 */
export function parseDestination(columns: SlideLinkColumns): ParsedDestination {
  if (columns.productSlug) {
    return { kind: "product", slug: columns.productSlug, value: "" };
  }
  const value = (columns.externalUrl ?? "").trim();
  if (!value) return { kind: "none", slug: null, value: "" };

  if (isInternalPath(value)) {
    const [path, query = ""] = value.split("?");
    if (path === CATALOG_PATH && query) {
      const params = new URLSearchParams(query);
      const category = params.get(CATALOG_PARAM.category);
      if (category) return { kind: "category", slug: category, value };
      const brand = params.get(CATALOG_PARAM.brand);
      if (brand) return { kind: "brand", slug: brand, value };
    }
    return { kind: "page", slug: null, value };
  }
  return { kind: "external", slug: null, value };
}

/**
 * Why a destination cannot be saved, or null when it can. `none` is always
 * valid — a decorative slide is a legitimate slide, and most banners are one.
 */
export function validateDestination(
  kind: DestinationKind,
  columns: SlideLinkColumns,
): string | null {
  if (kind === "none") return null;
  if (kind === "product") {
    return columns.productSlug ? null : "Pick a product, or choose No link.";
  }
  const value = (columns.externalUrl ?? "").trim();
  if (!value) {
    if (kind === "category") return "Pick a category, or choose No link.";
    if (kind === "brand") return "Pick a brand, or choose No link.";
    if (kind === "page") return "Enter a page path, or choose No link.";
    return "Enter a URL, or choose No link.";
  }
  if (kind === "external") {
    return isExternalUrl(value)
      ? null
      : "External links must start with http:// or https://.";
  }
  if (value.startsWith("//")) {
    return 'A page path starts with a single "/" — "//" points at another site.';
  }
  if (!isInternalPath(value)) {
    return 'A page on this site starts with "/", for example /product?page=1.';
  }
  return null;
}
