// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { SIDEBAR_RAIL_COOKIE, useSidebarStore } from "./sidebar-store";

describe("sidebar rail (ADR-0016)", () => {
  beforeEach(() => {
    useSidebarStore.setState({ railCollapsed: false, open: false });
    document.cookie = `${SIDEBAR_RAIL_COOKIE}=; path=/; max-age=0`;
  });

  it("collapses and expands the rail and persists it for the server read", () => {
    useSidebarStore.getState().toggleRail();
    expect(useSidebarStore.getState().railCollapsed).toBe(true);
    expect(document.cookie).toContain(`${SIDEBAR_RAIL_COOKIE}=collapsed`);

    useSidebarStore.getState().toggleRail();
    expect(useSidebarStore.getState().railCollapsed).toBe(false);
    expect(document.cookie).toContain(`${SIDEBAR_RAIL_COOKIE}=expanded`);
  });

  it("leaves the small-screen drawer alone", () => {
    useSidebarStore.getState().toggleRail();
    expect(useSidebarStore.getState().open).toBe(false);
  });
});
