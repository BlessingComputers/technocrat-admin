import { Stat, type StatTone } from "@/components/shared/stats-bar";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendType: "up" | "down";
  description: string;
  /** Iconify name. */
  icon: string;
  tone: StatTone;
}

/**
 * Dashboard KPI cell. A thin wrapper over the shared `<Stat>` so the dashboard,
 * the list-page stats strips, invoices and monitor all read as one instrument
 * (ticket 07 — `<StatsBar>` is the default look for KPIs app-wide).
 *
 * Must be rendered inside a `<StatsBar>`, which supplies the panel and rules.
 *
 * Ticket 07 also dropped the hover "⋯" ghost button that used to sit in the
 * top-right: it opened nothing.
 */
export function KpiCard({
  title,
  value,
  trend,
  trendType,
  description,
  icon,
  tone,
}: KpiCardProps) {
  return (
    <Stat
      icon={icon}
      tone={tone}
      label={title}
      value={value}
      trend={trend}
      trendDirection={trendType}
      description={description}
    />
  );
}
