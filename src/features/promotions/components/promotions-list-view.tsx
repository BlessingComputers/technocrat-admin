"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGate } from "@/lib/auth/permission-gate";
import { usePromotions } from "../api/promotions.queries";
import { PromotionCard } from "./promotion-card";
import { Card } from "@/components/ui/card";

export function PromotionsListView() {
  const { data, isLoading, isError, refetch } = usePromotions();
  const promotions = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Promotions"
        description="The homepage banner carousel — create a campaign, upload its slides, then publish it."
      >
        <PermissionGate permission="promotions:write">
          <Button asChild>
            <Link href="/socials/new">
              <AppIcon icon="solar:add-circle-linear" className="size-4" />
              New Promotion
            </Link>
          </Button>
        </PermissionGate>
      </PageHeader>

      {isLoading && <PromotionsGridSkeleton />}

      {isError && !isLoading && (
        <Card className="items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
            <AppIcon icon="solar:danger-circle-linear" className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Couldn&apos;t load promotions
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {!isLoading && !isError && promotions.length === 0 && (
        <Card className="items-center justify-center gap-3 border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <AppIcon icon="solar:share-linear" className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No promotions yet
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Create one, upload a few 16:9 banner images, then publish — it
            shows up on the homepage carousel right below the hero.
          </p>
        </Card>
      )}

      {!isLoading && !isError && promotions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promotion) => (
            <PromotionCard key={promotion.id} promotion={promotion} />
          ))}
        </div>
      )}
    </div>
  );
}

function PromotionsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border"
        >
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
