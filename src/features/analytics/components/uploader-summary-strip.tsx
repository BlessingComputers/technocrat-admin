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
  const onTarget = uploaders.filter(
    (u) => u.percentOfDailyTarget >= 100,
  ).length;

  const stats: {
    label: string;
    value: string | number;
    icon: string;
    tone: StatTone;
  }[] = [
    {
      label: "Total uploads",
      value: products + parts,
      icon: "solar:cloud-upload-linear",
      tone: "primary",
    },
    { label: "Products", value: products, icon: "solar:box-linear", tone: "info" },
    { label: "Parts", value: parts, icon: "solar:cpu-linear", tone: "jewel" },
    {
      label: "On target today",
      value: `${onTarget}/${uploaders.length}`,
      icon: "solar:target-linear",
      tone: onTarget === uploaders.length ? "success" : "warning",
    },
  ];

  return (
    <StatsBar>
      {stats.map((stat) => (
        <Stat
          key={stat.label}
          icon={stat.icon}
          tone={stat.tone}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </StatsBar>
  );
}
