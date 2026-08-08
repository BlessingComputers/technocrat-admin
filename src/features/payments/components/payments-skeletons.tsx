import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRows } from "@/components/shared/skeletons";

/**
 * Shared loading skeletons for the payments feature. Server-safe (no
 * "use client") so route-level `loading.tsx` files and the client views
 * render identical markup — mirrors `orders/components/orders-skeletons.tsx`.
 */

export function PaymentsTableSkeleton() {
  return <SkeletonRows rows={5} rowHeight="h-20" />;
}

export function PaymentDetailSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <Skeleton className="h-[240px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
        <div className="col-span-4 space-y-6">
          <Skeleton className="h-[180px] w-full rounded-xl" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
