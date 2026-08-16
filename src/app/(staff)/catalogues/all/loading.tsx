import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { ProductsTableSkeleton } from "@/features/products";
import { SkeletonFilterBar } from "@/components/shared/skeletons";

export default function ProductsBrowseLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Browse Products"
        description="Search, filter, and manage the full catalog"
      />
      <SkeletonFilterBar />
      <Card className="gap-0 overflow-hidden p-0">
        <ProductsTableSkeleton />
      </Card>
    </div>
  );
}
