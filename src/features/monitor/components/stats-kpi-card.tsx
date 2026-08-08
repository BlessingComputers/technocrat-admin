import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { AppIcon } from "@/components/shared/app-icon";

interface StatsKpiCardProps {
  title: string;
  value: string;
  description?: string;
  icon: string;
  tone?: "primary" | "success" | "warning" | "danger";
}

const TONE_CLASS: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
};

/** Simple KPI tile for the Monitor stats view — no trend arrow, since
 * `MonitorStatsResponse` has no prior-window comparison to derive one from
 * (unlike `analytics/kpi-card.tsx`). */
export function StatsKpiCard({
  title,
  value,
  description,
  icon,
  tone = "primary",
}: StatsKpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            TONE_CLASS[tone],
          )}
        >
          <AppIcon icon={icon} className="size-4.5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <h3 className="text-xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
