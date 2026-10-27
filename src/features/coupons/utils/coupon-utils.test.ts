import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/utils/format";
import {
  couponState,
  couponStateHint,
  discountConditions,
  discountSummary,
  expiryPhrase,
  isExpiringSoon,
  isSilentlyDead,
  normalizeCouponCode,
  usageFraction,
  usageSummary,
} from "./coupon-utils";
import type { Coupon } from "../types/coupons";

const NOW = new Date("2026-08-27T12:00:00.000Z");

function coupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    couponId: "CPN-ABCD1234",
    code: "SAVE20",
    description: null,
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxDiscountAmount: null,
    minOrderAmount: null,
    maxUsageCount: null,
    usageCount: 0,
    maxUsagePerUser: 1,
    status: "ACTIVE",
    // Defaults to the creation time, the way the backend does it, so the
    // baseline fixture is open rather than scheduled.
    startsAt: "2026-08-01T00:00:00.000Z",
    expiresAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("couponState — scheduled", () => {
  // `startsAt` became a real constraint in backend `b2661a1`; all three
  // redemption paths now reject a coupon whose start is still ahead. Stored
  // status stays ACTIVE, so this is exactly the stored-vs-real seam.
  it("is SCHEDULED when the start date has not arrived", () => {
    const future = coupon({ startsAt: "2026-09-01T00:00:00.000Z" });
    expect(couponState(future, NOW)).toBe("SCHEDULED");
  });

  it("is LIVE the moment the start date is reached", () => {
    const exactly = coupon({ startsAt: NOW.toISOString() });
    expect(couponState(exactly, NOW)).toBe("LIVE");
  });

  it("counts a scheduled coupon as silently dead — it reads Active but is not", () => {
    const future = coupon({ startsAt: "2026-09-01T00:00:00.000Z" });
    expect(isSilentlyDead(future, NOW)).toBe(true);
  });

  it("lets expiry win over a schedule, when a row somehow has both", () => {
    const broken = coupon({
      startsAt: "2026-09-01T00:00:00.000Z",
      expiresAt: "2026-08-10T00:00:00.000Z",
    });
    expect(couponState(broken, NOW)).toBe("EXPIRED");
  });

  it("leaves a disabled coupon disabled regardless of its schedule", () => {
    const off = coupon({
      status: "DISABLED",
      startsAt: "2026-09-01T00:00:00.000Z",
    });
    expect(couponState(off, NOW)).toBe("DISABLED");
  });
});

describe("couponState", () => {
  it("is LIVE for an active, unexpired, uncapped coupon", () => {
    expect(couponState(coupon(), NOW)).toBe("LIVE");
  });

  it("is EXPIRED once the expiry has passed, even while stored as ACTIVE", () => {
    // The reason this whole helper exists: nothing on the backend ever writes
    // the EXPIRED status, so the row sits at ACTIVE forever.
    const past = coupon({ expiresAt: "2026-08-20T00:00:00.000Z" });
    expect(past.status).toBe("ACTIVE");
    expect(couponState(past, NOW)).toBe("EXPIRED");
  });

  it("treats an expiry exactly at now as spent", () => {
    // The backend selects on `expiresAt > now`, so equality is already dead.
    expect(
      couponState(coupon({ expiresAt: NOW.toISOString() }), NOW),
    ).toBe("EXPIRED");
  });

  it("is USED_UP once the global cap is reached", () => {
    expect(
      couponState(coupon({ maxUsageCount: 50, usageCount: 50 }), NOW),
    ).toBe("USED_UP");
  });

  it("stays LIVE one redemption short of the cap", () => {
    expect(
      couponState(coupon({ maxUsageCount: 50, usageCount: 49 }), NOW),
    ).toBe("LIVE");
  });

  it("ignores the per-customer cap — that is not a global stop", () => {
    // maxUsagePerUser is checked per customer at checkout; it can never make
    // the coupon itself dead.
    expect(
      couponState(coupon({ maxUsagePerUser: 1, usageCount: 900 }), NOW),
    ).toBe("LIVE");
  });

  it("reports DISABLED ahead of an expiry that also passed", () => {
    expect(
      couponState(
        coupon({ status: "DISABLED", expiresAt: "2026-01-01T00:00:00.000Z" }),
        NOW,
      ),
    ).toBe("DISABLED");
  });
});

describe("isSilentlyDead", () => {
  it("flags a stored-ACTIVE coupon the till would reject", () => {
    expect(
      isSilentlyDead(coupon({ expiresAt: "2026-08-01T00:00:00.000Z" }), NOW),
    ).toBe(true);
  });

  it("does not flag a coupon that was deliberately switched off", () => {
    expect(isSilentlyDead(coupon({ status: "DISABLED" }), NOW)).toBe(false);
  });

  it("does not flag a working coupon", () => {
    expect(isSilentlyDead(coupon(), NOW)).toBe(false);
  });
});

describe("couponStateHint", () => {
  it("names the seam when a stored-ACTIVE coupon is really expired", () => {
    const hint = couponStateHint(
      coupon({ expiresAt: "2026-08-01T00:00:00.000Z" }),
      NOW,
    );
    expect(hint).toContain("still stored as active");
  });
});

describe("discountSummary", () => {
  it("renders a percentage without trailing zeros", () => {
    expect(discountSummary(coupon({ discountValue: 20 }))).toBe("20% off");
  });

  it("keeps a fractional percentage", () => {
    expect(discountSummary(coupon({ discountValue: 12.5 }))).toBe("12.5% off");
  });

  it("renders a fixed amount as money", () => {
    expect(
      discountSummary(
        coupon({ discountType: "FIXED_AMOUNT", discountValue: 2000 }),
      ),
    ).toBe(`${formatPrice(2000)} off`);
  });
});

describe("discountConditions", () => {
  it("leads with the cap, then the floor, then the per-customer limit", () => {
    expect(
      discountConditions(
        coupon({ maxDiscountAmount: 5000, minOrderAmount: 10000 }),
      ),
    ).toEqual([
      `max ${formatPrice(5000)}`,
      `carts over ${formatPrice(10000)}`,
      "once per customer",
    ]);
  });

  it("drops a cap on a FIXED_AMOUNT coupon — the backend never applies it", () => {
    expect(
      discountConditions(
        coupon({
          discountType: "FIXED_AMOUNT",
          discountValue: 2000,
          maxDiscountAmount: 5000,
        }),
      ),
    ).toEqual(["once per customer"]);
  });

  it("spells out a per-customer limit above one", () => {
    expect(discountConditions(coupon({ maxUsagePerUser: 3 }))).toContain(
      "3× per customer",
    );
  });
});

describe("usageSummary", () => {
  it("reads as a fraction when there is a cap to fill", () => {
    expect(usageSummary(coupon({ usageCount: 23, maxUsageCount: 500 }))).toBe(
      "23 of 500",
    );
  });

  it("reads as a plain count when uncapped", () => {
    expect(usageSummary(coupon({ usageCount: 23 }))).toBe("23 used");
    expect(usageSummary(coupon({ usageCount: 1 }))).toBe("1 used");
  });
});

describe("usageFraction", () => {
  it("is null without a cap — there is no bar to fill", () => {
    expect(usageFraction(coupon({ usageCount: 40 }))).toBeNull();
  });

  it("clamps at 1 if usage ever overshoots the cap", () => {
    expect(usageFraction(coupon({ usageCount: 60, maxUsageCount: 50 }))).toBe(1);
  });
});

describe("expiryPhrase", () => {
  it("says so when there is no expiry at all", () => {
    expect(expiryPhrase(coupon(), NOW)).toBe("Never expires");
  });

  it("counts forward", () => {
    expect(
      expiryPhrase(coupon({ expiresAt: "2026-09-06T12:00:00.000Z" }), NOW),
    ).toBe("in 10 days");
  });

  it("counts back", () => {
    expect(
      expiryPhrase(coupon({ expiresAt: "2026-08-17T12:00:00.000Z" }), NOW),
    ).toBe("10 days ago");
  });

  it("uses words for the near days", () => {
    expect(
      expiryPhrase(coupon({ expiresAt: "2026-08-28T12:00:00.000Z" }), NOW),
    ).toBe("Tomorrow");
    expect(
      expiryPhrase(coupon({ expiresAt: "2026-08-26T12:00:00.000Z" }), NOW),
    ).toBe("Yesterday");
  });
});

describe("isExpiringSoon", () => {
  it("flags a live coupon inside the window", () => {
    expect(
      isExpiringSoon(coupon({ expiresAt: "2026-08-30T12:00:00.000Z" }), NOW),
    ).toBe(true);
  });

  it("ignores one further out", () => {
    expect(
      isExpiringSoon(coupon({ expiresAt: "2026-09-30T12:00:00.000Z" }), NOW),
    ).toBe(false);
  });

  it("stays quiet about a coupon that is already dead", () => {
    // "Expiring soon" on an expired row is noise, not a warning.
    expect(
      isExpiringSoon(coupon({ expiresAt: "2026-08-20T12:00:00.000Z" }), NOW),
    ).toBe(false);
    expect(
      isExpiringSoon(
        coupon({ status: "DISABLED", expiresAt: "2026-08-30T12:00:00.000Z" }),
        NOW,
      ),
    ).toBe(false);
  });
});

describe("normalizeCouponCode", () => {
  it("uppercases and strips what the backend rejects", () => {
    expect(normalizeCouponCode("save 20")).toBe("SAVE20");
    expect(normalizeCouponCode("save-20")).toBe("SAVE20");
  });

  it("does not clamp length — that would eat the tail as someone types", () => {
    const long = "A".repeat(60);
    expect(normalizeCouponCode(long)).toHaveLength(60);
  });
});
