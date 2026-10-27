import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonStatCards } from "@/components/shared/skeletons";
import { RecentProductsSnapshotSkeleton } from "@/features/products";

/**
 * Route shell for the catalogue hub. Mirrors the real layout: static header,
 * the overview strip (label + filter + four cards), the two entry cards, then
 * the recently-added panel. Title/description match `ProductsHubView` exactly so
 * the header doesn't flash on navigation.
 */
export default function CatalogueHubLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue"
        description="Products, parts, categories and brands in one place"
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-64 rounded-lg" />
        </div>
        <SkeletonStatCards count={4} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>

      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b bg-muted/5 px-6 py-4">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <RecentProductsSnapshotSkeleton />
      </Card>
    </div>
  );
}
