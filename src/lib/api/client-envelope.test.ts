// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function respond(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        }),
    ),
  );
}

describe("response envelope unwrapping", () => {
  it("unwraps the ok() shape", async () => {
    respond({ success: true, data: [1, 2] });
    await expect(api.get("/x")).resolves.toEqual([1, 2]);
  });

  it("unwraps the ResponseUtil shape", async () => {
    respond({ status: "success", message: "Success", data: { staffId: "S1" } });
    await expect(api.get("/x")).resolves.toEqual({ staffId: "S1" });
  });

  it("unwraps a ResponseUtil body that has no data key", async () => {
    respond({ status: "success", message: "Deleted" });
    await expect(api.get("/x")).resolves.toBeUndefined();
  });

  it("keeps a sibling meta only with raw: true", async () => {
    const body = {
      status: "success",
      message: "Success",
      data: [1],
      meta: { total: 9 },
    };
    respond(body);
    await expect(api.get("/x")).resolves.toEqual([1]);
    respond(body);
    await expect(api.get("/x", { raw: true })).resolves.toEqual(body);
  });

  it("throws on a ResponseUtil error, even on HTTP 200", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    respond({ status: "error", message: "Rule not found" });
    await expect(api.get("/x")).rejects.toThrow("Rule not found");
  });

  it("passes through a domain object that has a status field", async () => {
    const order = { id: "o1", status: "success", message: "Paid", total: 5 };
    respond(order);
    await expect(api.get("/x")).resolves.toEqual(order);
  });
});
