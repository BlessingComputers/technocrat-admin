"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { MetaLabel } from "@/components/shared/meta-label";
import { getErrorMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils/cn";
import { prepareImageForUpload } from "@/lib/utils/convert-image";
import {
  useDeleteSlide,
  useReplaceSlideImages,
  useUpdateSlide,
  useUploadSlides,
} from "../api/promotions.queries";
import {
  TEMPLATES,
  TEMPLATE_LABEL,
  formatSize,
  type TemplateKey,
} from "../constants/placements";
import {
  assessFit,
  readImageSize,
  type Dimensions,
  type FitAssessment,
} from "../utils/image-fit";
import {
  describeSlideLink,
  EMPTY_SLIDE_LINK,
  PromotionSlideLinkFields,
  slideLinkError,
  slideToLinkValue,
  type SlideLinkValue,
} from "./promotion-slide-link-fields";
import { parseDestination } from "../utils/slide-destination";
import type { PromotionSlide } from "../types/promotions";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
/**
 * Ceiling on what a staffer may *choose*, not on what gets uploaded.
 *
 * Every file is downscaled to its template's export size and re-encoded to
 * WebP before it leaves the browser (`prepareSlideImage`), which puts a
 * straight-off-the-camera banner comfortably under both the backend's 5 MB
 * per-image cap and Vercel's ~4.5 MB request cap. This limit only exists so
 * an accidental 200 MB PSD export doesn't lock the tab up decoding.
 */
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
/** Cap for an unplaced promotion, where no template names a real limit. */
const FALLBACK_MAX_SLIDES = 20;

interface PendingImage {
  file: File;
  previewUrl: string;
  /** null while the decode is in flight, or if the file could not be decoded. */
  dimensions: Dimensions | null;
}

interface PendingSlide {
  id: string;
  desktop: PendingImage;
  mobile: PendingImage | null;
  link: SlideLinkValue;
}

/**
 * The corner badge on a saved slide's thumbnail. Naming the kind rather than
 * saying "Link" is the point: a grid of eight banners is where staff notice
 * that one of them points at the wrong category.
 */
function slideLinkBadge(
  slide: PromotionSlide,
): { icon: string; label: string } | null {
  const { kind } = parseDestination({
    productSlug: slide.productSlug ?? null,
    externalUrl: slide.externalUrl ?? null,
  });
  switch (kind) {
    case "product":
      return { icon: "solar:box-linear", label: "Product" };
    case "category":
      return { icon: "solar:widget-linear", label: "Category" };
    case "brand":
      return { icon: "solar:tag-linear", label: "Brand" };
    case "page":
      return { icon: "solar:document-linear", label: "Page" };
    case "external":
      return { icon: "solar:link-linear", label: "External" };
    default:
      return null;
  }
}

/** Shared gate for anything arriving from a file input. */
function rejectFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG, or WebP are accepted.`;
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return `${file.name}: too large to process — export it under 40 MB first.`;
  }
  return null;
}

/**
 * The backend's own ceiling. `prepareForS3(buffer, 'promotion')` runs every
 * slide through sharp at `maxDimension: 1920, fit: 'inside'`, so 1920 is the
 * largest a banner can be *stored* at no matter what we send. Shipping the
 * template's 2400px export only pays for pixels the backend throws away.
 */
const BACKEND_MAX_DIMENSION = 1920;

/**
 * Quality for our re-encode. Deliberately higher than the backend's 88: the
 * backend re-encodes whatever arrives, so ours is the first of two lossy
 * passes and should be close to transparent. At 0.92 and matched dimensions
 * we are handing sharp essentially the pixels it would have produced itself,
 * and the stored image's quality is still decided by the backend's pass —
 * exactly as it was before this step existed.
 */
const SLIDE_QUALITY = 0.92;

/**
 * The pixel box a slide's art should be reduced to before upload: the
 * template's export size, clamped to what the backend will actually keep.
 *
 * `box` is null for a promotion whose placement the storefront no longer
 * knows — there is no export size to aim at, so only the backend's cap
 * applies.
 */
function uploadBox(box: Dimensions | null): { w: number; h: number } {
  return {
    w: Math.min(box?.w ?? BACKEND_MAX_DIMENSION, BACKEND_MAX_DIMENSION),
    h: Math.min(box?.h ?? BACKEND_MAX_DIMENSION, BACKEND_MAX_DIMENSION),
  };
}

/**
 * Downscale and re-encode a chosen file against the slot it is going into.
 *
 * This happens at pick time, not at upload time, so what the row previews and
 * reports the size of is exactly what will be sent. A `wide` carousel is six
 * slides plus six mobile recuts in ONE request; at export sizes straight out
 * of a design tool that is tens of megabytes, and Vercel 413s the whole
 * upload before the function ever runs. Fitted to 1920 and stored as WebP the
 * same batch is a few hundred KB.
 *
 * Nothing visible is given up for that. The backend was always going to
 * resize to 1920 and re-encode at quality 88; doing the resize here just
 * means it arrives already done, and sharp's resize step becomes a no-op
 * (`withoutEnlargement`).
 */
async function prepareSlideImage(
  file: File,
  box: Dimensions | null,
): Promise<File> {
  try {
    return await prepareImageForUpload(file, {
      box: uploadBox(box),
      quality: SLIDE_QUALITY,
    });
  } catch {
    // A browser that can't decode or re-encode this file shouldn't cost the
    // staffer their upload — send the original and let the backend judge it.
    return file;
  }
}

async function toPendingImage(
  file: File,
  box: Dimensions | null,
): Promise<PendingImage> {
  // Measure the ORIGINAL, not what we are about to send. `assessFit` asks
  // whether the staffer exported the right thing, and the answer to that has
  // to be about their file — telling someone who exported a perfect 2400 ×
  // 1350 that it is "scaled" because we reduced it to 1920 would be reporting
  // our own transport step back at them as their mistake.
  const dimensions = await readImageSize(file);
  const prepared = await prepareSlideImage(file, box);
  return { file: prepared, previewUrl: URL.createObjectURL(prepared), dimensions };
}

export function PromotionSlideManager({
  promotionId,
  slides,
  /**
   * The promotion's template, or null when its placement key is one the
   * storefront no longer knows. Without a template there is no export size to
   * check against and no real ratio to preview at, so the manager falls back
   * to the old 16:9 behaviour and says nothing about sizes.
   */
  template,
}: {
  promotionId: string;
  slides: PromotionSlide[];
  template: TemplateKey | null;
}) {
  const uploadSlides = useUploadSlides(promotionId);
  const updateSlide = useUpdateSlide(promotionId);
  const replaceImages = useReplaceSlideImages(promotionId);
  const deleteSlide = useDeleteSlide(promotionId);

  const [pendingSlides, setPendingSlides] = useState<PendingSlide[]>([]);
  /** Chosen files are being downscaled and re-encoded off the main flow. */
  const [isPreparing, setIsPreparing] = useState(false);
  const [expandedPendingId, setExpandedPendingId] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<SlideLinkValue>(EMPTY_SLIDE_LINK);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  /** Which existing slide, and which of its two images, is being replaced. */
  const [replacing, setReplacing] = useState<{
    slideId: string;
    which: "desktop" | "mobile";
  } | null>(null);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  /** Which pending slide a mobile file picked from the shared input belongs to. */
  const mobileTargetRef = useRef<string | null>(null);

  const spec = template ? TEMPLATES[template] : null;
  const desktopSize = spec?.desktop ?? null;
  const mobileSize = spec?.mobile ?? null;
  const takesMobile = mobileSize !== null;
  const maxSlides = spec?.maxSlides ?? FALLBACK_MAX_SLIDES;

  // Preview existing and pending art at the template's real ratio rather than
  // a hardcoded 16:9 — a `panel` is 5:4 and a `band` is 12:5, and showing
  // either in a 16:9 box hides exactly the crop staff need to see (§6.4).
  const previewAspect = desktopSize
    ? `${desktopSize.w} / ${desktopSize.h}`
    : "16 / 9";

  // One cleanup for every object URL this component ever created. Revoking on
  // unmount only, because the previews are live for as long as the row is.
  const urlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const trackUrl = (image: PendingImage) => {
    urlsRef.current.add(image.previewUrl);
    return image;
  };

  const releaseSlide = (slide: PendingSlide) => {
    for (const url of [slide.desktop.previewUrl, slide.mobile?.previewUrl]) {
      if (url) {
        URL.revokeObjectURL(url);
        urlsRef.current.delete(url);
      }
    }
  };

  const sortedSlides = useMemo(
    () => [...slides].sort((a, b) => a.order - b.order),
    [slides],
  );

  const totalAfterUpload = slides.length + pendingSlides.length;
  const overCap = totalAfterUpload > maxSlides;

  const handleDesktopFilesSelected = async (fileList: FileList) => {
    const room = maxSlides - slides.length - pendingSlides.length;
    if (room <= 0) {
      toast.error(
        `This slot shows at most ${maxSlides} slides. Remove one first.`,
      );
      return;
    }
    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (accepted.length >= room) {
        toast.error(`This slot shows at most ${maxSlides} slides.`);
        break;
      }
      const rejection = rejectFile(file);
      if (rejection) {
        toast.error(rejection);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    setIsPreparing(true);
    try {
      const created = await Promise.all(
        accepted.map(async (file) => ({
          id: crypto.randomUUID(),
          desktop: trackUrl(await toPendingImage(file, desktopSize)),
          mobile: null,
          link: EMPTY_SLIDE_LINK,
        })),
      );
      setPendingSlides((prev) => [...prev, ...created]);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleMobileFileSelected = async (file: File) => {
    const pendingId = mobileTargetRef.current;
    mobileTargetRef.current = null;
    if (!pendingId) return;
    const rejection = rejectFile(file);
    if (rejection) {
      toast.error(rejection);
      return;
    }
    setIsPreparing(true);
    let image: PendingImage;
    try {
      image = trackUrl(await toPendingImage(file, mobileSize));
    } finally {
      setIsPreparing(false);
    }
    setPendingSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== pendingId) return slide;
        if (slide.mobile) {
          URL.revokeObjectURL(slide.mobile.previewUrl);
          urlsRef.current.delete(slide.mobile.previewUrl);
        }
        return { ...slide, mobile: image };
      }),
    );
  };

  const removePendingSlide = (id: string) =>
    setPendingSlides((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) releaseSlide(target);
      return prev.filter((s) => s.id !== id);
    });

  const clearPendingMobile = (id: string) =>
    setPendingSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== id || !slide.mobile) return slide;
        URL.revokeObjectURL(slide.mobile.previewUrl);
        urlsRef.current.delete(slide.mobile.previewUrl);
        return { ...slide, mobile: null };
      }),
    );

  /**
   * The first pending slide whose link is half-finished, e.g. brand mode with
   * nothing chosen. Blocking the whole batch is deliberate: the upload is one
   * multipart call, so letting three good slides through and dropping the
   * fourth would need staff to work out which one to redo.
   */
  const pendingLinkError = useMemo(() => {
    for (const [index, slide] of pendingSlides.entries()) {
      const error = slideLinkError(slide.link);
      if (error) return `Slide ${index + 1}: ${error}`;
    }
    return null;
  }, [pendingSlides]);

  const handleUploadPending = async () => {
    if (pendingSlides.length === 0) return;
    if (pendingLinkError) {
      toast.error(pendingLinkError);
      return;
    }
    // The service flattens this into files[] / mobileFiles[] / mobileIndexes;
    // nothing above it has to think in parallel arrays.
    const uploads = pendingSlides.map((slide) => ({
      file: slide.desktop.file,
      mobileFile: slide.mobile?.file ?? null,
      metadata: {
        description: slide.link.description || null,
        productSlug: slide.link.productSlug,
        externalUrl: slide.link.externalUrl,
      },
    }));
    const count = uploads.length;
    // The batch goes up in size-budgeted groups, so "how many landed" is not
    // all-or-nothing any more.
    let uploadedCount = 0;
    const promise = uploadSlides.mutateAsync({
      uploads,
      onProgress: (completed) => {
        uploadedCount = completed;
      },
    });
    toast.promise(promise, {
      loading: `Uploading ${count} slide(s)…`,
      success: `${count} slide(s) uploaded.`,
      error: (err) => getErrorMessage(err, "Failed to upload slides."),
    });
    try {
      await promise;
      pendingSlides.forEach(releaseSlide);
      setPendingSlides([]);
    } catch {
      // toast.promise already surfaced the error. What it can't know is that
      // the slides before the failure point are already saved — leaving them
      // queued would upload them a second time on retry, so drop exactly
      // those and keep the rest ready to send again.
      if (uploadedCount > 0) {
        toast(
          `The first ${uploadedCount} slide(s) were saved. Retry to send the rest.`,
        );
        setPendingSlides((prev) => {
          prev.slice(0, uploadedCount).forEach(releaseSlide);
          return prev.slice(uploadedCount);
        });
      }
    }
  };

  const handleReplaceFileSelected = async (file: File) => {
    const target = replacing;
    if (!target) return;
    const rejection = rejectFile(file);
    if (rejection) {
      toast.error(rejection);
      setReplacing(null);
      return;
    }
    // Same preparation as a new slide — a replacement is the same bytes over
    // the same proxy, so an untouched export 413s here exactly as it would
    // there.
    const prepared = await prepareSlideImage(
      file,
      target.which === "desktop" ? desktopSize : mobileSize,
    );
    const promise = replaceImages.mutateAsync({
      slideId: target.slideId,
      images:
        target.which === "desktop"
          ? { file: prepared }
          : { mobileFile: prepared },
    });
    toast.promise(promise, {
      loading: "Replacing image…",
      success:
        target.which === "desktop"
          ? "Desktop image replaced."
          : "Mobile image replaced.",
      error: (err) => getErrorMessage(err, "Failed to replace the image."),
    });
    // `replacing` stays set for the duration so the tile it belongs to can show
    // itself as busy; it is only cleared once the swap has landed or failed.
    promise.catch(() => {}).finally(() => setReplacing(null));
  };

  const openEdit = (slide: PromotionSlide) => {
    setEditingSlideId(slide.id);
    setEditValue(slideToLinkValue(slide));
  };

  const handleSaveEdit = () => {
    if (!editingSlideId) return;
    const linkError = slideLinkError(editValue);
    if (linkError) {
      toast.error(linkError);
      return;
    }
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

    // Slides have no bulk-reorder endpoint (only promotions do) — PATCH every
    // slide whose order actually moved.
    reordered.forEach((slide, index) => {
      if (slide.order !== index) {
        updateSlide.mutate({ slideId: slide.id, data: { order: index } });
      }
    });
  };

  return (
    <div className="space-y-6">
      {template && spec && desktopSize && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {TEMPLATE_LABEL[template]}
          </span>
          <span aria-hidden="true">·</span>
          <span>Desktop {formatSize(desktopSize)}</span>
          {mobileSize && (
            <>
              <span aria-hidden="true">·</span>
              <span>Mobile {formatSize(mobileSize)}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>up to {spec.maxSlides} slides</span>
        </div>
      )}

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
              <ExistingSlideTile
                key={slide.id}
                slide={slide}
                index={index}
                previewAspect={previewAspect}
                takesMobile={takesMobile}
                overCap={index >= maxSlides}
                onDragStart={() => setDraggedIndex(index)}
                onDrop={() => handleDrop(index)}
                onEdit={() => openEdit(slide)}
                onDelete={() => setSlideToDelete(slide.id)}
                onReplace={(which) => {
                  setReplacing({ slideId: slide.id, which });
                  // The input's onChange reads `replacing`, so it has to be set
                  // before the picker opens — a microtask is enough.
                  queueMicrotask(() => replaceInputRef.current?.click());
                }}
                isReplacing={
                  replaceImages.isPending && replacing?.slideId === slide.id
                }
              />
            ))}
          </div>
          {slides.length > maxSlides && (
            <p className="text-xs text-warning-ink">
              This slot shows the first {maxSlides}. The rest are stored but
              never rendered — delete them or move this promotion to a slot that
              holds more.
            </p>
          )}
        </div>
      )}

      {editingSlideId && (
        <Card className="space-y-4 border-primary/30 bg-primary/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Edit slide</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSlideId(null)}
            >
              Cancel
            </Button>
          </div>
          <PromotionSlideLinkFields
            value={editValue}
            onChange={setEditValue}
            idPrefix="edit-slide"
          />
          <Button
            onClick={handleSaveEdit}
            disabled={updateSlide.isPending}
            size="sm"
          >
            {updateSlide.isPending ? "Saving…" : "Save slide"}
          </Button>
        </Card>
      )}

      {pendingSlides.length > 0 && (
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Ready to upload ({pendingSlides.length})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  pendingSlides.forEach(releaseSlide);
                  setPendingSlides([]);
                }}
                disabled={uploadSlides.isPending}
              >
                Clear all
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleUploadPending}
                disabled={uploadSlides.isPending || Boolean(pendingLinkError)}
              >
                {uploadSlides.isPending ? "Uploading…" : "Upload now"}
              </Button>
            </div>
          </div>

          {pendingLinkError && (
            <p className="text-xs text-destructive-ink">{pendingLinkError}</p>
          )}

          {overCap && (
            <p className="text-xs text-warning-ink">
              That would put this promotion at {totalAfterUpload} slides, and
              the slot shows {maxSlides}.
            </p>
          )}

          <div className="space-y-3">
            {pendingSlides.map((slide) => (
              <PendingSlideRow
                key={slide.id}
                slide={slide}
                previewAspect={previewAspect}
                desktopSize={desktopSize}
                mobileSize={mobileSize}
                isExpanded={expandedPendingId === slide.id}
                isUploading={uploadSlides.isPending}
                onToggleExpanded={() =>
                  setExpandedPendingId((cur) =>
                    cur === slide.id ? null : slide.id,
                  )
                }
                onLinkChange={(link) =>
                  setPendingSlides((prev) =>
                    prev.map((s) => (s.id === slide.id ? { ...s, link } : s)),
                  )
                }
                onAddMobile={() => {
                  mobileTargetRef.current = slide.id;
                  queueMicrotask(() => mobileInputRef.current?.click());
                }}
                onClearMobile={() => clearPendingMobile(slide.id)}
                onRemove={() => removePendingSlide(slide.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/5 p-6 text-center">
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
          <AppIcon
            icon="solar:cloud-upload-linear"
            className="size-5 text-muted-foreground"
          />
        </div>
        <p className="mb-1 text-sm font-semibold text-foreground">
          Add banner images
        </p>
        <p className="mb-3 max-w-sm text-xs text-muted-foreground">
          {desktopSize
            ? takesMobile
              ? `Desktop first, at ${formatSize(desktopSize)}. You can attach the mobile version to each one after. JPEG, PNG, or WebP — larger files are resized to fit automatically.`
              : `${formatSize(desktopSize)}, square. One file serves every screen size. JPEG, PNG, or WebP — larger files are resized to fit automatically.`
            : "Choose a slot on this promotion first — the right image size depends on where it appears."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={isPreparing}
          onClick={() => desktopInputRef.current?.click()}
        >
          {isPreparing ? "Preparing…" : "Choose files"}
        </Button>
        <input
          ref={desktopInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              void handleDesktopFilesSelected(e.target.files);
            }
            e.target.value = "";
          }}
        />
        {/* One shared single-file input for every "add the mobile version"
            button; `mobileTargetRef` says which pending row asked. */}
        <input
          ref={mobileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleMobileFileSelected(file);
            e.target.value = "";
          }}
        />
        {/* Likewise for replacing an already-uploaded slide's image. */}
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleReplaceFileSelected(file);
            e.target.value = "";
          }}
        />
      </div>

      <ConfirmModal
        isOpen={!!slideToDelete}
        onClose={() => setSlideToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this slide?"
        description="This permanently removes the slide and both its images. This can't be undone."
        confirmText="Delete Slide"
        variant="destructive"
        isPending={deleteSlide.isPending}
      />
    </div>
  );
}

function ExistingSlideTile({
  slide,
  index,
  previewAspect,
  takesMobile,
  overCap,
  onDragStart,
  onDrop,
  onEdit,
  onDelete,
  onReplace,
  isReplacing,
}: {
  slide: PromotionSlide;
  index: number;
  previewAspect: string;
  takesMobile: boolean;
  overCap: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReplace: (which: "desktop" | "mobile") => void;
  isReplacing: boolean;
}) {
  const hasMobile = Boolean(slide.mobileImageUrl);
  const linkBadge = slideLinkBadge(slide);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{ aspectRatio: previewAspect }}
      className={cn(
        "group relative cursor-grab select-none overflow-hidden rounded-lg border border-border bg-muted active:cursor-grabbing",
        overCap && "opacity-50",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.imageUrl}
        alt={slide.description ?? ""}
        className="pointer-events-none h-full w-full object-cover"
      />

      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        {/* A slide with no mobile file is not broken — the desktop art is
            CSS-cropped on a phone (§7). It is unfinished, and the flag is how
            you tell the two apart at a glance. */}
        {takesMobile && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              hasMobile
                ? "bg-black/60 text-white"
                : "bg-warning text-warning-foreground",
            )}
            title={
              hasMobile
                ? "Has a mobile version"
                : "No mobile version — the desktop image gets cropped on phones"
            }
          >
            <AppIcon
              icon={
                hasMobile
                  ? "solar:smartphone-linear"
                  : "solar:smartphone-update-linear"
              }
              className="size-3"
            />
            {hasMobile ? "Mobile" : "No mobile"}
          </span>
        )}
      </div>

      {linkBadge && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
          <AppIcon icon={linkBadge.icon} className="size-3" />
          {linkBadge.label}
        </div>
      )}

      <div className="absolute right-1.5 bottom-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
        {index + 1}
      </div>

      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onReplace("desktop")}
          disabled={isReplacing}
        >
          <AppIcon icon="solar:refresh-linear" className="size-3.5" />
          Image
        </Button>
        {takesMobile && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onReplace("mobile")}
            disabled={isReplacing}
          >
            <AppIcon icon="solar:smartphone-linear" className="size-3.5" />
            {hasMobile ? "Mobile" : "Add mobile"}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 rounded-md"
          onClick={onEdit}
          aria-label="Edit caption and link"
        >
          <AppIcon icon="solar:pen-linear" className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 rounded-md text-destructive-ink"
          onClick={onDelete}
          aria-label="Delete slide"
        >
          <AppIcon icon="solar:trash-bin-trash-linear" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PendingSlideRow({
  slide,
  previewAspect,
  desktopSize,
  mobileSize,
  isExpanded,
  isUploading,
  onToggleExpanded,
  onLinkChange,
  onAddMobile,
  onClearMobile,
  onRemove,
}: {
  slide: PendingSlide;
  previewAspect: string;
  desktopSize: Dimensions | null;
  mobileSize: Dimensions | null;
  isExpanded: boolean;
  isUploading: boolean;
  onToggleExpanded: () => void;
  onLinkChange: (link: SlideLinkValue) => void;
  onAddMobile: () => void;
  onClearMobile: () => void;
  onRemove: () => void;
}) {
  const desktopFit =
    desktopSize && slide.desktop.dimensions
      ? assessFit(slide.desktop.dimensions, desktopSize)
      : null;
  const mobileFit =
    mobileSize && slide.mobile?.dimensions
      ? assessFit(slide.mobile.dimensions, mobileSize)
      : null;
  const linkSummary = describeSlideLink(slide.link);
  // Surfaced on the collapsed row, not only inside the expanded editor, so a
  // half-finished link is visible without opening every slide to find it.
  const linkProblem = slideLinkError(slide.link);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-start gap-3 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.desktop.previewUrl}
          alt=""
          style={{ aspectRatio: previewAspect }}
          className="w-28 shrink-0 rounded object-cover"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-xs font-semibold text-foreground">
            {slide.desktop.file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {(slide.desktop.file.size / (1024 * 1024)).toFixed(1)} MB
            {slide.desktop.dimensions &&
              ` · ${formatSize({ w: slide.desktop.dimensions.w, h: slide.desktop.dimensions.h })}`}
            {linkSummary && ` · ${linkSummary}`}
          </p>
          {linkProblem && (
            <p className="flex items-center gap-1 text-xs font-medium text-destructive-ink">
              <AppIcon
                icon="solar:danger-triangle-linear"
                className="size-3.5 shrink-0"
              />
              {linkProblem}
            </p>
          )}
          {desktopFit && <FitNote fit={desktopFit} />}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-xs"
          onClick={onToggleExpanded}
        >
          {isExpanded ? "Done" : "Caption & link"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-destructive-ink"
          onClick={onRemove}
          disabled={isUploading}
          aria-label={`Remove ${slide.desktop.file.name}`}
        >
          <AppIcon icon="solar:close-circle-linear" className="size-4" />
        </Button>
      </div>

      {/* The second drop target. It is a row rather than a side-by-side box
          because the mobile file is optional per slide and a half-empty pair of
          boxes reads as broken (§2.8 makes it the normal case, not a required
          one). */}
      {mobileSize && (
        <div className="flex items-center gap-3 border-t border-border bg-muted/20 px-2 py-2">
          {slide.mobile ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.mobile.previewUrl}
                alt=""
                style={{ aspectRatio: `${mobileSize.w} / ${mobileSize.h}` }}
                className="w-14 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  Mobile · {slide.mobile.file.name}
                </p>
                {mobileFit && <FitNote fit={mobileFit} />}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onAddMobile}
                disabled={isUploading}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-destructive-ink"
                onClick={onClearMobile}
                disabled={isUploading}
                aria-label="Remove the mobile version"
              >
                <AppIcon icon="solar:close-circle-linear" className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
                <AppIcon
                  icon="solar:smartphone-linear"
                  className="size-4 text-muted-foreground"
                />
              </div>
              <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                No mobile version — this one gets cropped on phones. Add one at{" "}
                {formatSize(mobileSize)}.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 text-xs"
                onClick={onAddMobile}
                disabled={isUploading}
              >
                Add mobile
              </Button>
            </>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="border-t border-border p-3">
          <PromotionSlideLinkFields
            value={slide.link}
            onChange={onLinkChange}
            idPrefix={`pending-${slide.id}`}
          />
        </div>
      )}
    </div>
  );
}

/** The size verdict for one pending file. Advisory — never blocks the upload. */
function FitNote({ fit }: { fit: FitAssessment }) {
  const tone =
    fit.status === "exact"
      ? "text-success-ink"
      : fit.status === "mismatch"
        ? "text-warning-ink"
        : "text-muted-foreground";
  const icon =
    fit.status === "exact"
      ? "solar:check-circle-linear"
      : fit.status === "mismatch"
        ? "solar:crop-linear"
        : "solar:info-circle-linear";
  return (
    <p className={cn("flex items-center gap-1 text-xs", tone)}>
      <AppIcon icon={icon} className="size-3.5 shrink-0" />
      {fit.message}
    </p>
  );
}
