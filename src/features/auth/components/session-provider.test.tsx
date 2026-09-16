// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "./session-provider";

const { refetch } = vi.hoisted(() => ({ refetch: vi.fn() }));

vi.mock("../api/auth.queries", () => ({
  useStaffProfileQuery: () => ({
    data: {
      id: "staff",
      firstName: "Ada",
      lastName: "Okafor",
      email: "ada@example.com",
      role: { id: "SALES", name: "Sales" },
      permissions: [],
    },
    isLoading: false,
    isError: false,
    refetch,
  }),
}));

afterEach(() => {
  cleanup();
  refetch.mockClear();
});

describe("stale staff permissions", () => {
  it("refreshes the staff profile after an API permission denial", async () => {
    render(<SessionProvider><p>Admin</p></SessionProvider>);
    window.dispatchEvent(new CustomEvent("api:permission-denied"));
    window.dispatchEvent(new CustomEvent("api:permission-denied"));

    await waitFor(() => expect(refetch).toHaveBeenCalledOnce());
  });
});
