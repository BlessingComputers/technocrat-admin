import { describe, expect, it } from "vitest";
import {
  ME_SEGMENT,
  currentHref,
  holdsCurrentPage,
  isPathActive,
  resolveMeHrefs,
} from "./nav-active";

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

describe("currentHref", () => {
  const hrefs = ["/", "/uploads", "/uploads/me-1", "/catalogues?page=1"];

  it("picks the most specific match, so only one row is active", () => {
    expect(currentHref("/uploads/me-1", hrefs)).toBe("/uploads/me-1");
    expect(currentHref("/uploads/someone-else", hrefs)).toBe("/uploads");
  });
  it("returns the href as written, query included", () => {
    expect(currentHref("/catalogues/abc", hrefs)).toBe("/catalogues?page=1");
  });
  it("is null when nothing matches", () => {
    expect(currentHref("/nowhere", ["/uploads"])).toBeNull();
  });
});

describe("holdsCurrentPage", () => {
  const children = [{ href: "/users" }, { href: "/uploads" }];

  it("is true when a child is the current href", () => {
    expect(holdsCurrentPage("/uploads", children)).toBe(true);
  });
  it("is false otherwise", () => {
    expect(holdsCurrentPage(null, children)).toBe(false);
    expect(holdsCurrentPage("/orders", children)).toBe(false);
  });
});

describe("resolveMeHrefs", () => {
  const groups = [
    {
      label: "You",
      items: [{ title: "My uploads", href: `/uploads/${ME_SEGMENT}` }],
    },
    { label: "System", items: [{ title: "Uploads", href: "/uploads" }] },
  ];

  it("puts the staff id into personal links", () => {
    const out = resolveMeHrefs(groups, "abc-123");
    expect(out[0].items[0].href).toBe("/uploads/abc-123");
    expect(out[1].items[0].href).toBe("/uploads");
  });
  it("drops personal links, and their empty group, without a session", () => {
    const out = resolveMeHrefs(groups, null);
    expect(out.map((g) => g.label)).toEqual(["System"]);
  });
});
