"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import { convertToUploadableImage } from "@/lib/utils/convert-image";
import {
  useCategoryDetail,
  useDeleteCategoryBanner,
  useSetPrimaryCategoryBanner,
  useUploadCategoryBanners,
} from "../../api/products.queries";
import { CategoryBannerCard } from "./category-banner-card";
import {
  CategoryBannerQueue,
  type PendingBanner,
} from "./category-banner-queue";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * The backend accepts 8 per category. Enforced here rather than left to the
 * server: multer's `upload.array('banners', 8)` rejects an over-limit request
 * with `LIMIT_UNEXPECTED_FILE` before the controller's own friendly check can
 * run, so the API's error for this case is unreadable.
 */
const MAX_BANNERS = 8;

interface CategoryBannersSectionProps {
  categoryId: string;
  categoryName: string;
}

/**
 * Banner gallery for one category — the hero artwork its storefront landing
 * page (`/category/<slug>`) shows above everything else.
 *
 * **Not the same thing as the category image.** `imageUrl`, set on the category
 * form, is the small thumbnail in nav and category grids. These are the large
 * promotional images, and they live behind their own endpoints.
 *
 * **There is no reorder control, and that is not an oversight.** The backend
 * ships add, delete and set-primary only; `sortOrder` is fixed at upload time
 * and no reorder route exists (BACKEND-ASKS item 20). A drag handle here would
 * be a control that cannot save. Order is upload order, with the primary banner
 * pulled to the front.
 *
 * **Callers must key this on `categoryId`.** The pending queue holds files
 * destined for one specific category; carrying it across a category switch
 * would upload them against the wrong one. Remounting clears the queue and
 * runs the unmount cleanup that revokes its preview URLs, which is why the
 * reset is a `key` rather than an effect.
 */
export function CategoryBannersSection({
  categoryId,
  categoryName,
}: CategoryBannersSectionProps) {
  const { data: category, isLoading } = useCategoryDetail(categoryId);
  const uploadBanners = useUploadCategoryBanners();
  const deleteBanner = useDeleteCategoryBanner();
  const setPrimary = useSetPrimaryCategoryBanner();

  const [pending, setPending] = useState<PendingBanner[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const banners = category?.banners ?? [];
  const remaining = MAX_BANNERS - banners.length - pending.length;
  const isBusy = uploadBanners.isPending || isConverting;

  // Revoke preview URLs on unmount only. Keyed through a ref so a queue change
  // does not revoke previews of files still sitting in it; the remove and
  // upload paths revoke their own as they go.
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(
    () => () =>
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)),
    [],
  );

  const handleFilesSelected = useCallback(
    async (fileList: FileList) => {
      const accepted: PendingBanner[] = [];
      setIsConverting(true);
      try {
        for (const rawFile of Array.from(fileList)) {
          if (accepted.length >= remaining) {
            toast.error(`Only ${MAX_BANNERS} banners per category`);
            break;
          }
          if (!ACCEPTED_TYPES.includes(rawFile.type)) {
            toast.error(`${rawFile.name}: only JPEG, PNG, WebP, AVIF accepted`);
            continue;
          }
          if (rawFile.size > MAX_FILE_SIZE) {
            toast.error(`${rawFile.name}: exceeds the 100 MB limit`);
            continue;
          }
          // AVIF is not storable by the backend pipeline; re-encode first.
          let file: File;
          try {
            file = await convertToUploadableImage(rawFile);
          } catch {
            toast.error(`${rawFile.name}: could not be read as an image`);
            continue;
          }
          accepted.push({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            altText: "",
            isPrimary: false,
          });
        }
      } finally {
        setIsConverting(false);
      }
      if (accepted.length) setPending((prev) => [...prev, ...accepted]);
    },
    [remaining],
  );

  const removePending = (id: string) =>
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });

  const handleUpload = () => {
    if (pending.length === 0) return;
    const queued = pending;
    const promise = uploadBanners.mutateAsync({
      categoryId,
      files: queued.map((p) => p.file),
      onProgress: (completed, total) => setProgress({ completed, total }),
      // `sortOrder` continues from what the category already holds, so a second
      // upload appends rather than restarting at 0 and interleaving.
      meta: queued.map((p, i) => ({
        altText: p.altText.trim() || undefined,
        isPrimary: p.isPrimary,
        sortOrder: banners.length + i,
      })),
    });

    toast.promise(promise, {
      loading: "Uploading banners…",
      success: "Banners uploaded",
      error: (err) => getErrorMessage(err, "Failed to upload banners"),
    });

    promise
      .then(() => {
        queued.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPending([]);
      })
      .catch(() => {})
      .finally(() => setProgress(null));
  };

  const handleDelete = () => {
    if (!bannerToDelete) return;
    const promise = deleteBanner.mutateAsync({
      categoryId,
      bannerId: bannerToDelete,
    });
    toast.promise(promise, {
      loading: "Deleting banner…",
      success: "Banner deleted",
      error: (err) => getErrorMessage(err, "Failed to delete banner"),
    });
    promise.catch(() => {}).finally(() => setBannerToDelete(null));
  };

  const handleSetPrimary = (bannerId: string) => {
    setSettingPrimaryId(bannerId);
    const promise = setPrimary.mutateAsync({ categoryId, bannerId });
    toast.promise(promise, {
      loading: "Setting as primary…",
      success: "Primary banner updated",
      error: (err) => getErrorMessage(err, "Failed to set primary banner"),
    });
    promise.catch(() => {}).finally(() => setSettingPrimaryId(null));
  };

  return (
    <section className="space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Landing page banners
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Hero artwork for the {categoryName} page. Separate from the category
            image, which is the small thumbnail in menus. Up to {MAX_BANNERS};
            the primary one shows first.
          </p>
          {/* There is one file per banner and no mobile version, so the
              storefront shows this ratio at every width and anything cut to a
              different one is cropped to fit. Naming the size is the only thing
              stopping that. */}
          <p className="mt-1 text-xs text-muted-foreground">
            Export at{" "}
            <span className="font-medium text-foreground">2400 × 1350</span>{" "}
            (16:9). Other ratios are cropped from the centre.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy || remaining <= 0}
        >
          <AppIcon icon="solar:gallery-add-linear" className="mr-1 size-3.5" />
          {remaining > 0 ? "Add banners" : "Limit reached"}
        </Button>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />

      <CategoryBannerQueue
        pending={pending}
        disabled={isBusy}
        onAltTextChange={(id, altText) =>
          setPending((prev) =>
            prev.map((p) => (p.id === id ? { ...p, altText } : p)),
          )
        }
        onSetPrimary={(id) =>
          setPending((prev) =>
            prev.map((p) => ({ ...p, isPrimary: p.id === id })),
          )
        }
        onRemove={removePending}
      />

      {pending.length > 0 && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs"
            onClick={handleUpload}
            disabled={isBusy}
          >
            <AppIcon
              icon={
                uploadBanners.isPending
                  ? "solar:refresh-linear"
                  : "solar:cloud-upload-linear"
              }
              className={`mr-1 size-3.5 ${uploadBanners.isPending ? "animate-spin" : ""}`}
            />
            {uploadBanners.isPending ? "Uploading…" : `Upload ${pending.length}`}
          </Button>
        </div>
      )}

      {progress && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-foreground">
              Uploading {Math.min(progress.completed + 1, progress.total)} of{" "}
              {progress.total}…
            </span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round((progress.completed / progress.total) * 100)}%
            </span>
          </div>
          <Progress
            value={(progress.completed / progress.total) * 100}
            className="h-1.5"
          />
          <p className="text-xs italic text-muted-foreground">
            Banners upload one at a time to stay within limits — keep this tab
            open until it finishes.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="aspect-[16/9] w-full rounded-lg" />
          <Skeleton className="aspect-[16/9] w-full rounded-lg" />
        </div>
      ) : banners.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {banners.map((banner) => (
            <CategoryBannerCard
              key={banner.id}
              banner={banner}
              categoryName={categoryName}
              isSettingPrimary={settingPrimaryId === banner.id}
              onSetPrimary={handleSetPrimary}
              onDelete={setBannerToDelete}
              disabled={setPrimary.isPending || deleteBanner.isPending}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          No banners yet. Until one is added, this category page opens straight
          into its title — a valid look, not a broken one.
        </p>
      )}

      <ConfirmModal
        isOpen={Boolean(bannerToDelete)}
        onClose={() => setBannerToDelete(null)}
        onConfirm={handleDelete}
        title="Delete banner?"
        description="The image is removed from storage as well as the category. This cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isPending={deleteBanner.isPending}
      />
    </section>
  );
}
