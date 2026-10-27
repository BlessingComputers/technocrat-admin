/**
 * The storefront pages a promotion banner may link to.
 *
 * Lives in `lib/` rather than inside the promotions feature because two layers
 * need it: the route handler at `app/api/admin/storefront-pages` that fetches
 * the real list, and the slide editor in `features/promotions` that renders it.
 */

/** One quick pick in the slide editor's "page" mode. */
export interface StorefrontPage {
  path: string;
  label: string;
  /** The storefront nav's one-liner, where the page has one. */
  description?: string;
}

/**
 * What the editor shows when the storefront cannot be reached.
 *
 * **This is not the source of truth, and should not be edited when a page
 * ships.** The real answer comes from the storefront itself over
 * `/api/admin/storefront-pages`, which derives it from that app's own build.
 * This array is the degraded case: `STOREFRONT_URL` unset, or the storefront
 * down.
 *
 * It exists so a manager can still point a banner at Home during an outage, not
 * because anyone should maintain it. It is deliberately *stale-tolerant* —
 * every path here has been live for months, so it ages slowly. `/preorders` was
 * added on 2026-09-01 only to close the gap that exposed the problem: the page
 * had shipped on the storefront and this list, being the only list, never
 * learnt about it.
 */
export const FALLBACK_STOREFRONT_PAGES: StorefrontPage[] = [
  { path: "/", label: "Home" },
  { path: "/product?page=1", label: "All products" },
  { path: "/parts", label: "Parts catalog" },
  { path: "/preorders", label: "Pre-orders" },
  { path: "/about", label: "About us" },
  { path: "/support", label: "Support" },
  { path: "/contact", label: "Contact" },
  { path: "/locations", label: "Locations" },
  { path: "/enterprise", label: "Enterprise" },
  { path: "/partners", label: "Partners" },
  { path: "/blog", label: "Blog" },
];
