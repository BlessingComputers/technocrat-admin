import { describe, expect, it } from "vitest";
import { getProductSpecLine, getProductTitle } from "./product-name";

/**
 * The real name of the first product in the live catalog. Supplier names in
 * this category are spec dumps, and rendering one whole is what produced a
 * four-line page title on the product detail view.
 */
const REAL_NAME =
  'HP Laptop 15-fd0100nia - Intel Core 5-120U Processor, 8GB DDR5 RAM, 512GB PCIe NVMe SSD, 15.6" FHD (1920x1080) Anti-Glare Display, Intel Integrated Graphics, BACKLIT KEYBOARD, FreeDOS 3.0, Natural Silver, 1-Year Channel Warranty';

describe("getProductTitle", () => {
  it("cuts the supplier spec dump at the dash separator", () => {
    expect(getProductTitle(REAL_NAME)).toBe("HP Laptop 15-fd0100nia");
  });

  it("splits on a comma when there is no dash", () => {
    expect(getProductTitle("Dell OptiPlex 7010, 16GB RAM, 512GB SSD")).toBe(
      "Dell OptiPlex 7010",
    );
  });

  it("keeps a short name whole", () => {
    expect(getProductTitle("Logitech MX Master 3S")).toBe(
      "Logitech MX Master 3S",
    );
  });

  it("never truncates into a wrong product name", () => {
    // Splitting here would leave "HP" — meaningless as a product title.
    expect(getProductTitle("HP, EliteBook 840 G9 Notebook")).toBe(
      "HP, EliteBook 840 G9 Notebook",
    );
  });

  it("handles missing input", () => {
    expect(getProductTitle(undefined)).toBe("");
    expect(getProductTitle("   ")).toBe("");
  });
});

describe("getProductSpecLine", () => {
  it("prefers structured specs in decisiveness order", () => {
    expect(
      getProductSpecLine({
        name: REAL_NAME,
        specifications: [
          { name: "Part Number", value: "D16Z3EA", sortOrder: 0 },
          { name: "RAM", value: "8GB DDR5", sortOrder: 2 },
          { name: "Processor", value: "Intel Core 5-120U", sortOrder: 1 },
          { name: "Storage", value: "512GB PCIe NVMe SSD", sortOrder: 3 },
        ],
      }),
    ).toBe("Intel Core 5-120U · 8GB DDR5 · 512GB PCIe NVMe SSD");
  });

  it("never puts the part number in the summary", () => {
    expect(
      getProductSpecLine({
        name: "Widget",
        specifications: [{ name: "Part Number", value: "D16Z3EA" }],
      }),
    ).toBe("");
  });

  it("falls back to the tail of the name when specs are absent", () => {
    // This is the list-row case: ProductSummary carries no specifications.
    expect(getProductSpecLine({ name: REAL_NAME })).toBe(
      'Intel Core 5-120U Processor · 8GB DDR5 RAM · 512GB PCIe NVMe SSD · 15.6" FHD (1920x1080) Anti-Glare Display',
    );
  });

  it("returns nothing when the name carries no specs", () => {
    expect(getProductSpecLine({ name: "Logitech MX Master 3S" })).toBe("");
  });

  it("uses merchandiser order when no spec matches the priority list", () => {
    expect(
      getProductSpecLine({
        name: "Widget",
        specifications: [
          { name: "Colour", value: "Silver", sortOrder: 2 },
          { name: "Material", value: "Aluminium", sortOrder: 1 },
        ],
      }),
    ).toBe("Aluminium · Silver");
  });
});
