import { Stat, StatsBar, type StatTone } from "@/components/shared/stats-bar";
import type { UploaderSummary } from "../types/upload-analytics";

/** Aggregate stats above the management table (sums over the loaded set). */
export function UploaderSummaryStrip({
  uploaders,
}: {
  uploaders: UploaderSummary[];
}) {
  const products = uploaders.reduce((sum, u) => sum + u.totals.products, 0);
  const parts = uploaders.reduce((sum, u) => sum + u.totals.parts, 0);
  const updates = uploaders.reduce((sum, u) => sum + u.totals.updates, 0);
  const onTarget = uploaders.filter(
    (u) => u.percentOfDailyTarget >= 100,
  ).length;

  // `scope` says which window each number covers: the period, or always today.
  const stats: {
    label: string;
    value: string | number;
    icon: string;
    tone: StatTone;
    scope: "This period" | "Today";
  }[] = [
    {
      label: "Total work",
      value: products + parts + updates,
      icon: "solar:cloud-upload-linear",
      tone: "primary",
      scope: "This period",
    },
    { label: "Products", value: products, icon: "solar:box-linear", tone: "info", scope: "This period" },
    { label: "Parts", value: parts, icon: "solar:cpu-linear", tone: "jewel", scope: "This period" },
    { label: "Updates", value: updates, icon: "solar:pen-2-linear", tone: "muted", scope: "This period" },
    {
      label: "On target",
      value: `${onTarget}/${uploaders.length}`,
      icon: "solar:target-linear",
      tone: onTarget === uploaders.length ? "success" : "warning",
      scope: "Today",
    },
  ];

  return (
    <StatsBar columns={5}>
      {stats.map((stat) => (
        <Stat
          key={stat.label}
          icon={stat.icon}
          tone={stat.tone}
          label={stat.label}
          value={stat.value}
          description={stat.scope}
        />
      ))}
    </StatsBar>
  );
}
