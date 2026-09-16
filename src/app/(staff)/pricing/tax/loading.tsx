import { Card } from "@/components/ui/card";

/**
 * Loading state for `/pricing/tax`. Mirrors the loaded view — centered
 * `max-w-6xl` column, the store-wide setting panel, then the scoped-rules
 * heading with its Products/Parts switch above the table Card.
 */
export default function TaxLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card className="h-40 animate-pulse bg-muted/40" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/70" />
        </div>
        <div className="h-10 w-[212px] max-w-full animate-pulse rounded-lg bg-muted" />
      </div>

      <Card className="h-64 animate-pulse bg-muted/40" />
    </div>
  );
}
