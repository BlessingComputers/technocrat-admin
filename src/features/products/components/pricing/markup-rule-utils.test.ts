import { describe, expect, it } from "vitest";

import type { MarkupRule } from "../../types/pricing";
import {
  applySummary,
  cancelSummary,
  isAllScopeRule,
  productLadder,
  replacedRuleRows,
  replaceSummary,
  resetSummary,
  ruleScopeLabel,
  rulesToReplace,
  tierOf,
} from "./markup-rule-utils";

const ref = (id: string, name: string) => ({ id, name, slug: id });
const rule = (over: Partial<MarkupRule>): MarkupRule => ({
  id: "r",
  ruleId: "MKP-R",
  categoryId: null,
  brandId: null,
  productId: null,
  markupPercentage: 10,
  applyTo: "PRICE",
  isActive: true,
  notes: null,
  createdByStaffId: "s",
  category: null,
  brand: null,
  product: null,
  createdBy: null,
  createdAt: "",
  updatedAt: "",
  allowCouponStacking: false,
  expiresAt: null,
  ...over,
});

const all = rule({ id: "all", ruleId: "MKP-ALL" });
const apple = rule({ id: "b", ruleId: "MKP-B", brandId: "apple", brand: ref("apple", "Apple"), markupPercentage: 15 });
const laptops = rule({ id: "c", ruleId: "MKP-C", categoryId: "lap", category: ref("lap", "Laptops"), markupPercentage: 12 });
const phonesApple = rule({
  id: "cb", ruleId: "MKP-CB", categoryId: "ph", brandId: "apple",
  category: ref("ph", "Phones"), brand: ref("apple", "Apple"), markupPercentage: 8,
});
const macbook = rule({ id: "p", ruleId: "MKP-P", productId: "mb", product: ref("mb", "MacBook Pro"), markupPercentage: 5 });
const offRule = rule({ id: "off", ruleId: "MKP-OFF", categoryId: "mon", category: ref("mon", "Monitors"), isActive: false });
const dealMarkup = rule({ id: "d", ruleId: "MKP-D", brandId: "hp", brand: ref("hp", "HP"), dealId: "deal-1" });

describe("tierOf and isAllScopeRule", () => {
  it("places each scope on its resolver tier", () => {
    expect([macbook, phonesApple, apple, laptops, all].map(tierOf)).toEqual([
      "product", "categoryBrand", "brand", "category", "all",
    ]);
    expect(isAllScopeRule(all)).toBe(true);
    expect(isAllScopeRule(laptops)).toBe(false);
  });
});

describe("ruleScopeLabel", () => {
  it("calls a rule with no scope All products", () => {
    expect(ruleScopeLabel(all)).toBe("All products");
    expect(ruleScopeLabel(apple)).toBe("Apple · All categories");
  });
});

describe("rulesToReplace", () => {
  it("takes active standing markups only, never the fallback itself", () => {
    const rules = [all, apple, laptops, offRule, dealMarkup, macbook];
    expect(rulesToReplace(rules).map((r) => r.id)).toEqual(["b", "c", "p"]);
    expect(rulesToReplace(rules, "b").map((r) => r.id)).toEqual(["c", "p"]);
  });
});

describe("productLadder", () => {
  it("counts the active markups at each tier around a category rule", () => {
    const rows = productLadder([all, apple, phonesApple, macbook, offRule], "category", undefined, false);
    expect(rows.map((r) => [r.key, r.relation, r.activeCount])).toEqual([
      ["product", "above", 1],
      ["categoryBrand", "above", 1],
      ["brand", "above", 1],
      ["category", "self", 0],
      ["all", "below", 1],
    ]);
  });

  it("lists what turns off for an all-products rule with replace on", () => {
    const rows = productLadder([all, apple, laptops], "all", "all", true);
    expect(rows.find((r) => r.key === "brand")?.turnsOff).toEqual([
      { tier: "brand", label: "Apple", percentage: 15 },
    ]);
    expect(rows.find((r) => r.key === "all")?.activeCount).toBe(0);
  });
});

describe("replace result", () => {
  it("matches turned-off ids to the rules as they were", () => {
    expect(replacedRuleRows(["MKP-B", "MKP-GONE"], [apple, laptops])).toEqual([
      { ruleId: "MKP-B", scope: "Apple", tier: "Brand", percentage: 15 },
      { ruleId: "MKP-GONE", scope: "MKP-GONE", tier: "—", percentage: null },
    ]);
  });

  it("summarises the replace for the toast", () => {
    expect(replaceSummary({ rulesReplaced: ["a", "b"], variantsRepriced: 1284, variantsReset: 17 })).toBe(
      "2 markups turned off, 1284 variants repriced, 17 variants set to base price.",
    );
    expect(replaceSummary({ rulesReplaced: ["a"], variantsRepriced: 1, variantsReset: 0 })).toBe(
      "1 markup turned off, 1 variant repriced.",
    );
  });
});

describe("cancelSummary", () => {
  it("reports variants moved to the next rule and variants sent to base", () => {
    expect(cancelSummary({ variantsReset: 1, variantsRepriced: 4, partsReset: 0 })).toBe(
      "4 variants moved to their next rule, 1 variant set to base price.",
    );
  });

  it("leaves out a zero count", () => {
    expect(cancelSummary({ variantsReset: 0, variantsRepriced: 2, partsReset: 0 })).toBe(
      "2 variants moved to their next rule.",
    );
  });

  it("says nothing changed when both counts are zero", () => {
    expect(cancelSummary({ variantsReset: 0, variantsRepriced: 0, partsReset: 0 })).toBe(
      "no prices changed.",
    );
  });
});

describe("resetSummary", () => {
  it("shows parts only when some were reset", () => {
    expect(resetSummary({ variantsReset: 3, partsReset: 0 })).toBe("3 variants set to base price.");
    expect(resetSummary({ variantsReset: 3, partsReset: 1 })).toBe(
      "3 variants and 1 part set to base price.",
    );
  });
});

describe("applySummary", () => {
  it("adds the variants another rule kept", () => {
    expect(applySummary({ updated: 5, results: [], skippedByOtherRule: 2 })).toBe(
      "Applied — 5 variants repriced. 2 variants kept by a more specific rule.",
    );
    expect(applySummary({ updated: 1, results: [], skippedByOtherRule: 0 })).toBe(
      "Applied — 1 variant repriced.",
    );
  });
});
