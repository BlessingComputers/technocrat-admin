import { describe, expect, it } from "vitest";
import {
  changedFieldLabels,
  parseUploaderTab,
  UPDATES_COUNTED_FROM,
  updatedItemHref,
  workSplitLabel,
} from "./uploader-work";

describe("changedFieldLabels", () => {
  it("maps backend field names to labels, in input order", () => {
    expect(changedFieldLabels(["price", "costPrice", "specifications"])).toEqual([
      "Price",
      "Cost price",
      "Specs",
    ]);
  });

  it("shows partType and partTypeId as one chip", () => {
    expect(changedFieldLabels(["partType", "partTypeId"])).toEqual(["Part type"]);
  });

  it("labels the variant fields the backend prefixes to avoid a clash", () => {
    expect(changedFieldLabels(["variant.name", "variant.isActive"])).toEqual([
      "Variant name",
      "Variant active",
    ]);
  });

  it("humanizes a field the map does not know", () => {
    expect(changedFieldLabels(["warrantyMonths"])).toEqual(["Warranty months"]);
  });

  it("returns nothing for no fields", () => {
    expect(changedFieldLabels([])).toEqual([]);
  });
});

describe("workSplitLabel", () => {
  it("names both parts of the total", () => {
    expect(workSplitLabel(7, 3)).toBe("7 uploads + 3 updates");
  });

  it("uses the singular for one", () => {
    expect(workSplitLabel(1, 1)).toBe("1 upload + 1 update");
  });

  it("keeps a zero update count visible", () => {
    expect(workSplitLabel(5, 0)).toBe("5 uploads + 0 updates");
  });
});

describe("parseUploaderTab", () => {
  it("accepts each tab", () => {
    expect(parseUploaderTab("products")).toBe("products");
    expect(parseUploaderTab("parts")).toBe("parts");
    expect(parseUploaderTab("updates")).toBe("updates");
  });

  it("falls back to products for a missing or unknown value", () => {
    expect(parseUploaderTab(null)).toBe("products");
    expect(parseUploaderTab("Updated")).toBe("products");
  });
});

describe("updatedItemHref", () => {
  it("links a product to its edit page", () => {
    expect(updatedItemHref({ type: "product", id: "p-1", name: "HP 840 G5" })).toBe(
      "/catalogues/p-1/edit",
    );
  });

  it("links a part to its edit page", () => {
    expect(updatedItemHref({ type: "part", id: "pt-1", name: "Fan" })).toBe(
      "/catalogues/parts/pt-1/edit",
    );
  });

  it("gives no link for an item the backend could not find", () => {
    expect(updatedItemHref({ type: "product", id: "p-2", name: "" })).toBeNull();
  });
});

describe("UPDATES_COUNTED_FROM", () => {
  it("is the backend launch day, as YYYY-MM-DD", () => {
    expect(UPDATES_COUNTED_FROM).toBe("2026-11-04");
  });
});
