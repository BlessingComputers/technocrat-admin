import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRows } from "@/components/shared/skeletons";

/**
 * Shared loading skeletons for the customers feature. Server-safe (no "use
 * client") so the client views and the route `loading.tsx` files render the
 * exact same markup — no skeleton "swap" on navigation.
 */

/** Rows shown while the customer list query loads (used by `CustomersTable`). */
export function CustomersTableSkeleton() {
  return <SkeletonRows rows={6} rowHeight="h-20" />;
}

/** Full customer-detail loading state (used by `CustomerDetailView`). */
export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-8 pb-20">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <Skeleton className="h-[360px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-[260px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
