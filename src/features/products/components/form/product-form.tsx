"use client";

import { useCallback, useState } from "react";
import { useForm, FormProvider, type SubmitHandler } from "react-hook-form";
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
  useCategories,
  useBrands,
  useCreateProduct,
  useUpdateProduct,
} from "../../api/products.queries";
import type { NewProductImage, ProductDetail } from "../../types/products";
import {
  productFormSchema,
  toCreateDto,
  toFormDefaults,
  type ProductFormValues,
} from "../../schemas/product-form";

import { AiFillPanel } from "./ai-fill-panel";
import { GeneralDetailsSection } from "./general-details-section";
import { VariantsSection } from "./variants-section";
import { SpecificationsSection } from "./specifications-section";
import { StatusSection } from "./status-section";
import { ImageUploadSection } from "./image-upload-section";

interface ProductFormProps {
  initialData?: ProductDetail;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Create only: images queued in the form travel with `POST /products` (see
  // productsService.createProduct) instead of needing a saved product first.
  const [pendingImages, setPendingImages] = useState<NewProductImage[]>([]);
  const [imageProgress, setImageProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormDefaults(initialData),
  });

  // Stable identity — ImageUploadSection reports the queue from an effect.
  const handlePendingChange = useCallback(
    (images: NewProductImage[]) => setPendingImages(images),
    [],
  );

  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    const dto = toCreateDto(values);
    // The variant `id` lives in the form's defaultValues but has no registered
    // input, so RHF doesn't reliably round-trip it back out on submit. Without
    // it, updateProduct can't tell which variant to PATCH and skips it — the
    // price/SKU/stock edits silently never persist. Re-attach the id from the
    // loaded product (index-aligned; there is exactly one variant today).
    if (isEditing && initialData) {
      dto.variants = dto.variants.map((variant, i) => ({
        ...variant,
        id: initialData.variants[i]?.id ?? variant.id,
      }));
    }
    const imageCount = pendingImages.length;
    if (!isEditing && imageCount > 0) {
      setImageProgress({ completed: 0, total: imageCount });
    }

    // Create resolves to `{ id, productId, message }`, update to a full
    // ProductDetail — only the id is used from here.
    const promise: Promise<{ id: string }> = isEditing
      ? updateMutation.mutateAsync({ id: initialData!.id, data: dto })
      : createMutation.mutateAsync({
          data: dto,
          images: pendingImages,
          onProgress: (completed, total) =>
            setImageProgress({ completed, total }),
        });

    toast.promise(promise, {
      loading: isEditing
        ? "Updating product…"
        : imageCount > 0
          ? `Creating product with ${imageCount} image(s)…`
          : "Creating product…",
      success: `Product “${values.name}” ${isEditing ? "updated" : "created"}.`,
      error: (err) =>
        getErrorMessage(err, `Failed to ${isEditing ? "update" : "create"} product.`),
    });

    try {
      const result = await promise;
      // Images already went up with the create, so land on the product itself
      // rather than the edit form.
      router.push(
        isEditing ? `/catalogues/${initialData!.id}` : `/catalogues/${result.id}`,
      );
    } catch {
      // toast already surfaced the error
    } finally {
      setImageProgress(null);
    }
  };

  const isPending = isEditing
    ? updateMutation.isPending
    : createMutation.isPending;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/catalogues"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary-ink transition-colors"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Products
      </Link>

      <PageHeader
        title={isEditing ? "Edit Product" : "New Product"}
        description={
          isEditing ? initialData!.name : "Create a new product listing"
        }
      />

      <Card>
        <CardContent className="p-6 lg:p-8">
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <AiFillPanel categories={categories} brands={brands} />
              <GeneralDetailsSection
                categories={categories}
                brands={brands}
                isEditing={isEditing}
              />
              <VariantsSection
                missingDefaultVariant={
                  isEditing && !initialData?.variants?.length
                }
              />
              <SpecificationsSection />
              <StatusSection />
              <ImageUploadSection
                productId={initialData?.id}
                images={initialData?.images}
                productName={form.getValues("name")}
                onPendingChange={handlePendingChange}
                progress={imageProgress}
              />

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="min-w-[150px] h-11 rounded-lg font-semibold"
                >
                  {isPending && (
                    <AppIcon
                      icon="solar:refresh-linear"
                      className="animate-spin size-4 mr-2"
                    />
                  )}
                  {isEditing ? "Update Product" : "Save Product"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
