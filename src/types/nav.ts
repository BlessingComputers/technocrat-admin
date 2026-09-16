/**
 * Sidebar navigation contract. Cross-cutting: `config/nav.ts` provides the data,
 * `lib/auth/permissions.ts` filters it, and `components/layouts/sidebar.tsx`
 * renders it — so it lives in `types/`, not in any one of them.
 *
 * `icon`/`iconActive` are Iconify name strings (Solar set), not component refs:
 * the nav config flows from the (staff) layout to the client sidebar as props,
 * which must be serializable, and `types`/`config` stay free of component refs.
 * `icon` is the linear (inactive) glyph, `iconActive` the bold (active) one
 * (ADR-0009). The sidebar renders them via `<AppIcon>`.
 *
 * Two levels, no more. A parent groups real routes (Pricing → Markup / Deals /
 * Tax); it is not itself a route, and its children are not tabs.
 */
export interface NavItem {
  title: string;
  /**
   * Root-relative route. Omitted on a parent that only groups `children` — such
   * a row navigates nowhere, it opens its child list.
   */
  href?: string;
  /** Iconify Solar name, linear variant — shown when inactive. */
  icon: string;
  /** Iconify Solar name, bold variant — shown when active. */
  iconActive: string;
  /** Permission groups needed (at least one match grants access). Omit for unrestricted. */
  requiredPermissions?: string[];
  /**
   * A single exact permission name (e.g. `tax:manage`), for surfaces whose
   * backend gate is one named permission rather than a whole group. Checked in
   * addition to `requiredPermissions` when both are present.
   */
  requiredPermission?: string;
  /**
   * Restricts the item to SUPER_ADMIN, independent of `requiredPermissions` —
   * for surfaces gated by role rather than an RBAC permission group (e.g.
   * Payments' transactions, where the backend's `/admin/transactions` and
   * `/payments/*` mutation routes are role-checked, not permission-checked).
   */
  superAdminOnly?: boolean;
  /**
   * Nested routes. A parent renders only when at least one child survives
   * permission filtering — never as a dead row over an empty list.
   */
  children?: NavItem[];
}

export interface NavGroup {
  /**
   * Section heading, uppercased by the sidebar. Omitted for a group that needs
   * no heading — the lone Overview row at the top of the rail.
   */
  label?: string;
  items: NavItem[];
}
