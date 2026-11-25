import { describe, expect, it } from "vitest";

import type { FxLog } from "../types/fx";
import {
  coveragePercent,
  flattenCategories,
  formatChange,
  formatRate,
  logDetail,
  scopeLabel,
  statusMeta,
  toNum,
} from "./fx-format";

function log(patch: Partial<FxLog>): FxLog {
  return {
    id: "l1",
    triggeredByStaffId: null,
    rateUsdNgn: "1550.25",
    previousRateUsdNgn: null,
    rateChangePercent: null,
    productsAffected: 0,
    variantsUpdated: 0,
    summary: null,
    status: "APPLIED",
    errorMessage: null,
    triggeredAt: "2026-11-24T08:00:00.000Z",
    ...patch,
  };
}

describe("fx-format", () => {
  it("reads Prisma Decimal strings", () => {
    expect(toNum("1550.25")).toBe(1550.25);
    expect(toNum(null)).toBeNull();
    expect(toNum("abc")).toBeNull();
    expect(formatRate("1550.5")).toBe("₦1,550.50");
    expect(formatRate(null)).toBe("—");
    expect(formatChange("2.1")).toBe("+2.10%");
    expect(formatChange(-0.5)).toBe("-0.50%");
  });

  it("labels RECORDED as a dry run and says what would have happened", () => {
    expect(statusMeta("RECORDED").label).toBe("Recorded only");
    expect(
      logDetail(
        log({
          status: "RECORDED",
          summary: { wouldDo: "APPLY", reason: "would reprice linked items" },
        }),
      ),
    ).toBe("Auto-update is off, so nothing changed. Would reprice linked items.");
    expect(logDetail(log({ status: "RECORDED", summary: { wouldDo: "SKIPPED" } }))).toBe(
      "Auto-update is off, so nothing changed. It would skip.",
    );
  });

  it("shows the error on a failed row and the reason elsewhere", () => {
    expect(logDetail(log({ status: "FAILED", errorMessage: "timeout" }))).toBe("timeout");
    expect(logDetail(log({ status: "SKIPPED", summary: { reason: "moved 0.2%" } }))).toBe(
      "Moved 0.2%.",
    );
    expect(logDetail(log({}))).toBeNull();
    expect(statusMeta("NEW_THING")).toEqual({ label: "NEW_THING", tone: "muted" });
  });

  it("names a standing link's scope, deleted names included", () => {
    const ref = (name: string | null) => ({ id: "x", name, slug: null });
    expect(scopeLabel({ categories: [ref("Laptops")], brands: [ref("HP")] })).toBe("Laptops + HP");
    expect(scopeLabel({ categories: [], brands: [ref(null)] })).toBe("Deleted brand");
  });

  it("flattens the category tree with depth", () => {
    expect(
      flattenCategories([
        { id: "a", name: "Laptops", children: [{ id: "b", name: "Workstations" }] },
        { id: "c", name: "Phones" },
      ]),
    ).toEqual([
      { id: "a", name: "Laptops", depth: 0 },
      { id: "b", name: "Workstations", depth: 1 },
      { id: "c", name: "Phones", depth: 0 },
    ]);
  });

  it("rounds coverage and survives an empty catalogue", () => {
    expect(coveragePercent(1, 3)).toBe(33);
    expect(coveragePercent(0, 0)).toBe(0);
  });
});
