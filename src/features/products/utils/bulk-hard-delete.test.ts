import { describe, expect, it } from "vitest";
import type { HardDeleteSkip } from "../types/products";
import { deactivatableIds, hardDeleteSummary } from "./bulk-hard-delete";

const skip = (productId: string, code: HardDeleteSkip["code"]): HardDeleteSkip => ({
  productId,
  name: null,
  code,
  message: "",
});

describe("hardDeleteSummary", () => {
  it("counts what was deleted", () => {
    expect(hardDeleteSummary({ deleted: 2, deletedIds: ["a", "b"], skipped: [] })).toBe(
      "Permanently deleted 2 products",
    );
    expect(hardDeleteSummary({ deleted: 1, deletedIds: ["a"], skipped: [] })).toBe(
      "Permanently deleted 1 product",
    );
  });

  it("says how many were skipped", () => {
    const res = { deleted: 1, deletedIds: ["a"], skipped: [skip("b", "PRODUCT_HAS_ORDERS")] };
    expect(hardDeleteSummary(res)).toBe("Permanently deleted 1 product, 1 skipped");
  });

  it("doesn't claim a delete when nothing went", () => {
    const res = {
      deleted: 0,
      deletedIds: [],
      skipped: [skip("a", "PRODUCT_HAS_ORDERS"), skip("b", "PRODUCT_IN_CHECKOUT")],
    };
    expect(hardDeleteSummary(res)).toBe("Nothing deleted, 2 skipped");
  });
});

describe("deactivatableIds", () => {
  it("leaves out products that no longer exist", () => {
    expect(
      deactivatableIds([
        skip("a", "PRODUCT_HAS_ORDERS"),
        skip("b", "PRODUCT_NOT_FOUND"),
        skip("c", "PRODUCT_BLOCKED"),
      ]),
    ).toEqual(["a", "c"]);
  });
});
