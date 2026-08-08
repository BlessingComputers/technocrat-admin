import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { ProductDetailVariant } from "../../types/products";

interface ProductPricingCardProps {
  /** The product's single pricing/inventory record. */
  variant?: ProductDetailVariant;
}

const STAT_LABEL =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";

/**
 * Pricing & inventory for a product. The variant concept is no longer exposed,
 * so this shows the single record's price, cost, condition, and stock. The SKU
 * is backend-generated and intentionally not surfaced here.
 */
export function ProductPricingCard({ variant }: ProductPricingCardProps) {
  if (!variant) {
    return (
      <Card className="border border-border p-6">
        <p className="text-sm text-muted-foreground">
          No pricing information available.
        </p>
      </Card>
    );
  }

  const isOut = variant.stockQuantity === 0;
  const isLow = variant.stockQuantity <= variant.lowStockThreshold;

  return (
    <Card className="border border-border p-0">
      <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <p className={STAT_LABEL}>Part Number</p>
          <p className="text-sm font-semibold font-mono text-foreground break-all">
            {variant.sku || "—"}
          </p>
        </div>

        <div className="space-y-1">
          <p className={STAT_LABEL}>Price</p>
          <p className="text-lg font-semibold text-foreground">
            {formatPrice(variant.price)}
          </p>
          <p className="text-xs text-muted-foreground">
            Cost: {formatPrice(variant.costPrice)}
          </p>
        </div>

        <div className="space-y-1">
          <p className={STAT_LABEL}>Condition</p>
          <Badge
            variant="outline"
            className="text-xs font-medium uppercase tracking-tight h-5"
          >
            {variant.condition}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className={STAT_LABEL}>Stock</p>
          <p
            className={cn(
              "text-lg font-semibold",
              isOut
                ? "text-destructive"
                : isLow
                  ? "text-warning"
                  : "text-foreground",
            )}
          >
            {variant.stockQuantity}
          </p>
          <p className="text-xs text-muted-foreground">
            Low at {variant.lowStockThreshold}
          </p>
        </div>

        <div className="space-y-1">
          <p className={STAT_LABEL}>Status</p>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-semibold",
              variant.isActive ? "text-success" : "text-muted-foreground",
            )}
          >
            <AppIcon
              icon={
                variant.isActive
                  ? "solar:check-circle-bold"
                  : "solar:close-circle-linear"
              }
              className="size-4"
            />
            {variant.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
