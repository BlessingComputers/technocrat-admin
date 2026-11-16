import { describe, expect, it } from "vitest";

import type { HuntCampaign } from "../types/hunts";
import { defaultCampaign, groupCampaigns } from "./hunt-groups";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");
const H = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();

function campaign(overrides: Partial<HuntCampaign> = {}): HuntCampaign {
  return {
    id: "c-1",
    campaignId: "HUNT-ABCD1234",
    name: "Saturday hunt",
    windowStart: iso(NOW + 24 * H),
    windowEnd: iso(NOW + 28 * H),
    status: "SCHEDULED",
    huntDeals: [],
    createdAt: iso(NOW - 48 * H),
    updatedAt: iso(NOW - 48 * H),
    ...overrides,
  };
}

describe("groupCampaigns", () => {
  it("puts DRAFT with SCHEDULED and orders each group", () => {
    const g = groupCampaigns([
      campaign({ id: "e-old", status: "ENDED", windowEnd: iso(NOW - 90 * H) }),
      campaign({ id: "s-late", windowStart: iso(NOW + 90 * H) }),
      campaign({ id: "live", status: "ACTIVE", windowStart: iso(NOW - H) }),
      campaign({ id: "draft", status: "DRAFT", windowStart: iso(NOW + 30 * H) }),
      campaign({ id: "e-new", status: "ENDED", windowEnd: iso(NOW - 2 * H) }),
    ]);
    expect(g.live.map((c) => c.id)).toEqual(["live"]);
    expect(g.scheduled.map((c) => c.id)).toEqual(["draft", "s-late"]);
    expect(g.ended.map((c) => c.id)).toEqual(["e-new", "e-old"]);
  });
});

describe("defaultCampaign", () => {
  it("picks the live campaign first", () => {
    const live = campaign({ id: "live", status: "ACTIVE", windowStart: iso(NOW - H) });
    expect(defaultCampaign([campaign({ id: "next" }), live], NOW)?.id).toBe("live");
  });
  it("else the next scheduled one whose window has not passed", () => {
    const stale = campaign({
      id: "stale",
      windowStart: iso(NOW - 50 * H),
      windowEnd: iso(NOW - 48 * H),
    });
    const next = campaign({ id: "next" });
    expect(defaultCampaign([stale, next], NOW)?.id).toBe("next");
  });
  it("else nothing", () => {
    const stale = campaign({ windowStart: iso(NOW - 5 * H), windowEnd: iso(NOW - 4 * H) });
    expect(defaultCampaign([stale, campaign({ status: "ENDED" })], NOW)).toBeUndefined();
  });
});
