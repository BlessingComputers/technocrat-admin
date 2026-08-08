import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRows } from "@/components/shared/skeletons";

/**
 * Shared loading skeletons for the orders feature. Server-safe (no "use client")
 * so both the client views and the route-level `loading.tsx` files render the
 * exact same markup — no skeleton "swap" between the route transition and the
 * view's own loading state.
 */

/** Rows shown while the orders list query loads (used by `OrdersTable`). */
export function OrdersTableSkeleton() {
  return <SkeletonRows rows={5} rowHeight="h-24" />;
}

/** Full order-detail loading state (used by `OrderDetailView`). */
export function OrderDetailSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
        <div className="col-span-4 space-y-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
