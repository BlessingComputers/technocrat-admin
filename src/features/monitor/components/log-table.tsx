"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogTableRow } from "./log-table-row";
import { MonitorTableSkeleton } from "./monitor-skeletons";
import { MonitorUnavailable, isMonitorUnavailableError } from "./monitor-unavailable";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import type { MonitorLogListItem } from "../types/monitor";
import { Card } from "@/components/ui/card";

const HEADERS = ["Method & Date", "Route", "Status", "Duration", "Tags", ""];

/** Placeholder rows appended while the next page is in flight. Same cell
 * structure as `LogTableRow` so column widths never shift mid-scroll. */
function LoadingRows({ count = 4 }: { count?: number }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={`loading-${i}`} aria-hidden="true">
      <td className="px-6 py-3">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="mt-1.5 h-3 w-28" />
      </td>
      <td className="px-6 py-3">
        <Skeleton className="h-3.5 w-56" />
      </td>
      <td className="px-6 py-3">
        <Skeleton className="h-5 w-14 rounded-full" />
      </td>
      <td className="px-6 py-3">
        <Skeleton className="h-3.5 w-12" />
      </td>
      <td className="px-6 py-3">
        <Skeleton className="h-5 w-20 rounded-full" />
      </td>
      <td className="px-6 py-3">
        <Skeleton className="ml-auto h-3.5 w-10" />
      </td>
    </tr>
  ));
}

interface LogTableProps {
  logs: MonitorLogListItem[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  emptyMessage?: string;
  /** Infinite-scroll wiring. Omitted, the table renders as a plain list. */
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /** Total rows matching the current filters, from the list envelope's meta. */
  total?: number;
}

export function LogTable({
  logs,
  isLoading,
  isError,
  error,
  onRetry,
  emptyMessage = "No requests found",
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  total,
}: LogTableProps) {
  const { sentinelRef, loadMore } = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: hasNextPage && !!onLoadMore,
    isFetching: isFetchingNextPage,
    onLoadMore: onLoadMore ?? (() => {}),
  });

  if (isLoading) {
    return <MonitorTableSkeleton />;
  }

  if (isError) {
    if (isMonitorUnavailableError(error)) {
      return <MonitorUnavailable onRetry={onRetry} />;
    }
    return (
      <Card className="gap-0 py-20 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
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
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="gap-0 py-20 text-center">
        <AppIcon
          icon="solar:list-linear"
          className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
        />
        <h3 className="text-lg font-semibold text-foreground">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
      </Card>
    );
  }

  const showFooter = !!onLoadMore || typeof total === "number";

  return (
    <Card className="gap-0 overflow-x-auto w-full py-0">
      <table className="w-full text-left min-w-[900px]">
        <thead>
          <tr className="border-b border-border bg-primary/[0.04]">
            {HEADERS.map((label) => (
              <th
                key={label || "actions"}
                className="px-6 py-4 text-xs font-semibold text-muted-foreground"
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
          {isFetchingNextPage && <LoadingRows />}
        </tbody>
      </table>

      {showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
          <p
            aria-live="polite"
            className="text-xs font-medium text-muted-foreground tabular-nums"
          >
            {isFetchingNextPage ? (
              <span className="inline-flex items-center gap-2">
                <AppIcon icon="solar:refresh-linear" className="size-3.5 animate-spin" />
                Loading more requests…
              </span>
            ) : typeof total === "number" ? (
              `Showing ${logs.length.toLocaleString()} of ${total.toLocaleString()}`
            ) : (
              `Showing ${logs.length.toLocaleString()}`
            )}
          </p>

          {/* Sentinel: the observer starts the next page well before this
              scrolls into view. The button is the keyboard/no-observer path. */}
          <div ref={sentinelRef} className="flex items-center">
            {hasNextPage && onLoadMore ? (
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isFetchingNextPage}
                className="rounded-md font-medium text-xs"
              >
                Load more
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground/70">
                End of the log
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
