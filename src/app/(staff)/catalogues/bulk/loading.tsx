import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function BulkUploadLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Upload"
        description="Paste a supplier list for AI to structure, review the rows, then upload"
      />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
