// Deal timing.
//
// The same shape as `sale-timing.ts` in the products and parts slices, kept
// here rather than shared because features may not import each other. The
// difference is what it reads: a deal's own `expiresAt` and `startsAt` rather
// than a single rule's.

/** How a timestamp reads against the clock right now. */
export type DealTiming =
  | { state: "none" }
  | { state: "future"; at: string }
  | { state: "past"; at: string };

/**
 * Resolve a deal's expiry.
 *
 * A passed expiry does not flip the deal's `status`: the backend sweep runs
 * every five minutes, so an ACTIVE deal can honestly be over and its prices not
 * yet reset. That gap is what the list has to show instead of hiding.
 */
export function dealExpiry(
  expiresAt: string | null | undefined,
  now: number = Date.now(),
): DealTiming {
  return resolve(expiresAt, now);
}

/** Resolve a deal's start time. Same five-minute lateness applies. */
export function dealStart(
  startsAt: string | null | undefined,
  now: number = Date.now(),
): DealTiming {
  return resolve(startsAt, now);
}

function resolve(value: string | null | undefined, now: number): DealTiming {
  if (!value) return { state: "none" };
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return { state: "none" };
  return at > now ? { state: "future", at: value } : { state: "past", at: value };
}

/** "12 Sep 2026, 02:00 pm" — the date style the rest of admin uses. */
export function formatDealTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * "in 6h" / "2 days ago" — a coarse distance, deliberately.
 *
 * The sweep that starts and ends deals runs every five minutes and first runs
 * two minutes after boot, so anything implying second precision would be a
 * promise the backend does not make. Nothing here resolves finer than a minute.
 */
export function formatDealDistance(value: string, now: number = Date.now()): string {
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return "—";
  const diff = at - now;
  const ahead = diff > 0;
  const mins = Math.round(Math.abs(diff) / 60_000);

  const label =
    mins < 1
      ? "less than a minute"
      : mins < 60
        ? plural(mins, "minute")
        : mins < 60 * 24
          ? plural(Math.round(mins / 60), "hour")
          : plural(Math.round(mins / (60 * 24)), "day");

  return ahead ? `in ${label}` : `${label} ago`;
}

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/**
 * ISO timestamp → the "YYYY-MM-DDTHH:mm" a `datetime-local` input wants.
 * Empty for a value that is absent or already past — the backend refuses a past
 * `expiresAt`, so echoing an elapsed one back would fail the save.
 */
export function toDealTimeInput(
  value: string | null | undefined,
  now: number = Date.now(),
): string {
  if (dealExpiry(value, now).state !== "future") return "";
  const d = new Date(value as string);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A `datetime-local` value → the ISO string the API takes, or null for empty. */
export function fromDealTimeInput(inputValue: string): string | null {
  if (!inputValue) return null;
  const d = new Date(inputValue);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
