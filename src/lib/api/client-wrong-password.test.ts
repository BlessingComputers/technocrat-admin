// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("wrong current password", () => {
  it("rejects without trying a session refresh", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            success: false,
            code: "WRONG_PASSWORD",
            message: "Current password is incorrect",
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      api.post("/api/auth/staff/change-password", {
        currentPassword: "Wrong#123",
        newPassword: "Blessing#2026",
      }),
    ).rejects.toThrow("Current password is incorrect");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
