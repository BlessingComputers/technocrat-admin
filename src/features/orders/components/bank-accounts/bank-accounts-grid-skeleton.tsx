import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder cards shown while the bank-accounts query is loading. */
export function BankAccountsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  );
}
