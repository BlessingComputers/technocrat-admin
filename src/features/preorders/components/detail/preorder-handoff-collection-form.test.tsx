// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preorderService } from "../../api/preorder.service";
import { PreorderHandoffCollectionForm } from "./preorder-handoff-collection-form";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("recording a handoff collection", () => {
  it("requires a transaction reference for transfer", async () => {
    const collect = vi.spyOn(preorderService, "recordHandoffCollection").mockRejectedValue(new Error("Test response"));
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><PreorderHandoffCollectionForm preorderId="preorder" requestId="request" /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText("Payment method"), { target: { value: "TRANSFER" } });
    expect(screen.getByRole("button", { name: "Record collection" }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByLabelText("Transaction reference"), { target: { value: "TRX-2031" } });
    fireEvent.click(screen.getByRole("button", { name: "Record collection" }));
    await waitFor(() => expect(collect).toHaveBeenCalledWith("request", {
      paymentMethod: "TRANSFER",
      transactionReference: "TRX-2031",
    }));
    client.clear();
  });

  it("records cash without a transaction reference", async () => {
    const collect = vi.spyOn(preorderService, "recordHandoffCollection").mockRejectedValue(new Error("Test response"));
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><PreorderHandoffCollectionForm preorderId="preorder" requestId="request" /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText("Payment method"), { target: { value: "CASH" } });
    fireEvent.click(screen.getByRole("button", { name: "Record collection" }));
    await waitFor(() => expect(collect).toHaveBeenCalledWith("request", { paymentMethod: "CASH" }));
    client.clear();
  });
});
