// Sale timing.
//
// `expiresAt` only means anything on a negative (discount) rule — the backend
// ignores it on a markup — so this file belongs to the Deals half of pricing.
// It sat in `markup-rule-utils.ts` while one form did both jobs; it moved here
// when `/pricing/markup` stopped carrying a discount (ticket 04).

/** How a rule's expiry reads right now. */
export type MarkupExpiry =
  | { state: "none" }
  | { state: "scheduled"; at: string }
  | { state: "expired"; at: string };

/**
 * Resolve a rule's expiry against the clock.
 *
 * An elapsed expiry does not clear `isActive` — the backend's sweep runs every
 * five minutes — so a row can read "Active" while the sale is already over.
 * That gap is exactly what the table has to show.
 */
export function markupRuleExpiry(
  expiresAt: string | null | undefined,
  now: number = Date.now(),
): MarkupExpiry {
  if (!expiresAt) return { state: "none" };
  const at = new Date(expiresAt).getTime();
  if (Number.isNaN(at)) return { state: "none" };
  return at > now
    ? { state: "scheduled", at: expiresAt }
    : { state: "expired", at: expiresAt };
}

/** "12 Sep 2026, 02:00 pm" — matches the date style used elsewhere in admin. */
export function formatExpiry(value: string): string {
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
 * ISO timestamp → the "YYYY-MM-DDTHH:mm" a `datetime-local` input wants.
 * Returns "" for no expiry, and for one that has already passed: the backend
 * refuses a past `expiresAt`, so echoing a rule's own elapsed expiry back on an
 * unrelated edit would fail the whole save.
 */
export function toExpiryInputValue(
  value: string | null | undefined,
  now: number = Date.now(),
): string {
  if (markupRuleExpiry(value, now).state !== "scheduled") return "";
  const d = new Date(value as string);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * A `datetime-local` value → the ISO string the API takes, or `null` for empty.
 * Always call this on submit — the service writes `dto.expiresAt ?? null`, so a
 * payload that omits the field turns a timed sale indefinite.
 */
export function toExpiryIso(inputValue: string): string | null {
  if (!inputValue) return null;
  const d = new Date(inputValue);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
