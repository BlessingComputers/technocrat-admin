import { PageHeader } from "@/components/shared/page-header";
import { CustomersTableSkeleton } from "@/features/customers";
import {
  SkeletonStatCards,
  SkeletonFilterBar,
} from "@/components/shared/skeletons";

export default function CustomersLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Customer Management"
        description="Browse, search, and inspect customer accounts"
      />
      <SkeletonStatCards count={4} />
      <SkeletonFilterBar />
      <CustomersTableSkeleton />
    </div>
  );
}
