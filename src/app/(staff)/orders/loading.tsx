import { PageHeader } from "@/components/shared/page-header";
import { OrdersTableSkeleton } from "@/features/orders";
import {
  SkeletonStatCards,
  SkeletonFilterBar,
} from "@/components/shared/skeletons";

export default function OrdersLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Order Management"
        description="Review and fulfill manual transfer orders"
      />
      <SkeletonStatCards count={4} />
      <SkeletonFilterBar />
      <OrdersTableSkeleton />
    </div>
  );
}
