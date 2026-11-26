import { describe, expect, it } from "vitest";

import type { PartDetail } from "../types/parts";
import { toFormDefaults } from "./part-form";

// The part response's `price`/`compareAtPrice` have the markup rule applied;
// PATCH sets the BASE values and the backend applies the rule again. The form
// must edit the base values, or every save compounds the markup.
const part = (fields: Partial<PartDetail>) =>
  ({ name: "Screen", price: 55_000, compareAtPrice: 66_000, ...fields }) as unknown as PartDetail;

describe("toFormDefaults price", () => {
  it("prefills the base price and base compare-at price", () => {
    const values = toFormDefaults(
      part({ price: 55_000, basePrice: 50_000, compareAtPrice: 66_000, baseCompareAtPrice: 60_000 }),
    );
    expect(values.price).toBe("₦50 000");
    expect(values.compareAtPrice).toBe("₦60 000");
  });

  it("falls back to the shelf values when the part has no base values", () => {
    const values = toFormDefaults(part({ basePrice: null, baseCompareAtPrice: null }));
    expect(values.price).toBe("₦55 000");
    expect(values.compareAtPrice).toBe("₦66 000");
  });
});
