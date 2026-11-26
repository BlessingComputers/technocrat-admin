import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function request(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(path, "http://admin.test"));
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe("proxy /login", () => {
  it("sends a signed-in staff member with a plain /login back home", () => {
    const res = proxy(request("/login", { staffAccessToken: "valid" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://admin.test/");
  });

  it("clears a dead session and shows /login after a failed refresh", () => {
    const res = proxy(
      request("/login?redirect=%2F&error=unauthorized", {
        staffAccessToken: "stale",
        staffRefreshToken: "stale",
      }),
    );
    expect(res.headers.get("location")).toBeNull();
    const cleared = res.headers.getSetCookie().join("\n");
    expect(cleared).toMatch(/staffAccessToken=;.*Expires=Thu, 01 Jan 1970/);
    expect(cleared).toMatch(/staffRefreshToken=;.*Expires=Thu, 01 Jan 1970/);
  });

  it("keeps the bounce for /login?notice=, which is not a failed refresh", () => {
    const res = proxy(
      request("/login?notice=password-reset", { staffAccessToken: "valid" }),
    );
    expect(res.status).toBe(307);
  });
});
