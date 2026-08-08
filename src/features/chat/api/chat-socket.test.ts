/**
 * @vitest-environment jsdom
 *
 * The socket-token bridge path (ticket #27): a 401 from the bridge must
 * trigger exactly ONE single-flight refresh (ADR-0004, owned by the shared
 * REST client) followed by one retry — never a refresh per reconnect attempt.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSocketToken } from "./chat-socket";

const BRIDGE_URL = "/api/auth/staff/socket-token";
const REFRESH_URL = "/api/auth/staff/refresh";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const fetchMock = vi.fn<typeof fetch>();

function callsTo(url: string): number {
  return fetchMock.mock.calls.filter(([input]) => String(input).includes(url))
    .length;
}

beforeEach(() => {
  // The client's cross-tab guard treats a refresh in the last 10s as fresh —
  // clear it so each test starts cold.
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchSocketToken", () => {
  it("returns the token straight from the bridge when the session is live", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ token: "sock-1" }));

    await expect(fetchSocketToken()).resolves.toBe("sock-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("on bridge 401: refreshes exactly once, retries once, and returns the fresh token", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes(REFRESH_URL)) return jsonResponse({ success: true });
      // First bridge call 401s (expired access token), the retry succeeds.
      return callsTo(BRIDGE_URL) <= 1
        ? jsonResponse({ error: "Unauthorized" }, 401)
        : jsonResponse({ token: "sock-2" });
    });

    await expect(fetchSocketToken()).resolves.toBe("sock-2");

    expect(callsTo(REFRESH_URL)).toBe(1);
    expect(callsTo(BRIDGE_URL)).toBe(2);
  });

  it("returns null when the refresh itself fails (client redirects to /login)", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes(REFRESH_URL))
        return jsonResponse({ error: "invalid refresh token" }, 401);
      return jsonResponse({ error: "Unauthorized" }, 401);
    });

    await expect(fetchSocketToken()).resolves.toBeNull();
    expect(callsTo(REFRESH_URL)).toBe(1);
  });

  it("returns null on network failure without attempting a refresh", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));

    await expect(fetchSocketToken()).resolves.toBeNull();
    expect(callsTo(REFRESH_URL)).toBe(0);
  });
});
