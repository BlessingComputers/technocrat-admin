import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function LegalLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Legal"
        description="The purchase and customer policy customers accept at checkout."
      />
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
