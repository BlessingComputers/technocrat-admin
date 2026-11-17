import { describe, expect, it } from "vitest";

import {
  analyzeRule,
  buildCoverage,
  candidates,
  cellItems,
  categoryChain,
  countGaps,
  familyCounts,
  filterMap,
  filterRules,
  flattenCategoryTree,
  ruleAfterDeal,
  type CoverageRow,
  type CoverageRule,
} from "./markup-coverage";

// The comp's catalogue (docs/design/markup-page-comp.html, state A).
const ROWS: CoverageRow[] = [
  ["computers", null],
  ["laptops", "computers"],
  ["desktops", "computers"],
  ["monitors", "computers"],
  ["phones-tabs", null],
  ["phones", "phones-tabs"],
  ["tablets", "phones-tabs"],
  ["accessories", null],
  ["kbm", "accessories"],
  ["storage", "accessories"],
  ["printers", null],
  ["networking", null],
].map(([id, parentId]) => ({ id: id!, name: id!, parentId, count: 1 }));

const NOW = new Date("2026-11-13T12:00:00Z").getTime();
let seq = 0;

function rule(
  ruleId: string,
  scope: { cat?: string; brand?: string; type?: string; item?: string },
  pct: number,
  extra: Partial<CoverageRule> = {},
): CoverageRule {
  const { cat = null, brand = null, type = null, item = null } = scope;
  seq += 1;
  return {
    id: ruleId,
    ruleId,
    label: ruleId,
    tier: "x",
    categoryId: cat,
    categoryName: cat,
    brandId: brand,
    brandName: brand,
    typeId: type,
    typeName: type,
    itemId: item,
    pct,
    affectsPrice: true,
    isDeal: pct < 0,
    dealId: null,
    meta: "",
    expiresAt: null,
    isActive: true,
    createdAt: `2026-01-01T00:00:${String(seq).padStart(2, "0")}Z`,
    ...extra,
  };
}

const ends = (iso: string) => ({ expiresAt: iso });

const STATE_A = [
  rule("MKP-0070", { item: "macbook" }, 5),
  rule("MKP-0057", { cat: "phones", brand: "apple" }, 8),
  rule("MKP-0066", { cat: "laptops", brand: "dell" }, 10),
  rule("MKP-0049", { brand: "apple" }, 15),
  rule("MKP-0052", { brand: "logitech" }, 18),
  rule("MKP-0051", { brand: "samsung" }, 6, { isActive: false }),
  rule("MKP-0081", { cat: "laptops" }, 12),
  rule("MKP-0041", { cat: "monitors" }, 10),
  rule("MKP-0062", { cat: "accessories" }, 20),
  rule("MKP-0045", { cat: "phones-tabs" }, 7),
  rule("MKP-0090", { cat: "laptops", brand: "hp" }, -10, ends("2026-11-20T23:59:00Z")),
  rule("MKP-0093", { cat: "storage" }, -15, ends("2026-11-28T23:59:00Z")),
];

const mapA = (withDeals = true) =>
  buildCoverage({ kind: "products", rules: STATE_A, rows: ROWS, withDeals, now: NOW });

const ids = (rules: CoverageRule[]) => rules.map((r) => r.ruleId);

describe("candidates", () => {
  it("orders product tiers like pickProductRule: category & brand (walking up), brand, category (walking up), all", () => {
    const rules = [
      rule("all", {}, 5),
      rule("cat-computers", { cat: "computers" }, 7),
      rule("cat-laptops", { cat: "laptops" }, 12),
      rule("brand", { brand: "dell" }, 9),
      rule("cb-computers", { cat: "computers", brand: "dell" }, 11),
      rule("cb-laptops", { cat: "laptops", brand: "dell" }, 10),
    ];
    const m = buildCoverage({ kind: "products", rules, rows: ROWS, withDeals: true, now: NOW });
    expect(ids(m.cell("laptops", "dell").candidates)).toEqual([
      "cb-laptops",
      "cb-computers",
      "brand",
      "cat-laptops",
      "cat-computers",
      "all",
    ]);
  });

  it("orders the nine part tiers like pickPartRule", () => {
    const rules = [
      rule("all", {}, 1),
      rule("t", { type: "battery" }, 2),
      rule("c", { cat: "laptops" }, 3),
      rule("b", { brand: "hp" }, 4),
      rule("ct", { cat: "laptops", type: "battery" }, 5),
      rule("bt", { brand: "hp", type: "battery" }, 6),
      rule("cb", { cat: "laptops", brand: "hp" }, 7),
      rule("cbt", { cat: "laptops", brand: "hp", type: "battery" }, 8),
      rule("part", { item: "p1" }, 9),
    ];
    const m = buildCoverage({
      kind: "parts",
      rules,
      rows: ROWS,
      typeId: "battery",
      withDeals: true,
      now: NOW,
    });
    expect(ids(m.cell("laptops", "hp").candidates)).toEqual([
      "cbt",
      "cb",
      "bt",
      "ct",
      "b",
      "c",
      "t",
      "all",
    ]);
    // "Other types": the type tiers drop out.
    const other = buildCoverage({ kind: "parts", rules, rows: ROWS, withDeals: true, now: NOW });
    expect(ids(other.cell("laptops", "hp").candidates)).toEqual(["cb", "b", "c", "all"]);
  });

  it("walks up self + 5 ancestors and no further", () => {
    const parents = new Map<string, string | null>([
      ["c0", null],
      ["c1", "c0"],
      ["c2", "c1"],
      ["c3", "c2"],
      ["c4", "c3"],
      ["c5", "c4"],
      ["c6", "c5"],
    ]);
    expect(categoryChain(parents, "c6")).toEqual(["c6", "c5", "c4", "c3", "c2", "c1"]);
    const index = new Map([
      ["c0:-:-", rule("too-far", { cat: "c0" }, 3)],
      ["c1:-:-", rule("fifth", { cat: "c1" }, 4)],
    ]);
    expect(ids(candidates(index, parents, "products", "c6", null, null))).toEqual(["fifth"]);
  });

  it("keeps the oldest rule when two share a scope, as the backend does", () => {
    const newer = rule("newer", { brand: "dell" }, 9, { createdAt: "2026-02-01T00:00:00Z" });
    const older = rule("older", { brand: "dell" }, 5, { createdAt: "2026-01-01T00:00:00Z" });
    const m = buildCoverage({
      kind: "products",
      rules: [newer, older],
      rows: ROWS,
      withDeals: true,
      now: NOW,
    });
    expect(m.cell("laptops", "dell").winner?.ruleId).toBe("older");
  });
});

describe("buildCoverage", () => {
  it("puts Other brands first and leaves out inactive and one-item rules", () => {
    const m = mapA();
    expect(m.columns).toEqual([null, "apple", "dell", "hp", "logitech"]);
    expect(m.cell("phones", "samsung").winner?.ruleId).toBe("MKP-0045");
  });

  it("counts gaps when there is no fallback, and none when there is", () => {
    const m = mapA();
    expect(m.fallback).toBeNull();
    // Desktops, Printers and Networking have no rule for Other brands, Dell or HP.
    expect(m.cell("desktops", null).winner).toBeNull();
    expect(countGaps(m)).toBeGreaterThan(0);

    const withAll = buildCoverage({
      kind: "products",
      rules: [...STATE_A, rule("all", {}, 5)],
      rows: ROWS,
      withDeals: true,
      now: NOW,
    });
    expect(withAll.fallback?.ruleId).toBe("all");
    expect(countGaps(withAll)).toBe(0);
    expect(familyCounts(withAll).some((f) => f.family === "gap")).toBe(false);
  });

  it("lets a deal win its scope and names what takes over after it", () => {
    const c = mapA().cell("laptops", "hp");
    expect(c.winner?.ruleId).toBe("MKP-0090");
    expect(ruleAfterDeal(c)?.ruleId).toBe("MKP-0081");
    // The Storage deal: Accessories +20% returns after it.
    expect(ruleAfterDeal(mapA().cell("storage", null))?.ruleId).toBe("MKP-0062");
    // No deal in the cell.
    expect(ruleAfterDeal(mapA().cell("laptops", null))).toBeUndefined();
  });

  it("lets a stronger markup beat a deal: Apple +15% beats the Storage −15% deal", () => {
    const c = mapA().cell("storage", "apple");
    expect(ids(c.candidates)).toEqual(["MKP-0049", "MKP-0093", "MKP-0062"]);
  });

  it("drops deals and expired deals from the map when asked", () => {
    expect(mapA(false).cell("laptops", "hp").winner?.ruleId).toBe("MKP-0081");
    const late = buildCoverage({
      kind: "products",
      rules: STATE_A,
      rows: ROWS,
      withDeals: true,
      now: new Date("2026-11-21T00:00:00Z").getTime(),
    });
    expect(late.cell("laptops", "hp").winner?.ruleId).toBe("MKP-0081");
  });

  it("marks a brand cell won by the baseline's rule as the same", () => {
    const m = mapA();
    expect(m.cell("desktops", "dell").sameAsBaseline).toBe(true); // both base price
    expect(m.cell("monitors", "hp").sameAsBaseline).toBe(true); // both Monitors +10%
    expect(m.cell("laptops", "dell").sameAsBaseline).toBe(false);
    expect(m.cell("laptops", null).sameAsBaseline).toBe(false); // the baseline itself
  });
});

describe("analyzeRule", () => {
  it("state A: Apple +15% wins 11 cells and is beaten in 1 by Apple · Phones +8%", () => {
    const a = analyzeRule(mapA(), "MKP-0049");
    expect(a.wins.size).toBe(11);
    expect(a.lost.size).toBe(1);
    expect(a.beatenBy.map(([r, n]) => [r.ruleId, n])).toEqual([["MKP-0057", 1]]);
    expect(a.beats.find(([r]) => r.ruleId === "MKP-0093")?.[1]).toBe(1);
  });
});

describe("filters", () => {
  it("a brand search keeps the baseline column and every row", () => {
    const v = filterMap(mapA(), { query: "apple", gapsOnly: false });
    expect(v.columns).toEqual([null, "apple"]);
    expect(v.rows).toHaveLength(ROWS.length);
    expect(v.brandHits).toBe(1);
  });

  it("a category search keeps the category, its parents and its children", () => {
    expect(filterMap(mapA(), { query: "storage", gapsOnly: false }).rows.map((r) => r.id)).toEqual([
      "accessories",
      "storage",
    ]);
    expect(
      filterMap(mapA(), { query: "phones-tabs", gapsOnly: false }).rows.map((r) => r.id),
    ).toEqual(["phones-tabs", "phones", "tablets"]);
  });

  it("only gaps keeps rows with a cell at base price", () => {
    const rows = filterMap(mapA(), { query: "", gapsOnly: true }).rows.map((r) => r.id);
    expect(rows).toContain("desktops");
    expect(rows).not.toContain("laptops");
  });

  it("filters lane rules by status, deals and label", () => {
    expect(filterRules(STATE_A, { query: "", activeOnly: true, withDeals: true })).toHaveLength(11);
    expect(filterRules(STATE_A, { query: "", activeOnly: false, withDeals: false })).toHaveLength(10);
    expect(ids(filterRules(STATE_A, { query: "0049", activeOnly: false, withDeals: true }))).toEqual([
      "MKP-0049",
    ]);
  });
});

describe("flattenCategoryTree", () => {
  it("lists each root, then its children", () => {
    const rows = flattenCategoryTree(
      [
        { id: "a", name: "A", n: 3, children: [{ id: "a1", name: "A1", n: 1 }] },
        { id: "b", name: "B", n: 2, children: ["stale-id"] },
      ],
      (c) => c.n,
    );
    expect(rows).toEqual([
      { id: "a", name: "A", parentId: null, count: 3 },
      { id: "a1", name: "A1", parentId: "a", count: 1 },
      { id: "b", name: "B", parentId: null, count: 2 },
    ]);
  });
});

describe("cellItems", () => {
  const row = (id: string, projected: number, current: number, extra: object = {}) => ({
    id,
    name: id,
    detail: null,
    current,
    projected,
    cost: 50,
    covered: false,
    ...extra,
  });

  it("recovers the base and the difference, and flags prices not applied yet", () => {
    const { items, covered } = cellItems(
      [row("a", 115, 115), row("b", 230, 200), row("c", 115, 115, { covered: true })],
      15,
      { affectsPrice: true },
    );
    expect(covered).toBe(1);
    expect(items.map((i) => [i.id, i.base, i.rulePrice, i.diff, i.drift])).toEqual([
      ["a", 100, 115, 15, false],
      ["b", 200, 230, 30, true],
    ]);
  });

  it("prices a gap at base (previewed at 1%)", () => {
    const [i] = cellItems([row("a", 101, 100)], 1, null).items;
    expect([i.base, i.rulePrice, i.diff, i.drift]).toEqual([100, 100, 0, false]);
  });

  it("gives no base at the cost floor", () => {
    const [i] = cellItems([row("a", 50, 50)], -60, { affectsPrice: true }).items;
    expect([i.base, i.rulePrice, i.diff]).toEqual([null, 50, null]);
  });
});
