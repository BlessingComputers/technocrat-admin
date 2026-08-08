import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { UploaderSummary } from "../types/upload-analytics";

/** Aggregate stat cards above the management table (sums over the loaded set). */
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

  const stats: { label: string; value: string | number; icon: string }[] = [
    { label: "Total uploads", value: products + parts, icon: "solar:cloud-upload-bold" },
    { label: "Products", value: products, icon: "solar:box-bold" },
    { label: "Parts", value: parts, icon: "solar:cpu-bold" },
    {
      label: "On target today",
      value: `${onTarget}/${uploaders.length}`,
      icon: "solar:target-bold",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <AppIcon icon={stat.icon} className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-none tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
