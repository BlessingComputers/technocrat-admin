import { PageHeader } from "@/components/shared/page-header";
import { PaymentsTableSkeleton } from "@/features/payments";
import { SkeletonFilterBar } from "@/components/shared/skeletons";

export default function PaymentsLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        description="Every gateway transaction — search, filter, and open the DLQ or webhook tools when one gets stuck"
      />
      <SkeletonFilterBar />
      <PaymentsTableSkeleton />
    </div>
  );
}
