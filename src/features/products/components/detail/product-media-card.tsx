import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { ProductDetail } from "../../types/products";

interface ProductMediaCardProps {
  product: ProductDetail;
}

export function ProductMediaCard({ product }: ProductMediaCardProps) {
  const primary =
    product.images.find((img) => img.isPrimary)?.url ||
    product.primaryImage ||
    null;
  const unitsInStock = product.variants.reduce(
    (acc, v) => acc + (v.stockQuantity || 0),
    0,
  );

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border p-0">
        <div className="aspect-square relative bg-muted flex items-center justify-center">
          {primary ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primary}
              alt={product.name}
              className="w-full h-full object-contain p-6"
            />
          ) : (
            <AppIcon
              icon="solar:box-linear"
              className="size-16 text-muted-foreground/30"
            />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <MiniStat
          icon="solar:star-bold"
          chip="bg-primary/10 text-primary"
          value={`${product.averageRating} / 5.0`}
          label={`${product.reviewCount} Ratings`}
        />
        <MiniStat
          icon="solar:arrow-right-up-linear"
          chip="bg-success/15 text-success"
          value={String(product.totalSales)}
          label="Total Sales"
        />
        <MiniStat
          icon="solar:box-linear"
          chip="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          value={String(unitsInStock)}
          label="Units in Stock"
        />
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  chip,
  value,
  label,
}: {
  icon: string;
  chip: string;
  value: string;
  label: string;
}) {
  return (
    <Card className="bg-muted/30 border-none">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`size-10 rounded-xl flex items-center justify-center ${chip}`}>
          <AppIcon icon={icon} className="size-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
