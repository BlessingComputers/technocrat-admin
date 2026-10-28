"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { PermissionGate } from "@/lib/auth/permission-gate";
import { getErrorMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useArchivePromotion,
  useDeletePromotion,
  usePublishPromotion,
} from "../api/promotions.queries";
import {
  TEMPLATES,
  TEMPLATE_LABEL,
  placementLabel,
  templateFor,
} from "../constants/placements";
import { PromotionStatusBadge } from "./promotion-status-badge";
import type { Promotion } from "../types/promotions";

function formatWindow(promotion: Promotion): string | null {
  if (!promotion.startAt && !promotion.endAt) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  if (promotion.startAt && promotion.endAt) {
    return `${fmt(promotion.startAt)} – ${fmt(promotion.endAt)}`;
  }
  if (promotion.startAt) return `From ${fmt(promotion.startAt)}`;
  return `Until ${fmt(promotion.endAt!)}`;
}

export function PromotionCard({
  promotion,
  /**
   * The grouped list puts the slot name in the group header, so repeating it on
   * every card is noise. Set this where a card appears outside its group.
   */
  showPlacement = false,
  /** 1-based rank inside its slot, shown only when a slot holds more than one. */
  rank,
}: {
  promotion: Promotion;
  showPlacement?: boolean;
  rank?: number;
}) {
  const [confirmAction, setConfirmAction] = useState<"delete" | null>(null);
  const publish = usePublishPromotion(promotion.id);
  const archive = useArchivePromotion(promotion.id);
  const deletePromotion = useDeletePromotion();

  const thumb = promotion.slides[0]?.imageUrl;
  const window = formatWindow(promotion);
  const template = templateFor(promotion.placement);
  const desktopSize = template ? TEMPLATES[template].desktop : null;

  /**
   * "Is this finished?" — a slide with no mobile file is not broken, but its
   * desktop art gets CSS-cropped on a phone (§7). Only counted on templates
   * that take a second file at all; `tile` never does.
   */
  const takesMobile = template ? TEMPLATES[template].mobile !== null : false;
  const missingMobile = takesMobile
    ? promotion.slides.filter((s) => !s.mobileImageUrl).length
    : 0;

  const handlePublish = () => {
    const promise = publish.mutateAsync();
    toast.promise(promise, {
      loading: "Publishing…",
      success: "Promotion published.",
      error: (err) => getErrorMessage(err, "Failed to publish promotion."),
    });
  };

  const handleArchive = () => {
    const promise = archive.mutateAsync();
    toast.promise(promise, {
      loading: "Archiving…",
      success: "Promotion archived.",
      error: (err) => getErrorMessage(err, "Failed to archive promotion."),
    });
  };

  const handleDelete = () => {
    const promise = deletePromotion.mutateAsync(promotion.id);
    toast.promise(promise, {
      loading: "Deleting…",
      success: "Promotion deleted.",
      error: (err) => getErrorMessage(err, "Failed to delete promotion."),
    });
    promise.catch(() => {}).finally(() => setConfirmAction(null));
  };

  return (
    <Card className="group overflow-hidden p-0 gap-0">
      <Link
        href={`/socials/${promotion.id}`}
        // At the template's real ratio, so a `band` card does not promise a
        // 16:9 frame that the storefront then crops to 12:5.
        style={{
          aspectRatio: desktopSize
            ? `${desktopSize.w} / ${desktopSize.h}`
            : "16 / 9",
        }}
        className="relative block w-full bg-muted"
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <AppIcon icon="solar:gallery-linear" className="size-8" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5">
          <PromotionStatusBadge status={promotion.status} />
          {promotion.isFallback && (
            <span
              className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white"
              title="Shows only when no other campaign is live in this slot"
            >
              <AppIcon icon="solar:shield-check-linear" className="size-3" />
              Fallback
            </span>
          )}
        </div>
        {rank !== undefined && (
          <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            #{rank}
          </span>
        )}
      </Link>

      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/socials/${promotion.id}`}
            className="block truncate text-sm font-semibold text-foreground hover:text-primary-ink"
          >
            {promotion.title}
          </Link>

          {showPlacement && (
            <p className="truncate text-xs text-muted-foreground">
              {placementLabel(promotion.placement)}
            </p>
          )}

          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <AppIcon icon="solar:gallery-wide-linear" className="size-3.5" />
            {promotion.slides.length}{" "}
            {promotion.slides.length === 1 ? "slide" : "slides"}
            {template && (
              <>
                <span aria-hidden="true">·</span>
                {TEMPLATE_LABEL[template]}
              </>
            )}
            {window && (
              <>
                <span aria-hidden="true">·</span>
                {window}
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            {promotion.targetCategorySlug && (
              <span
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                title="Only shows on pages in this category"
              >
                <AppIcon icon="solar:widget-linear" className="size-3" />
                {promotion.targetCategorySlug}
              </span>
            )}
            {missingMobile > 0 && (
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  "bg-warning/15 text-warning-ink",
                )}
                title="These slides fall back to the desktop image on phones, cropped"
              >
                <AppIcon
                  icon="solar:smartphone-update-linear"
                  className="size-3"
                />
                {missingMobile} without mobile art
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={`Actions for ${promotion.title}`}
            >
              <AppIcon icon="solar:menu-dots-bold" className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/socials/${promotion.id}`}>
                <AppIcon icon="solar:pen-linear" className="size-4" />
                Manage
              </Link>
            </DropdownMenuItem>
            <PermissionGate permission="promotions:publish">
              {promotion.status !== "PUBLISHED" && (
                <DropdownMenuItem
                  onClick={handlePublish}
                  disabled={publish.isPending}
                >
                  <AppIcon icon="solar:check-circle-linear" className="size-4" />
                  Publish
                </DropdownMenuItem>
              )}
              {promotion.status !== "ARCHIVED" && (
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={archive.isPending}
                >
                  <AppIcon icon="solar:archive-linear" className="size-4" />
                  Archive
                </DropdownMenuItem>
              )}
            </PermissionGate>
            <PermissionGate permission="promotions:delete">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmAction("delete")}
              >
                <AppIcon
                  icon="solar:trash-bin-trash-linear"
                  className="size-4"
                />
                Delete
              </DropdownMenuItem>
            </PermissionGate>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmModal
        isOpen={confirmAction === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleDelete}
        title="Delete this promotion?"
        description="This permanently deletes the promotion and all its slides, including the images. This can't be undone."
        confirmText="Delete Promotion"
        variant="destructive"
        isPending={deletePromotion.isPending}
      />
    </Card>
  );
}
