"use client";

import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";

/**
 * Gates coupons at SUPER_ADMIN.
 *
 * Not a product choice — both coupon routes sit under the backend's
 * consolidated admin router, which applies `requireRole('SUPER_ADMIN')` with a
 * blanket `router.use()`. There is no RBAC group to gate on, which is why the
 * nav entry uses `superAdminOnly` rather than `requiredPermissions`. (The
 * backend does seed `coupons:read` / `coupons:manage` permissions, but nothing
 * on these routes consults them.)
 *
 * Presentation gating only (ADR-0001) — the backend's 403 is the real
 * boundary. This just means a staff member on a stale bookmark reads a clear
 * "not for you" instead of watching an empty table fail to load.
 */
export function CouponsAccessGate({ children }: { children: ReactNode }) {
  const { staffSession, isLoading } = useStaffSession();

  if (isLoading && !staffSession) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!isSuperAdmin(staffSession)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-3">
        <AppIcon
          icon="solar:shield-cross-linear"
          className="w-12 h-12 text-muted-foreground/40"
        />
        <h2 className="text-lg font-semibold text-foreground">
          Coupons are restricted
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Only Super Admins can mint or stop discount codes. Ask one to set a
          code up for you.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
