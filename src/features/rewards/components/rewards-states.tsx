"use client";

import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RewardsLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

export function RewardsError({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void;
}) {
  return (
    <Card className="items-center gap-3 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
        <AppIcon icon="solar:danger-circle-linear" className="size-6" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </Card>
  );
}

/** `/rewards/team` without a `rewards` permission. The backend 403 still guards the data. */
export function RewardsNoAccess() {
  return (
    <Card className="items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <AppIcon icon="solar:lock-keyhole-minimalistic-linear" className="size-7" />
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          No access to team rewards
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This page needs the <code className="font-mono">rewards:pay</code> or{" "}
          <code className="font-mono">rewards:manage</code> permission. Ask a super
          admin to grant it.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/rewards">See my rewards</Link>
      </Button>
    </Card>
  );
}
