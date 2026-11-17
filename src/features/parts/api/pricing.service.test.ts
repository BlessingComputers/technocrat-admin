/**
 * Guards the part type name on part markup rules. The backend sends the
 * relation as `partTypeRef`; every reader uses `partType`. Without the copy,
 * the coverage map's type switcher showed the type's UUID.
 */

import { describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  api: { get: (...a: unknown[]) => get(...a) },
}));

import { partsPricingService } from "./pricing.service";

describe("partsPricingService.getMarkupRules", () => {
  it("copies partTypeRef into partType", async () => {
    const battery = { id: "t1", name: "Battery", slug: "battery" };
    get.mockResolvedValueOnce([
      { id: "r1", partTypeId: "t1", partTypeRef: battery },
      { id: "r2", partTypeId: null, partTypeRef: null },
    ]);
    const rules = await partsPricingService.getMarkupRules();
    expect(rules[0].partType).toEqual(battery);
    expect(rules[1].partType).toBeNull();
  });
});
