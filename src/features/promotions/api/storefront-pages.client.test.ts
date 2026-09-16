import { afterEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_STOREFRONT_PAGES } from "@/lib/storefront-pages";
import { fetchStorefrontPages } from "./storefront-pages.client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchStorefrontPages", () => {
  it("returns a valid route response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            pages: [{ path: "/", label: "Home" }],
            source: "storefront",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await expect(fetchStorefrontPages()).resolves.toEqual({
      pages: [{ path: "/", label: "Home" }],
      source: "storefront",
    });
  });

  it("uses the fallback when a successful response has the wrong shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ pages: { path: "/" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(fetchStorefrontPages()).resolves.toEqual({
      pages: FALLBACK_STOREFRONT_PAGES,
      source: "fallback",
    });
  });
});
