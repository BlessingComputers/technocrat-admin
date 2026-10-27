// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function forbiddenResponse(): Response {
  return new Response(JSON.stringify({ message: "Forbidden" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

describe("permission denial events", () => {
  it("announces an action denial so the session can refresh", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(forbiddenResponse()));
    const denied = vi.fn();
    window.addEventListener("api:permission-denied", denied, { once: true });

    await expect(api.post("/api/v1/admin/preorders/id/cancel")).rejects.toThrow("Forbidden");
    expect(denied).toHaveBeenCalledOnce();
  });

  it("does not loop when the staff-profile refresh itself is forbidden", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(forbiddenResponse()));
    const denied = vi.fn();
    window.addEventListener("api:permission-denied", denied, { once: true });

    await expect(api.get("/api/auth/staff/profile")).rejects.toThrow("Forbidden");
    expect(denied).not.toHaveBeenCalled();
  });
});
