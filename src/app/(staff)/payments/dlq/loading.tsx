import { PageHeader } from "@/components/shared/page-header";
import { PaymentsTableSkeleton } from "@/features/payments";

export default function PaymentsDlqLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dead Letter Queue"
        description="Payment-events jobs that threw and exhausted every retry — replay once the underlying issue is fixed"
      />
      <PaymentsTableSkeleton />
    </div>
  );
}
