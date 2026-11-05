import { describe, expect, it } from "vitest";
import type { AdSpend } from "../types/ad-spend";
import {
  amountInWindow,
  formatRoas,
  parsePeriod,
  spendByCampaign,
  spendWindow,
  unmatchedSpend,
} from "./ad-spend";

const entry = (over: Partial<AdSpend>): AdSpend => ({
  id: "e1",
  platform: "meta",
  campaign: "black_friday_2026",
  adContent: null,
  startDate: "2026-10-01",
  endDate: "2026-10-10",
  amount: 100_000,
  currency: "NGN",
  note: null,
  createdBy: { id: "s1", name: "Ada" },
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...over,
});

const oct = { from: "2026-10-01", to: "2026-10-31" };

describe("spendWindow", () => {
  it("covers the last N days, today included", () => {
    expect(spendWindow(7, new Date("2026-10-29T15:00:00Z"))).toEqual({ from: "2026-10-23", to: "2026-10-29" });
  });
});

describe("parsePeriod", () => {
  it("falls back to 30d", () => {
    expect(parsePeriod("90d")).toBe("90d");
    expect(parsePeriod("2y")).toBe("30d");
    expect(parsePeriod(undefined)).toBe("30d");
  });
});

describe("amountInWindow", () => {
  it("counts a whole entry inside the window", () => {
    expect(amountInWindow(entry({}), oct)).toBe(100_000);
  });

  it("spreads an entry evenly when the window cuts through it", () => {
    const straddle = entry({ startDate: "2026-10-25", endDate: "2026-11-03" });
    expect(amountInWindow(straddle, { from: "2026-10-01", to: "2026-10-29" })).toBe(50_000);
  });

  it("counts a one-day entry once", () => {
    expect(amountInWindow(entry({ startDate: "2026-10-05", endDate: "2026-10-05" }), oct)).toBe(100_000);
  });

  it("is zero outside the window", () => {
    expect(amountInWindow(entry({ startDate: "2026-09-01", endDate: "2026-09-30" }), oct)).toBe(0);
  });
});

describe("spendByCampaign", () => {
  it("sums per campaign and per ad, keyed case-insensitively", () => {
    const spend = spendByCampaign(
      [
        entry({ id: "a", adContent: "Carousel_A", amount: 30_000 }),
        entry({ id: "b", adContent: null, amount: 70_000 }),
      ],
      oct,
    );
    const bf = spend.get("black_friday_2026");
    expect(bf?.total).toBe(100_000);
    expect(bf?.byAd.get("carousel_a")).toBe(30_000);
    expect(bf?.byAd.size).toBe(1);
  });

  it("leaves out entries with nothing in the window", () => {
    expect(spendByCampaign([entry({ startDate: "2026-09-01", endDate: "2026-09-02" })], oct).size).toBe(0);
  });
});

describe("unmatchedSpend", () => {
  it("lists spend whose campaign brought no tagged visits", () => {
    const spend = spendByCampaign([entry({}), entry({ id: "x", campaign: "ghost" })], oct);
    expect(unmatchedSpend(spend, ["Black_Friday_2026"])).toEqual([{ campaign: "ghost", total: 100_000 }]);
  });
});

describe("formatRoas", () => {
  it("is a multiple of spend", () => {
    expect(formatRoas(320_000, 100_000)).toBe("3.2×");
    expect(formatRoas(0, 100_000)).toBe("0.0×");
  });

  it("is a dash without spend", () => {
    expect(formatRoas(320_000, undefined)).toBe("–");
    expect(formatRoas(320_000, 0)).toBe("–");
  });
});
