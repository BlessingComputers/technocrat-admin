import { describe, expect, it } from "vitest";

import { railPoint, railSpan, railTicks, type RailRange } from "./time-rail";

const range: RailRange = { start: 0, end: 1000 };

describe("railPoint", () => {
  it("places a time inside the range as a percent", () => {
    expect(railPoint(250, range)).toBe(25);
  });
  it("includes both edges", () => {
    expect(railPoint(0, range)).toBe(0);
    expect(railPoint(1000, range)).toBe(100);
  });
  it("returns null outside the range", () => {
    expect(railPoint(-1, range)).toBeNull();
    expect(railPoint(1001, range)).toBeNull();
  });
  it("returns null for an empty or inverted range", () => {
    expect(railPoint(5, { start: 10, end: 10 })).toBeNull();
    expect(railPoint(5, { start: 10, end: 0 })).toBeNull();
  });
});

describe("railSpan", () => {
  it("returns left and width for a span inside the range", () => {
    expect(railSpan(100, 600, range)).toEqual({
      left: 10,
      width: 50,
      clippedStart: false,
      clippedEnd: false,
    });
  });
  it("clips a span that starts before the range", () => {
    expect(railSpan(-500, 300, range)).toEqual({
      left: 0,
      width: 30,
      clippedStart: true,
      clippedEnd: false,
    });
  });
  it("runs an open end to the right edge and flags it", () => {
    expect(railSpan(400, null, range)).toEqual({
      left: 40,
      width: 60,
      clippedStart: false,
      clippedEnd: true,
    });
  });
  it("clips a span that ends after the range", () => {
    expect(railSpan(900, 5000, range)?.clippedEnd).toBe(true);
  });
  it("returns null when the span misses the range", () => {
    expect(railSpan(1200, 1500, range)).toBeNull();
    expect(railSpan(-300, -100, range)).toBeNull();
  });
  it("returns null for an empty or inverted range", () => {
    expect(railSpan(0, 10, { start: 5, end: 5 })).toBeNull();
    expect(railSpan(0, 10, { start: 9, end: 1 })).toBeNull();
  });
});

describe("railTicks", () => {
  it("spreads count ticks evenly, both ends included", () => {
    expect(railTicks(range, 5)).toEqual([0, 250, 500, 750, 1000]);
  });
  it("returns nothing for fewer than two ticks or an empty range", () => {
    expect(railTicks(range, 1)).toEqual([]);
    expect(railTicks({ start: 3, end: 3 }, 4)).toEqual([]);
  });
});
