// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { navGroups } from "@/config/nav";
import { filterNavByPermissions, type StaffSession } from "@/lib/auth/permissions";
import { SessionContext } from "@/lib/auth/session-context";
import { PREORDER_PERMISSIONS } from "../constants/preorder-permissions";
import { PreordersAccessGate } from "./preorders-access-gate";

afterEach(cleanup);

function session(permissionNames: string[]): StaffSession {
  return {
    id: "staff",
    firstName: "Ada",
    lastName: "Okafor",
    email: "ada@example.com",
    role: { id: "SALES", name: "Sales" },
    permissions: permissionNames.map((name) => ({ id: name, name })),
  };
}

function renderGate(staffSession: StaffSession) {
  render(
    <SessionContext.Provider value={{ staffSession, isLoading: false, isError: false }}>
      <PreordersAccessGate><p>Preorder queue</p></PreordersAccessGate>
    </SessionContext.Provider>,
  );
}

describe("preorder read permission", () => {
  it("allows a non-super-admin with preorders:read into the queue", () => {
    renderGate(session([PREORDER_PERMISSIONS.read]));
    expect(screen.getByText("Preorder queue")).toBeTruthy();
  });

  it("blocks a staff member whose role lacks preorders:read", () => {
    renderGate(session([PREORDER_PERMISSIONS.reviewEvidence]));
    expect(screen.queryByText("Preorder queue")).toBeNull();
    expect(screen.getByText("Pre-orders is restricted")).toBeTruthy();
  });

  it("shows the sidebar entry only with the exact read permission", () => {
    const withoutRead = filterNavByPermissions(navGroups, session([PREORDER_PERMISSIONS.reviewEvidence]));
    const withRead = filterNavByPermissions(navGroups, session([PREORDER_PERMISSIONS.read]));
    const titles = (groups: typeof navGroups) => groups.flatMap((group) => group.items.map((item) => item.title));

    expect(titles(withoutRead)).not.toContain("Pre-orders");
    expect(titles(withRead)).toContain("Pre-orders");
  });
});
