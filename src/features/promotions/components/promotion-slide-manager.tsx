"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  useDeleteSlide,
  useUpdateSlide,
  useUploadSlides,
} from "../api/promotions.queries";
import {
  EMPTY_SLIDE_LINK,
  PromotionSlideLinkFields,
  type SlideLinkValue,
} from "./promotion-slide-link-fields";
import type { PromotionSlide } from "../types/promotions";
import { MetaLabel } from "@/components/shared/meta-label";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // backend caps at 5 MB/image
const MAX_FILES = 20;

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  link: SlideLinkValue;
}

function slideToLinkValue(slide: PromotionSlide): SlideLinkValue {
  return {
    description: slide.description ?? "",
    productSlug: slide.productSlug ?? null,
    productName: slide.productSlug,
    externalUrl: slide.externalUrl ?? null,
  };
}

export function PromotionSlideManager({
  promotionId,
  slides,
}: {
  promotionId: string;
  slides: PromotionSlide[];
}) {
  const uploadSlides = useUploadSlides(promotionId);
  const updateSlide = useUpdateSlide(promotionId);
  const deleteSlide = useDeleteSlide(promotionId);

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [expandedPendingId, setExpandedPendingId] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<SlideLinkValue>(EMPTY_SLIDE_LINK);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedSlides = [...slides].sort((a, b) => a.order - b.order);

  const handleFilesSelected = (fileList: FileList) => {
    const room = MAX_FILES - pendingFiles.length - slides.length;
    const newPending: PendingFile[] = [];
    for (const file of Array.from(fileList)) {
      if (newPending.length >= room) {
        toast.error(`A promotion can hold at most ${MAX_FILES} slides.`);
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPEG, PNG, or WebP are accepted.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: exceeds the 5 MB limit.`);
        continue;
      }
      newPending.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        link: EMPTY_SLIDE_LINK,
      });
    }
    if (newPending.length) setPendingFiles((prev) => [...prev, ...newPending]);
  };

  const removePendingFile = (id: string) =>
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });

  const handleUploadPending = async () => {
    if (pendingFiles.length === 0) return;
    const files = pendingFiles.map((pf) => pf.file);
    const metadata = pendingFiles.map((pf) => ({
      description: pf.link.description || null,
      productSlug: pf.link.productSlug,
      externalUrl: pf.link.externalUrl,
    }));
    const promise = uploadSlides.mutateAsync({ files, metadata });
    toast.promise(promise, {
      loading: `Uploading ${files.length} slide(s)…`,
      success: `${files.length} slide(s) uploaded.`,
      error: (err) => getErrorMessage(err, "Failed to upload slides."),
    });
    try {
      await promise;
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setPendingFiles([]);
    } catch {
      // toast already surfaced the error
    }
  };

  const openEdit = (slide: PromotionSlide) => {
    setEditingSlideId(slide.id);
    setEditValue(slideToLinkValue(slide));
  };

  const handleSaveEdit = () => {
    if (!editingSlideId) return;
    const promise = updateSlide.mutateAsync({
      slideId: editingSlideId,
      data: {
        description: editValue.description || null,
        productSlug: editValue.productSlug,
        externalUrl: editValue.externalUrl,
      },
    });
    toast.promise(promise, {
      loading: "Saving slide…",
      success: "Slide updated.",
      error: (err) => getErrorMessage(err, "Failed to update slide."),
    });
    promise.then(() => setEditingSlideId(null)).catch(() => {});
  };

  const handleDelete = () => {
    if (!slideToDelete) return;
    const promise = deleteSlide.mutateAsync(slideToDelete);
    toast.promise(promise, {
      loading: "Deleting slide…",
      success: "Slide deleted.",
      error: (err) => getErrorMessage(err, "Failed to delete slide."),
    });
    promise.catch(() => {}).finally(() => setSlideToDelete(null));
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const reordered = [...sortedSlides];
    const [dragged] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, dragged);
    setDraggedIndex(null);

    // No bulk-reorder endpoint — PATCH every slide whose order actually moved.
    reordered.forEach((slide, index) => {
      if (slide.order !== index) {
        updateSlide.mutate({ slideId: slide.id, data: { order: index } });
      }
    });
  };

  return (
    <div className="space-y-6">
      {sortedSlides.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <MetaLabel className="block">
              Slides ({sortedSlides.length})
            </MetaLabel>
            <span className="text-xs text-muted-foreground italic">
              Drag to reorder
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sortedSlides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className="group relative aspect-video cursor-grab select-none overflow-hidden rounded-lg border border-border bg-muted active:cursor-grabbing"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageUrl}
                  alt={slide.description ?? ""}
                  className="pointer-events-none h-full w-full object-cover"
                />
                {(slide.productSlug || slide.externalUrl) && (
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                    <AppIcon
                      icon={
                        slide.productSlug ? "solar:box-linear" : "solar:link-linear"
                      }
                      className="size-3"
                    />
                    {slide.productSlug ? "Product" : "Link"}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-8 rounded-md"
                    onClick={() => openEdit(slide)}
                  >
                    <AppIcon icon="solar:pen-linear" className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-8 rounded-md text-destructive-ink"
                    onClick={() => setSlideToDelete(slide.id)}
                  >
                    <AppIcon icon="solar:trash-bin-trash-linear" className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingSlideId && (
        <Card className="space-y-4 border-primary/30 bg-primary/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Edit slide</p>
            <Button variant="ghost" size="sm" onClick={() => setEditingSlideId(null)}>
              Cancel
            </Button>
          </div>
          <PromotionSlideLinkFields
            value={editValue}
            onChange={setEditValue}
            idPrefix="edit-slide"
          />
          <Button onClick={handleSaveEdit} disabled={updateSlide.isPending} size="sm">
            {updateSlide.isPending ? "Saving…" : "Save slide"}
          </Button>
        </Card>
      )}

      {pendingFiles.length > 0 && (
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Ready to upload ({pendingFiles.length})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
                  setPendingFiles([]);
                }}
                disabled={uploadSlides.isPending}
              >
                Clear all
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleUploadPending}
                disabled={uploadSlides.isPending}
              >
                {uploadSlides.isPending ? "Uploading…" : "Upload now"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {pendingFiles.map((pf) => (
              <div
                key={pf.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pf.previewUrl}
                    alt=""
                    className="aspect-video w-24 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {pf.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(pf.file.size / (1024 * 1024)).toFixed(1)} MB
                      {pf.link.productSlug && " · linked to a product"}
                      {pf.link.externalUrl && " · linked to a URL"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      setExpandedPendingId((cur) => (cur === pf.id ? null : pf.id))
                    }
                  >
                    {expandedPendingId === pf.id ? "Done" : "Caption & link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive-ink"
                    onClick={() => removePendingFile(pf.id)}
                    disabled={uploadSlides.isPending}
                  >
                    <AppIcon icon="solar:close-circle-linear" className="size-4" />
                  </Button>
                </div>
                {expandedPendingId === pf.id && (
                  <div className="border-t border-border p-3">
                    <PromotionSlideLinkFields
                      value={pf.link}
                      onChange={(link) =>
                        setPendingFiles((prev) =>
                          prev.map((f) => (f.id === pf.id ? { ...f, link } : f)),
                        )
                      }
                      idPrefix={`pending-${pf.id}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/5 p-6 text-center">
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
          <AppIcon icon="solar:cloud-upload-linear" className="size-5 text-muted-foreground" />
        </div>
        <p className="mb-1 text-sm font-semibold text-foreground">
          Add banner images
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          16:9 works best. JPEG, PNG, or WebP, up to 5 MB each.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <ConfirmModal
        isOpen={!!slideToDelete}
        onClose={() => setSlideToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this slide?"
        description="This permanently removes the slide and its image. This can't be undone."
        confirmText="Delete Slide"
        variant="destructive"
        isPending={deleteSlide.isPending}
      />
    </div>
  );
}
