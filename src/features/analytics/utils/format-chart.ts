/** Presentation helpers for the dashboard charts. */

/** "2026-07-15" → "Jul 15" (axis ticks, tooltips). */
export function formatChartDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** 12500 → "12.5K", 2_300_000 → "2.3M" (compact axis + KPI values). */
export function compactNumber(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n ?? 0);
}

/** Compact Naira, e.g. "₦2.3M" — for chart axes where full currency is too wide. */
export function compactPrice(n: number): string {
  return `₦${compactNumber(n)}`;
}

/**
 * Brand data-viz ramp as CSS-var references (see `--chart-*` in globals.css).
 * Cycled for categorical series (order statuses, loyalty tiers) so colours stay
 * on-brand and theme-aware without hardcoding.
 */
export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** Turn a status/tier string into a config-safe key ("IN PROGRESS" → "in_progress"). */
export function toSeriesKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/** Title-case a SCREAMING_SNAKE or lower status for display ("IN_PROGRESS" → "In Progress"). */
export function humanizeLabel(label: string): string {
  return label
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
