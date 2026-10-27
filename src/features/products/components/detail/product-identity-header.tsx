"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { PermissionGate } from "@/lib/auth/permission-gate";
import { getProductSpecLine, getProductTitle } from "@/lib/utils/product-name";
import type { ProductDetail } from "../../types/products";

interface ProductIdentityHeaderProps {
  product: ProductDetail;
  onReindex: () => void;
  isReindexing: boolean;
}

/**
 * Who this product is: name, what is inside it, where it is filed, and whether
 * it is live.
 *
 * The title used to be `product.name` verbatim. Supplier names in this catalog
 * are spec dumps ("HP Laptop 15-fd0100nia - Intel Core 5-120U Processor, 8GB
 * DDR5 RAM, …"), so the page opened with a four-line heading that buried the
 * status badges and the actions below the fold. It now uses the storefront's
 * split: the name in the heading, the specs as the one-line summary under it.
 */
export function ProductIdentityHeader({
  product,
  onReindex,
  isReindexing,
}: ProductIdentityHeaderProps) {
  const title = getProductTitle(product.name);
  const specLine = getProductSpecLine(product);
  // The part number rides in the heading, in brackets, the way the storefront
  // PDP does it: in hardware retail it is what a returning buyer matches on,
  // and staff quote it back to them over the phone.
  const partNumber = product.variants?.[0]?.sku;

  return (
    <div className="space-y-3">
      <Link
        href="/catalogues/all"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary-ink"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Products
      </Link>

      <PageHeader
        title={
          <>
            {title}
            {partNumber && (
              <span className="font-medium text-muted-foreground">
                {" "}
                ({partNumber})
              </span>
            )}
          </>
        }
        description={specLine}
        className="mb-0"
      >
        <PermissionGate permission="search:admin">
          <Button
            variant="outline"
            className="h-10 rounded-lg font-medium"
            onClick={onReindex}
            disabled={isReindexing}
          >
            <AppIcon
              icon="solar:refresh-linear"
              className={`mr-2 size-4${isReindexing ? " animate-spin" : ""}`}
            />
            Re-index
          </Button>
        </PermissionGate>
        <Button asChild className="h-10 rounded-lg font-medium">
          <Link href={`/catalogues/${product.id}/edit`}>
            <AppIcon icon="solar:pen-2-linear" className="mr-2 size-4" />
            Edit product
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground"
          title="Catalogue ID"
        >
          {product.productId}
        </span>
        <Badge variant="outline">{product.brand.name}</Badge>
        <Badge variant="outline">{product.category.name}</Badge>
        <Badge variant={product.isActive ? "success" : "muted"}>
          <AppIcon
            icon={
              product.isActive
                ? "solar:check-circle-linear"
                : "solar:forbidden-circle-linear"
            }
            className="size-3.5"
          />
          {product.isActive ? "Active" : "Inactive"}
        </Badge>
        {product.isFeatured && (
          <Badge variant="warning">
            <AppIcon icon="solar:star-linear" className="size-3.5" />
            Featured
          </Badge>
        )}
      </div>
    </div>
  );
}
