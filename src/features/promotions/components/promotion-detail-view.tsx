"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGate } from "@/lib/auth/permission-gate";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  useArchivePromotion,
  useDeletePromotion,
  usePromotionById,
  usePublishPromotion,
  useUpdatePromotion,
} from "../api/promotions.queries";
import { PromotionForm } from "./promotion-form";
import { PromotionSlideManager } from "./promotion-slide-manager";
import { PromotionStatusBadge } from "./promotion-status-badge";

export function PromotionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: promotion, isLoading, isError, refetch } = usePromotionById(id);
  const updatePromotion = useUpdatePromotion(id);
  const publish = usePublishPromotion(id);
  const archive = useArchivePromotion(id);
  const deletePromotion = useDeletePromotion();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <PromotionDetailSkeleton />;

  if (isError || !promotion) {
    return (
      <Card className="items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
          <AppIcon icon="solar:danger-circle-linear" className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Couldn&apos;t load this promotion
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const handleSave = (values: {
    title: string;
    description?: string;
    startAt?: string | null;
    endAt?: string | null;
  }) => {
    const promise = updatePromotion.mutateAsync(values);
    toast.promise(promise, {
      loading: "Saving…",
      success: "Promotion updated.",
      error: (err) => getErrorMessage(err, "Failed to update promotion."),
    });
  };

  const handlePublish = () => {
    const promise = publish.mutateAsync();
    toast.promise(promise, {
      loading: "Publishing…",
      success: "Promotion published — it's now live on the homepage.",
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
    const promise = deletePromotion.mutateAsync(id);
    toast.promise(promise, {
      loading: "Deleting…",
      success: "Promotion deleted.",
      error: (err) => getErrorMessage(err, "Failed to delete promotion."),
    });
    promise.then(() => router.push("/socials")).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={promotion.title}>
        <PromotionStatusBadge status={promotion.status} />
        <PermissionGate permission="promotions:publish">
          {promotion.status !== "PUBLISHED" && (
            <Button variant="outline" onClick={handlePublish} disabled={publish.isPending}>
              <AppIcon icon="solar:check-circle-linear" className="size-4" />
              Publish
            </Button>
          )}
          {promotion.status !== "ARCHIVED" && (
            <Button variant="outline" onClick={handleArchive} disabled={archive.isPending}>
              <AppIcon icon="solar:archive-linear" className="size-4" />
              Archive
            </Button>
          )}
        </PermissionGate>
        <PermissionGate permission="promotions:delete">
          <Button
            variant="outline"
            className="text-destructive-ink hover:text-destructive-ink"
            onClick={() => setConfirmDelete(true)}
          >
            <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
            Delete
          </Button>
        </PermissionGate>
      </PageHeader>

      {promotion.status === "DRAFT" && promotion.slides.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-ink">
          <AppIcon icon="solar:info-circle-bold" className="size-5 shrink-0" />
          Add at least one slide below before publishing.
        </div>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Details
        </h2>
        <PromotionForm
          promotion={promotion}
          onSubmit={handleSave}
          isPending={updatePromotion.isPending}
          submitLabel="Save changes"
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Slides
        </h2>
        <PromotionSlideManager promotionId={id} slides={promotion.slides} />
      </Card>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this promotion?"
        description="This permanently deletes the promotion and all its slides, including the images. This can't be undone."
        confirmText="Delete Promotion"
        variant="destructive"
        isPending={deletePromotion.isPending}
      />
    </div>
  );
}

function PromotionDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
      <div className="h-48 animate-pulse rounded-lg bg-muted/40" />
    </div>
  );
}
