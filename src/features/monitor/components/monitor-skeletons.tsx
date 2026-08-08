import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRows } from "@/components/shared/skeletons";

/**
 * Shared loading skeletons for the monitor feature. Server-safe (no
 * "use client") so route-level `loading.tsx` files and the client views
 * render identical markup — mirrors `payments/components/payments-skeletons.tsx`.
 */

export function MonitorTableSkeleton() {
  return <SkeletonRows rows={8} rowHeight="h-14" />;
}

export function MonitorDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <Skeleton className="h-[180px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-[180px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function MonitorStatsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[110px] w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[280px] w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MonitorAnomaliesSkeleton() {
  return <SkeletonRows rows={4} rowHeight="h-24" />;
}
