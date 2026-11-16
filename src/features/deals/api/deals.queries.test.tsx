// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dealKeys, useEndedDeals } from "./deals.queries";
import { dealsService, type DealsPage } from "./deals.service";

afterEach(() => vi.restoreAllMocks());

const page = (n: number, totalPages: number): DealsPage =>
  ({ data: [], meta: { page: n, limit: 20, total: 25, totalPages } }) as unknown as DealsPage;

describe("useEndedDeals", () => {
  it("pages ended deals 20 at a time and stops after the last page", async () => {
    const getDeals = vi
      .spyOn(dealsService, "getDeals")
      .mockImplementation(async ({ page: n = 1 } = {}) => page(n, 2));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useEndedDeals(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getDeals).toHaveBeenCalledWith({ status: "ENDED", page: 1, limit: 20 });
    expect(result.current.hasNextPage).toBe(true);

    await act(() => result.current.fetchNextPage());
    expect(getDeals).toHaveBeenLastCalledWith({ status: "ENDED", page: 2, limit: 20 });
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    expect(result.current.data?.pages).toHaveLength(2);
  });

  it("sits under the list key, so start and end invalidations refresh it", () => {
    expect(dealKeys.ended().slice(0, dealKeys.lists().length)).toEqual(dealKeys.lists());
  });
});
