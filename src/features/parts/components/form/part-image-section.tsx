"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  useDeletePartImage,
  useUploadPartImages,
  useSetPartPrimaryImage,
} from "../../api/parts.queries";
import type { PartImage, PartImageWithStorage } from "../../types/parts";
import { MetaLabel } from "@/components/shared/meta-label";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (backend rejects larger)
// The multipart create takes all images in one request; the backend caps it at 10.
const MAX_CREATE_IMAGES = 10;

interface PartImageSectionProps {
  partId?: string;
  images?: PartImage[];
  partName: string;
  /**
   * Create mode only (no `partId`): syncs the queued files up to the form so it
   * can upload them first (visible feedback) and attach their urls to the create.
   */
  onPendingChange?: (files: { file: File; isPrimary: boolean }[]) => void;
  /**
   * Create mode only: upload progress driven by the form while it uploads the
   * queued images before create. Renders the same per-card + bar feedback the
   * edit-mode "Upload Now" shows (mirrors the bulk upload).
   */
  uploadProgress?: { completed: number; total: number } | null;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary?: boolean;
}

/**
 * Part image management. Mirrors the product image section, with two parts-only
 * differences: there's no reorder endpoint (existing images can't be dragged —
 * order is fixed at upload), and delete must send `storagePublicId` +
 * `storageProvider`. Those fields aren't on the part image rows yet (backend ask
 * #1b) — read defensively here so deletion works the moment they're returned.
 */
export function PartImageSection({
  partId,
  images,
  partName,
  onPendingChange,
  uploadProgress: externalUploadProgress,
}: PartImageSectionProps) {
  // No part id yet → create mode: images are queued locally and uploaded by the
  // form on save, rather than posted straight to an existing part.
  const isCreateMode = !partId;
  const deleteImage = useDeletePartImage();
  const uploadImages = useUploadPartImages();
  const setPrimary = useSetPartPrimaryImage();

  const [imageToDelete, setImageToDelete] = useState<PartImage | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [editUploadProgress, setEditUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  // Edit mode drives its own progress ("Upload Now"); create mode gets it from
  // the form as it uploads before create. Same render, one source at a time.
  const uploadProgress = externalUploadProgress ?? editUploadProgress;
  const [draggedPendingIndex, setDraggedPendingIndex] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [pendingFiles]);

  // Create mode: keep the form in sync with the queue (in display order, which
  // becomes the images' sortOrder) so it can upload them on save.
  useEffect(() => {
    if (!isCreateMode) return;
    onPendingChange?.(
      pendingFiles.map((f) => ({ file: f.file, isPrimary: !!f.isPrimary })),
    );
  }, [pendingFiles, isCreateMode, onPendingChange]);

  const handleDeleteImage = async () => {
    if (!imageToDelete || !partId) return;
    const img = imageToDelete as PartImageWithStorage;
    const promise = deleteImage.mutateAsync({
      partId,
      imageId: imageToDelete.id,
      body: {
        storagePublicId: img.storagePublicId ?? "",
        storageProvider: img.storageProvider ?? "s3",
      },
    });
    toast.promise(promise, {
      loading: "Deleting image…",
      success: "Image deleted",
      error: (err) => getErrorMessage(err, "Failed to delete image"),
    });
    promise.catch(() => {}).finally(() => setImageToDelete(null));
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!partId) return;
    setSettingPrimaryId(imageId);
    const promise = setPrimary.mutateAsync({ partId, imageId });
    toast.promise(promise, {
      loading: "Setting as primary…",
      success: "Primary image updated",
      error: (err) => getErrorMessage(err, "Failed to set primary image"),
    });
    promise.catch(() => {}).finally(() => setSettingPrimaryId(null));
  };

  const setPendingPrimary = (id: string) =>
    setPendingFiles((prev) => prev.map((f) => ({ ...f, isPrimary: f.id === id })));

  const handleFilesSelected = useCallback(
    (fileList: FileList) => {
      const hasExistingPrimary = images?.some((img) => img.isPrimary) || false;
      const hasPendingPrimary = pendingFiles.some((f) => f.isPrimary);
      let needsPrimary = !hasExistingPrimary && !hasPendingPrimary;

      const newPending: PendingFile[] = [];
      for (const file of Array.from(fileList)) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: only JPEG, PNG, WebP are accepted`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: exceeds the 10 MB limit`);
          continue;
        }
        // Create sends all images in one request, capped at 10 by the backend.
        if (isCreateMode && pendingFiles.length + newPending.length >= MAX_CREATE_IMAGES) {
          toast.error(`You can add up to ${MAX_CREATE_IMAGES} images at once.`);
          break;
        }
        const isPrimary = needsPrimary;
        if (isPrimary) needsPrimary = false;
        newPending.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          isPrimary,
        });
      }
      if (newPending.length) setPendingFiles((prev) => [...prev, ...newPending]);
    },
    [images, pendingFiles, isCreateMode],
  );

  const removePendingFile = (id: string) =>
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const remaining = prev.filter((f) => f.id !== id);
      const hasExistingPrimary = images?.some((img) => img.isPrimary) || false;
      if (target?.isPrimary && remaining.length > 0 && !hasExistingPrimary) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return remaining;
    });

  const clearPendingFiles = () => {
    pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setPendingFiles([]);
  };

  const handleUploadPending = async () => {
    if (pendingFiles.length === 0 || !partId) return;
    const files = pendingFiles.map((pf) => pf.file);
    const primaryIndex = pendingFiles.findIndex((pf) => pf.isPrimary);
    setEditUploadProgress({ completed: 0, total: files.length });
    try {
      const promise = uploadImages.mutateAsync({
        partId,
        files,
        onProgress: (completed, total) =>
          setEditUploadProgress({ completed, total }),
      });
      toast.promise(promise, {
        loading: `Uploading ${files.length} image(s)…`,
        success: `${files.length} image(s) uploaded`,
        error: (err) => getErrorMessage(err, "Failed to upload images"),
      });
      const res = await promise;
      if (primaryIndex !== -1 && res && res.length > primaryIndex) {
        const newPrimaryId = res[primaryIndex]?.id;
        if (newPrimaryId) {
          await setPrimary.mutateAsync({ partId, imageId: newPrimaryId });
        }
      }
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setPendingFiles([]);
    } catch {
      // toast already surfaced the error
    } finally {
      setEditUploadProgress(null);
    }
  };

  const handleDropPending = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPendingIndex === null || draggedPendingIndex === targetIndex) return;
    setPendingFiles((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(draggedPendingIndex, 1);
      updated.splice(targetIndex, 0, dragged);
      return updated;
    });
    setDraggedPendingIndex(null);
  };

  const sortedImages = images
    ? [...images].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const busy = deleteImage.isPending || setPrimary.isPending;

  return (
    <div className="space-y-6 border-t border-border pt-6">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Part Images
        </h3>
        <p className="text-xs text-muted-foreground">
          {partId
            ? "Upload images and choose the primary one"
            : "Add images and choose the primary one — they upload when you save the part"}
        </p>
      </div>

      {/* Existing images */}
      {sortedImages.length > 0 && (
        <div className="space-y-2">
          <MetaLabel className="block">
            Current Images
          </MetaLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {sortedImages.map((img) => {
              const hasPendingPrimary = pendingFiles.some((f) => f.isPrimary);
              const isVisuallyPrimary = img.isPrimary && !hasPendingPrimary;
              return (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.altText ?? partName}
                    className="h-full w-full object-cover"
                  />
                  {isVisuallyPrimary && (
                    <Badge className="absolute left-2 top-2 z-10 h-5 gap-1 text-xs">
                      <AppIcon icon="solar:check-circle-bold" className="size-2.5" />
                      Primary
                    </Badge>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {!isVisuallyPrimary && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        disabled={busy}
                        className="size-8 rounded-md text-warning-ink transition-transform hover:scale-110"
                        onClick={() => handleSetPrimary(img.id)}
                      >
                        <AppIcon
                          icon={
                            setPrimary.isPending && settingPrimaryId === img.id
                              ? "solar:refresh-linear"
                              : "solar:star-bold"
                          }
                          className={
                            setPrimary.isPending && settingPrimaryId === img.id
                              ? "size-3.5 animate-spin"
                              : "size-3.5"
                          }
                        />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      disabled={busy}
                      className="size-8 rounded-md text-destructive-ink transition-transform hover:scale-110"
                      onClick={() => setImageToDelete(img)}
                    >
                      <AppIcon icon="solar:trash-bin-trash-linear" className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending queue */}
      {pendingFiles.length > 0 && (
        <div className="space-y-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppIcon icon="solar:gallery-linear" className="size-4 text-primary-ink" />
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-foreground">
                  Ready to Upload ({pendingFiles.length})
                </p>
                <span className="text-xs italic text-muted-foreground">
                  Drag to arrange. Star sets the primary image.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={clearPendingFiles}
                disabled={!!uploadProgress || uploadImages.isPending}
              >
                Clear All
              </Button>
              {isCreateMode ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium italic text-muted-foreground">
                  <AppIcon icon="solar:cloud-upload-linear" className="size-3" />
                  Uploads when you save
                </span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleUploadPending}
                  disabled={uploadImages.isPending}
                >
                  <AppIcon
                    icon={
                      uploadImages.isPending
                        ? "solar:refresh-linear"
                        : "solar:cloud-upload-linear"
                    }
                    className={
                      uploadImages.isPending
                        ? "mr-1 size-3 animate-spin"
                        : "mr-1 size-3"
                    }
                  />
                  {uploadImages.isPending ? "Uploading…" : "Upload Now"}
                </Button>
              )}
            </div>
          </div>

          {uploadProgress && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">
                  Uploading{" "}
                  {Math.min(uploadProgress.completed + 1, uploadProgress.total)} of{" "}
                  {uploadProgress.total}…
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(
                    (uploadProgress.completed / uploadProgress.total) * 100,
                  )}
                  %
                </span>
              </div>
              <Progress
                value={(uploadProgress.completed / uploadProgress.total) * 100}
                className="h-1.5"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pendingFiles.map((pf, index) => {
              const status = uploadProgress
                ? index < uploadProgress.completed
                  ? "done"
                  : index === uploadProgress.completed
                    ? "uploading"
                    : "queued"
                : null;
              return (
                <div
                  key={pf.id}
                  draggable={!uploadProgress}
                  onDragStart={() => setDraggedPendingIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropPending(e, index)}
                  className={`group relative aspect-square select-none overflow-hidden rounded-lg border border-border bg-muted transition-opacity ${
                    uploadProgress
                      ? "cursor-default"
                      : "cursor-grab active:cursor-grabbing"
                  } ${status === "queued" ? "opacity-50" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pf.previewUrl}
                    alt={pf.file.name}
                    className="pointer-events-none h-full w-full object-cover"
                  />
                  {status && status !== "queued" && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70">
                      <AppIcon
                        icon={
                          status === "done"
                            ? "solar:check-circle-bold"
                            : "solar:refresh-linear"
                        }
                        className={
                          status === "done"
                            ? "size-7 text-success-ink"
                            : "size-7 animate-spin text-primary-ink"
                        }
                      />
                    </div>
                  )}
                  {pf.isPrimary && (
                    <Badge className="absolute left-1.5 top-1.5 z-10 h-4 gap-1 text-xs">
                      <AppIcon icon="solar:star-bold" className="size-2" />
                      Primary
                    </Badge>
                  )}
                  <Badge
                    variant="muted"
                    className="absolute right-1 top-1 z-10 px-1 text-xs"
                  >
                    {(pf.file.size / (1024 * 1024)).toFixed(1)} MB
                  </Badge>
                  {!uploadProgress && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      {!pf.isPrimary && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="size-7 rounded-md text-warning-ink transition-transform hover:scale-110"
                          onClick={() => setPendingPrimary(pf.id)}
                          disabled={uploadImages.isPending}
                        >
                          <AppIcon icon="solar:star-bold" className="size-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="size-7 rounded-md transition-transform hover:scale-110"
                        onClick={() => removePendingFile(pf.id)}
                        disabled={uploadImages.isPending}
                      >
                        <AppIcon icon="solar:close-circle-linear" className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/5 p-6 text-center transition-colors hover:border-primary/30">
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
          <AppIcon
            icon="solar:cloud-upload-linear"
            className="size-5 text-muted-foreground transition-colors group-hover:text-primary-ink"
          />
        </div>
        <p className="mb-1 text-sm font-semibold text-foreground">Select Images</p>
        <p className="mb-3 text-xs text-muted-foreground">
          {partId
            ? "Queue images for the part gallery"
            : "Queue images — they upload when you save the part"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!uploadProgress}
        >
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesSelected(e.target.files);
            }
            e.target.value = "";
          }}
        />
      </div>

      <ConfirmModal
        isOpen={!!imageToDelete}
        onClose={() => setImageToDelete(null)}
        onConfirm={handleDeleteImage}
        title="Delete image?"
        description="This permanently removes the image from storage and cannot be undone."
        confirmText="Delete Image"
        variant="destructive"
        isPending={deleteImage.isPending}
      />
    </div>
  );
}
