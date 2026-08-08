import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatLogTimestamp } from "../../utils/monitor-utils";
import type { MonitorLogDetail } from "../../types/monitor";

export function RequestInfoCard({ log }: { log: MonitorLogDetail }) {
  return (
    <Card className="p-6 border border-border bg-card rounded-xl space-y-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        <AppIcon icon="solar:info-circle-linear" className="w-4 h-4 text-primary" />
        Request Info
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <Row label="Timestamp" value={formatLogTimestamp(log.timestamp)} />
        <Row label="IP" value={log.ip ?? "—"} mono />
        <Row label="User ID" value={log.userId ?? "—"} mono />
        <Row label="Staff ID" value={log.staffId ?? "—"} mono />
        <Row
          label="Request body size"
          value={log.requestBodySize != null ? `${log.requestBodySize} B` : "—"}
        />
        <Row
          label="Response size"
          value={log.responseSize != null ? `${log.responseSize} B` : "—"}
        />
      </div>

      {log.tags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {log.tags.map((tag) => (
              <Badge key={tag} variant="muted">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {log.userAgent && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            User Agent
          </p>
          <p className="text-xs font-mono text-foreground break-all">
            {log.userAgent}
          </p>
        </div>
      )}

      {Object.keys(log.query ?? {}).length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Query params
          </p>
          <pre className="text-xs font-mono text-foreground bg-muted/40 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(log.query, null, 2)}
          </pre>
        </div>
      )}

      {log.requestBody !== undefined && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Request body (sanitized)
          </p>
          <pre className="text-xs font-mono text-foreground bg-muted/40 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(log.requestBody, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-sm text-foreground font-medium ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
