// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preorderService } from "../../api/preorder.service";
import { PreorderCancellationForm } from "./preorder-cancellation-form";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function renderForm(approvedAmount: number) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><PreorderCancellationForm preorderId="preorder" approvedAmount={approvedAmount} /></QueryClientProvider>);
  return client;
}

describe("preorder cancellation", () => {
  it("submits an ordinary cancellation before payment approval", async () => {
    const cancel = vi.spyOn(preorderService, "cancel").mockRejectedValue(new Error("Test response"));
    const client = renderForm(0);
    fireEvent.change(screen.getByLabelText("Cancellation reason shown to the customer"), { target: { value: "Item is no longer required" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel preorder" }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("preorder", { reason: "Item is no longer required" }));
    client.clear();
  });

  it("shows the financial resolution fields after an approved payment", () => {
    const client = renderForm(30_000);
    expect(screen.getByText("Financial resolution")).toBeTruthy();
    expect(screen.getByText(/Approved payments total/)).toBeTruthy();
    expect(screen.getByLabelText("Resolution reason shown to the customer")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel preorder" }).hasAttribute("disabled")).toBe(true);
    client.clear();
  });
});
