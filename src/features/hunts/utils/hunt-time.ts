// Hunt times, always in West Africa Time and always saying so.
//
// A hunt races on minutes, and staff can open this screen on a laptop set to
// any zone. Every time here is pinned to Africa/Lagos and carries "WAT", the
// way the preorder deadlines already do.

const LAGOS = "Africa/Lagos";

type TimeInput = string | number | Date;

const DATE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
};

const CLOCK: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

function toDate(value: TimeInput): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function format(value: TimeInput, options: Intl.DateTimeFormatOptions): string {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-NG", { timeZone: LAGOS, ...options }).format(d);
}

/** "Sat, 12 Sep 2026, 2:00 pm WAT" */
export function formatHuntTime(value: TimeInput): string {
  return format(value, { ...DATE, ...CLOCK, timeZoneName: "short" });
}

/** "2:27 pm WAT", for a time whose day is already on screen. */
export function formatHuntClock(value: TimeInput): string {
  return format(value, { ...CLOCK, timeZoneName: "short" });
}

/** True when both fall on the same calendar day in Lagos. */
export function sameHuntDay(a: TimeInput, b: TimeInput): boolean {
  const day: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return format(a, day) === format(b, day);
}

/**
 * "Sat, 12 Sep 2026, 12:00 pm to 4:00 pm WAT", or two full stamps when the
 * window crosses midnight.
 */
export function formatHuntWindow(start: TimeInput, end: TimeInput): string {
  if (!toDate(start) || !toDate(end)) return "—";
  return sameHuntDay(start, end)
    ? `${format(start, DATE)}, ${format(start, CLOCK)} to ${formatHuntClock(end)}`
    : `${formatHuntTime(start)} to ${formatHuntTime(end)}`;
}

/** "2:40 pm to 2:45 pm WAT", with the date in front when the window spans days. */
export function formatHuntSlot(
  start: TimeInput,
  end: TimeInput,
  withDate = false,
): string {
  const range = `${format(start, CLOCK)} to ${formatHuntClock(end)}`;
  return withDate ? `${format(start, DATE)}, ${range}` : range;
}

/**
 * "in 12 minutes" / "3 minutes ago". Minute precision is enough: the monitor
 * refreshes every 15 seconds, so seconds would be wrong most of the time.
 */
export function formatHuntDistance(value: TimeInput, now: number = Date.now()): string {
  const d = toDate(value);
  if (!d) return "—";
  const diff = d.getTime() - now;
  const mins = Math.round(Math.abs(diff) / 60_000);

  const label =
    mins < 1
      ? "less than a minute"
      : mins < 60
        ? plural(mins, "minute")
        : mins < 60 * 24
          ? plural(Math.round(mins / 60), "hour")
          : plural(Math.round(mins / (60 * 24)), "day");

  return diff > 0 ? `in ${label}` : `${label} ago`;
}

/** Lagos runs UTC+1 all year. No daylight saving, so a fixed offset is exact. */
const WAT_OFFSET_MS = 60 * 60_000;

/**
 * An ISO time → the "YYYY-MM-DDTHH:mm" a `datetime-local` input shows, read in
 * WAT. Empty when absent or unreadable.
 *
 * The browser's own zone is ignored on purpose. A `datetime-local` value has no
 * zone, so the form labels every input "WAT" and converts both ways here.
 */
export function toHuntTimeInput(value: TimeInput | null | undefined): string {
  if (value == null) return "";
  const d = toDate(value);
  if (!d) return "";
  return new Date(d.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 16);
}

/** A `datetime-local` value, read as WAT → an ISO string. Null when empty or malformed. */
export function fromHuntTimeInput(input: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/.exec(input.trim());
  if (!match) return null;
  const d = new Date(`${match[1]}${match[2] ?? ":00"}+01:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}
