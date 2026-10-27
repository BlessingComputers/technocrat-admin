// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NewPasswordFields } from "./new-password-fields";

afterEach(cleanup);

function renderFields(password: string, confirm: string) {
  render(
    <NewPasswordFields
      password={password}
      confirm={confirm}
      onPasswordChange={() => undefined}
      onConfirmChange={() => undefined}
    />,
  );
}

describe("new password fields", () => {
  it("marks each rule as met or not met", () => {
    renderFields("Blessing", "");
    const list = screen.getByRole("list", { name: "Password requirements" });
    expect(list.textContent).toContain("One uppercase letter (met)");
    expect(list.textContent).toContain("One number (not met)");
  });

  it("warns when the confirmation differs", () => {
    renderFields("Blessing#2026", "Blessing#20");
    expect(screen.getByText("Passwords do not match")).toBeTruthy();
  });

  it("stays quiet before the confirmation is typed", () => {
    renderFields("Blessing#2026", "");
    expect(screen.queryByText("Passwords do not match")).toBeNull();
  });
});
