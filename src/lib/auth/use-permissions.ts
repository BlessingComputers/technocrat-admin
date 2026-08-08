"use client";

import { useStaffSession } from "@/lib/auth/session-context";
import {
  hasAnyPermissionInGroup,
  hasPermission,
  isSuperAdmin,
} from "@/lib/auth/permissions";

/**
 * Presentation-gating hook (ADR-0001). Binds the pure permission helpers to the
 * current staff session so UI can decide what to *show*. This is UX only — never
 * a security boundary; the backend's 403 is the sole authority.
 *
 * `isSuperAdmin` short-circuits every check (super admins see all affordances),
 * mirroring `filterNavByPermissions`.
 */
export function usePermissions() {
  const { staffSession } = useStaffSession();
  const permissions = staffSession?.permissions ?? [];
  const superAdmin = isSuperAdmin(staffSession);

  return {
    /** True if the user has the exact permission (e.g. "orders:write"). */
    can: (permissionName: string) =>
      superAdmin || hasPermission(permissions, permissionName),
    /** True if the user has any permission within one of the groups. */
    canAnyInGroup: (groups: string[]) =>
      superAdmin || hasAnyPermissionInGroup(permissions, groups),
    isSuperAdmin: superAdmin,
    session: staffSession,
  };
}
