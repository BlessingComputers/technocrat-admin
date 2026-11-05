import { describe, expect, it } from "vitest";
import { ApiError, isUnreadableImage } from "./error";

describe("isUnreadableImage", () => {
  it("is true for the backend's 400 INVALID_IMAGE", () => {
    const err = new ApiError("x", 400, { success: false, code: "INVALID_IMAGE", message: "x" });
    expect(isUnreadableImage(err)).toBe(true);
  });

  it("is false for every other failure", () => {
    expect(isUnreadableImage(new ApiError("x", 500, { code: "INVALID_IMAGE" }))).toBe(false);
    expect(isUnreadableImage(new ApiError("x", 400, { code: "INVALID_IMAGE_KEY" }))).toBe(false);
    expect(isUnreadableImage(new ApiError("x", 429, null))).toBe(false);
    expect(isUnreadableImage(new Error("x"))).toBe(false);
  });
});
