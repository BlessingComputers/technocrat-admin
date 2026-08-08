import { Skeleton } from "@/components/ui/skeleton";

/** Loading state for the manual-invoice detail view (server-safe). */
export function ManualInvoiceDetailSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
