import { Stat, type StatTone } from "@/components/shared/stats-bar";
import { cn } from "@/lib/utils/cn";
import type { KpiSplitRow } from "../types/dashboard-kpi";

interface KpiSplitCardProps {
  /** Iconify name. */
  icon: string;
  tone: StatTone;
  badgeLabel: string;
  badgeTone?: StatTone;
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
 * KPI cell for the super-admin live dashboard: the shared `<Stat>` plus a
 * two-stripe ratio bar and two breakdown rows in its footer slot.
 *
 * Ticket 07 rebuilt this on `<Stat>` so the richest KPI in the app still reads
 * as the same instrument as the simplest. Render inside a `<StatsBar>`.
 */
export function KpiSplitCard({
  icon,
  tone,
  badgeLabel,
  badgeTone,
  title,
  value,
  split,
  rows,
}: KpiSplitCardProps) {
  return (
    <Stat
      icon={icon}
      tone={tone}
      label={title}
      value={value}
      badge={badgeLabel}
      badgeTone={badgeTone ?? "success"}
      footer={
        <>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn("transition-all duration-500", split.firstColor)}
              style={{ width: `${split.firstPct}%` }}
            />
            <div
              className={cn("transition-all duration-500", split.secondColor)}
              style={{ width: `${split.secondPct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{split.firstCaption}</span>
            <span>{split.secondCaption}</span>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-border pt-2 text-xs">
            {rows.map((row, idx) => (
              <SplitRow key={idx} row={row} />
            ))}
          </div>
        </>
      }
    />
  );
}

function SplitRow({ row }: { row: KpiSplitRow }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span className="flex items-center gap-1.5 font-medium">
        <span className={cn("size-2 rounded-full", row.dotColor)} />
        {row.label}
      </span>
      <span className="font-semibold text-foreground">
        {row.value}
        {row.suffix && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {row.suffix}
          </span>
        )}
      </span>
    </div>
  );
}
