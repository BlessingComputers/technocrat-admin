import { Card } from "@/components/ui/card";
import { MetaLabel } from "@/components/shared/meta-label";
import type { Preorder } from "../../types/preorders";

interface PreorderRequestCardProps {
  preorder: Preorder;
}

/** What the customer asked for, in their own words where they gave any. */
export function PreorderRequestCard({ preorder }: PreorderRequestCardProps) {
  return (
    <Card className="p-8 space-y-6">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
        The request
      </h2>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <Field label="Product" value={preorder.productName} className="col-span-2 sm:col-span-1" />
        <Field label="Brand" value={preorder.brand} />
        <Field label="Quantity" value={String(preorder.quantity)} />
      </div>

      <div>
        <MetaLabel>Customer&apos;s notes</MetaLabel>
        {preorder.productDescription ? (
          // `whitespace-pre-line` because this is free text a customer typed —
          // their line breaks are part of what they said (specs, model numbers
          // listed one per line) and flattening them loses the structure.
          <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-line">
            {preorder.productDescription}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground italic">
            They didn&apos;t add any. Worth asking for specifics before sourcing.
          </p>
        )}
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <MetaLabel>{label}</MetaLabel>
      <p className="mt-1 text-sm font-semibold tracking-tight text-foreground break-words">
        {value || "—"}
      </p>
    </div>
  );
}
