"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/lib/auth/use-permissions";

interface PermissionGateProps {
  children: ReactNode;
  /** Exact permission required, e.g. "orders:write". */
  permission?: string;
  /** Visible if the user has any permission within one of these groups. */
  anyOfGroups?: string[];
  /** Rendered when the user lacks permission. Defaults to nothing. */
  fallback?: ReactNode;
}

/**
 * Hides UI affordances the user lacks permission for — presentation gating only
 * (ADR-0001). A hidden button is a convenience, NOT a security boundary: the
 * action still reaches the backend if invoked, and the backend's 403 is the
 * authority. Do not add server-side permission checks to "back this up".
 *
 * With no `permission`/`anyOfGroups` constraint, children always render.
 * Super admins bypass all checks (via `usePermissions`).
 */
export function PermissionGate({
  children,
  permission,
  anyOfGroups,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAnyInGroup } = usePermissions();

  let allowed = true;
  if (permission) allowed = allowed && can(permission);
  if (anyOfGroups) allowed = allowed && canAnyInGroup(anyOfGroups);

  return <>{allowed ? children : fallback}</>;
}
