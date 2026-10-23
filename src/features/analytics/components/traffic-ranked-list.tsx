import { compactNumber } from "../utils/format-chart";
import type { RankedRow } from "../types/traffic";

/**
 * A ranked list with an inline bar per row, for any "top N by count" breakdown
 * (regions, channels, pages, devices). One hue for every row: the bar shows
 * magnitude, the label carries identity, so nothing depends on colour.
 */
export function TrafficRankedList({
  rows,
  unit,
  empty = "Nothing recorded in this period",
}: {
  rows: RankedRow[];
  /** Spoken after the number for screen readers, e.g. "visitors". */
  unit: string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs font-medium text-muted-foreground">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ol className="space-y-2.5">
      {rows.map((row) => (
        <li key={`${row.label}-${row.detail ?? ""}`} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <div className="min-w-0">
              {row.href ? (
                <a
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-medium text-foreground hover:text-primary-ink hover:underline"
                >
                  {row.label}
                </a>
              ) : (
                <span className="block truncate font-medium text-foreground">{row.label}</span>
              )}
              {row.detail && <span className="block truncate text-xs text-muted-foreground">{row.detail}</span>}
            </div>
            <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-foreground">
              {compactNumber(row.value)}
              <span className="sr-only"> {unit}</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
