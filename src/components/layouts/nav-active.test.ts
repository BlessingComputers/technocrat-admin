import { describe, expect, it } from "vitest";
import { holdsCurrentPage, isPathActive } from "./nav-active";

describe("isPathActive", () => {
  it("matches the route and its sub-routes", () => {
    expect(isPathActive("/uploads", "/uploads")).toBe(true);
    expect(isPathActive("/uploads/abc", "/uploads")).toBe(true);
  });
  it("does not match a route that only shares a prefix", () => {
    expect(isPathActive("/uploads-old", "/uploads")).toBe(false);
  });
  it("matches / exactly", () => {
    expect(isPathActive("/", "/")).toBe(true);
    expect(isPathActive("/orders", "/")).toBe(false);
  });
  it("ignores the query and hash on the href", () => {
    expect(isPathActive("/catalogues", "/catalogues?page=1")).toBe(true);
  });
});

describe("holdsCurrentPage", () => {
  const children = [{ href: "/users" }, { href: "/uploads" }];

  it("is true when a child is the current route", () => {
    expect(holdsCurrentPage("/uploads/abc", children)).toBe(true);
  });
  it("is false when no child is", () => {
    expect(holdsCurrentPage("/orders", children)).toBe(false);
  });
  it("is false for a child without an href", () => {
    expect(holdsCurrentPage("/", [{}])).toBe(false);
  });
});
