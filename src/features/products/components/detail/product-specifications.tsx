import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { ProductSpecification } from "../../types/products";

interface ProductSpecificationsProps {
  specifications: ProductSpecification[];
  /** The product's part number (variant SKU) — shown first as "Part Number". */
  partNumber?: string | null;
}

export function ProductSpecifications({
  specifications,
  partNumber,
}: ProductSpecificationsProps) {
  // Lead with the part number (from the SKU); drop any stored "Part Number"
  // spec so it never duplicates.
  const entries: { name: string; value: string }[] = [
    ...(partNumber ? [{ name: "Part Number", value: partNumber }] : []),
    ...[...specifications]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((spec) => spec.name.trim().toLowerCase() !== "part number")
      .map((spec) => ({ name: spec.name, value: spec.value })),
  ];

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center bg-muted/20 rounded-xl border border-dashed border-border">
        <AppIcon
          icon="solar:info-circle-linear"
          className="size-8 text-muted-foreground/30 mx-auto mb-2"
        />
        <p className="text-sm text-muted-foreground italic">
          No specifications provided for this product.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map((spec, i) => (
        <Card key={i} className="border border-border bg-muted/10">
          <CardContent className="p-3 flex justify-between items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {spec.name}
            </span>
            <span className="text-sm font-semibold text-foreground text-right">
              {spec.value}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
