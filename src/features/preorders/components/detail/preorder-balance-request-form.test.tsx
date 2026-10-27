// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preorderService } from "../../api/preorder.service";
import { PreorderBalanceRequestForm } from "./preorder-balance-request-form";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("requesting the balance", () => {
  it("requires receipt of the item and an explicit transfer choice", async () => {
    const request = vi.spyOn(preorderService, "requestBalance").mockRejectedValue(new Error("Test response"));
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><PreorderBalanceRequestForm preorderId="preorder" amount={70_000} /></QueryClientProvider>);
    const submit = screen.getByRole("button", { name: "Request balance" });
    expect(submit.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit.hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("radio", { name: /Pay at delivery or pickup/ }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("radio", { name: /Bank transfer before/ }));
    expect(submit.hasAttribute("disabled")).toBe(false);
    fireEvent.change(screen.getByLabelText("Balance deadline, WAT"), { target: { value: "2099-09-10T11:00" } });
    fireEvent.click(submit);
    await waitFor(() => expect(request).toHaveBeenCalledWith("preorder", {
      collectionMethod: "TRANSFER_BEFORE_HANDOFF", payBy: "2099-09-10T10:00:00.000Z",
    }));
    client.clear();
  });

  it("requests pay at handoff without a deadline", async () => {
    const request = vi.spyOn(preorderService, "requestBalance").mockRejectedValue(new Error("Test response"));
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><PreorderBalanceRequestForm preorderId="preorder" amount={70_000} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("radio", { name: /Pay at delivery or pickup/ }));
    expect(screen.queryByLabelText("Balance deadline, WAT")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Request balance" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith("preorder", {
      collectionMethod: "PAY_AT_HANDOFF",
    }));
    client.clear();
  });
});
