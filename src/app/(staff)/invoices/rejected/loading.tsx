import Link from "next/link";
import PageContainer from "@/components/layouts/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { InvoiceTableSkeleton } from "@/features/invoice";

export default function RejectedInvoicesLoading() {
  return (
    <PageContainer className="pb-16">
      <div className="space-y-1">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <AppIcon icon="solar:arrow-left-linear" className="h-4 w-4" />
          Back
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Rejected invoices
        </h1>
      </div>

      <div className="rounded-2xl bg-muted/40 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <div className="p-6 pb-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <InvoiceTableSkeleton />
      </div>
    </PageContainer>
  );
}
