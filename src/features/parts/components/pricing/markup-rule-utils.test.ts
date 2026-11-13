import { describe, expect, it } from "vitest";

import type { PartMarkupRule } from "../../types/pricing";
import {
  isAllScopeRule,
  partLadder,
  replacedRuleRows,
  replaceSummary,
  ruleScopeLabel,
  rulesToReplace,
  tierOf,
} from "./markup-rule-utils";

const ref = (id: string, name: string) => ({ id, name, slug: id });
const rule = (over: Partial<PartMarkupRule>): PartMarkupRule => ({
  id: "r",
  ruleId: "MKP-R",
  categoryId: null,
  brandId: null,
  partTypeId: null,
  partId: null,
  markupPercentage: 10,
  applyTo: "PRICE",
  isActive: true,
  notes: null,
  ...over,
});

const all = rule({ id: "all", ruleId: "MKP-ALL" });
const hpBattery = rule({
  id: "bt", ruleId: "MKP-BT", brandId: "hp", partTypeId: "bat",
  brand: ref("hp", "HP"), partType: ref("bat", "Battery"), markupPercentage: 18,
});
const laptops = rule({ id: "c", ruleId: "MKP-C", categoryId: "lap", category: ref("lap", "Laptops") });
const screens = rule({ id: "t", ruleId: "MKP-T", partTypeId: "scr", partType: ref("scr", "Screen"), isActive: false });
const onePart = rule({ id: "p", ruleId: "MKP-P", partId: "x", part: ref("x", "Fan 01") });

describe("tierOf and isAllScopeRule", () => {
  it("places every combination on the 9-tier ladder", () => {
    const t = (c?: string, b?: string, ty?: string) =>
      tierOf({ categoryId: c, brandId: b, partTypeId: ty });
    expect([
      tierOf({ partId: "x" }),
      t("c", "b", "t"), t("c", "b"), t(undefined, "b", "t"), t("c", undefined, "t"),
      t(undefined, "b"), t("c"), t(undefined, undefined, "t"), t(),
    ]).toEqual([
      "part", "categoryBrandType", "categoryBrand", "brandType", "categoryType",
      "brand", "category", "type", "all",
    ]);
    expect(isAllScopeRule(all)).toBe(true);
    expect(ruleScopeLabel(all)).toBe("All parts");
  });
});

describe("rulesToReplace", () => {
  it("takes active standing markups only", () => {
    expect(rulesToReplace([all, hpBattery, laptops, screens, onePart]).map((r) => r.id)).toEqual([
      "bt", "c", "p",
    ]);
  });
});

describe("partLadder", () => {
  it("marks the tiers around a brand & type rule", () => {
    const rows = partLadder([all, laptops, onePart, hpBattery], "brandType", "bt", false);
    expect(rows.map((r) => r.relation)).toEqual([
      "above", "above", "above", "self", "below", "below", "below", "below", "below",
    ]);
    expect(rows.find((r) => r.key === "category")?.activeCount).toBe(1);
    expect(rows.find((r) => r.key === "brandType")?.activeCount).toBe(0);
  });
});

describe("replace result", () => {
  it("matches turned-off ids and summarises them", () => {
    expect(replacedRuleRows(["MKP-BT"], [hpBattery])).toEqual([
      { ruleId: "MKP-BT", scope: "HP · Battery", tier: "Brand & type", percentage: 18 },
    ]);
    expect(replaceSummary({ rulesReplaced: ["a", "b", "c"], partsRepriced: 40, partsReset: 2 })).toBe(
      "3 markups turned off, 40 parts repriced, 2 parts set to base price.",
    );
  });
});
