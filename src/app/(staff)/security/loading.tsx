import { PageHeader } from "@/components/shared/page-header";
import { MonitorTableSkeleton } from "@/features/monitor";

export default function SecurityLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Security"
        description="Every logged HTTP request and SYSTEM event — filter by path, method, tag, or duration"
      />
      <MonitorTableSkeleton />
    </div>
  );
}
