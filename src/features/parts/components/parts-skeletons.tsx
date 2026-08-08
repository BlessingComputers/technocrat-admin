import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRows } from "@/components/shared/skeletons";

/**
 * Shared loading skeletons for the parts feature. Server-safe (no "use client")
 * so the client views and the route `loading.tsx` files render identical markup.
 */

/** Rows shown while the parts list query loads (used by `PartsTable`). */
export function PartsTableSkeleton() {
  return (
    <div className="p-4">
      <SkeletonRows rows={8} rowHeight="h-16" />
    </div>
  );
}

/** Full part-detail loading state (used by `PartDetailView`). */
export function PartDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="aspect-square rounded-xl lg:col-span-1" />
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Full part create/edit form loading state (used by `PartFormView`). */
export function PartFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}

/** Rows shown while the parts markup-rules query loads (used by parts `MarkupRulesTable`). */
export function PartsMarkupTableSkeleton() {
  return (
    <div className="p-4">
      <SkeletonRows rows={5} rowHeight="h-14" />
    </div>
  );
}

/** Card grid shown while the part-types query loads (used by `PartTypesPanel`). */
export function PartTypesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}
