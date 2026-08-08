import { Skeleton } from "@/components/ui/skeleton";
import PageContainer from "@/components/layouts/page-container";

/**
 * Shared loading skeletons for the invoice feature. Server-safe (no
 * "use client") so the client views and the route `loading.tsx` files render
 * identical markup.
 */

/** Rows shown while the invoice list query loads (used by `InvoiceTable`). */
export function InvoiceTableSkeleton() {
  return (
    <div className="space-y-px px-6 pb-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-md" />
      ))}
    </div>
  );
}

/** Full invoice-detail loading state (used by `InvoiceDetailView`). */
export function InvoiceDetailSkeleton() {
  return (
    <PageContainer>
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    </PageContainer>
  );
}
