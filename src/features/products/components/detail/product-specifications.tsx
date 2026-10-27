import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import type { ProductSpecification } from "../../types/products";

interface ProductSpecificationsProps {
  specifications: ProductSpecification[];
  /** The product's part number (variant SKU) — shown first as "Part Number". */
  partNumber?: string | null;
}

/**
 * The spec sheet, as one definition list.
 *
 * Every row used to be its own `<Card>`, so a laptop with eighteen specs
 * rendered eighteen cards — a card grid standing in for a table, which
 * DESIGN.md rules out twice over (cards are the lazy answer, and a card per row
 * is not what a card is for). One card, two columns, hairlines between rows.
 */
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
      <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
        <AppIcon
          icon="solar:document-text-linear"
          className="mx-auto mb-2 size-8 text-muted-foreground/40"
        />
        <p className="text-sm font-medium text-foreground">
          No specifications yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Specs drive storefront filtering and the product summary line. Add
          them from Edit product.
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* Hairlines are drawn on the top edge of each row, so the grid never
          leaves a stray line hanging under the last one however the rows wrap.
          The first row of each column drops it. */}
      <dl className="grid grid-cols-1 md:grid-cols-2">
        {entries.map((spec, i) => (
          <div
            key={spec.name}
            data-first-row={i < 2 ? "" : undefined}
            className="flex items-baseline justify-between gap-4 border-t border-border/50 px-5 py-3 first:border-t-0 md:odd:border-r md:odd:border-r-border/50 md:data-[first-row]:border-t-0"
          >
            <MetaLabel asChild>
              <dt className="shrink-0">{spec.name}</dt>
            </MetaLabel>
            <dd className="min-w-0 text-right text-sm font-semibold text-foreground">
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
