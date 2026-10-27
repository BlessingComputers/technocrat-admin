import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRows } from "@/components/shared/skeletons";

/**
 * Loading skeletons for the pre-orders queue. Server-safe (no "use client") so
 * the client views and any route `loading.tsx` render identical markup — no
 * skeleton swap on navigation.
 */

/** Rows shown while the queue query loads (used by `PreordersTable`). */
export function PreordersTableSkeleton() {
  return <SkeletonRows rows={6} rowHeight="h-20" />;
}

/** Full pre-order detail loading state (used by `PreorderDetailView`). */
export function PreorderDetailSkeleton() {
  return (
    <div className="space-y-8 pb-20">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[240px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-[240px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
