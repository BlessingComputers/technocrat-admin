import Link from "next/link";
import PageContainer from "@/components/layouts/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { InvoiceTableSkeleton } from "@/features/invoice";
import { Card } from "@/components/ui/card";

export default function PendingReviewLoading() {
  return (
    <PageContainer>
      <div className="space-y-1">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <AppIcon icon="solar:arrow-left-linear" className="h-4 w-4" />
          Back
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Pending Review
        </h1>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="p-6 pb-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <InvoiceTableSkeleton />
      </Card>
    </PageContainer>
  );
}
