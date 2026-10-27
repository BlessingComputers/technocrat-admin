import { describe, expect, it } from "vitest";
import { pageEntries } from "./data-pagination";

/**
 * The whole point of the primitive: the number of buttons is bounded no matter
 * how big the catalog gets. The products footer used to render one per page.
 */
describe("pageEntries", () => {
  it("lists every page while they still fit", () => {
    expect(pageEntries(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("anchors first and last with a trailing gap near the start", () => {
    expect(pageEntries(2, 42)).toEqual([1, 2, 3, 4, 5, "gap", 42]);
  });

  it("gaps on both sides in the middle", () => {
    expect(pageEntries(20, 42)).toEqual([1, "gap", 19, 20, 21, "gap", 42]);
  });

  it("anchors first and last with a leading gap near the end", () => {
    expect(pageEntries(42, 42)).toEqual([1, "gap", 38, 39, 40, 41, 42]);
  });

  it("never exceeds seven entries", () => {
    for (let total = 1; total <= 200; total++) {
      for (const page of [1, 2, Math.ceil(total / 2), total - 1, total]) {
        if (page < 1) continue;
        expect(pageEntries(page, total).length).toBeLessThanOrEqual(7);
      }
    }
  });

  it("always includes the current page", () => {
    for (let total = 1; total <= 60; total++) {
      for (let page = 1; page <= total; page++) {
        expect(pageEntries(page, total)).toContain(page);
      }
    }
  });
});
