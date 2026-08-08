"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { LogTableRow } from "./log-table-row";
import { MonitorTableSkeleton } from "./monitor-skeletons";
import { MonitorUnavailable, isMonitorUnavailableError } from "./monitor-unavailable";
import type { MonitorLogListItem } from "../types/monitor";

const HEADERS = ["Method & Date", "Route", "Status", "Duration", "Tags", ""];

interface LogTableProps {
  logs: MonitorLogListItem[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  emptyMessage?: string;
}

export function LogTable({
  logs,
  isLoading,
  isError,
  error,
  onRetry,
  emptyMessage = "No requests found",
}: LogTableProps) {
  if (isLoading) {
    return <MonitorTableSkeleton />;
  }

  if (isError) {
    if (isMonitorUnavailableError(error)) {
      return <MonitorUnavailable onRetry={onRetry} />;
    }
    return (
      <div className="py-20 text-center bg-card rounded-lg border border-border">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AppIcon icon="solar:danger-circle-linear" className="size-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Request logs unavailable
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We hit an error loading logs. Please try again shortly.
        </p>
        <Button variant="outline" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-20 text-center bg-card rounded-lg border border-border">
        <AppIcon
          icon="solar:list-linear"
          className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
        />
        <h3 className="text-lg font-semibold text-foreground">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-card rounded-lg border border-border w-full">
      <table className="w-full text-left min-w-[900px]">
        <thead>
          <tr className="border-b border-border bg-primary/[0.04]">
            {HEADERS.map((label) => (
              <th
                key={label || "actions"}
                className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {logs.map((log) => (
            <LogTableRow key={log.requestId} log={log} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
