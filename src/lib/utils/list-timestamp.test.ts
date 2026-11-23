import { describe, expect, it } from "vitest";
import { formatListTimestamp } from "./list-timestamp";

// Local-time constructors, so the test holds in any timezone.
const now = new Date(2026, 10, 23, 15, 0); // Sun 23 Nov 2026, 15:00

describe("formatListTimestamp", () => {
  it("shows the time for today", () => {
    expect(formatListTimestamp(new Date(2026, 10, 23, 9, 5).toISOString(), now)).toBe("09:05");
  });

  it("shows Yesterday for yesterday, even late at night", () => {
    expect(formatListTimestamp(new Date(2026, 10, 22, 23, 59).toISOString(), now)).toBe(
      "Yesterday",
    );
  });

  it("shows the weekday within the last 6 days", () => {
    expect(formatListTimestamp(new Date(2026, 10, 18, 12, 0).toISOString(), now)).toBe(
      "Wednesday",
    );
  });

  it("shows the date for anything older", () => {
    expect(formatListTimestamp(new Date(2026, 10, 16, 12, 0).toISOString(), now)).toBe(
      "16/11/2026",
    );
  });

  it("returns an empty string for a missing or bad value", () => {
    expect(formatListTimestamp(null, now)).toBe("");
    expect(formatListTimestamp("not a date", now)).toBe("");
  });
});
