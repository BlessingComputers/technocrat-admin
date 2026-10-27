import { describe, expect, it } from "vitest";
import { groupByPlacement, reorderWithin } from "./promotion-grouping";
import type { Promotion } from "../types/promotions";

function promo(
  id: string,
  placement: string,
  position: number,
  createdAt = "2026-01-01T00:00:00.000Z",
): Promotion {
  return {
    id,
    title: id,
    description: null,
    status: "PUBLISHED",
    position,
    placement,
    isFallback: false,
    targetCategorySlug: null,
    startAt: null,
    endAt: null,
    createdById: "u1",
    createdBy: { id: "u1", firstName: "A", lastName: "B" },
    slides: [],
    createdAt,
    updatedAt: createdAt,
  };
}

/** Read a slot back as plain ids, in order, for readable assertions. */
function slot(promotions: Promotion[], placement: string): string[] {
  return promotions
    .filter((p) => p.placement === placement)
    .sort((a, b) => a.position - b.position)
    .map((p) => p.id);
}

describe("groupByPlacement", () => {
  it("buckets by slot and sorts each by position", () => {
    const grouped = groupByPlacement([
      promo("b", "home-after-hero", 1),
      promo("a", "home-after-hero", 0),
      promo("c", "catalog-top", 0),
    ]);
    expect(grouped.placed["home-after-hero"]?.map((p) => p.id)).toEqual(["a", "b"]);
    expect(grouped.placed["catalog-top"]?.map((p) => p.id)).toEqual(["c"]);
    expect(grouped.unplaced).toEqual([]);
  });

  it("sends a key this build does not know to unplaced, not to the default slot", () => {
    // Falling back to home-after-hero here would put a banner on the homepage
    // that the storefront renders nowhere — the two must not disagree.
    const grouped = groupByPlacement([promo("x", "home-after-carousel-v2", 0)]);
    expect(grouped.unplaced.map((p) => p.id)).toEqual(["x"]);
    expect(grouped.placed["home-after-hero"]).toBeUndefined();
  });

  it("breaks a position tie by age, so the order does not flicker", () => {
    const grouped = groupByPlacement([
      promo("newer", "catalog-top", 0, "2026-05-01T00:00:00.000Z"),
      promo("older", "catalog-top", 0, "2026-01-01T00:00:00.000Z"),
    ]);
    expect(grouped.placed["catalog-top"]?.map((p) => p.id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("leaves slots with nothing in them absent rather than empty", () => {
    const grouped = groupByPlacement([promo("a", "hero-panel", 0)]);
    expect(Object.keys(grouped.placed)).toEqual(["hero-panel"]);
  });
});

describe("reorderWithin", () => {
  const list = [
    promo("a", "home-after-value", 0),
    promo("b", "home-after-value", 1),
    promo("c", "home-after-value", 2),
  ];

  it("moves a card backwards within its slot", () => {
    const result = reorderWithin(list, "c", "home-after-value", 0);
    expect(slot(result!.promotions, "home-after-value")).toEqual(["c", "a", "b"]);
  });

  it("moves a card forwards, accounting for the gap it leaves behind", () => {
    // Dropping "a" on the card at index 2 should land it after that card, not
    // before it — the index is read against the list before the move.
    const result = reorderWithin(list, "a", "home-after-value", 2);
    expect(slot(result!.promotions, "home-after-value")).toEqual(["b", "a", "c"]);
  });

  it("appends when dropped past the end", () => {
    const result = reorderWithin(list, "a", "home-after-value", 3);
    expect(slot(result!.promotions, "home-after-value")).toEqual(["b", "c", "a"]);
  });

  it("is a no-op when a card is dropped on itself", () => {
    expect(reorderWithin(list, "b", "home-after-value", 1)).toBeNull();
  });

  it("is a no-op when a card is dropped just after itself", () => {
    expect(reorderWithin(list, "b", "home-after-value", 2)).toBeNull();
  });

  it("returns null for an unknown id rather than throwing", () => {
    expect(reorderWithin(list, "nope", "home-after-value", 0)).toBeNull();
  });

  it("carries a card across slots and renumbers both", () => {
    const across = [
      promo("a", "home-after-value", 0),
      promo("b", "home-after-value", 1),
      promo("c", "home-after-value", 2),
      promo("x", "home-after-brands", 0),
    ];
    const result = reorderWithin(across, "b", "home-after-brands", 0)!;
    expect(slot(result.promotions, "home-after-brands")).toEqual(["b", "x"]);
    // The gap "b" left behind is closed in the same payload.
    expect(slot(result.promotions, "home-after-value")).toEqual(["a", "c"]);
    expect(
      result.entries.find((e) => e.id === "c"),
    ).toEqual({ id: "c", placement: "home-after-value", position: 1 });
  });

  it("sends placement on every entry, since the endpoint requires it", () => {
    const result = reorderWithin(list, "c", "home-after-value", 0)!;
    expect(result.entries.length).toBeGreaterThan(0);
    for (const entry of result.entries) {
      expect(entry.placement).toBe("home-after-value");
      expect(typeof entry.position).toBe("number");
    }
  });

  it("only sends the rows that actually moved", () => {
    // Swapping the last two leaves the first alone.
    const result = reorderWithin(list, "c", "home-after-value", 1)!;
    expect(result.entries.map((e) => e.id).sort()).toEqual(["b", "c"]);
  });

  it("can rescue an unplaced promotion into a real slot", () => {
    const stray = [promo("lost", "home-after-carousel-v2", 0)];
    const result = reorderWithin(stray, "lost", "home-after-hero", 0)!;
    expect(result.entries).toEqual([
      { id: "lost", placement: "home-after-hero", position: 0 },
    ]);
  });
});
