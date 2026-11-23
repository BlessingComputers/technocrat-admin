import { describe, expect, it } from "vitest";
import { runStarts } from "./message-runs";

describe("runStarts", () => {
  it("marks the first message of each run of the same sender", () => {
    const keys = ["customer", "customer", "ai", "staff:a", "staff:a", "staff:b", "customer"];
    expect(runStarts(keys, (k) => k)).toEqual([true, false, true, true, false, true, true]);
  });

  it("returns an empty array for no messages", () => {
    expect(runStarts([], (k: string) => k)).toEqual([]);
  });
});
