import { SkeletonPageHeader, SkeletonStatCards } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** First load runs about 17 PostHog queries; later loads come from the 5-minute cache. */
export default function AnalyticsLoading() {
  return (
    <div className="w-full space-y-6">
      <SkeletonPageHeader />
      <SkeletonStatCards />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
