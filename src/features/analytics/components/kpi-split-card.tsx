import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";
import type { KpiSplitRow } from "../types/dashboard-kpi";

interface KpiSplitCardProps {
  icon: ReactNode;
  /** Tailwind classes for the icon background tile, e.g. "bg-primary/10 text-primary". */
  iconColorClass: string;
  badgeLabel: string;
  /** Tailwind classes for the badge, e.g. "bg-success/10 text-success". */
  badgeColorClass: string;
  title: string;
  value: string;
  /**
   * Two-stripe progress bar. The first colour fills `firstPct`%, the second
   * fills `secondPct`%. Captions appear underneath.
   */
  split: {
    firstColor: string;
    firstPct: number;
    firstCaption: string;
    secondColor: string;
    secondPct: number;
    secondCaption: string;
  };
  /** Detail rows shown beneath the split bar. */
  rows: [KpiSplitRow, KpiSplitRow];
}

/**
 * Reusable KPI tile used by the super-admin live dashboard. Top row has an
 * icon + badge, then a big numeric value, a two-stripe progress bar, and two
 * breakdown rows underneath.
 */
export function KpiSplitCard({
  icon,
  iconColorClass,
  badgeLabel,
  badgeColorClass,
  title,
  value,
  split,
  rows,
}: KpiSplitCardProps) {
  return (
    <Card className="hover:border-primary/20 transition-all group relative overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "size-10 rounded-xl flex items-center justify-center",
              iconColorClass,
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md",
              badgeColorClass,
            )}
          >
            {badgeLabel}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {value}
          </h3>
        </div>

        <div className="space-y-1">
          <div className="h-1.5 w-full bg-muted/60 rounded-full flex overflow-hidden">
            <div
              className={cn("transition-all duration-500", split.firstColor)}
              style={{ width: `${split.firstPct}%` }}
            />
            <div
              className={cn("transition-all duration-500", split.secondColor)}
              style={{ width: `${split.secondPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            <span>{split.firstCaption}</span>
            <span>{split.secondCaption}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 space-y-1.5 text-xs">
          {rows.map((row, idx) => (
            <SplitRow key={idx} row={row} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SplitRow({ row }: { row: KpiSplitRow }) {
  return (
    <div className="flex justify-between items-center text-muted-foreground">
      <span className="flex items-center gap-1.5 font-bold">
        <span className={cn("h-2 w-2 rounded-full", row.dotColor)} />
        {row.label}
      </span>
      <span className="font-extrabold text-foreground">
        {row.value}
        {row.suffix && (
          <span className="text-xs text-muted-foreground font-normal ml-1">
            {row.suffix}
          </span>
        )}
      </span>
    </div>
  );
}
