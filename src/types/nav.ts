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
 */
export interface NavItem {
  title: string;
  href: string;
  /** Iconify Solar name, linear variant — shown when inactive. */
  icon: string;
  /** Iconify Solar name, bold variant — shown when active. */
  iconActive: string;
  /** Permission groups needed (at least one match grants access). Omit for unrestricted. */
  requiredPermissions?: string[];
  /**
   * Restricts the item to SUPER_ADMIN, independent of `requiredPermissions` —
   * for surfaces gated by role rather than an RBAC permission group (e.g.
   * Payments, where the backend's `/admin/transactions` and `/payments/*`
   * mutation routes are role-checked, not permission-checked).
   */
  superAdminOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}
