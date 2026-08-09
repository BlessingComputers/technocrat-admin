import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import { MonitorStatusBadge } from "./monitor-status-badge";
import { formatDuration, formatLogTimestamp } from "../utils/monitor-utils";
import type { MonitorLogListItem } from "../types/monitor";

export function LogTableRow({ log }: { log: MonitorLogListItem }) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-6 py-3">
        <Link
          href={`/security/${log.requestId}`}
          className="font-mono text-xs font-semibold text-primary-ink hover:underline"
        >
          {log.method}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatLogTimestamp(log.timestamp)}
        </div>
      </td>
      <td className="px-6 py-3">
        <div className="text-sm text-foreground font-medium max-w-[320px] truncate">
          {log.route ?? log.path}
        </div>
        {log.error && (
          <div className="text-xs text-destructive-ink mt-0.5 max-w-[320px] truncate">
            {log.error.message}
          </div>
        )}
      </td>
      <td className="px-6 py-3">
        <MonitorStatusBadge statusCode={log.statusCode} />
      </td>
      <td className="px-6 py-3 text-sm tabular-nums text-foreground">
        {formatDuration(log.duration)}
      </td>
      <td className="px-6 py-3">
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {log.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="muted" className="text-xs">
              {tag}
            </Badge>
          ))}
          {log.tags.length > 4 && (
            <Badge variant="muted" className="text-xs">
              +{log.tags.length - 4}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-3 text-right">
        <Link
          href={`/security/${log.requestId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary-ink transition-colors"
        >
          View
          <AppIcon icon="solar:alt-arrow-right-linear" className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}
