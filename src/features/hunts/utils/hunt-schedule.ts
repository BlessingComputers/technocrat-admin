// A drop's slot, in the design's default shape.
//
// Five minutes long, its countdown public ten minutes before it opens. Staff
// set the slot start and the other two follow unless edited. "Spread evenly"
// fills the starts across the window; staff then nudge them, so the pattern is
// not guessable from the first two drops.

/** How long a drop is open. */
export const SLOT_MS = 5 * 60_000;

/** How long before a drop opens its countdown goes public. */
export const REVEAL_LEAD_MS = 10 * 60_000;

/** The create route takes one to twenty drops. */
export const HUNT_MAX_DROPS = 20;

/** The design's shape: three small items and an anchor prize. */
export const HUNT_DEFAULT_DROPS = 4;

const MINUTE = 60_000;

const ms = (iso: string) => new Date(iso).getTime();

/** The default slot end: five minutes after the start. */
export function defaultSlotEnd(slotStart: string): string {
  return new Date(ms(slotStart) + SLOT_MS).toISOString();
}

/** The default reveal: ten minutes before the start. */
export function defaultRevealAt(slotStart: string): string {
  return new Date(ms(slotStart) - REVEAL_LEAD_MS).toISOString();
}

/**
 * `count` slot starts spread across the window, or null when it is too short.
 *
 * The usable range starts ten minutes in, so the first countdown is not public
 * before the window opens, and ends five minutes before the close, so the last
 * slot fits. Each start sits in the middle of its equal share of that range,
 * floored to the minute. That keeps drops off the window's edges.
 *
 * Too short means no room for one slot, or, with several drops, a share under
 * eleven minutes. Below ten, one drop's countdown would start while the one
 * before it is still counting down, and the public page shows one countdown at
 * a time. The extra minute absorbs the flooring.
 */
export function spreadStarts(
  windowStart: string,
  windowEnd: string,
  count: number,
): string[] | null {
  const from = ms(windowStart) + REVEAL_LEAD_MS;
  const to = ms(windowEnd) - SLOT_MS;
  if (!Number.isFinite(from) || !Number.isFinite(to) || count < 1 || to < from) {
    return null;
  }

  const share = (to - from) / count;
  if (count > 1 && share < REVEAL_LEAD_MS + MINUTE) return null;

  return Array.from({ length: count }, (_, i) => {
    const at = from + share * (i + 0.5);
    return new Date(Math.floor(at / MINUTE) * MINUTE).toISOString();
  });
}
