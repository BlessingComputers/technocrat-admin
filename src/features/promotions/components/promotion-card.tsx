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

export function PromotionCard({ promotion }: { promotion: Promotion }) {
  const [confirmAction, setConfirmAction] = useState<"delete" | null>(null);
  const publish = usePublishPromotion(promotion.id);
  const archive = useArchivePromotion(promotion.id);
  const deletePromotion = useDeletePromotion();

  const thumb = promotion.slides[0]?.imageUrl;
  const window = formatWindow(promotion);

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
    <Card className="group overflow-hidden rounded-xl border border-border p-0 gap-0">
      <Link
        href={`/socials/${promotion.id}`}
        className="relative block aspect-video w-full bg-muted"
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
        <div className="absolute top-2 left-2">
          <PromotionStatusBadge status={promotion.status} />
        </div>
      </Link>

      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <Link
            href={`/socials/${promotion.id}`}
            className="block truncate text-sm font-black text-foreground hover:text-primary"
          >
            {promotion.title}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <AppIcon icon="solar:gallery-wide-linear" className="size-3.5" />
            {promotion.slides.length}{" "}
            {promotion.slides.length === 1 ? "slide" : "slides"}
            {window && (
              <>
                <span aria-hidden="true">·</span>
                {window}
              </>
            )}
          </p>
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
                <DropdownMenuItem onClick={handlePublish} disabled={publish.isPending}>
                  <AppIcon icon="solar:check-circle-linear" className="size-4" />
                  Publish
                </DropdownMenuItem>
              )}
              {promotion.status !== "ARCHIVED" && (
                <DropdownMenuItem onClick={handleArchive} disabled={archive.isPending}>
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
                <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
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
