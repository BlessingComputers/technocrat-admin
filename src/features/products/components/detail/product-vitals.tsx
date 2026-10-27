import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { MetaLabel } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { SOURCE_LABEL } from "../../constants/product-display";
import { ProductStockBadge } from "../product-stock-badge";
import type { ProductDetail, ProductDetailVariant } from "../../types/products";

interface ProductVitalsProps {
  product: ProductDetail;
  /** The product's single pricing/inventory record. */
  variant?: ProductDetailVariant;
}

/**
 * The readings an operator needs before they need anything else: what it sells
 * for, how many are left, what condition it is in, and how it moves.
 *
 * These were previously split between three stat cards stacked down the media
 * rail and a tab the operator had to click into, which meant the two questions
 * this page exists to answer (is it in stock, what does it cost) were never
 * both on screen. One instrument strip, always visible, above the tabs.
 *
 * It is deliberately not six cards. DESIGN.md's density rule is that surfaces
 * stay quiet so the data is loud, so this is a single card divided by hairlines
 * (a 1px grid gap over a border-coloured ground) rather than a card grid. Six
 * readings, so every breakpoint — 2, 3, or 6 columns — fills its rows exactly
 * and no cell is left empty.
 */
export function ProductVitals({ product, variant }: ProductVitalsProps) {
  const stock = variant?.stockQuantity ?? 0;
  const isOut = stock === 0;
  const isLow = variant ? stock <= variant.lowStockThreshold : false;

  return (
    <Card className="grid grid-cols-2 gap-px overflow-hidden bg-border/60 p-0 sm:grid-cols-3 xl:grid-cols-6">
      <Vital label="Price">
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {variant ? formatPrice(variant.price) : "—"}
        </span>
      </Vital>

      <Vital label="On hand">
        <span
          className={cn(
            "text-lg font-semibold tabular-nums",
            isOut
              ? "text-destructive-ink"
              : isLow
                ? "text-warning-ink"
                : "text-foreground",
          )}
        >
          {variant ? stock : "—"}
        </span>
      </Vital>

      <Vital label="Availability">
        <ProductStockBadge
          status={variant?.availabilityStatus ?? product.availabilityStatus}
        />
      </Vital>

      <Vital label="Condition">
        <span className="text-sm font-semibold text-foreground">
          {variant?.condition ?? "—"}
        </span>
        {variant?.sourcingType && (
          <span className="block text-xs text-muted-foreground">
            {SOURCE_LABEL[variant.sourcingType] ?? variant.sourcingType}
          </span>
        )}
      </Vital>

      <Vital label="Units sold">
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {product.totalSales}
        </span>
      </Vital>

      <Vital label="Rating">
        {product.reviewCount > 0 ? (
          <>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {product.averageRating}
              <span className="text-sm font-normal text-muted-foreground">
                /5
              </span>
            </span>
            <span className="block text-xs text-muted-foreground">
              {product.reviewCount} review
              {product.reviewCount === 1 ? "" : "s"}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No reviews yet</span>
        )}
      </Vital>
    </Card>
  );
}

function Vital({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 bg-card p-4">
      <MetaLabel>{label}</MetaLabel>
      <div className="min-w-0 truncate">{children}</div>
    </div>
  );
}
