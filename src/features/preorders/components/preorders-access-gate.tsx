"use client";

import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/lib/auth/use-permissions";
import { PREORDER_PERMISSIONS } from "../constants/preorder-permissions";

/** The backend remains the security boundary. This gate avoids dead-end reads. */
export function PreordersAccessGate({ children }: { children: ReactNode }) {
  const { can, session, isLoading } = usePermissions();

  if (isLoading && !session) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!can(PREORDER_PERMISSIONS.read)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-3 text-center">
        <AppIcon
          icon="solar:shield-cross-linear"
          className="size-12 text-muted-foreground/40"
        />
        <h2 className="text-lg font-semibold text-foreground">
          Pre-orders is restricted
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your role does not include permission to view pre-orders. Ask a role
          manager for preorders:read access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
