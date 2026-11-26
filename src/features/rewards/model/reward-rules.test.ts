import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/error";
import { formatPrice } from "@/lib/utils/format";
import {
  closesOnLabel,
  formatAdjustment,
  formatRewardMonth,
  isAlreadyPaidError,
  isOpenForAction,
  monthTotal,
  paidOnLabel,
  parseWholeNaira,
  previewFinalAmount,
  staffHistory,
  staffName,
  uploadsOf,
  visibleTeamTabs,
} from "./reward-rules";

describe("formatRewardMonth", () => {
  it("names the month and year", () => {
    expect(formatRewardMonth("2026-12")).toBe("December 2026");
  });
  it("returns a malformed month as-is", () => {
    expect(formatRewardMonth("2026-13x")).toBe("2026-13x");
  });
});

describe("closesOnLabel", () => {
  it("is the 1st of the next month", () => {
    expect(closesOnLabel("2026-11")).toBe("1 December");
  });
  it("rolls December over to January", () => {
    expect(closesOnLabel("2026-12")).toBe("1 January");
  });
  it("is empty for a malformed month", () => {
    expect(closesOnLabel("bad")).toBe("");
  });
});

describe("paidOnLabel", () => {
  it("formats the paid date in UTC", () => {
    expect(paidOnLabel("2026-12-03T00:00:00.000Z")).toBe("Paid on 3 Dec 2026");
  });
});

describe("row helpers", () => {
  const row = {
    id: "s1",
    paidAt: null,
    products: 40,
    parts: 12,
    staff: { id: "u1", firstName: "Ada", lastName: "Obi" },
  };

  it("counts products and parts as uploads", () => {
    expect(uploadsOf(row)).toBe(52);
  });
  it("joins the staff name", () => {
    expect(staffName(row)).toBe("Ada Obi");
  });
  it("allows actions on a closed, unpaid row", () => {
    expect(isOpenForAction(row)).toBe(true);
  });
  it("blocks actions on the open month (id null)", () => {
    expect(isOpenForAction({ ...row, id: null })).toBe(false);
  });
  it("blocks actions on a paid row", () => {
    expect(isOpenForAction({ ...row, paidAt: "2026-12-03T00:00:00.000Z" })).toBe(false);
  });
  it("sums final amounts, and is 0 for no rows", () => {
    expect(monthTotal([{ finalAmount: 5450 }, { finalAmount: 300 }])).toBe(5750);
    expect(monthTotal([])).toBe(0);
  });
});

describe("formatAdjustment", () => {
  it("signs positive amounts", () => {
    expect(formatAdjustment(500)).toBe(`+${formatPrice(500)}`);
  });
  it("keeps the minus on negative amounts", () => {
    expect(formatAdjustment(-200)).toBe(formatPrice(-200));
  });
  it("shows zero plainly", () => {
    expect(formatAdjustment(0)).toBe(formatPrice(0));
  });
});

describe("parseWholeNaira / previewFinalAmount", () => {
  it("never reads an empty field as 0", () => {
    expect(parseWholeNaira("")).toBeNaN();
    expect(parseWholeNaira("   ")).toBeNaN();
  });
  it("previews computed + adjustment", () => {
    expect(previewFinalAmount(5650, "-200")).toBe(5450);
    expect(previewFinalAmount(5650, " 350 ")).toBe(6000);
  });
  it("shows no preview for invalid input", () => {
    expect(previewFinalAmount(5650, "")).toBeNull();
    expect(previewFinalAmount(5650, "abc")).toBeNull();
    expect(previewFinalAmount(5650, "1.5")).toBeNull();
  });
});

describe("visibleTeamTabs", () => {
  const perms = (names: string[]) => ({
    can: (n: string) => names.includes(n),
    canAnyInGroup: (groups: string[]) =>
      names.some((n) => groups.includes(n.split(":")[0])),
  });

  it("is empty (no access) without rewards permissions", () => {
    expect(visibleTeamTabs(perms(["products:read"]))).toEqual([]);
  });
  it("shows only Uploaders for rewards:pay", () => {
    expect(visibleTeamTabs(perms(["rewards:pay"]))).toEqual(["uploaders"]);
  });
  it("adds Rates for rewards:manage", () => {
    expect(visibleTeamTabs(perms(["rewards:manage"]))).toEqual(["uploaders", "rates"]);
  });
  it("shows both to a super admin", () => {
    const superAdmin = { can: () => true, canAnyInGroup: () => true };
    expect(visibleTeamTabs(superAdmin)).toEqual(["uploaders", "rates"]);
  });
});

describe("isAlreadyPaidError", () => {
  it("is true for a 409", () => {
    expect(isAlreadyPaidError(new ApiError("paid", 409, { code: "REWARD_ALREADY_PAID" }))).toBe(true);
  });
  it("is false for other errors", () => {
    expect(isAlreadyPaidError(new ApiError("bad", 400, null))).toBe(false);
    expect(isAlreadyPaidError(new Error("x"))).toBe(false);
  });
});

describe("staffHistory", () => {
  const row = (month: string, staffId: string) => ({ month, staff: { id: staffId } });
  const months = [
    { statements: [row("2026-12", "a"), row("2026-12", "b")] },
    { statements: [row("2026-11", "b")] },
    { statements: [row("2026-10", "a")] },
  ];

  it("keeps one row per month for the uploader, in the given order", () => {
    expect(staffHistory(months, "a").map((r) => r.month)).toEqual(["2026-12", "2026-10"]);
  });
  it("is empty for an uploader with no rows", () => {
    expect(staffHistory(months, "zz")).toEqual([]);
    expect(staffHistory([], "a")).toEqual([]);
  });
});
