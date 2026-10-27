"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { useMonitorRequestDetail } from "../api/monitor.queries";
import { MonitorAccessGate } from "./monitor-access-gate";
import { MonitorNavTabs } from "./monitor-nav-tabs";
import { MonitorDetailSkeleton } from "./monitor-skeletons";
import { MonitorUnavailable, isMonitorUnavailableError } from "./monitor-unavailable";
import { RequestDetailHeader } from "./detail/request-detail-header";
import { RequestInfoCard } from "./detail/request-info-card";
import { RequestErrorCard } from "./detail/request-error-card";

interface MonitorRequestDetailViewProps {
  requestId: string;
}

/** Request detail (route `/security/[requestId]`) — `GET /monitor/requests/:requestId`. */
export function MonitorRequestDetailView({
  requestId,
}: MonitorRequestDetailViewProps) {
  return (
    <MonitorAccessGate>
      <MonitorRequestDetailBody requestId={requestId} />
    </MonitorAccessGate>
  );
}

function MonitorRequestDetailBody({ requestId }: MonitorRequestDetailViewProps) {
  const { data: log, isLoading, isError, error, refetch } =
    useMonitorRequestDetail(requestId);

  return (
    <div className="space-y-8 pb-20">
      <MonitorNavTabs />

      {isLoading ? (
        <MonitorDetailSkeleton />
      ) : isError ? (
        isMonitorUnavailableError(error) ? (
          <MonitorUnavailable onRetry={() => refetch()} />
        ) : (
          <RequestNotFound />
        )
      ) : !log ? (
        <RequestNotFound />
      ) : (
        <div className="space-y-8">
          <RequestDetailHeader log={log} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <RequestInfoCard log={log} />
            </div>
            <div className="lg:col-span-4 space-y-6">
              {log.error && <RequestErrorCard error={log.error} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <AppIcon
        icon="solar:danger-circle-linear"
        className="w-16 h-16 text-destructive-ink"
      />
      <h2 className="text-xl font-semibold text-foreground">
        Request log not found
      </h2>
      <p className="text-muted-foreground text-sm">
        This request log does not exist or could not be loaded.
      </p>
      <Link href="/security">
        <Button variant="outline" className="rounded-md px-8">
          Return to Requests
        </Button>
      </Link>
    </div>
  );
}
