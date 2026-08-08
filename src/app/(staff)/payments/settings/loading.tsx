import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentsSettingsLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Payment Settings"
        description="Webhook registration and gateway health"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
