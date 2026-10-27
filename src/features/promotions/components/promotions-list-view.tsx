"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGate } from "@/lib/auth/permission-gate";
import { getErrorMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils/cn";
import { useReorderPromotions, usePromotions } from "../api/promotions.queries";
import {
  DENSITY_THRESHOLD,
  GROUP_LABEL,
  GROUP_ORDER,
  PLACEMENTS,
  PLACEMENTS_BY_GROUP,
  TEMPLATE_LABEL,
  UNPLACED_LABEL,
  type PlacementGroup,
  type PlacementKey,
} from "../constants/placements";
import { groupByPlacement, reorderWithin } from "../utils/promotion-grouping";
import { PromotionCard } from "./promotion-card";
import type { Promotion } from "../types/promotions";

export function PromotionsListView() {
  const { data, isLoading, isError, refetch } = usePromotions({ limit: 100 });
  const reorder = useReorderPromotions();
  const promotions = useMemo(() => data?.data ?? [], [data]);

  /**
   * The dragged order, held locally for as long as the write is in flight so
   * the cards do not snap back to the server's answer and then forward again.
   * Cleared once the list refetches.
   */
  const [draft, setDraft] = useState<Promotion[] | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const effective = draft ?? promotions;
  const grouped = useMemo(() => groupByPlacement(effective), [effective]);

  const applyMove = (targetPlacement: PlacementKey, targetIndex: number) => {
    if (!draggedId) return;
    const result = reorderWithin(effective, draggedId, targetPlacement, targetIndex);
    setDraggedId(null);
    if (!result) return;

    setDraft(result.promotions);
    const promise = reorder.mutateAsync(result.entries);
    toast.promise(promise, {
      loading: "Reordering…",
      success: "Order saved.",
      error: (err) => getErrorMessage(err, "Failed to save the new order."),
    });
    promise.catch(() => {}).finally(() => setDraft(null));
  };

  return (
    <div>
      <PageHeader
        title="Promotions"
        description="Banner campaigns across the storefront. Create one, pick its slot, upload the slides, then publish."
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
            Create one, choose which slot it fills, upload its banner images,
            then publish — it appears on the storefront within a few minutes.
          </p>
        </Card>
      )}

      {!isLoading && !isError && promotions.length > 0 && (
        <div className="space-y-10">
          {GROUP_ORDER.map((group) => {
            const slots = PLACEMENTS_BY_GROUP[group].filter(
              (key) => (grouped.placed[key]?.length ?? 0) > 0,
            );
            if (slots.length === 0) return null;
            return (
              <section key={group} className="space-y-5">
                <SurfaceHeader
                  group={group}
                  promotions={PLACEMENTS_BY_GROUP[group].flatMap(
                    (key) => grouped.placed[key] ?? [],
                  )}
                />
                {slots.map((key) => (
                  <SlotGroup
                    key={key}
                    placement={key}
                    promotions={grouped.placed[key] ?? []}
                    draggedId={draggedId}
                    onDragStart={setDraggedId}
                    onDropAt={(index) => applyMove(key, index)}
                  />
                ))}
              </section>
            );
          })}

          {grouped.unplaced.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-ink">
                <AppIcon
                  icon="solar:danger-circle-bold"
                  className="mt-0.5 size-5 shrink-0"
                />
                <div>
                  <p className="font-semibold">
                    {UNPLACED_LABEL} ({grouped.unplaced.length})
                  </p>
                  <p className="mt-0.5 text-xs">
                    These sit in a slot the storefront no longer has, so they
                    show nowhere. Open each one and pick a slot.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.unplaced.map((promotion) => (
                  <PromotionCard
                    key={promotion.id}
                    promotion={promotion}
                    showPlacement
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A surface, with the density warning from §2.17. It counts what is actually
 * live — a draft banner competes with nothing — and it counts across the whole
 * page rather than per slot, because the cost being named is that banners
 * compete with each other, not that one slot is busy.
 *
 * Nothing is blocked or hidden. The judgement stays with the person
 * merchandising.
 */
function SurfaceHeader({
  group,
  promotions,
}: {
  group: PlacementGroup;
  promotions: Promotion[];
}) {
  const live = promotions.filter((p) => p.status === "PUBLISHED").length;
  const threshold = DENSITY_THRESHOLD[group];
  const isDense = live > threshold;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
      <h2 className="text-base font-semibold text-foreground">
        {GROUP_LABEL[group]}
      </h2>
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs",
          isDense ? "text-warning-ink" : "text-muted-foreground",
        )}
      >
        {isDense && (
          <AppIcon icon="solar:danger-triangle-linear" className="size-3.5" />
        )}
        {live} live
        {isDense &&
          ` · more than the ${threshold} recommended here — banners start competing with each other`}
      </p>
    </div>
  );
}

function SlotGroup({
  placement,
  promotions,
  draggedId,
  onDragStart,
  onDropAt,
}: {
  placement: PlacementKey;
  promotions: Promotion[];
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDropAt: (index: number) => void;
}) {
  const spec = PLACEMENTS[placement];
  const isDragging = draggedId !== null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">{spec.label}</h3>
        <span className="text-xs text-muted-foreground">
          {TEMPLATE_LABEL[spec.template]} · {promotions.length}
        </span>
        {promotions.length > 1 && (
          <span className="text-xs text-muted-foreground italic">
            drag to reorder
          </span>
        )}
      </div>

      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        // Dropping on the group's own padding, rather than on a card, appends.
        onDragOver={(e) => isDragging && e.preventDefault()}
        onDrop={() => isDragging && onDropAt(promotions.length)}
      >
        {promotions.map((promotion, index) => (
          <div
            key={promotion.id}
            draggable
            onDragStart={() => onDragStart(promotion.id)}
            onDragOver={(e) => isDragging && e.preventDefault()}
            onDrop={(e) => {
              // Without this the group's own handler fires too and appends.
              e.stopPropagation();
              onDropAt(index);
            }}
            className={cn(
              "cursor-grab rounded-xl transition-opacity active:cursor-grabbing",
              draggedId === promotion.id && "opacity-40",
            )}
          >
            <PromotionCard
              promotion={promotion}
              rank={promotions.length > 1 ? index + 1 : undefined}
            />
          </div>
        ))}
      </div>
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
