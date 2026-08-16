"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { useProduct } from "../api/products.queries";
import { ProductForm } from "./form/product-form";
import { ProductFormSkeleton } from "./products-skeletons";

interface ProductFormViewProps {
  /** Omit for create mode; pass the product id to edit. */
  productId?: string;
}

/** Create/edit route entry (`/catalogues/new`, `/catalogues/[id]/edit`). */
export function ProductFormView({ productId }: ProductFormViewProps) {
  // Create mode — render the empty form immediately.
  if (!productId) return <ProductForm />;

  return <EditProductForm productId={productId} />;
}

function EditProductForm({ productId }: { productId: string }) {
  const { data: product, isLoading, isError } = useProduct(productId);

  if (isLoading) return <ProductFormSkeleton />;
  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive-ink">
          <AppIcon icon="solar:danger-circle-linear" className="size-8" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            Product not found
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            We couldn&apos;t load this product to edit. It may have been
            removed.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/catalogues/all?page=1&limit=20">
            <AppIcon
              icon="solar:alt-arrow-left-linear"
              className="size-4 mr-2"
            />
            Back to Products
          </Link>
        </Button>
      </div>
    );
  }

  return <ProductForm initialData={product} />;
}
