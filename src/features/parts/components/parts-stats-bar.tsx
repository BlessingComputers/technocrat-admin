import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

interface PartsStatsBarProps {
  total: number;
  inStock: number;
  outOfStock: number;
  partTypes: number;
  isLoading?: boolean;
}

const CARDS = [
  {
    key: "total" as const,
    title: "Total Parts",
    icon: "solar:cpu-bolt-linear",
    chip: "bg-primary/10 text-primary",
  },
  {
    key: "inStock" as const,
    title: "In Stock",
    icon: "solar:check-circle-linear",
    chip: "bg-success/15 text-success",
  },
  {
    key: "outOfStock" as const,
    title: "Out of Stock",
    icon: "solar:close-circle-linear",
    chip: "bg-destructive/12 text-destructive",
  },
  {
    key: "partTypes" as const,
    title: "Part Types",
    icon: "solar:widget-5-linear",
    chip: "bg-warning/15 text-warning",
  },
];

export function PartsStatsBar({
  total,
  inStock,
  outOfStock,
  partTypes,
  isLoading,
}: PartsStatsBarProps) {
  const values = { total, inStock, outOfStock, partTypes };
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => (
        <Card
          key={card.key}
          className="rounded-lg border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-start justify-between">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg",
                card.chip,
              )}
            >
              <AppIcon icon={card.icon} className="h-6 w-6" />
            </div>
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {card.title}
          </p>
          {isLoading ? (
            <div className="mt-1 h-8 w-12 animate-pulse rounded bg-muted" />
          ) : (
            <h3 className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {values[card.key]}
            </h3>
          )}
        </Card>
      ))}
    </div>
  );
}
