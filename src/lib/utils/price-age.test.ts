import { describe, expect, it, vi } from "vitest";

import {
  confirmPricesInBatches,
  priceAgeDays,
  priceAgeLabel,
  priceCheckedBefore,
  toPriceAgeDays,
} from "./price-age";

const NOW = new Date("2026-11-13T12:00:00.000Z");

describe("price age", () => {
  it("counts whole days and never goes negative", () => {
    expect(priceAgeDays("2026-10-14T12:00:00.000Z", NOW)).toBe(30);
    expect(priceAgeDays("2026-11-13T01:00:00.000Z", NOW)).toBe(0);
    expect(priceAgeDays("2026-11-14T00:00:00.000Z", NOW)).toBe(0);
  });

  it("labels the age", () => {
    expect(priceAgeLabel(0)).toBe("Today");
    expect(priceAgeLabel(1)).toBe("1 day ago");
    expect(priceAgeLabel(42)).toBe("42 days ago");
  });

  it("builds the cut-off for N days", () => {
    expect(priceCheckedBefore(30, NOW)).toBe("2026-10-14T12:00:00.000Z");
  });

  it("accepts only the offered filter choices", () => {
    expect(toPriceAgeDays(60)).toBe(60);
    expect(toPriceAgeDays(45)).toBeUndefined();
    expect(toPriceAgeDays(undefined)).toBeUndefined();
  });
});

describe("confirmPricesInBatches", () => {
  it("sends at most 200 ids per call and adds up the counts", async () => {
    const ids = Array.from({ length: 450 }, (_, i) => `id-${i}`);
    const send = vi.fn(async (batch: string[]) => ({
      updated: batch.length - 1,
      priceCheckedAt: "2026-11-13T12:00:00.000Z",
    }));

    const res = await confirmPricesInBatches(ids, send);

    expect(send.mock.calls.map(([batch]) => batch.length)).toEqual([200, 200, 50]);
    expect(res).toEqual({ updated: 447, priceCheckedAt: "2026-11-13T12:00:00.000Z" });
  });
});
