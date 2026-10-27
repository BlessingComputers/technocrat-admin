import { Stat, type StatTone } from "@/components/shared/stats-bar";

interface StatsKpiCardProps {
  title: string;
  value: string;
  description?: string;
  icon: string;
  tone?: StatTone;
}

/**
 * KPI cell for the Monitor stats view — no trend arrow, since
 * `MonitorStatsResponse` has no prior-window comparison to derive one from
 * (unlike the dashboard's KPIs).
 *
 * Ticket 07 made this a wrapper over the shared `<Stat>`. Render inside a
 * `<StatsBar>`.
 */
export function StatsKpiCard({
  title,
  value,
  description,
  icon,
  tone = "primary",
}: StatsKpiCardProps) {
  return (
    <Stat
      icon={icon}
      tone={tone}
      label={title}
      value={value}
      description={description}
    />
  );
}
