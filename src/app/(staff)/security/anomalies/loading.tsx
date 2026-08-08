import { PageHeader } from "@/components/shared/page-header";
import { MonitorAnomaliesSkeleton } from "@/features/monitor";

export default function SecurityAnomaliesLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Anomalies"
        description="Error-rate and latency spikes detected against the 24-hour rolling baseline"
      />
      <MonitorAnomaliesSkeleton />
    </div>
  );
}
