"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { usePermissions } from "@/lib/auth/use-permissions";

import { FxCoverageCard } from "./fx-coverage-card";
import { FxHistory } from "./fx-history";
import { FxLinkForm } from "./fx-link-form";
import { FxStandingLinks } from "./fx-standing-links";

/**
 * `/pricing/fx`: which items follow the dollar (ask 45). Reads need
 * `products:read`; the link tool and standing-link delete are SUPER_ADMIN
 * only, so they are hidden from everyone else. The backend's 403 is the real
 * boundary; this only decides what to show.
 *
 * Not here yet: FX settings, preview, approve/reject, manual rate and
 * rollback. The backend has them; this screen covers visibility first.
 */
export function FxWorkspaceView() {
  const { can, isSuperAdmin } = usePermissions();

  if (!can("products:read")) {
    return (
      <Card className="items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AppIcon icon="solar:lock-keyhole-minimalistic-linear" className="size-7" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            No access to dollar pricing
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This screen needs the <code className="font-mono">products:read</code>{" "}
            permission. Ask a super admin to grant it.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <FxCoverageCard />
      {isSuperAdmin ? (
        <FxLinkForm />
      ) : (
        <p className="text-sm text-muted-foreground">
          Only a super admin can link or unlink items.
        </p>
      )}
      <FxStandingLinks canDelete={isSuperAdmin} />
      <FxHistory />
    </div>
  );
}
