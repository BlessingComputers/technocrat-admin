import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRows } from "@/components/shared/skeletons";

/**
 * Loading skeletons for the coupons catalogue. Server-safe (no "use client")
 * so the client views and the route `loading.tsx` render identical markup —
 * one skeleton, two consumers, no swap on navigation (see the standard in
 * `components/shared/skeletons.tsx`).
 */

/** Chip row placeholder — All plus one per stored status. */
export function CouponsStatusChipsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-28 rounded-full" />
      ))}
    </div>
  );
}

/** Rows shown while the list query loads (used by `CouponsTable`). */
export function CouponsTableSkeleton() {
  return <SkeletonRows rows={6} rowHeight="h-20" />;
}

/** The create/edit form shell, while an edit page resolves its coupon. */
export function CouponFormSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-[88px] w-full rounded-xl" />
      <Skeleton className="h-[72px] w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-[72px] w-full rounded-xl" />
        <Skeleton className="h-[72px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-[72px] w-full rounded-xl" />
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}
