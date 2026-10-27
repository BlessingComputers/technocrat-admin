"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";

import {
  useProduct,
  useReindexProduct,
} from "@/features/products/api/products.queries";
import { ProductIdentityHeader } from "@/features/products/components/detail/product-identity-header";
import { ProductMediaCard } from "@/features/products/components/detail/product-media-card";
import { ProductOverviewTab } from "@/features/products/components/detail/product-overview-tab";
import { ProductPricingCard } from "@/features/products/components/detail/product-pricing-card";
import { ProductSpecifications } from "@/features/products/components/detail/product-specifications";
import { ProductVitals } from "@/features/products/components/detail/product-vitals";
import { ProductDetailSkeleton } from "@/features/products/components/products-skeletons";

/** Args handed to the parts slot so the parts feature can render without
 *  importing the products feature (composed at the app layer). */
export interface ProductPartsSlotArgs {
  productId: string;
  productSku?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  brandId?: string;
}

interface ProductDetailViewProps {
  productId: string;
  /** Renders the "Parts" tab content. Injected by the route (app layer). */
  partsSlot?: (args: ProductPartsSlotArgs) => ReactNode;
}

/**
 * Product detail view (route `/catalogues/[id]`).
 *
 * Reads top to bottom the way the questions arrive: who is this product, what
 * are its numbers, then the detail behind them. The vitals strip sits above the
 * tabs on purpose — price and stock are what an operator is on this page for,
 * and they used to be one click away behind the second tab.
 */
export function ProductDetailView({
  productId,
  partsSlot,
}: ProductDetailViewProps) {
  const { data: product, isLoading, isError } = useProduct(productId);
  const reindex = useReindexProduct();

  if (isLoading) return <ProductDetailSkeleton />;
  if (isError || !product) return <ProductNotFound />;

  const variant = product.variants?.[0];

  return (
    <div className="space-y-6 pb-12">
      <ProductIdentityHeader
        product={product}
        onReindex={() => reindex.mutate(product.id)}
        isReindexing={reindex.isPending}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProductMediaCard product={product} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <ProductVitals product={product} variant={variant} />

          <Tabs defaultValue="overview" className="w-full">
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & inventory</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              {partsSlot && <TabsTrigger value="parts">Parts</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview">
              <ProductOverviewTab product={product} />
            </TabsContent>
            <TabsContent value="pricing">
              <ProductPricingCard variant={variant} />
            </TabsContent>
            <TabsContent value="specifications">
              <ProductSpecifications
                specifications={product.specifications}
                partNumber={variant?.sku}
              />
            </TabsContent>
            {partsSlot && (
              <TabsContent value="parts">
                {partsSlot({
                  productId: product.id,
                  productSku: variant?.sku,
                  categoryId: product.categoryId,
                  subcategoryId: product.subcategoryId,
                  brandId: product.brandId,
                })}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ProductNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
        <AppIcon icon="solar:danger-circle-linear" className="size-8" />
      </div>
      <div className="space-y-1 text-center">
        <h3 className="text-xl font-semibold text-foreground">
          Error loading product
        </h3>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          We couldn&apos;t retrieve this product. It may have been removed or
          the ID is incorrect.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/catalogues/all">
          <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
          Back to products
        </Link>
      </Button>
    </div>
  );
}
