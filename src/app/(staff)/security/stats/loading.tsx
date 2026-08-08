import { PageHeader } from "@/components/shared/page-header";
import { MonitorStatsSkeleton } from "@/features/monitor";

export default function SecurityStatsLoading() {
  return (
    <div className="space-y-8">
      <PageHeader title="Stats" description="Rolling-window request health at a glance" />
      <MonitorStatsSkeleton />
    </div>
  );
}
