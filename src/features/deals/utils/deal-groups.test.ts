import { describe, expect, it } from "vitest";

import type { Deal } from "../types/deals";
import { formatDealDistance, formatDealTime } from "./deal-timing";
import {
  DAY_MS,
  dealWindow,
  groupDeals,
  overlapPairs,
  overviewHeading,
  overviewRange,
  timeOverlaps,
  timingLine,
} from "./deal-groups";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "d-1",
    dealId: "DEAL-0001",
    name: "Storage week",
    targets: [{ entityType: "product", categoryId: "c-1", markupPercentage: -10 }],
    startsAt: null,
    expiresAt: null,
    allowCouponStacking: false,
    status: "ACTIVE",
    notes: null,
    createdByStaffId: "s-1",
    createdAt: iso(NOW - 10 * DAY_MS),
    updatedAt: iso(NOW - 2 * DAY_MS),
    ...overrides,
  };
}

describe("groupDeals", () => {
  it("splits by status and drops ended deals", () => {
    const g = groupDeals([
      deal({ id: "a", status: "ACTIVE" }),
      deal({ id: "s", status: "SCHEDULED", startsAt: iso(NOW + DAY_MS) }),
      deal({ id: "d", status: "DRAFT" }),
      deal({ id: "e", status: "ENDED" }),
    ]);
    expect(g.running.map((d) => d.id)).toEqual(["a"]);
    expect(g.comingUp.map((d) => d.id)).toEqual(["s"]);
    expect(g.drafts.map((d) => d.id)).toEqual(["d"]);
  });

  it("sorts running by soonest end, open-ended last", () => {
    const g = groupDeals([
      deal({ id: "open", expiresAt: null }),
      deal({ id: "late", expiresAt: iso(NOW + 9 * DAY_MS) }),
      deal({ id: "soon", expiresAt: iso(NOW + DAY_MS) }),
    ]);
    expect(g.running.map((d) => d.id)).toEqual(["soon", "late", "open"]);
  });

  it("sorts coming up by soonest start and drafts by newest", () => {
    const g = groupDeals([
      deal({ id: "s2", status: "SCHEDULED", startsAt: iso(NOW + 5 * DAY_MS) }),
      deal({ id: "s1", status: "SCHEDULED", startsAt: iso(NOW + DAY_MS) }),
      deal({ id: "old", status: "DRAFT", createdAt: iso(NOW - 9 * DAY_MS) }),
      deal({ id: "new", status: "DRAFT", createdAt: iso(NOW - DAY_MS) }),
    ]);
    expect(g.comingUp.map((d) => d.id)).toEqual(["s1", "s2"]);
    expect(g.drafts.map((d) => d.id)).toEqual(["new", "old"]);
  });
});

describe("dealWindow", () => {
  it("uses startsAt when the sweep started the deal", () => {
    const start = NOW - 3 * DAY_MS;
    const end = NOW + 4 * DAY_MS;
    expect(dealWindow(deal({ startsAt: iso(start), expiresAt: iso(end) }))).toEqual({ start, end });
  });
  it("falls back to updatedAt for a deal started by hand", () => {
    expect(dealWindow(deal({ startsAt: null }))?.start).toBe(NOW - 2 * DAY_MS);
  });
  it("keeps an open end as null", () => {
    expect(dealWindow(deal({ expiresAt: null }))?.end).toBeNull();
  });
  it("has no window for drafts and ended deals", () => {
    expect(dealWindow(deal({ status: "DRAFT" }))).toBeNull();
    expect(dealWindow(deal({ status: "ENDED" }))).toBeNull();
  });
});

describe("timeOverlaps", () => {
  const apple = deal({
    id: "apple",
    startsAt: iso(NOW - 5 * DAY_MS),
    expiresAt: iso(NOW + 12 * DAY_MS),
  });

  it("finds a deal that runs at the same time, from the later start", () => {
    const bf = deal({
      id: "bf",
      status: "SCHEDULED",
      startsAt: iso(NOW + 2 * DAY_MS),
      expiresAt: iso(NOW + 20 * DAY_MS),
    });
    const [hit] = timeOverlaps(apple, [bf]);
    expect(hit.deal.id).toBe("bf");
    expect(hit.from).toBe(NOW + 2 * DAY_MS);
  });

  it("ignores itself, back-to-back deals, and drafts", () => {
    const after = deal({
      id: "after",
      status: "SCHEDULED",
      startsAt: iso(NOW + 12 * DAY_MS),
      expiresAt: iso(NOW + 14 * DAY_MS),
    });
    const draft = deal({ id: "draft", status: "DRAFT" });
    expect(timeOverlaps(apple, [apple, after, draft])).toEqual([]);
  });

  it("treats an open end as running forever", () => {
    const open = deal({ id: "open", startsAt: iso(NOW - DAY_MS), expiresAt: null });
    const far = deal({
      id: "far",
      status: "SCHEDULED",
      startsAt: iso(NOW + 300 * DAY_MS),
      expiresAt: iso(NOW + 301 * DAY_MS),
    });
    expect(timeOverlaps(open, [far]).map((o) => o.deal.id)).toEqual(["far"]);
  });

  it("lists each pair once in overlapPairs", () => {
    const bf = deal({
      id: "bf",
      status: "SCHEDULED",
      startsAt: iso(NOW + 2 * DAY_MS),
      expiresAt: iso(NOW + 20 * DAY_MS),
    });
    expect(overlapPairs([apple, bf])).toEqual([{ a: apple, b: bf, from: NOW + 2 * DAY_MS }]);
  });
});

describe("overviewRange", () => {
  it("spans four days back to sixteen days ahead", () => {
    expect(overviewRange(NOW)).toEqual({ start: NOW - 4 * DAY_MS, end: NOW + 16 * DAY_MS });
  });
  it("stretches its end so a deal starting after day sixteen still shows a segment", () => {
    const far = deal({ status: "SCHEDULED", startsAt: iso(NOW + 30 * DAY_MS) });
    const near = deal({ status: "SCHEDULED", startsAt: iso(NOW + 3 * DAY_MS) });
    expect(overviewRange(NOW, [near, far]).end).toBe(NOW + 32 * DAY_MS);
    expect(overviewRange(NOW, [near]).end).toBe(NOW + 16 * DAY_MS);
  });
});

describe("overviewHeading", () => {
  it("says two weeks for the default range", () => {
    expect(overviewHeading(overviewRange(NOW), NOW)).toBe("The next two weeks");
  });
  it("counts the weeks, rounded up, when the range stretches", () => {
    const at = (days: number) => [deal({ status: "SCHEDULED", startsAt: iso(NOW + days * DAY_MS) })];
    expect(overviewHeading(overviewRange(NOW, at(16)), NOW)).toBe("The next 3 weeks");
    expect(overviewHeading(overviewRange(NOW, at(30)), NOW)).toBe("The next 5 weeks");
  });
});

describe("timingLine", () => {
  it("says when a running deal ends", () => {
    const end = iso(NOW + 5 * DAY_MS);
    expect(timingLine(deal({ expiresAt: end }), NOW)).toBe(`Ends ${formatDealDistance(end, NOW)}`);
  });
  it("says prices reset when an ACTIVE deal is past its end", () => {
    const end = iso(NOW - 2 * 60_000);
    expect(timingLine(deal({ expiresAt: end }), NOW)).toBe(
      `Ended ${formatDealDistance(end, NOW)} · prices reset on the next sweep`,
    );
  });
  it("covers open-ended, scheduled, draft and ended deals", () => {
    expect(timingLine(deal({ expiresAt: null }), NOW)).toBe("Runs until you end it");
    const start = iso(NOW + DAY_MS);
    expect(timingLine(deal({ status: "SCHEDULED", startsAt: start }), NOW)).toBe(
      `Starts ${formatDealTime(start)}`,
    );
    expect(timingLine(deal({ status: "SCHEDULED", startsAt: iso(NOW - 60_000) }), NOW)).toBe(
      "Starting shortly",
    );
    expect(timingLine(deal({ status: "DRAFT" }), NOW)).toBe("Not started");
    expect(timingLine(deal({ status: "ENDED", expiresAt: null }), NOW)).toBe("Ended manually");
  });
});
