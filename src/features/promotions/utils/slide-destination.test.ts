import { describe, expect, it } from "vitest";
import {
  buildBrandPath,
  buildCategoryPath,
  isSafeDestination,
  normalizeDestination,
  parseDestination,
  validateDestination,
} from "./slide-destination";

describe("parseDestination", () => {
  it("reads a product link off productSlug", () => {
    expect(
      parseDestination({ productSlug: "dell-xps-15", externalUrl: null }),
    ).toEqual({ kind: "product", slug: "dell-xps-15", value: "" });
  });

  it("treats an empty pair as decorative", () => {
    expect(parseDestination({ productSlug: null, externalUrl: null }).kind).toBe(
      "none",
    );
    expect(parseDestination({ productSlug: null, externalUrl: "  " }).kind).toBe(
      "none",
    );
  });

  it("round-trips a category path back to category mode", () => {
    const stored = buildCategoryPath("gaming-laptops");
    expect(parseDestination({ productSlug: null, externalUrl: stored })).toEqual(
      { kind: "category", slug: "gaming-laptops", value: stored },
    );
  });

  it("round-trips a brand path back to brand mode", () => {
    const stored = buildBrandPath("hp");
    expect(parseDestination({ productSlug: null, externalUrl: stored })).toEqual(
      { kind: "brand", slug: "hp", value: stored },
    );
  });

  it("falls through to page mode for any other internal path", () => {
    expect(
      parseDestination({ productSlug: null, externalUrl: "/parts" }),
    ).toEqual({ kind: "page", slug: null, value: "/parts" });
    // The catalog route without a category or brand filter is a page, not a
    // half-read category link.
    expect(
      parseDestination({ productSlug: null, externalUrl: "/product?page=1" })
        .kind,
    ).toBe("page");
  });

  it("classifies an off-site URL as external", () => {
    expect(
      parseDestination({
        productSlug: null,
        externalUrl: "https://partner.example/sale",
      }).kind,
    ).toBe("external");
  });

  it("does not mistake a protocol-relative host for an internal path", () => {
    expect(
      parseDestination({ productSlug: null, externalUrl: "//evil.example" })
        .kind,
    ).toBe("external");
  });

  it("prefers the product column when both somehow arrive", () => {
    expect(
      parseDestination({ productSlug: "x", externalUrl: "/parts" }).kind,
    ).toBe("product");
  });
});

describe("isSafeDestination", () => {
  it("accepts internal paths and http(s) URLs", () => {
    expect(isSafeDestination("/product?page=1")).toBe(true);
    expect(isSafeDestination("https://example.com")).toBe(true);
    expect(isSafeDestination("http://example.com")).toBe(true);
  });

  it("rejects everything that would be unsafe in an href", () => {
    expect(isSafeDestination("javascript:alert(1)")).toBe(false);
    expect(isSafeDestination("data:text/html,<script>")).toBe(false);
    expect(isSafeDestination("//evil.example")).toBe(false);
    expect(isSafeDestination("example.com")).toBe(false);
    expect(isSafeDestination("   ")).toBe(false);
  });
});

describe("normalizeDestination", () => {
  it("turns a pasted storefront URL into its path", () => {
    expect(
      normalizeDestination(
        "https://blessingcomputers.com/product?page=1&category=laptops",
        "https://blessingcomputers.com",
      ),
    ).toBe("/product?page=1&category=laptops");
  });

  it("leaves a genuinely off-site URL alone", () => {
    expect(
      normalizeDestination(
        "https://partner.example/x",
        "https://blessingcomputers.com",
      ),
    ).toBe("https://partner.example/x");
  });

  it("adds the missing slash to a typed path", () => {
    expect(normalizeDestination("parts")).toBe("/parts");
    expect(normalizeDestination("product?page=1")).toBe("/product?page=1");
  });

  it("does not slash-prefix something that looks like a host", () => {
    expect(normalizeDestination("example.com/x")).toBe("example.com/x");
  });
});

describe("validateDestination", () => {
  const empty = { productSlug: null, externalUrl: null };

  it("always allows a decorative slide", () => {
    expect(validateDestination("none", empty)).toBeNull();
  });

  it("requires the chosen mode to be filled in", () => {
    expect(validateDestination("product", empty)).toBeTruthy();
    expect(validateDestination("category", empty)).toBeTruthy();
    expect(validateDestination("brand", empty)).toBeTruthy();
    expect(validateDestination("page", empty)).toBeTruthy();
    expect(validateDestination("external", empty)).toBeTruthy();
  });

  it("holds external links to http(s)", () => {
    expect(
      validateDestination("external", {
        productSlug: null,
        externalUrl: "example.com",
      }),
    ).toBeTruthy();
    expect(
      validateDestination("external", {
        productSlug: null,
        externalUrl: "https://example.com",
      }),
    ).toBeNull();
  });

  it("rejects a page path that points off-site", () => {
    expect(
      validateDestination("page", {
        productSlug: null,
        externalUrl: "//evil.example",
      }),
    ).toBeTruthy();
    expect(
      validateDestination("page", {
        productSlug: null,
        externalUrl: "https://evil.example",
      }),
    ).toBeTruthy();
  });

  it("accepts any well-formed internal path", () => {
    expect(
      validateDestination("page", {
        productSlug: null,
        externalUrl: "/product?category=laptops&sort=price_asc",
      }),
    ).toBeNull();
  });
});
