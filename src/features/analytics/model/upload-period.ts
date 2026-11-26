import { periodToDateRange } from "../utils/period-to-range";

/** A `YYYY-MM-DD` window, inclusive on both ends (UTC, like the backend). */
export interface DateRange {
  startDate: string;
  endDate: string;
}

export type PeriodPreset = "today" | "last_week" | "this_month";

export const PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "Today",
  last_week: "Last week",
  this_month: "This month",
};

/** The window a page opens on when the URL names none. */
export const DEFAULT_PERIOD: PeriodPreset = "this_month";

/** Upper end of the "Past x weeks" stepper (about one quarter). */
export const MAX_WEEKS = 13;

const DAY_MS = 24 * 60 * 60 * 1000;
const toDate = (date: string) => new Date(`${date}T00:00:00Z`);
const daysBetween = (a: string, b: string) =>
  Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY_MS);

/** "Past x weeks": from today minus x * 7 days, to today. */
export function pastWeeksRange(weeks: number): DateRange {
  const { endDate } = periodToDateRange("today", null);
  const start = toDate(endDate);
  start.setUTCDate(start.getUTCDate() - weeks * 7);
  return { startDate: start.toISOString().slice(0, 10), endDate };
}

/** The x for which this window is "Past x weeks" today, or null. */
export function pastWeeksOf(range: DateRange): number | null {
  if (range.endDate !== periodToDateRange("today", null).endDate) return null;
  const days = daysBetween(range.startDate, range.endDate);
  const weeks = days / 7;
  return Number.isInteger(weeks) && weeks >= 1 && weeks <= MAX_WEEKS ? weeks : null;
}

const matches = (a: DateRange, b: DateRange) =>
  a.startDate === b.startDate && a.endDate === b.endDate;

/**
 * Which control gives exactly this window today. When two give the same
 * window (on the 1st, or on the 15th with x = 2), the earlier one wins, in
 * the order the controls show.
 */
export function activePreset(range: DateRange): PeriodPreset | "weeks" | "custom" {
  if (matches(range, periodToDateRange("today", null))) return "today";
  if (matches(range, periodToDateRange("last_week", null))) return "last_week";
  if (pastWeeksOf(range) !== null) return "weeks";
  if (matches(range, periodToDateRange("this_month", null))) return "this_month";
  return "custom";
}

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

function parts(date: string) {
  const d = toDate(date);
  return { d, day: d.getUTCDate(), month: MONTH.format(d), year: d.getUTCFullYear() };
}

/** "1–26 Nov 2026 · 26 days": the window in words, with its inclusive length. */
export function describeRange({ startDate, endDate }: DateRange): string {
  const a = parts(startDate);
  const b = parts(endDate);
  const days = Math.round((b.d.getTime() - a.d.getTime()) / DAY_MS) + 1;
  const length = `${days} ${days === 1 ? "day" : "days"}`;

  let dates: string;
  if (startDate === endDate) dates = `${b.day} ${b.month} ${b.year}`;
  else if (a.year !== b.year) dates = `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  else if (a.month !== b.month) dates = `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  else dates = `${a.day}–${b.day} ${b.month} ${b.year}`;

  return `${dates} · ${length}`;
}

/** Why a custom window cannot be applied, or null when it can. */
export function rangeError({ startDate, endDate }: DateRange): string | null {
  if (!startDate || !endDate) return "Pick both dates.";
  // ISO dates compare correctly as strings.
  if (startDate > endDate) return "The start date must be on or before the end date.";
  return null;
}
