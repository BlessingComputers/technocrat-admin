import type { NavGroup } from "@/types/nav";
import type { HelpDoc } from "@/types/help";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface UserPermission {
  id: string;
  name: string; // e.g. "products:read"
  group?: string; // e.g. "products"
}

export interface StaffSession {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: { id: string; name: string };
  permissions: UserPermission[];
  avatarUrl?: string | null;
}

// ──────────────────────────────────────────────
// Permission checks (presentation gating — see ADR-0001)
// ──────────────────────────────────────────────

const SUPER_ADMIN = "SUPER_ADMIN";

/**
 * Returns true if the user is a super admin (bypasses all nav filtering).
 *
 * Accepts a match on EITHER `role.id` or `role.name`. `get-server-session`
 * populates `role.id` from the backend's `data.role` and `role.name` from
 * `customRole.name`, and which field carries "SUPER_ADMIN" depends on the
 * backend's role representation — so we accept either rather than re-introduce
 * the old `role.id`-only bug that a `customRole`-named super admin failed.
 *
 * TODO(codegen): once the OpenAPI StaffProfile schema lands (ADR-0006), pin
 * this to the single canonical field.
 */
export function isSuperAdmin(session: StaffSession | null): boolean {
  if (!session?.role) return false;
  return session.role.id === SUPER_ADMIN || session.role.name === SUPER_ADMIN;
}

/**
 * Returns true if the user has at least one permission whose `group`
 * matches one of the provided groups.
 *
 * Example:
 *   hasAnyPermissionInGroup(permissions, ["products"])
 *   → true if the user has "products:read", "products:write", etc.
 */
export function hasAnyPermissionInGroup(
  permissions: UserPermission[],
  groups: string[],
): boolean {
  return permissions.some((p) => {
    const group = p.group || p.name.split(":")[0];
    return groups.includes(group);
  });
}

/**
 * Returns true if the user has an exact permission by name.
 * Useful for action-level affordance gating (e.g. "products:write").
 */
export function hasPermission(
  permissions: UserPermission[],
  permissionName: string,
): boolean {
  return permissions.some((p) => p.name === permissionName);
}

// ──────────────────────────────────────────────
// Sidebar filtering
// ──────────────────────────────────────────────

/**
 * Filters nav groups and their items based on the user's permissions.
 *
 * - Items without `requiredPermissions` are always visible.
 * - Items with `requiredPermissions` require at least one matching group.
 * - Empty groups (all items filtered out) are hidden entirely.
 * - SUPER_ADMIN bypasses all filtering.
 */
export function filterNavByPermissions(
  navGroups: NavGroup[],
  session: StaffSession | null,
): NavGroup[] {
  const superAdmin = isSuperAdmin(session);
  if (superAdmin) return navGroups;

  const permissions = session?.permissions || [];

  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.superAdminOnly) return false;
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
          return true;
        }
        return hasAnyPermissionInGroup(permissions, item.requiredPermissions);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

// ──────────────────────────────────────────────
// Help-center relevance (ADR-0011)
// ──────────────────────────────────────────────

/**
 * Filters help docs to those relevant to the viewer, using the same rule as the
 * sidebar: a doc with no `requiredPermissions` shows for everyone; otherwise the
 * user needs at least one matching permission group; SUPER_ADMIN sees all.
 *
 * This is presentation *relevance*, not access control (ADR-0001) — help content
 * isn't sensitive and the routes stay reachable. Powers both the `/help` hub and
 * the topbar Help dropdown so, e.g., a sales agent isn't shown RBAC-admin guides.
 */
export function filterHelpDocsByPermissions(
  docs: HelpDoc[],
  session: StaffSession | null,
): HelpDoc[] {
  if (isSuperAdmin(session)) return docs;

  const permissions = session?.permissions || [];

  return docs.filter((doc) => {
    if (!doc.requiredPermissions || doc.requiredPermissions.length === 0) {
      return true;
    }
    return hasAnyPermissionInGroup(permissions, doc.requiredPermissions);
  });
}
