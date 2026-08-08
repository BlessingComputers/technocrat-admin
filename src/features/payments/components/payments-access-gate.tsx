"use client";

import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";

/**
 * Gates the entire Payments section at SUPER_ADMIN — no split between reads
 * and mutations. `/admin/transactions*` (the list/detail data) stays
 * SUPER_ADMIN-only on the backend while `/payments/*` reads are staff-level
 * (BACKEND-CONTRACT-DELTA §5.2); a page half of whose data a plain admin
 * can't see is worse than a clean boundary, so we don't try to show a partial
 * view. This is presentation gating only (ADR-0001) — the backend's 403 is
 * the real boundary; a staff member who reaches this via a stale bookmark or
 * a notification link just sees a clear "not for you" state instead of a
 * silent data failure.
 */
export function PaymentsAccessGate({ children }: { children: ReactNode }) {
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
          Payments is restricted
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          This section is limited to Super Admins. Ask a Super Admin if you
          need to look into a payment.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
