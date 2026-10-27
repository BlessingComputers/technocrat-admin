import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/utils/format";
import {
  cheapestBasePrice,
  discountLabel,
  huntPrice,
  huntPriceLabel,
  resolvePercentage,
} from "./hunt-price";

describe("cheapestBasePrice", () => {
  it("takes the lowest basePrice, the variant the backend prices from", () => {
    expect(
      cheapestBasePrice([
        { basePrice: 900_000 },
        { basePrice: 845_000 },
        { basePrice: 1_020_000 },
      ]),
    ).toBe(845_000);
  });

  it("skips variants with no basePrice, as the backend's ascending sort does", () => {
    expect(cheapestBasePrice([{ basePrice: null }, { basePrice: 12_500 }, {}])).toBe(
      12_500,
    );
  });

  it("is null when nothing can be priced", () => {
    expect(cheapestBasePrice([])).toBeNull();
    expect(cheapestBasePrice([{ basePrice: null }])).toBeNull();
  });
});

describe("huntPrice", () => {
  it("applies the stored percentage and rounds to the naira", () => {
    expect(huntPrice(845_000, -99)).toBe(8_450);
    expect(huntPrice(845_000, -99.4)).toBe(5_070);
    expect(huntPrice(12_345, -50)).toBe(6_173);
  });

  it("never goes below zero", () => {
    expect(huntPrice(1_000, -150)).toBe(0);
  });
});

describe("huntPriceLabel", () => {
  it("prints a single-variant item's price plainly", () => {
    expect(
      huntPriceLabel({ productId: "p", cheapestBasePrice: 845_000, variantCount: 1 }, -99),
    ).toBe(formatPrice(8_450));
  });

  it("says 'from' when other variants cost more", () => {
    expect(
      huntPriceLabel({ productId: "p", cheapestBasePrice: 845_000, variantCount: 3 }, -99),
    ).toBe(`from ${formatPrice(8_450)}`);
  });

  it("gives up rather than print ₦0 when the base price is unknown", () => {
    expect(huntPriceLabel(undefined, -99)).toBeNull();
    expect(
      huntPriceLabel({ productId: "p", cheapestBasePrice: null, variantCount: 1 }, -99),
    ).toBeNull();
  });
});

describe("resolvePercentage", () => {
  it("trusts a reported discount", () => {
    expect(resolvePercentage(-99, -50)).toBe(-99);
  });

  it("falls back to the deal's stored target when the response says 0", () => {
    expect(resolvePercentage(0, -99)).toBe(-99);
  });

  it("is null when neither source has a real discount", () => {
    expect(resolvePercentage(0, undefined)).toBeNull();
    expect(resolvePercentage(0, 0)).toBeNull();
  });
});

describe("discountLabel", () => {
  it("shows the stored magnitude, trimmed to two places", () => {
    expect(discountLabel(-99)).toBe("−99%");
    expect(discountLabel(-99.4)).toBe("−99.4%");
    expect(discountLabel(-33.333333)).toBe("−33.33%");
  });
});
