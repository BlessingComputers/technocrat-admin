import { Card } from "@/components/ui/card";
import { MarkupRulesTableSkeleton } from "@/features/products";

/**
 * Loading state for `/pricing/markup`. Mirrors the loaded default (Products)
 * exactly — centered `max-w-6xl` column, the Products/Parts toggle, a
 * `PageHeader`-shaped title/actions block, then the table Card — so the page
 * does not reflow when the client shell hydrates.
 */
export default function MarkupLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Products / Parts toggle */}
      <div className="h-10 w-[212px] max-w-full animate-pulse rounded-lg bg-muted" />

      {/* Header — matches PageHeader's layout (title + description left, actions
          right, mb-8). */}
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="h-8 w-52 max-w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted/70" />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="hidden h-10 w-44 animate-pulse rounded-lg bg-muted sm:block" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <MarkupRulesTableSkeleton />
      </Card>
    </div>
  );
}
