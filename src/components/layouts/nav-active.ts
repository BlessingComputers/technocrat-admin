/**
 * Is `href` the route currently open? Compares against the path only —
 * `usePathname()` strips the query/hash, but hrefs may carry them (e.g.
 * `/catalogues?page=1`). `/` is matched exactly: every path starts with it, so
 * the prefix test would light up the dashboard row on every screen.
 */
export function isPathActive(pathname: string, href: string): boolean {
  const hrefPath = pathOf(href);
  if (hrefPath === "/") return pathname === "/";
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

function pathOf(href: string): string {
  return href.split(/[?#]/)[0];
}

/**
 * The one nav href that owns `pathname`: the longest matching path. Prefix
 * matching alone would light up both "Uploads" (`/uploads`) and "My uploads"
 * (`/uploads/<id>`) on your own page; the most specific link wins instead.
 */
export function currentHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (!isPathActive(pathname, href)) continue;
    if (best === null || pathOf(href).length > pathOf(best).length) best = href;
  }
  return best;
}

/** Does one of a parent's children own the current page? */
export function holdsCurrentPage(
  current: string | null,
  children: { href?: string }[],
): boolean {
  return current !== null && children.some((child) => child.href === current);
}

/** Placeholder in a nav href for the signed-in staff member's id. */
export const ME_SEGMENT = ":me";

interface HrefItem {
  href?: string;
  children?: HrefItem[];
}

/**
 * Fill `ME_SEGMENT` with the staff id. Without a session the personal links
 * have nowhere to point, so they are dropped, and so is a group they leave
 * empty.
 */
export function resolveMeHrefs<G extends { items: I[] }, I extends HrefItem>(
  groups: G[],
  staffId: string | null,
): G[] {
  const resolveItems = <T extends HrefItem>(items: T[]): T[] =>
    items.flatMap((item) => {
      if (item.href?.includes(ME_SEGMENT)) {
        return staffId
          ? [{ ...item, href: item.href.replace(ME_SEGMENT, staffId) }]
          : [];
      }
      return item.children
        ? [{ ...item, children: resolveItems(item.children) }]
        : [item];
    });

  return groups
    .map((group) => ({ ...group, items: resolveItems(group.items) }))
    .filter((group) => group.items.length > 0);
}
