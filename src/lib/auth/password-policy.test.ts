import { describe, expect, it } from "vitest";
import { checkPasswordRules, isNewPasswordValid } from "./password-policy";

describe("password policy", () => {
  it("lists every rule a weak password misses", () => {
    const missed = checkPasswordRules("abc")
      .filter((r) => !r.met)
      .map((r) => r.label);
    expect(missed).toEqual([
      "At least 8 characters",
      "One uppercase letter",
      "One number",
      "One special character",
    ]);
  });

  it("passes a password the backend accepts", () => {
    expect(checkPasswordRules("Blessing#2026").every((r) => r.met)).toBe(true);
  });

  it("needs the confirmation to match", () => {
    expect(isNewPasswordValid("Blessing#2026", "Blessing#2025")).toBe(false);
    expect(isNewPasswordValid("Blessing#2026", "Blessing#2026")).toBe(true);
  });
});
