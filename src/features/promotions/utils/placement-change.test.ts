import { describe, expect, it } from "vitest";
import { findConflictingFallback, templateChangeWarning } from "./placement-change";
import type { Promotion } from "../types/promotions";

function promo(overrides: Partial<Promotion> & { id: string }): Promotion {
  return {
    title: overrides.id,
    description: null,
    status: "PUBLISHED",
    position: 0,
    placement: "home-after-value",
    isFallback: false,
    targetCategorySlug: null,
    startAt: null,
    endAt: null,
    createdById: "u1",
    createdBy: { id: "u1", firstName: "A", lastName: "B" },
    slides: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("templateChangeWarning", () => {
  it("stays silent moving between two band slots — the daily case", () => {
    expect(templateChangeWarning("home-after-value", "home-after-shelf", 3)).toBeNull();
  });

  it("warns moving from a band slot to the listing strip", () => {
    expect(templateChangeWarning("home-after-value", "listing-top", 1)).toEqual({ from: "band", to: "strip" });
  });

  it("warns moving from the listing strip to a band slot", () => {
    expect(templateChangeWarning("listing-top", "home-after-hero", 2)).toEqual({ from: "strip", to: "band" });
  });

  it("stays silent when there is no art to be cropped yet", () => {
    expect(templateChangeWarning("home-after-value", "listing-top", 0)).toBeNull();
  });

  it("stays silent on a slot that has not moved", () => {
    expect(templateChangeWarning("home-after-value", "home-after-value", 5)).toBeNull();
  });

  it("stays silent when either end is a key this build does not know", () => {
    expect(templateChangeWarning("legacy-slot", "home-after-shelf", 4)).toBeNull();
    expect(templateChangeWarning("home-after-shelf", "legacy-slot", 4)).toBeNull();
  });
});

describe("findConflictingFallback", () => {
  const evergreen = promo({
    id: "evergreen",
    isFallback: true,
    placement: "listing-top",
  });

  it("finds the sitting fallback in the same slot", () => {
    expect(
      findConflictingFallback([evergreen], {
        placement: "listing-top",
        targetCategorySlug: null,
      })?.id,
    ).toBe("evergreen");
  });

  it("does not treat a promotion as conflicting with itself", () => {
    expect(
      findConflictingFallback([evergreen], {
        id: "evergreen",
        placement: "listing-top",
        targetCategorySlug: null,
      }),
    ).toBeNull();
  });

  it("scopes uniqueness to the category, not the slot", () => {
    // §2.11: laptops and accessories can each hold their own evergreen banner.
    const laptops = promo({
      id: "laptops",
      isFallback: true,
      placement: "listing-top",
      targetCategorySlug: "laptops",
    });
    expect(
      findConflictingFallback([laptops], {
        placement: "listing-top",
        targetCategorySlug: "accessories",
      }),
    ).toBeNull();
    expect(
      findConflictingFallback([laptops], {
        placement: "listing-top",
        targetCategorySlug: "laptops",
      })?.id,
    ).toBe("laptops");
  });

  it("treats a site-wide fallback and a targeted one as different spots", () => {
    expect(
      findConflictingFallback([evergreen], {
        placement: "listing-top",
        targetCategorySlug: "laptops",
      }),
    ).toBeNull();
  });

  it("ignores an archived fallback, which can no longer render", () => {
    expect(
      findConflictingFallback([promo({ ...evergreen, status: "ARCHIVED" })], {
        placement: "listing-top",
        targetCategorySlug: null,
      }),
    ).toBeNull();
  });

  it("counts a DRAFT fallback, so two do not go live together later", () => {
    expect(
      findConflictingFallback([promo({ ...evergreen, status: "DRAFT" })], {
        placement: "listing-top",
        targetCategorySlug: null,
      })?.id,
    ).toBe("evergreen");
  });

  it("ignores a non-fallback campaign sitting in the same slot", () => {
    expect(
      findConflictingFallback([promo({ id: "campaign", placement: "listing-top" })], {
        placement: "listing-top",
        targetCategorySlug: null,
      }),
    ).toBeNull();
  });

  it("ignores a fallback in a different slot", () => {
    expect(
      findConflictingFallback([evergreen], {
        placement: "home-before-bike",
        targetCategorySlug: null,
      }),
    ).toBeNull();
  });
});
