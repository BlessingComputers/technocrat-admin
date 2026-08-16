"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import { convertToUploadableImage } from "@/lib/utils/convert-image";
import {
  useDeleteProductImage,
  useUploadProductImages,
  useSetProductPrimaryImage,
  useReorderProductImages,
} from "../../api/products.queries";
import type { NewProductImage, ProductImage } from "../../types/products";
import { MetaLabel } from "@/components/shared/meta-label";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

interface ImageUploadSectionProps {
  /** Absent while creating — the product doesn't exist yet. */
  productId?: string;
  images?: ProductImage[];
  productName: string;
  /**
   * Create mode only. The queue is handed to the form instead of being uploaded
   * here, so `POST /products` can carry the images in the same request.
   */
  onPendingChange?: (images: NewProductImage[]) => void;
  /** Create mode only: upload progress owned by the form's submit. */
  progress?: { completed: number; total: number } | null;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary?: boolean;
}

export function ImageUploadSection({
  productId,
  images,
  productName,
  onPendingChange,
  progress,
}: ImageUploadSectionProps) {
  // Creating: the queue is submitted with the product. Editing: it's uploaded
  // here against an id that already exists.
  const isDeferred = !productId;
  const deleteImage = useDeleteProductImage();
  const uploadImages = useUploadProductImages();
  const setPrimary = useSetProductPrimaryImage();
  const reorderImages = useReorderProductImages();

  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [ownProgress, setOwnProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const uploadProgress = isDeferred ? (progress ?? null) : ownProgress;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedPendingIndex, setDraggedPendingIndex] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to avoid leaks. Tracked through a ref, not an
  // effect dependency: depending on `pendingFiles` would run the cleanup on
  // every queue change and revoke previews of files that are still queued.
  // Removal/clear/upload revoke their own URLs as they go.
  const pendingFilesRef = useRef(pendingFiles);
  useEffect(() => {
    pendingFilesRef.current = pendingFiles;
  }, [pendingFiles]);
  useEffect(() => {
    return () => {
      pendingFilesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, []);

  const handleDeleteImage = async () => {
    if (!imageToDelete || !productId) return;
    const promise = deleteImage.mutateAsync({ productId, imageId: imageToDelete });
    toast.promise(promise, {
      loading: "Deleting image…",
      success: "Image deleted",
      error: (err) => getErrorMessage(err, "Failed to delete image"),
    });
    promise.catch(() => {}).finally(() => setImageToDelete(null));
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!productId) return;
    setSettingPrimaryId(imageId);
    const promise = setPrimary.mutateAsync({ productId, imageId });
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
    async (fileList: FileList) => {
      const hasExistingPrimary = images?.some((img) => img.isPrimary) || false;
      const hasPendingPrimary = pendingFiles.some((f) => f.isPrimary);
      let needsPrimary = !hasExistingPrimary && !hasPendingPrimary;

      const newPending: PendingFile[] = [];
      setIsConverting(true);
      try {
        for (const rawFile of Array.from(fileList)) {
          if (!ACCEPTED_TYPES.includes(rawFile.type)) {
            toast.error(
              `${rawFile.name}: only JPEG, PNG, WebP, AVIF are accepted`,
            );
            continue;
          }
          if (rawFile.size > MAX_FILE_SIZE) {
            toast.error(`${rawFile.name}: exceeds the 100 MB limit`);
            continue;
          }
          // AVIF isn't storable by the pipeline; re-encode (and downscale) to
          // WebP/PNG first. Renaming would leave AVIF bytes → corrupt file.
          let file: File;
          try {
            file = await convertToUploadableImage(rawFile);
          } catch {
            toast.error(`${rawFile.name}: couldn't be read as an image`);
            continue;
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
      } finally {
        setIsConverting(false);
      }
      if (newPending.length) setPendingFiles((prev) => [...prev, ...newPending]);
    },
    [images, pendingFiles],
  );

  // Create mode: the form owns the queue — it ships with `POST /products`.
  useEffect(() => {
    if (!isDeferred) return;
    onPendingChange?.(
      pendingFiles.map((pf) => ({ file: pf.file, isPrimary: pf.isPrimary })),
    );
  }, [isDeferred, pendingFiles, onPendingChange]);

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
    if (pendingFiles.length === 0 || !productId) return;
    const files = pendingFiles.map((pf) => pf.file);
    const primaryIndex = pendingFiles.findIndex((pf) => pf.isPrimary);
    setOwnProgress({ completed: 0, total: files.length });
    try {
      const promise = uploadImages.mutateAsync({
        productId,
        files,
        onProgress: (completed, total) =>
          setOwnProgress({ completed, total }),
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
          await setPrimary.mutateAsync({ productId, imageId: newPrimaryId });
        }
      }
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setPendingFiles([]);
    } catch {
      // toast already surfaced the error
    } finally {
      setOwnProgress(null);
    }
  };

  const handleDropExisting = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (
      draggedIndex === null ||
      draggedIndex === targetIndex ||
      !images ||
      !productId
    ) {
      return;
    }
    const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
    const [dragged] = sorted.splice(draggedIndex, 1);
    sorted.splice(targetIndex, 0, dragged);
    const order = sorted.map((img, idx) => ({ imageId: img.id, sortOrder: idx }));
    const promise = reorderImages.mutateAsync({ productId, order });
    toast.promise(promise, {
      loading: "Updating image order…",
      success: "Image order updated",
      error: (err) => getErrorMessage(err, "Failed to reorder images"),
    });
    promise.catch(() => {}).finally(() => setDraggedIndex(null));
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
  const busy =
    deleteImage.isPending || setPrimary.isPending || reorderImages.isPending;

  return (
    <div className="space-y-6 pt-6 border-t border-border">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Product Images
        </h3>
        <p className="text-xs text-muted-foreground">
          {isDeferred
            ? "Add, reorder, and choose the primary image — they upload with the product"
            : "Upload, reorder, and choose the primary image"}
        </p>
      </div>

      {/* Existing images */}
      {sortedImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <MetaLabel className="block">
              Current Images
            </MetaLabel>
            <span className="text-xs text-muted-foreground italic">
              Drag to reorder
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedImages.map((img, index) => {
              const hasPendingPrimary = pendingFiles.some((f) => f.isPrimary);
              const isVisuallyPrimary = img.isPrimary && !hasPendingPrimary;
              return (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropExisting(e, index)}
                  className="group bg-muted relative aspect-square rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all cursor-grab active:cursor-grabbing select-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={productName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 pointer-events-none"
                  />
                  {isVisuallyPrimary && (
                    <Badge className="absolute top-2 left-2 z-10 text-xs h-5 gap-1">
                      <AppIcon icon="solar:check-circle-bold" className="size-2.5" />
                      Primary
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!isVisuallyPrimary && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        disabled={busy}
                        className="size-8 rounded-md text-warning-ink hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSetPrimary(img.id);
                        }}
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
                      className="size-8 rounded-md text-destructive-ink hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImageToDelete(img.id);
                      }}
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
        <div className="bg-muted/30 border border-dashed border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppIcon icon="solar:gallery-linear" className="size-4 text-primary-ink" />
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-foreground">
                  {isDeferred
                    ? `Uploading with this product (${pendingFiles.length})`
                    : `Ready to Upload (${pendingFiles.length})`}
                </p>
                <span className="text-xs text-muted-foreground italic">
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
                disabled={uploadImages.isPending}
              >
                Clear All
              </Button>
              {!isDeferred && (
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
                      ? "size-3 mr-1 animate-spin"
                      : "size-3 mr-1"
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
                  {Math.min(
                    uploadProgress.completed + 1,
                    uploadProgress.total,
                  )}{" "}
                  of {uploadProgress.total}…
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
              <p className="text-xs italic text-muted-foreground">
                {isDeferred
                  ? "Images ride with the product, then any extras follow one at a time — keep this tab open until it finishes."
                  : "Images upload one at a time to stay within limits — keep this tab open until it finishes."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                className={`group relative aspect-square rounded-lg border border-border bg-muted overflow-hidden select-none transition-opacity ${
                  uploadProgress
                    ? "cursor-default"
                    : "cursor-grab active:cursor-grabbing"
                } ${status === "queued" ? "opacity-50" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pf.previewUrl}
                  alt={pf.file.name}
                  className="w-full h-full object-cover pointer-events-none"
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
                          : "size-7 text-primary-ink animate-spin"
                      }
                    />
                  </div>
                )}
                {pf.isPrimary && (
                  <Badge className="absolute top-1.5 left-1.5 z-10 text-xs h-4 gap-1">
                    <AppIcon icon="solar:star-bold" className="size-2" />
                    Primary
                  </Badge>
                )}
                <Badge
                  variant="muted"
                  className="absolute top-1 right-1 z-10 text-xs px-1"
                >
                  {(pf.file.size / (1024 * 1024)).toFixed(1)} MB
                </Badge>
                {!uploadProgress && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!pf.isPrimary && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="size-7 rounded-md text-warning-ink hover:scale-110 transition-transform"
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
                      className="size-7 rounded-md hover:scale-110 transition-transform"
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
      <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/5 group hover:border-primary/30 transition-colors">
        <div className="size-10 bg-muted rounded-full flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
          <AppIcon
            icon="solar:cloud-upload-linear"
            className="size-5 text-muted-foreground group-hover:text-primary-ink transition-colors"
          />
        </div>
        <p className="text-sm font-semibold mb-1 text-foreground">Select Images</p>
        <p className="text-xs text-muted-foreground mb-3">
          {isConverting
            ? "Preparing images…"
            : isDeferred
              ? "Queue images for the carousel — they upload when you save"
              : "Queue images for the product carousel"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={isConverting || !!uploadProgress}
        >
          {isConverting ? (
            <>
              <AppIcon
                icon="solar:refresh-linear"
                className="size-3.5 animate-spin"
              />
              Preparing…
            </>
          ) : (
            "Choose Files"
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
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
