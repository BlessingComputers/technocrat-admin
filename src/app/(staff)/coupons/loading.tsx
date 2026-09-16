import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CouponsStatusChipsSkeleton,
  CouponsTableSkeleton,
} from "@/features/coupons";

/**
 * Loading state for `/coupons`. Renders the real header — its title,
 * description and primary action are static, so they should not flash — and
 * skeletons only the data region, using the same components the view itself
 * renders while loading (one skeleton, two consumers; see the standard in
 * `components/shared/skeletons.tsx`).
 */
export default function CouponsLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Coupons"
        description="Discount codes customers type at checkout"
      >
        {/* The refresh control is a client component with its own state, so it
            stands in as a shape rather than being imported here. */}
        <Skeleton className="h-10 w-32 rounded-md" />
        <Button asChild>
          <Link href="/coupons/new" className="gap-2">
            <AppIcon icon="solar:add-circle-linear" className="size-4" />
            New coupon
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-2">
        <CouponsStatusChipsSkeleton />
        <Skeleton className="h-8 w-full max-w-2xl rounded" />
      </div>

      <Skeleton className="h-9 w-full rounded-md" />

      <CouponsTableSkeleton />
    </div>
  );
}
