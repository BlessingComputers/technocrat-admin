import { Skeleton } from "@/components/ui/skeleton";

/** Row-shaped skeleton for the uploaders table while the report loads. */
export function UploaderAnalyticsSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-3.5">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-4 w-40" />
        </div>
      ))}
    </div>
  );
}
