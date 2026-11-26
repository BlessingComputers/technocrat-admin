import type { AppliedDateRange } from "../types/analytics";

/** UTC `YYYY-MM-DD` for a Date (the backend buckets uploads in UTC). */
function toUtcDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Converts the dashboard's period filter (`today`, `7d`, `30d`, `90d`,
 * `last_week`, `this_month`, `12m`, `custom`) into the `startDate`/`endDate` range the
 * uploaders endpoint expects. Lets the upload section react to the same filter
 * the super-admin already uses for KPIs, instead of owning its own control.
 */
export function periodToDateRange(
  period: string,
  custom: AppliedDateRange | null,
): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = toUtcDateStr(today);

  if (period === "custom" && custom) {
    return {
      startDate: toUtcDateStr(new Date(custom.from)),
      endDate: toUtcDateStr(new Date(custom.to)),
    };
  }

  if (period === "this_month") {
    const first = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );
    return { startDate: toUtcDateStr(first), endDate };
  }

  if (period === "last_week") {
    // The previous Monday to Saturday: the week the Wednesday meeting reviews.
    const sinceMonday = (today.getUTCDay() + 6) % 7;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - sinceMonday - 7);
    const saturday = new Date(monday);
    saturday.setUTCDate(monday.getUTCDate() + 5);
    return { startDate: toUtcDateStr(monday), endDate: toUtcDateStr(saturday) };
  }

  const daysBack: Record<string, number> = {
    today: 0,
    "7d": 6,
    "30d": 29,
    "90d": 89,
    "12m": 364,
  };
  const back = daysBack[period] ?? 29;
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - back);
  return { startDate: toUtcDateStr(start), endDate };
}
