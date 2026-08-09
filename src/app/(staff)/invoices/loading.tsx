import PageContainer from "@/components/layouts/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceTableSkeleton } from "@/features/invoice";
import { Card } from "@/components/ui/card";
import {
  SkeletonStatCards,
  SkeletonFilterBar,
} from "@/components/shared/skeletons";

export default function InvoicesLoading() {
  return (
    <PageContainer>
      <PageHeader title="Invoices" />
      <SkeletonStatCards count={4} />
      <Skeleton className="h-10 w-72 rounded-lg" />
      <Card className="gap-0 overflow-hidden py-0">
        <div className="p-6 pb-4">
          <SkeletonFilterBar />
        </div>
        <InvoiceTableSkeleton />
      </Card>
    </PageContainer>
  );
}
