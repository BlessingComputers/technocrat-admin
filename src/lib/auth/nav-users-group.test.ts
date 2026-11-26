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

/** Titles of the "Users" parent's children after permission filtering, or null. */
function usersChildren(permissionNames: string[]): string[] | null {
  const items = filterNavByPermissions(navGroups, session(permissionNames)).flatMap(
    (group) => group.items,
  );
  const users = items.find((item) => item.title === "Users");
  return users ? (users.children ?? []).map((child) => child.title) : null;
}

describe("Users nav group", () => {
  it("holds Staff and Uploads as children, not as top-level rows", () => {
    const topLevel = navGroups.flatMap((group) => group.items.map((item) => item.title));
    expect(topLevel).not.toContain("Uploads");
    expect(usersChildren(["users:read", "products:read"])).toEqual(["Staff", "Uploads"]);
  });

  it("adds Rewards for a rewards permission holder", () => {
    expect(usersChildren(["users:read", "products:read", "rewards:pay"])).toEqual([
      "Staff",
      "Uploads",
      "Rewards",
    ]);
  });

  it("shows an uploader only Uploads", () => {
    expect(usersChildren(["products:read"])).toEqual(["Uploads"]);
  });

  it("shows a user manager only Staff", () => {
    expect(usersChildren(["users:read"])).toEqual(["Staff"]);
  });

  it("hides the parent when no child is allowed", () => {
    expect(usersChildren(["orders:read"])).toBeNull();
  });
});

describe("You nav group", () => {
  it("gives an uploader My uploads and My rewards", () => {
    const you = filterNavByPermissions(navGroups, session(["products:read"])).find(
      (group) => group.label === "You",
    );
    expect(you?.items.map((item) => item.title)).toEqual(["My uploads", "My rewards"]);
  });
});
