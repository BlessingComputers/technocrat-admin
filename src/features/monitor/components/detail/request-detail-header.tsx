import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { MonitorStatusBadge } from "../monitor-status-badge";
import { formatDuration } from "../../utils/monitor-utils";
import type { MonitorLogDetail } from "../../types/monitor";

export function RequestDetailHeader({ log }: { log: MonitorLogDetail }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <Link
          href="/security"
          className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {log.method}
            </span>
            <span className="font-mono text-sm text-muted-foreground truncate max-w-[420px]">
              {log.route ?? log.path}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {log.requestId}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <MonitorStatusBadge statusCode={log.statusCode} />
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatDuration(log.duration)}
        </span>
      </div>
    </div>
  );
}
