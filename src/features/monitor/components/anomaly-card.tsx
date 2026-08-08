import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  anomalyTypeLabel,
  anomalyTypeTone,
  formatLogTimestamp,
} from "../utils/monitor-utils";
import type { MonitorAnomaly } from "../types/monitor";

/** Formats a rate (0–1) as a percent, or a plain ms value for latency spikes. */
function formatMetric(type: MonitorAnomaly["type"], value: number): string {
  if (type === "error_rate_spike") return `${(value * 100).toFixed(1)}%`;
  return `${Math.round(value)}ms`;
}

export function AnomalyCard({ anomaly }: { anomaly: MonitorAnomaly }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AppIcon icon="solar:danger-triangle-linear" className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {anomalyTypeLabel(anomaly.type)}
                </h3>
                <Badge variant={anomalyTypeTone(anomaly.type)}>
                  {anomaly.factor.toFixed(1)}x baseline
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatLogTimestamp(anomaly.timestamp)} · {anomaly.windowMins}
                -min window
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Current
            </p>
            <p className="font-semibold tabular-nums text-foreground">
              {formatMetric(anomaly.type, anomaly.current)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              24h baseline
            </p>
            <p className="font-semibold tabular-nums text-foreground">
              {formatMetric(anomaly.type, anomaly.baseline)}
            </p>
          </div>
        </div>

        {anomaly.routeSamples.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {anomaly.routeSamples.map((route) => (
              <Badge key={route} variant="outline" className="font-mono">
                {route}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
