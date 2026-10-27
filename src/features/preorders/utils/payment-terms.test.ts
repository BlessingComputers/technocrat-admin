import { describe, expect, it } from "vitest";
import {
  calculatePaymentPreview,
  defaultPaymentDeadline,
  formatWestAfricaTime,
  toDateTimeLocalValue,
  westAfricaLocalToIso,
} from "./payment-terms";

describe("preorder payment terms", () => {
  it("defaults the deadline to exactly 72 hours", () => {
    const now = new Date("2026-09-07T10:00:00.000Z");
    expect(defaultPaymentDeadline(now).toISOString()).toBe(
      "2026-09-10T10:00:00.000Z",
    );
  });

  it("calculates commitment fee and balance amounts", () => {
    expect(calculatePaymentPreview(500_000, 30)).toEqual({
      firstPaymentAmount: 150_000,
      balanceAmount: 350_000,
      isFullPayment: false,
    });
  });

  it("omits the conceptual balance for full payment", () => {
    expect(calculatePaymentPreview(500_000, 100)).toEqual({
      firstPaymentAmount: 500_000,
      balanceAmount: 0,
      isFullPayment: true,
    });
  });

  it("shows the deadline in West Africa Time", () => {
    expect(formatWestAfricaTime("2026-09-10T10:00:00.000Z")).toContain("WAT");
  });

  it("keeps datetime-local values fixed to West Africa Time", () => {
    const instant = new Date("2026-09-10T10:00:00.000Z");
    expect(toDateTimeLocalValue(instant)).toBe("2026-09-10T11:00");
    expect(westAfricaLocalToIso("2026-09-10T11:00")).toBe(
      "2026-09-10T10:00:00.000Z",
    );
  });
});
