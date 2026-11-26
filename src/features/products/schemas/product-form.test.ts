import { describe, expect, it } from "vitest";

import type { ProductDetail } from "../types/products";
import { toFormDefaults } from "./product-form";

// The detail response's `price` has the markup rule applied; PATCH `price`
// sets the BASE price and the backend applies the rule again. The form must
// edit the base price, or every save compounds the markup (or, during a flash
// sale, makes the sale price permanent).
const product = (variant: Partial<ProductDetail["variants"][number]>) =>
  ({
    name: "Laptop",
    variants: [{ id: "v1", name: "Default", sku: "SKU", price: 110_000, costPrice: 80_000, ...variant }],
  }) as unknown as ProductDetail;

describe("toFormDefaults price", () => {
  it("prefills the base price, not the marked-up shelf price", () => {
    const values = toFormDefaults(product({ price: 110_000, basePrice: 100_000 }));
    expect(values.variants[0].price).toBe("₦100 000");
  });

  it("falls back to the shelf price when the row has no base price", () => {
    const values = toFormDefaults(product({ price: 110_000, basePrice: null }));
    expect(values.variants[0].price).toBe("₦110 000");
  });
});
