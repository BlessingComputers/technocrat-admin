/** Pure formatting/display helpers for the chat UI. */

/**
 * Two-letter initials from a display name (e.g. "Mr Femi" → "MF"). Tolerates a
 * missing name — chat conversation payloads are hand-typed and not runtime-
 * guaranteed, so `name` can be null/undefined at runtime despite the type.
 */
export function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// A small palette of avatar tints, matching the designer's varied circles.
// Semantic tokens only (ADR-0009) — the chart series plus success/gold give the
// varied hues without hardcoding Tailwind palette colors.
const AVATAR_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-success",
  "bg-gold",
  "bg-warning",
];

/** Deterministic avatar colour for a name/id, so the same person is consistent. */
export function avatarColorClass(seed?: string | null): string {
  const s = seed ?? "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** "9:32 pm" — message + list timestamp. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

/** Day separator label — "Today", "Yesterday" or "Mon, 9:30 PM"-style date. */
export function formatDaySeparator(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(d, today)) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Group messages into day buckets keyed by a separator label. */
export function groupByDay<T extends { createdAt: string }>(
  messages: T[],
): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const message of messages) {
    const label = formatDaySeparator(message.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(message);
    } else {
      groups.push({ label, items: [message] });
    }
  }
  return groups;
}
