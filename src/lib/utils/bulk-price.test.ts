import { describe, expect, it } from "vitest";

import {
  BULK_PRICE_MAX_ITEMS,
  adjustPrice,
  parseBulkPriceIds,
  pendingPriceChanges,
  runLimited,
} from "./bulk-price";

describe("adjustPrice", () => {
  it("raises by a percentage and rounds to the step", () => {
    expect(adjustPrice(152_340, { mode: "percent", value: 5, roundTo: 1000 })).toBe(160_000);
  });

  it("lowers by a percentage", () => {
    expect(adjustPrice(200_000, { mode: "percent", value: -10, roundTo: 1 })).toBe(180_000);
  });

  it("adds a fixed amount", () => {
    expect(adjustPrice(99_950, { mode: "amount", value: 2_000, roundTo: 100 })).toBe(102_000);
  });

  it("never goes below zero", () => {
    expect(adjustPrice(5_000, { mode: "amount", value: -9_000, roundTo: 1 })).toBe(0);
  });
});

describe("pendingPriceChanges", () => {
  const rows = [
    { key: "a", current: 100_000 },
    { key: "b", current: 50_000 },
    { key: "c", current: null },
    { key: "d", current: 70_000 },
  ];

  it("keeps only rows whose draft differs from the current price", () => {
    const res = pendingPriceChanges(rows, {
      a: "₦110 000",
      b: "₦50 000",
      c: "",
    });
    expect(res.changes).toEqual([{ key: "a", price: 110_000 }]);
    expect(res.invalid).toEqual([]);
  });

  it("treats a blank or missing draft as no change", () => {
    expect(pendingPriceChanges(rows, { a: "", d: "  " }).changes).toEqual([]);
  });

  it("flags a zero price as invalid", () => {
    const res = pendingPriceChanges(rows, { b: "₦0", c: "₦12 000" });
    expect(res.invalid).toEqual(["b"]);
    expect(res.changes).toEqual([{ key: "c", price: 12_000 }]);
  });
});

describe("runLimited", () => {
  it("never runs more than the limit at once and keeps input order", async () => {
    let running = 0;
    let peak = 0;
    const results = await runLimited([1, 2, 3, 4, 5, 6], 2, async (n) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5));
      running -= 1;
      if (n === 4) throw new Error("boom");
      return n * 10;
    });
    expect(peak).toBe(2);
    expect(results.map((r) => (r.status === "fulfilled" ? r.value : "x"))).toEqual([
      10, 20, 30, "x", 50, 60,
    ]);
  });
});

describe("parseBulkPriceIds", () => {
  const a = "0b6f8c1e-3d2a-4f5b-9c8d-7e6f5a4b3c2d";
  const b = "1c7a9d2f-4e3b-4a6c-8d9e-8f7a6b5c4d3e";

  it("keeps UUIDs and drops anything else", () => {
    expect(parseBulkPriceIds(`${a},../orders,${b},`)).toEqual([a, b]);
  });

  it("returns nothing for a missing param and drops duplicates", () => {
    expect(parseBulkPriceIds(null)).toEqual([]);
    expect(parseBulkPriceIds(`${a},${a}`)).toEqual([a]);
  });

  it("caps the batch size", () => {
    const many = Array.from({ length: BULK_PRICE_MAX_ITEMS + 5 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    expect(parseBulkPriceIds(many.join(","))).toHaveLength(BULK_PRICE_MAX_ITEMS);
  });
});
