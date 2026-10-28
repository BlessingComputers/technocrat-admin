"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/lib/auth/use-permissions";
import { getErrorMessage } from "@/lib/api/error-message";

import { useCurrentPolicy, usePolicyVersions } from "../api/policy.queries";
import { LegalCurrentCard } from "./legal-current-card";
import { LegalHistoryTable } from "./legal-history-table";
import { LegalPublishDialog } from "./legal-publish-dialog";

/**
 * The `/legal` screen: which policy customers are agreeing to at checkout, the
 * versions that came before it, and the one button that publishes a new one.
 *
 * Read is gated on `policy:versions:read` and publishing on
 * `policy:versions:write` — the backend's 403 is the real boundary, this only
 * decides what to show. Both live in the RBAC `policy` group, which is why the
 * sidebar entry names that group while the screen is called Legal.
 */
export function LegalWorkspaceView() {
  const { can } = usePermissions();
  const [isPublishOpen, setPublishOpen] = useState(false);

  const current = useCurrentPolicy();
  const versions = usePolicyVersions();

  const canRead = can("policy:versions:read");
  const canPublish = can("policy:versions:write");

  if (!canRead) {
    return (
      <Card className="items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AppIcon
            icon="solar:lock-keyhole-minimalistic-linear"
            className="size-7"
          />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            No access to legal policies
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Reading published policy versions needs the{" "}
            <code className="font-mono">policy:versions:read</code> permission.
            Ask a super admin to grant it.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Legal"
        description="The purchase and customer policy customers accept at checkout."
      />

      <div className="space-y-6">
        {current.isLoading ? (
          <Card className="gap-4 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </Card>
        ) : current.isError ? (
          <Card className="items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
              <AppIcon icon="solar:danger-circle-linear" className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {getErrorMessage(
                current.error,
                "Couldn’t load the current policy.",
              )}
            </p>
            <Button variant="outline" onClick={() => current.refetch()}>
              Retry
            </Button>
          </Card>
        ) : (
          <LegalCurrentCard
            current={current.data ?? null}
            canPublish={canPublish}
            onPublish={() => setPublishOpen(true)}
          />
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Published versions
            </h2>
            <p className="text-sm text-muted-foreground">
              Kept for every order that recorded them. Nothing here is edited or
              removed after publishing.
            </p>
          </div>

          <LegalHistoryTable
            versions={versions.data}
            isLoading={versions.isLoading}
          />
        </section>
      </div>

      <LegalPublishDialog
        open={isPublishOpen}
        onOpenChange={setPublishOpen}
        current={current.data ?? null}
      />
    </div>
  );
}
