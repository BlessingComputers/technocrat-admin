"use client";

import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";

/**
 * Gates the whole Monitor section at SUPER_ADMIN — every `/monitor/*` route is
 * SUPER_ADMIN-only on the backend (own Mongo logging DB, not RBAC-permissioned),
 * same reasoning as `PaymentsAccessGate`. Presentation gating only (ADR-0001);
 * the backend's 403 is the real boundary.
 */
export function MonitorAccessGate({ children }: { children: ReactNode }) {
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
          Monitor is restricted
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          This section is limited to Super Admins. Ask a Super Admin if you
          need to look into a request or an incident.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
