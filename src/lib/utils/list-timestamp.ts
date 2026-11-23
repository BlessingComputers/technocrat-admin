/**
 * Conversation-list timestamps, the way WhatsApp's chat list shows them:
 *
 * - today: the time, "14:05"
 * - yesterday: "Yesterday"
 * - the last 6 days: the weekday, "Tuesday"
 * - older: the date, "21/11/2026" (day first, as staff in Nigeria read it)
 *
 * The chat list used to print only the time, so a month-old message looked
 * like it arrived today, and the WhatsApp list printed "3h"/"2d", which says
 * nothing about when. `listTimestampTitle` gives the exact moment for a
 * `title` tooltip.
 */
export function formatListTimestamp(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (days <= 0) {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-GB", { weekday: "long" });
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** "Sun 23 Nov 2026, 14:05" — the exact moment, for a tooltip. */
export function listTimestampTitle(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
