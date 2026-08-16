"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { PermissionGate } from "@/lib/auth/permission-gate";

import {
  useProduct,
  useReindexProduct,
} from "@/features/products/api/products.queries";
import { ProductMediaCard } from "@/features/products/components/detail/product-media-card";
import { ProductOverviewTab } from "@/features/products/components/detail/product-overview-tab";
import { ProductPricingCard } from "@/features/products/components/detail/product-pricing-card";
import { ProductSpecifications } from "@/features/products/components/detail/product-specifications";
import { ProductImageGallery } from "@/features/products/components/detail/product-image-gallery";
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

/** Product detail view (route `/catalogues/[id]`). */
export function ProductDetailView({
  productId,
  partsSlot,
}: ProductDetailViewProps) {
  const { data: product, isLoading, isError } = useProduct(productId);
  const reindex = useReindexProduct();

  if (isLoading) return <ProductDetailSkeleton />;
  if (isError || !product) return <ProductNotFound />;

  return (
    <div className="space-y-6 pb-12">
      <Link
        href="/catalogues/all?page=1&limit=20"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary-ink transition-colors"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Products
      </Link>

      <PageHeader title={product.name} description={product.productId}>
        <Badge
          variant={product.isActive ? "success" : "muted"}
          className="font-semibold text-xs px-2.5 py-1 rounded-full"
        >
          {product.isActive ? "Active" : "Inactive"}
        </Badge>
        {product.isFeatured && (
          <Badge
            variant="warning"
            className="font-semibold text-xs px-2.5 py-1 rounded-full"
          >
            Featured
          </Badge>
        )}
        <PermissionGate permission="search:admin">
          <Button
            variant="outline"
            className="h-10 rounded-lg font-medium"
            onClick={() => reindex.mutate(product.id)}
            disabled={reindex.isPending}
          >
            <AppIcon
              icon="solar:refresh-linear"
              className={`size-4 mr-2${reindex.isPending ? " animate-spin" : ""}`}
            />
            Re-index
          </Button>
        </PermissionGate>
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href={`/catalogues/${product.id}/edit`}>
            <AppIcon icon="solar:pen-2-linear" className="size-4 mr-2" />
            Edit Product
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProductMediaCard product={product} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList variant="line" className="mb-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              {partsSlot && <TabsTrigger value="parts">Parts</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview">
              <ProductOverviewTab product={product} />
            </TabsContent>
            <TabsContent value="pricing">
              <ProductPricingCard variant={product.variants?.[0]} />
            </TabsContent>
            <TabsContent value="specifications">
              <ProductSpecifications
                specifications={product.specifications}
                partNumber={product.variants?.[0]?.sku}
              />
            </TabsContent>
            {partsSlot && (
              <TabsContent value="parts">
                {partsSlot({
                  productId: product.id,
                  productSku: product.variants?.[0]?.sku,
                  categoryId: product.categoryId,
                  subcategoryId: product.subcategoryId,
                  brandId: product.brandId,
                })}
              </TabsContent>
            )}
          </Tabs>

          <ProductImageGallery
            images={product.images}
            productName={product.name}
          />
        </div>
      </div>
    </div>
  );
}

function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive-ink">
        <AppIcon icon="solar:danger-circle-linear" className="size-8" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-xl font-semibold text-foreground">
          Error loading product
        </h3>
        <p className="text-muted-foreground max-w-xs mx-auto text-sm">
          We couldn&apos;t retrieve this product. It may have been removed or
          the ID is incorrect.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/catalogues">
          <AppIcon icon="solar:alt-arrow-left-linear" className="size-4 mr-2" />
          Back to Products
        </Link>
      </Button>
    </div>
  );
}
