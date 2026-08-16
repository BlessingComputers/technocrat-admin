import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonStatCards } from "@/components/shared/skeletons";
import { RecentProductsSnapshotSkeleton } from "@/features/products";

export default function ProductsHubLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Product Management"
        description="Manage products, categories, and brands in one place"
      />
      <SkeletonStatCards count={4} />
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b bg-muted/5 px-6 py-4">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <RecentProductsSnapshotSkeleton />
      </Card>
    </div>
  );
}
