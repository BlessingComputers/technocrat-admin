import { describe, expect, it } from "vitest";
import { navGroups } from "@/config/nav";
import { filterNavByPermissions, type StaffSession } from "@/lib/auth/permissions";

function session(permissionNames: string[]): StaffSession {
  return {
    id: "staff",
    firstName: "Ada",
    lastName: "Okafor",
    email: "ada@example.com",
    role: { id: "STAFF", name: "Staff" },
    permissions: permissionNames.map((name) => ({ id: name, name })),
  };
}

/** Titles of the "Pricing" parent's children after permission filtering, or null. */
function pricingChildren(permissionNames: string[]): string[] | null {
  const items = filterNavByPermissions(navGroups, session(permissionNames)).flatMap(
    (group) => group.items,
  );
  const pricing = items.find((item) => item.title === "Pricing");
  return pricing ? (pricing.children ?? []).map((child) => child.title) : null;
}

// Backend ask 53: deal routes accept discounts:* (or the priceMarkup:* they
// needed before). Markup rules themselves stay on priceMarkup/partMarkup.
describe("Pricing nav: Deals", () => {
  it("shows Deals, and only Deals, to a discounts-only role", () => {
    expect(pricingChildren(["discounts:read"])).toEqual(["Deals"]);
    expect(pricingChildren(["discounts:read", "discounts:write"])).toEqual(["Deals"]);
  });

  it("still shows Deals to priceMarkup holders", () => {
    expect(pricingChildren(["priceMarkup:read"])).toContain("Deals");
  });
});
