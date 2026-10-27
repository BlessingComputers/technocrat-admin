import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { SOURCE_LABEL } from "../../constants/product-display";
import type { ProductDetailVariant } from "../../types/products";

interface ProductPricingCardProps {
  /** The product's single pricing/inventory record. */
  variant?: ProductDetailVariant;
}

/**
 * The deep pricing and inventory view. The headline numbers (price, units on
 * hand, condition) live in the vitals strip above the tabs; this is what an
 * operator opens the tab for — margin, cost, what is reserved against orders,
 * and where the low-stock line sits.
 *
 * The old layout put five readings into a four-column grid, which left a hole
 * in the second row at every width above `md`.
 */
export function ProductPricingCard({ variant }: ProductPricingCardProps) {
  if (!variant) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
        <AppIcon
          icon="solar:tag-price-linear"
          className="mx-auto mb-2 size-8 text-muted-foreground/40"
        />
        <p className="text-sm font-medium text-foreground">No pricing record</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This product cannot be sold until a price and stock level are set.
        </p>
      </div>
    );
  }

  // Margin on the sale price, the way it is quoted internally. Guarded because
  // a zero price is a real state here — a draft product that has stock but has
  // not been priced yet.
  const marginValue = variant.price - variant.costPrice;
  const marginPct = variant.price > 0 ? (marginValue / variant.price) * 100 : null;

  const available = Math.max(variant.stockQuantity - variant.reservedQuantity, 0);
  const isOut = variant.stockQuantity === 0;
  const isLow = variant.stockQuantity <= variant.lowStockThreshold;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel icon="solar:tag-price-linear" title="Pricing">
        <Figure label="Sale price" value={formatPrice(variant.price)} strong />
        <Figure label="Cost price" value={formatPrice(variant.costPrice)} />
        {variant.compareAtPrice > 0 && (
          <Figure
            label="Compare at"
            value={formatPrice(variant.compareAtPrice)}
          />
        )}
        <Figure
          label="Margin"
          value={
            marginPct === null
              ? "Not priced"
              : `${formatPrice(marginValue)} · ${marginPct.toFixed(1)}%`
          }
          tone={
            marginPct === null
              ? "muted"
              : marginValue <= 0
                ? "danger"
                : "success"
          }
        />
      </Panel>

      <Panel icon="solar:box-linear" title="Inventory">
        <Figure
          label="Units on hand"
          value={String(variant.stockQuantity)}
          strong
          tone={isOut ? "danger" : isLow ? "warning" : undefined}
        />
        <Figure
          label="Reserved against orders"
          value={String(variant.reservedQuantity)}
        />
        <Figure label="Free to sell" value={String(available)} />
        <Figure
          label="Low-stock alert at"
          value={String(variant.lowStockThreshold)}
        />
      </Panel>

      <Panel icon="solar:hashtag-linear" title="Identity" className="lg:col-span-2">
        <Figure label="Part number" value={variant.sku || "—"} mono />
        <Figure label="Condition" value={variant.condition || "—"} />
        <Figure
          label="Sourcing"
          value={
            variant.sourcingType
              ? (SOURCE_LABEL[variant.sourcingType] ?? variant.sourcingType)
              : "—"
          }
        />
        <Figure
          label="Sellable"
          value={variant.isActive ? "Yes" : "No"}
          tone={variant.isActive ? "success" : "muted"}
        />
      </Panel>
    </div>
  );
}

function Panel({
  icon,
  title,
  className,
  children,
}: {
  icon: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <AppIcon icon={icon} className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {children}
      </CardContent>
    </Card>
  );
}

const TONE: Record<string, string> = {
  success: "text-success-ink",
  warning: "text-warning-ink",
  danger: "text-destructive-ink",
  muted: "text-muted-foreground",
};

function Figure({
  label,
  value,
  strong,
  mono,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
  tone?: "success" | "warning" | "danger" | "muted";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-2.5 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
      <MetaLabel className="shrink-0">{label}</MetaLabel>
      <span
        className={cn(
          "min-w-0 truncate text-right font-semibold tabular-nums",
          strong ? "text-base" : "text-sm",
          mono && "font-mono text-xs",
          tone ? TONE[tone] : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
