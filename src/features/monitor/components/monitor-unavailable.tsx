import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

/**
 * The monitoring Mongo connection is independent of the primary DB — every
 * `/monitor/*` route 503s when it's down, which is a distinct "not right now"
 * state from a generic fetch failure.
 */
export function MonitorUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-20 text-center bg-card rounded-lg border border-border">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-warning/10 text-warning">
        <AppIcon icon="solar:danger-triangle-linear" className="size-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Monitoring is temporarily unavailable
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        The monitoring database isn&apos;t connected right now. This doesn&apos;t
        affect the store — only the log/anomaly viewer.
      </p>
      <Button variant="outline" onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  );
}

/** True when the error is the monitoring DB's own 503, not a generic failure. */
export function isMonitorUnavailableError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503;
}
