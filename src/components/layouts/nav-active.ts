/**
 * Is `href` the route currently open? Compares against the path only —
 * `usePathname()` strips the query/hash, but hrefs may carry them (e.g.
 * `/catalogues?page=1`). `/` is matched exactly: every path starts with it, so
 * the prefix test would light up the dashboard row on every screen.
 */
export function isPathActive(pathname: string, href: string): boolean {
  const hrefPath = href.split(/[?#]/)[0];
  if (hrefPath === "/") return pathname === "/";
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

/** Does one of a parent's children own the current route? */
export function holdsCurrentPage(
  pathname: string,
  children: { href?: string }[],
): boolean {
  return children.some((child) => !!child.href && isPathActive(pathname, child.href));
}
