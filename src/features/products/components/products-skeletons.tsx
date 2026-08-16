import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { SkeletonRows } from "@/components/shared/skeletons";

/**
 * Shared loading skeletons for the products feature. Server-safe (no
 * "use client") so the client views and the route `loading.tsx` files render
 * identical markup.
 */

/** Rows shown while the products list query loads (used by `ProductsTable`). */
export function ProductsTableSkeleton() {
  return (
    <div className="p-4">
      <SkeletonRows rows={8} rowHeight="h-16" />
    </div>
  );
}

/** Full product-detail loading state (used by `ProductDetailView`). */
export function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="aspect-square rounded-xl lg:col-span-1" />
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full product create/edit form loading state (used by `ProductFormView`). */
export function ProductFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}

/** Rows shown while the markup-rules query loads (used by `MarkupRulesTable`). */
export function MarkupRulesTableSkeleton() {
  return (
    <div className="p-4">
      <SkeletonRows rows={5} rowHeight="h-14" />
    </div>
  );
}

/** Recently-added snapshot rows on the products hub (used by `RecentProductsSnapshot`). */
export function RecentProductsSnapshotSkeleton() {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="size-11 shrink-0 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** List rows shown while a category column loads (used by `CategoriesPanel`). */
export function CategoriesListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 rounded-lg" />
      ))}
    </div>
  );
}

/** Card grid shown while the brands query loads (used by `BrandsPanel`). */
export function BrandsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

/**
 * Full taxonomy "Categories" tab loading state (default tab of
 * `/catalogues/taxonomy`). Two columns matching `CategoriesPanel`.
 */
export function CategoriesPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {[0, 1].map((col) => (
        <Card key={col} className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border p-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
          <CategoriesListSkeleton />
        </Card>
      ))}
    </div>
  );
}
