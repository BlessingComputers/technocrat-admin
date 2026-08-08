import { PageHeader } from "@/components/shared/page-header";
import { MonitorTableSkeleton } from "@/features/monitor";

export default function SecuritySlowLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Slow"
        description="Requests whose duration exceeded the slow-request threshold, sorted newest first"
      />
      <MonitorTableSkeleton />
    </div>
  );
}
