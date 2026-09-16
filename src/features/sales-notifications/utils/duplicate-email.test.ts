/**
 * The 409 → inline-field-error routing hangs off this predicate, so it must not
 * widen: any other failure has to keep falling through to a toast.
 */

import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/error";
import { isDuplicateEmailError } from "./duplicate-email";

describe("isDuplicateEmailError", () => {
  it("claims a 409 from the recipient routes", () => {
    const error = new ApiError("already registered", 409, {
      status: "error",
      message: "a@b.com is already registered for sales notifications",
    });
    expect(isDuplicateEmailError(error)).toBe(true);
  });

  it("leaves every other status to the toast path", () => {
    for (const status of [400, 403, 404, 422, 500]) {
      expect(isDuplicateEmailError(new ApiError("nope", status, null))).toBe(
        false,
      );
    }
  });

  it("ignores errors that never came from the API client", () => {
    expect(isDuplicateEmailError(new Error("network down"))).toBe(false);
    expect(isDuplicateEmailError({ status: 409 })).toBe(false);
    expect(isDuplicateEmailError(null)).toBe(false);
  });
});
