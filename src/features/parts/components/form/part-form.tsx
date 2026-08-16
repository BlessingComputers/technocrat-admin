"use client";

import { useEffect, useState } from "react";
import {
  useForm,
  useWatch,
  FormProvider,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";

import {
  usePartCategories,
  usePartBrands,
  usePartTypes,
  useCreatePart,
  useUpdatePart,
  useLinkPart,
  useBulkUploadPartImages,
} from "../../api/parts.queries";
import type { PartDetail, PreUploadedPartImage } from "../../types/parts";
import {
  partFormSchema,
  toCreateDto,
  toUpdateDto,
  toFormDefaults,
  type PartFormValues,
} from "../../schemas/part-form";

import { PartGeneralSection } from "./part-general-section";
import { PartSmartPastePanel } from "./part-smart-paste-panel";
import { PartPricingSection } from "./part-pricing-section";
import { PartSpecificationsSection } from "./part-specifications-section";
import { PartStatusSection } from "./part-status-section";
import { PartImageSection } from "./part-image-section";
import { PartRestoreModal } from "../bulk/part-restore-modal";
import {
  partDraftStore,
  type LoadedPartDraft,
} from "../../utils/part-draft-store";

/** When present, the part is being created in the context of a product: its
 *  `ownerSku` and taxonomy are inherited from the product and, on save, it's
 *  linked to that product. */
export interface PartProductContext {
  productId: string;
  ownerSku: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
}

interface PartFormProps {
  initialData?: PartDetail;
  productContext?: PartProductContext;
}

export function PartForm({ initialData, productContext }: PartFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const { data: categories = [] } = usePartCategories();
  const { data: brands = [] } = usePartBrands();
  const { data: partTypes = [] } = usePartTypes();
  const createMutation = useCreatePart();
  const updateMutation = useUpdatePart();
  const linkMutation = useLinkPart();
  const bulkUploadMutation = useBulkUploadPartImages();

  // Images queued in the create-mode image section. On save they're uploaded
  // first (visible feedback) and their url/metadata is attached to the create.
  const [pendingImages, setPendingImages] = useState<
    { file: File; isPrimary: boolean }[]
  >([]);
  // Drives the image section's per-card + bar feedback during the pre-upload
  // (one image per request, like the bulk upload).
  const [imageUploadProgress, setImageUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);

  const defaults = toFormDefaults(initialData);
  if (productContext && !isEditing) {
    // Inherit ownerSku + taxonomy from the product (sent in the create payload).
    defaults.ownerSku = productContext.ownerSku;
    if (productContext.categoryId) defaults.categoryId = productContext.categoryId;
    if (productContext.subcategoryId)
      defaults.subcategoryId = productContext.subcategoryId;
    if (productContext.brandId) defaults.brandId = productContext.brandId;
  }

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: defaults,
  });

  // ── Draft persistence (create only) ────────────────────────────────────
  // Autosaves the in-progress form to localStorage (keyed per product) so the
  // uploader can resume after leaving/reloading. `ready` gates autosave until
  // the restore prompt is answered, so a pending draft can't be clobbered.
  const draftScope = productContext?.productId ?? "standalone";
  const [draft, setDraft] = useState<{
    pending: LoadedPartDraft | null;
    ready: boolean;
  }>({ pending: null, ready: false });

  useEffect(() => {
    if (isEditing) return;
    const loaded = partDraftStore.load(draftScope);
    // One-shot hydration of the restore prompt from localStorage on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft({ pending: loaded, ready: loaded === null });
  }, [isEditing, draftScope]);

  // Debounced autosave. `useWatch` re-renders on any field change (compiler-safe,
  // unlike a render-time `form.watch()`); the effect then persists the full values.
  const watchedValues = useWatch({ control: form.control });
  useEffect(() => {
    if (isEditing || !draft.ready) return;
    const t = setTimeout(() => {
      const values = form.getValues();
      // Only persist once there's real work (a name); otherwise drop the draft
      // so an untouched, inherited-defaults form doesn't re-prompt on return.
      if (values.name?.trim()) partDraftStore.save(draftScope, values);
      else partDraftStore.clear(draftScope);
    }, 400);
    return () => clearTimeout(t);
  }, [watchedValues, isEditing, draft.ready, draftScope, form]);

  const continueDraft = () => {
    if (draft.pending) form.reset(draft.pending.values);
    setDraft({ pending: null, ready: true });
  };
  const discardDraft = () => {
    partDraftStore.clear(draftScope);
    setDraft({ pending: null, ready: true });
  };

  const backHref = productContext
    ? `/catalogues/${productContext.productId}`
    : "/catalogues/parts";
  const backLabel = productContext ? "Product" : "Parts";

  const onSubmit: SubmitHandler<PartFormValues> = async (values) => {
    if (isEditing && initialData) {
      const promise = updateMutation.mutateAsync({
        id: initialData.partId,
        data: toUpdateDto(values),
      });
      toast.promise(promise, {
        loading: "Updating part…",
        success: `Part “${values.name}” updated.`,
        error: (err) => getErrorMessage(err, "Failed to update part."),
      });
      try {
        await promise;
        router.push(`/catalogues/parts/${initialData.partId}`);
      } catch {
        // toast already surfaced the error
      }
      return;
    }

    const dto = toCreateDto(values);

    // Upload the queued images FIRST — one request per image so the section can
    // show per-card + bar progress (mirrors the bulk upload) — then attach their
    // url + storage metadata to the create payload. The JSON create is then
    // instant with no timeout risk.
    if (pendingImages.length > 0) {
      const preUploadedImages: PreUploadedPartImage[] = [];
      setImageUploadProgress({ completed: 0, total: pendingImages.length });
      try {
        for (let i = 0; i < pendingImages.length; i++) {
          const key = `img-${i}`;
          const res = await bulkUploadMutation.mutateAsync([
            { file: pendingImages[i].file, key },
          ]);
          const meta = res[key];
          if (meta) {
            preUploadedImages.push({
              url: meta.url,
              storagePublicId: meta.storagePublicId,
              storageProvider: meta.storageProvider,
              isPrimary: pendingImages[i].isPrimary,
              sortOrder: i,
            });
          }
          setImageUploadProgress({ completed: i + 1, total: pendingImages.length });
        }
      } catch (err) {
        // Don't create the part if its images failed to upload — the form keeps
        // the user's input so they can retry.
        setImageUploadProgress(null);
        toast.error(getErrorMessage(err, "Failed to upload images. Please try again."));
        return;
      }
      setImageUploadProgress(null);
      if (preUploadedImages.length) dto.preUploadedImages = preUploadedImages;
    }

    const createPromise = createMutation.mutateAsync(dto);
    toast.promise(createPromise, {
      loading: "Creating part…",
      success: `Part “${values.name}” created.`,
      error: (err) => getErrorMessage(err, "Failed to create part."),
    });

    try {
      const result = await createPromise;
      // The part is saved — drop its draft so it doesn't re-prompt on return.
      partDraftStore.clear(draftScope);
      if (productContext) {
        // Link the new part to its product so it appears under the product's
        // Parts tab. If the link fails, the part still exists — point the user at
        // "Attach existing" rather than losing their work.
        try {
          await linkMutation.mutateAsync({
            productId: productContext.productId,
            data: { partId: result.id, sortOrder: 0 },
          });
        } catch {
          toast.error(
            "Part created, but linking to the product failed. Attach it from the product's Parts tab.",
          );
        }
        router.push(`/catalogues/${productContext.productId}`);
      } else {
        // Images were attached at create — go straight to the part detail.
        router.push(`/catalogues/parts/${result.partId}`);
      }
    } catch {
      // toast already surfaced the error
    }
  };

  const isPending = isEditing
    ? updateMutation.isPending
    : createMutation.isPending ||
      linkMutation.isPending ||
      bulkUploadMutation.isPending ||
      imageUploadProgress !== null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!isEditing && (
        <PartRestoreModal
          open={!!draft.pending}
          partCount={1}
          savedAt={draft.pending?.savedAt ?? 0}
          onContinue={continueDraft}
          onDiscard={discardDraft}
        />
      )}

      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary-ink"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        {backLabel}
      </Link>

      <PageHeader
        title={isEditing ? "Edit Part" : "New Part"}
        description={
          isEditing
            ? initialData!.name
            : productContext
              ? `New part for ${productContext.ownerSku || "this product"}`
              : "Create a new part"
        }
      />

      <Card>
        <CardContent className="p-6 lg:p-8">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {!isEditing && (
                <PartSmartPastePanel
                  categories={categories}
                  brands={brands}
                  partTypes={partTypes}
                  lockOwnerSku={!!productContext}
                />
              )}
              <PartGeneralSection
                categories={categories}
                brands={brands}
                partTypes={partTypes}
                isEditing={isEditing}
              />
              <PartPricingSection />
              <PartSpecificationsSection />
              <PartStatusSection />
              <PartImageSection
                partId={initialData?.partId}
                images={initialData?.images}
                partName={form.getValues("name")}
                onPendingChange={!isEditing ? setPendingImages : undefined}
                uploadProgress={!isEditing ? imageUploadProgress : undefined}
              />

              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 min-w-[150px] rounded-lg font-semibold"
                >
                  {isPending && (
                    <AppIcon
                      icon="solar:refresh-linear"
                      className="mr-2 size-4 animate-spin"
                    />
                  )}
                  {isEditing ? "Update Part" : "Save Part"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
