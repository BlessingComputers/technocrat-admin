// Positions on a time rail, as percents of a range.
//
// Pure, so the deals and hunts slices share one set of rules and the tests can
// pin the edges: a span clipped by the range, an open end, a range with no
// length (bad data must draw nothing, not NaN%).

export interface RailRange {
  start: number;
  end: number;
}

export interface RailSpan {
  left: number;
  width: number;
  /** Starts before the range. */
  clippedStart: boolean;
  /** Ends after the range, or never. The rail draws no end tick. */
  clippedEnd: boolean;
}

function hasLength(range: RailRange): boolean {
  return range.end > range.start;
}

function toPct(t: number, range: RailRange): number {
  return ((t - range.start) / (range.end - range.start)) * 100;
}

/** A moment on the rail, edges included; null outside the range. */
export function railPoint(t: number, range: RailRange): number | null {
  if (!hasLength(range) || t < range.start || t > range.end) return null;
  return toPct(t, range);
}

/** A stretch of time on the rail; `end: null` runs to the right edge. */
export function railSpan(
  start: number,
  end: number | null,
  range: RailRange,
): RailSpan | null {
  if (!hasLength(range)) return null;
  const from = Math.max(start, range.start);
  const to = end === null ? range.end : Math.min(end, range.end);
  if (to <= from) return null;
  const left = toPct(from, range);
  return {
    left,
    width: toPct(to, range) - left,
    clippedStart: start < range.start,
    clippedEnd: end === null || end > range.end,
  };
}

/** `count` evenly spaced axis ticks, both ends included. */
export function railTicks(range: RailRange, count: number): number[] {
  if (count < 2 || !hasLength(range)) return [];
  const step = (range.end - range.start) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(range.start + i * step));
}
