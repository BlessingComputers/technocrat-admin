import { PageHeader } from "@/components/shared/page-header";
import { MonitorTableSkeleton } from "@/features/monitor";

export default function SecurityErrorsLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Errors"
        description="Requests that resulted in a 4xx or 5xx response, sorted newest first"
      />
      <MonitorTableSkeleton />
    </div>
  );
}
