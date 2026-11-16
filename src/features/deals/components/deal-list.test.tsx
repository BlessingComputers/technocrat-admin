// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Deal } from "../types/deals";
import { DAY_MS, groupDeals } from "../utils/deal-groups";
import { DealList, type EndedDeals } from "./deal-list";
import { DealOverview } from "./deal-overview";
import { DealRail } from "./deal-rail";

afterEach(cleanup);

const NOW = Date.parse("2026-11-13T12:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "d-1",
    dealId: "DEAL-0001",
    name: "Storage week",
    targets: [{ entityType: "product", categoryId: "c-1", markupPercentage: -10 }],
    startsAt: iso(NOW - 2 * DAY_MS),
    expiresAt: iso(NOW + 5 * DAY_MS),
    allowCouponStacking: false,
    status: "ACTIVE",
    notes: null,
    createdByStaffId: "s-1",
    createdAt: iso(NOW - 10 * DAY_MS),
    updatedAt: iso(NOW - 2 * DAY_MS),
    ...overrides,
  };
}

const running = deal({ id: "run", name: "Apple November" });
const coming = deal({
  id: "soon",
  name: "Black Friday",
  status: "SCHEDULED",
  startsAt: iso(NOW + 2 * DAY_MS),
  expiresAt: iso(NOW + 9 * DAY_MS),
});
const draft = deal({ id: "draft", name: "Monitors", status: "DRAFT", startsAt: null });

function list(overrides: Partial<Parameters<typeof DealList>[0]> = {}, ended: Partial<EndedDeals> = {}) {
  const props = {
    groups: groupDeals([running, coming]),
    ended: { deals: [], total: 3, hasMore: false, isFetchingMore: false, onMore: vi.fn(), ...ended },
    selectedId: "run",
    now: NOW,
    isLoading: false,
    isError: false,
    onRetry: vi.fn(),
    showEnded: false,
    onShowEnded: vi.fn(),
    ...overrides,
  };
  render(<DealList {...props} />);
  return props;
}

describe("DealList", () => {
  it("groups deals with counts, skips empty groups, and marks the selected row", () => {
    list();
    expect(screen.getByRole("region", { name: "Running now" }).textContent).toContain("Apple November");
    expect(screen.getByRole("region", { name: "Coming up" }).textContent).toContain("Black Friday");
    expect(screen.queryByRole("region", { name: "Drafts" })).toBeNull();
    expect(screen.getByRole("link", { current: "page" }).getAttribute("href")).toBe("/pricing/deals?deal=run");
  });

  it("folds ended deals behind a count, then pages them 20 more at a time", () => {
    const folded = list();
    fireEvent.click(screen.getByRole("button", { name: "Show ended deals (3)" }));
    expect(folded.onShowEnded).toHaveBeenCalled();
    cleanup();

    const open = list(
      { showEnded: true },
      { deals: [deal({ id: "old", name: "October", status: "ENDED" })], hasMore: true },
    );
    expect(screen.getByRole("region", { name: "Ended" }).textContent).toContain("October");
    fireEvent.click(screen.getByRole("button", { name: "Show 20 more" }));
    expect(open.ended.onMore).toHaveBeenCalled();
  });

  it("hides the ended button when there are no ended deals", () => {
    list({}, { total: 0 });
    expect(screen.queryByRole("button", { name: /Show ended/ })).toBeNull();
  });
});

describe("DealOverview", () => {
  it("points to New deal when nothing runs or is coming up, for writers only", () => {
    render(<DealOverview running={[]} comingUp={[]} now={NOW} canWrite />);
    expect(screen.getByText("Nothing running or coming up")).toBeTruthy();
    expect(screen.getByRole("link", { name: "New deal" })).toBeTruthy();
    cleanup();
    render(<DealOverview running={[]} comingUp={[]} now={NOW} canWrite={false} />);
    expect(screen.queryByRole("link", { name: "New deal" })).toBeNull();
  });

  it("draws one rail per deal and one note per time overlap", () => {
    render(<DealOverview running={[running]} comingUp={[coming]} now={NOW} canWrite />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByText(/Apple November runs at the same time as Black Friday from/)).toBeTruthy();
  });
});

describe("DealRail", () => {
  it("draws the deal's rail and a pale rail per deal that runs at the same time", () => {
    render(<DealRail deal={running} others={[running, coming, draft]} now={NOW} />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByText(/^Black Friday runs at the same time from/)).toBeTruthy();
  });

  it("draws nothing for a draft", () => {
    const { container } = render(<DealRail deal={draft} others={[running]} now={NOW} />);
    expect(container.innerHTML).toBe("");
  });
});
