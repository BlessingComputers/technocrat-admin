import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Composable loading-skeleton primitives + composed page skeletons.
 *
 * Every `(staff)` route is dynamic (the layout reads the session cookie), so
 * without a `loading.tsx` boundary Next.js skips prefetching and blocks
 * navigation on the server round-trip (see `.next-docs` linking-and-navigating →
 * "Dynamic routes without loading.tsx"). These skeletons back the `loading.tsx`
 * boundary that makes navigation instant.
 *
 * ── The loading-skeleton standard (follow this for every new route) ──────────
 *
 * 1. Instant nav: every data route ships a `loading.tsx`. Placeholder/instant
 *    routes (FeaturePlaceholder, static docs) ship NONE — they inherit the
 *    neutral `(staff)/loading.tsx` fallback. Don't add a bespoke loader to a
 *    page that renders instantly.
 *
 * 2. One skeleton, two consumers (no "swap"): a page's loading UI lives in a
 *    single server-safe component. The view renders it in its `isLoading`
 *    branch AND the route `loading.tsx` renders the same component. They must
 *    be the same import so the route-transition shell and the view's own
 *    loading state are pixel-identical.
 *
 * 3. Location: feature-specific skeletons live in `features/<x>/components/
 *    <x>-skeletons.tsx` (server-safe — no "use client") and are re-exported
 *    from the feature barrel so `app/` can import them (the boundary lint
 *    blocks deep feature imports). Cross-feature primitives live here.
 *
 * 4. Real static chrome: `loading.tsx` renders the real `<PageHeader>` (static
 *    title/description) and skeletons only the data region — the header should
 *    not flash. Skip this only where the header itself is data-derived
 *    (dashboard, detail pages), where the whole shell is a skeleton.
 *
 * 5. Tables early-return their skeleton (`if (isLoading) return <XTableSkeleton/>`)
 *    rather than rendering a spinner inside the table body — keeps the list
 *    loading state consistent and reusable by `loading.tsx`.
 *
 * Pure presentational + server-safe, so they import cleanly into server
 * `loading.tsx` files.
 */

/** Title + description + optional action buttons. Mirrors `PageHeader`. */
export function SkeletonPageHeader({
  actions = 1,
  className,
}: {
  actions?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end",
        className,
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {actions > 0 && (
        <div className="flex shrink-0 items-center gap-3">
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}

/** Responsive grid of KPI/stat cards. */
export function SkeletonStatCards({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Search field + a couple of filter controls. */
export function SkeletonFilterBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Skeleton className="h-10 min-w-[220px] flex-1 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}

/** A bordered table card: header strip + evenly-spaced rows. */
export function SkeletonTable({
  rows = 6,
  rowHeight = "h-16",
  className,
}: {
  rows?: number;
  rowHeight?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-lg border border-border bg-card p-0",
        className,
      )}
    >
      <CardHeader className="border-b bg-primary/[0.04] px-6 py-4">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={cn("w-full rounded-lg", rowHeight)} />
        ))}
      </CardContent>
    </Card>
  );
}

/** Loose stack of large rounded rows (matches list views without a table chrome). */
export function SkeletonRows({
  rows = 5,
  rowHeight = "h-24",
  className,
}: {
  rows?: number;
  rowHeight?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-xl", rowHeight)} />
      ))}
    </div>
  );
}

/** Responsive grid of large cards (dashboards, card layouts). */
export function SkeletonCardGrid({
  count = 4,
  columns = "sm:grid-cols-2",
  cardHeight = "h-48",
  className,
}: {
  count?: number;
  columns?: string;
  cardHeight?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-6", columns, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-xl", cardHeight)} />
      ))}
    </div>
  );
}

// ── Composed page skeletons ──────────────────────────────────────────────

/**
 * Neutral fallback: header + one large content block. Safe on any page shape
 * (used by the `(staff)` group fallback for placeholder/static routes).
 */
export function SkeletonPage() {
  return (
    <div className="w-full">
      <SkeletonPageHeader />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

/** List page: header + optional stat cards + filter bar + table. */
export function SkeletonListPage({
  stats = 0,
  filter = true,
  rows = 6,
  actions = 1,
}: {
  stats?: number;
  filter?: boolean;
  rows?: number;
  actions?: number;
}) {
  return (
    <div className="w-full space-y-6">
      <SkeletonPageHeader actions={actions} />
      {stats > 0 && <SkeletonStatCards count={stats} />}
      {filter && <SkeletonFilterBar />}
      <SkeletonTable rows={rows} />
    </div>
  );
}

/** Detail page: back link + header + two-column card layout. */
export function SkeletonDetailPage() {
  return (
    <div className="w-full space-y-6">
      <Skeleton className="h-4 w-24" />
      <SkeletonPageHeader actions={2} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Form page: header + stacked form-section cards. */
export function SkeletonFormPage({ sections = 3 }: { sections?: number }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <SkeletonPageHeader actions={2} />
      {Array.from({ length: sections }).map((_, i) => (
        <Card key={i} className="rounded-xl border border-border p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
