import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activePreset,
  describeRange,
  pastWeeksOf,
  pastWeeksRange,
  rangeError,
} from "./upload-period";
import { periodToDateRange } from "../utils/period-to-range";

describe("activePreset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-26T10:00:00Z")); // a Thursday
  });
  afterEach(() => vi.useRealTimers());

  it("names the preset that produced the range", () => {
    expect(activePreset({ startDate: "2026-11-26", endDate: "2026-11-26" })).toBe("today");
    expect(activePreset({ startDate: "2026-11-16", endDate: "2026-11-21" })).toBe("last_week");
    expect(activePreset({ startDate: "2026-11-12", endDate: "2026-11-26" })).toBe("weeks");
    expect(activePreset({ startDate: "2026-11-01", endDate: "2026-11-26" })).toBe("this_month");
  });

  it("returns custom for any other window", () => {
    expect(activePreset({ startDate: "2026-11-02", endDate: "2026-11-20" })).toBe("custom");
  });

  it("prefers the first preset when two give the same window", () => {
    // On the 15th, "past 2 weeks" and "this month" are both 1–15.
    vi.setSystemTime(new Date("2026-11-15T10:00:00Z"));
    expect(activePreset({ startDate: "2026-11-01", endDate: "2026-11-15" })).toBe("weeks");
    // On the 1st, "today" and "this month" are the same day.
    vi.setSystemTime(new Date("2026-11-01T10:00:00Z"));
    expect(activePreset({ startDate: "2026-11-01", endDate: "2026-11-01" })).toBe("today");
  });
});

describe("past x weeks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T09:00:00Z")); // Wednesday meeting
  });
  afterEach(() => vi.useRealTimers());

  it("runs from today minus x * 7 days to today", () => {
    expect(pastWeeksRange(2)).toEqual({ startDate: "2026-11-11", endDate: "2026-11-25" });
    expect(pastWeeksRange(1)).toEqual({ startDate: "2026-11-18", endDate: "2026-11-25" });
  });

  it("reads x back from a window", () => {
    expect(pastWeeksOf({ startDate: "2026-11-11", endDate: "2026-11-25" })).toBe(2);
    expect(pastWeeksOf({ startDate: "2026-08-26", endDate: "2026-11-25" })).toBe(13);
  });

  it("returns null for a window that is not x weeks back from today", () => {
    expect(pastWeeksOf({ startDate: "2026-11-12", endDate: "2026-11-25" })).toBeNull();
    expect(pastWeeksOf({ startDate: "2026-11-04", endDate: "2026-11-18" })).toBeNull();
    expect(pastWeeksOf({ startDate: "2026-11-25", endDate: "2026-11-25" })).toBeNull();
  });
});

describe("last week", () => {
  afterEach(() => vi.useRealTimers());

  it("is the previous Monday to Saturday at a Wednesday meeting", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T09:00:00Z"));
    expect(periodToDateRange("last_week", null)).toEqual({
      startDate: "2026-11-16",
      endDate: "2026-11-21",
    });
  });

  it("still means the week before on a Monday and on a Sunday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T09:00:00Z")); // Monday
    expect(periodToDateRange("last_week", null).startDate).toBe("2026-11-16");
    vi.setSystemTime(new Date("2026-11-29T09:00:00Z")); // Sunday
    expect(periodToDateRange("last_week", null).startDate).toBe("2026-11-16");
  });

  it("crosses a month end", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-02T09:00:00Z")); // Wednesday
    expect(periodToDateRange("last_week", null)).toEqual({
      startDate: "2026-11-23",
      endDate: "2026-11-28",
    });
  });
});

describe("describeRange", () => {
  it("shows one day without a range", () => {
    expect(describeRange({ startDate: "2026-11-26", endDate: "2026-11-26" })).toBe(
      "26 Nov 2026 · 1 day",
    );
  });

  it("shares the month and year inside one month", () => {
    expect(describeRange({ startDate: "2026-11-01", endDate: "2026-11-26" })).toBe(
      "1–26 Nov 2026 · 26 days",
    );
  });

  it("shares the year across months", () => {
    expect(describeRange({ startDate: "2026-10-28", endDate: "2026-11-26" })).toBe(
      "28 Oct – 26 Nov 2026 · 30 days",
    );
  });

  it("writes both years across a year end", () => {
    expect(describeRange({ startDate: "2025-12-30", endDate: "2026-01-02" })).toBe(
      "30 Dec 2025 – 2 Jan 2026 · 4 days",
    );
  });
});

describe("rangeError", () => {
  it("accepts a valid window", () => {
    expect(rangeError({ startDate: "2026-11-01", endDate: "2026-11-26" })).toBeNull();
    expect(rangeError({ startDate: "2026-11-26", endDate: "2026-11-26" })).toBeNull();
  });

  it("rejects missing dates", () => {
    expect(rangeError({ startDate: "", endDate: "2026-11-26" })).toBe("Pick both dates.");
  });

  it("rejects a start after the end", () => {
    expect(rangeError({ startDate: "2026-11-27", endDate: "2026-11-26" })).toBe(
      "The start date must be on or before the end date.",
    );
  });
});
