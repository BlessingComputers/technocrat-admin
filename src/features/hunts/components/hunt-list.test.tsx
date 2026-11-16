// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { HuntCampaign, HuntDeal } from "../types/hunts";
import { groupCampaigns } from "../utils/hunt-groups";
import { HuntList } from "./hunt-list";
import { HuntWindowRail } from "./hunt-window-rail";

afterEach(cleanup);

const NOW = Date.parse("2026-11-13T12:00:00.000Z");
const M = 60_000;
const iso = (ms: number) => new Date(ms).toISOString();

function drop(startMs: number, overrides: Partial<HuntDeal> = {}): HuntDeal {
  return {
    id: `hd-${startMs}`,
    dealId: "deal-1",
    productId: "prod-1",
    productName: "iPhone 15",
    markupPercentage: -99,
    discountApplied: true,
    revealAt: iso(startMs - 10 * M),
    slotStart: iso(startMs),
    slotEnd: iso(startMs + 5 * M),
    claimStatus: "OPEN",
    heldByOrderId: null,
    heldByCustomerId: null,
    heldByCustomerName: null,
    heldAt: null,
    claimedAt: null,
    releasedAt: null,
    releaseReason: null,
    orderPaymentStatus: null,
    orderNumber: null,
    ...overrides,
  };
}

function campaign(overrides: Partial<HuntCampaign> = {}): HuntCampaign {
  return {
    id: "c-1",
    campaignId: "HUNT-ABCD1234",
    name: "Saturday hunt",
    windowStart: iso(NOW + 24 * 60 * M),
    windowEnd: iso(NOW + 28 * 60 * M),
    status: "SCHEDULED",
    huntDeals: [],
    createdAt: iso(NOW - 48 * 60 * M),
    updatedAt: iso(NOW - 48 * 60 * M),
    ...overrides,
  };
}

const live = campaign({
  id: "live",
  name: "Friday flash",
  status: "ACTIVE",
  windowStart: iso(NOW - 60 * M),
  windowEnd: iso(NOW + 60 * M),
  huntDeals: [
    drop(NOW - 30 * M, { claimStatus: "CLAIMED" }),
    drop(NOW - 2 * M),
    drop(NOW + 30 * M, { claimStatus: "HELD", productName: "AirPods" }),
  ],
});

function renderList(campaigns: HuntCampaign[], selectedId: string | null = null) {
  return render(
    <HuntList
      groups={groupCampaigns(campaigns)}
      selectedId={selectedId}
      now={NOW}
      isLoading={false}
      isError={false}
      onRetry={() => {}}
    />,
  );
}

describe("HuntList", () => {
  it("groups campaigns, marks the selection and folds ended", () => {
    renderList(
      [live, campaign({ id: "next" }), campaign({ id: "old", name: "Old hunt", status: "ENDED" })],
      "live",
    );
    expect(screen.getByRole("region", { name: "Live now" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Scheduled" })).toBeTruthy();
    expect(screen.queryByText("Old hunt")).toBeNull();
    expect(screen.getByRole("link", { current: "page" }).textContent).toContain("Friday flash");
    expect(screen.getByLabelText("1 of 3 claimed")).toBeTruthy();
    expect(screen.getByText("Drop live now")).toBeTruthy();
    expect(screen.getByText("1 awaiting payment")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Show ended campaigns (1)" }));
    expect(screen.getByText("Old hunt")).toBeTruthy();
  });

  it("warns on a stale scheduled campaign", () => {
    renderList([
      campaign({ windowStart: iso(NOW - 5 * 60 * M), windowEnd: iso(NOW - 4 * 60 * M) }),
    ]);
    expect(screen.getByText(/Never ran\. It will block the next campaign/)).toBeTruthy();
  });

  it("says so when there are no campaigns", () => {
    renderList([]);
    expect(screen.getByText("No treasure hunts yet.")).toBeTruthy();
  });
});

describe("HuntWindowRail", () => {
  it("puts each drop state in the rail label and the legend", () => {
    render(<HuntWindowRail campaign={live} now={NOW} />);
    const rail = screen.getByRole("img");
    const label = rail.getAttribute("aria-label") ?? "";
    expect(label).toMatch(/: Claimed\./);
    expect(label).toMatch(/: Live now\./);
    expect(label).toMatch(/AirPods: Held, awaiting payment\./);
    expect(screen.getByText("Times in WAT.")).toBeTruthy();
    // The legend names only the states this campaign has.
    expect(screen.getByText("Claimed")).toBeTruthy();
    expect(screen.queryByText("Still to drop")).toBeNull();
  });
});
