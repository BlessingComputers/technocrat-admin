"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";
import { getProductTitle } from "@/lib/utils/product-name";
import type { ProductDetail } from "../../types/products";

interface ProductMediaCardProps {
  product: ProductDetail;
}

/**
 * The product's images: one large view plus a thumbnail strip to switch it.
 *
 * The gallery used to be a second, unrelated grid further down the page, so an
 * operator checking whether a listing has usable photos had to scroll past the
 * tabs to find out, and the large image on the left never changed. One surface
 * now, in the rail, with the primary image marked.
 */
export function ProductMediaCard({ product }: ProductMediaCardProps) {
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeId, setActiveId] = useState<string | null>(
    () => images.find((img) => img.isPrimary)?.id ?? images[0]?.id ?? null,
  );

  const active = images.find((img) => img.id === activeId) ?? images[0];
  const shown = active?.url ?? product.primaryImage ?? null;
  const alt = active?.altText || getProductTitle(product.name);

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden p-0">
        <div className="relative flex aspect-square items-center justify-center bg-muted">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt={alt}
              className="h-full w-full object-contain p-6"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <AppIcon icon="solar:gallery-linear" className="size-10" />
              <MetaLabel>No images uploaded</MetaLabel>
            </div>
          )}
          {active?.isPrimary && (
            <Badge className="absolute left-3 top-3">Primary</Badge>
          )}
        </div>
      </Card>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img) => {
            const isActive = img.id === active?.id;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveId(img.id)}
                aria-label={img.altText || `View image ${img.sortOrder + 1}`}
                aria-pressed={isActive}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border bg-muted transition-colors",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  isActive
                    ? "border-primary ring-1 ring-primary/40"
                    : "border-border hover:border-primary/40",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-contain p-1.5"
                />
                {img.isPrimary && (
                  <span
                    className="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
                    title="Primary image"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-xs text-muted-foreground">
          This product will show a placeholder on the storefront. Add images
          from Edit product.
        </p>
      )}
    </div>
  );
}
