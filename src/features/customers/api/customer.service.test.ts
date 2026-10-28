/**
 * Guards the customer list envelope. The backend sends its pagination flat,
 * beside the rows (`{ status, data: { data, total, page, limit, totalPages } }`).
 * Reading only `pagination`/`meta` made every list look like one page of 20.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  api: { get: (...a: unknown[]) => get(...a) },
}));

import { customerService } from "./customer.service";

const row = (n: number) => ({ id: `id-${n}`, customerId: `C${n}`, email: `c${n}@x.ng` });

/** What `/v1/admin/customers` returns for page `page` of `total` rows. */
function envelope(page: number, limit: number, total: number) {
  const start = (page - 1) * limit;
  const count = Math.max(0, Math.min(limit, total - start));
  return {
    status: "success",
    data: {
      data: Array.from({ length: count }, (_, i) => row(start + i + 1)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

type Config = { params: { page: number; limit: number } };

beforeEach(() => {
  get.mockReset();
});

describe("customerService.getAllCustomers", () => {
  it("reads the flat pagination beside the rows", async () => {
    get.mockResolvedValueOnce(envelope(1, 20, 135));
    const { data, meta } = await customerService.getAllCustomers({ page: 1, limit: 20 });
    expect(data).toHaveLength(20);
    expect(meta).toMatchObject({ total: 135, totalPages: 7, page: 1, hasNextPage: true });
  });
});

describe("customerService.getAllMatchingCustomers", () => {
  it("pages through at 100 until the last page, keeping the filters", async () => {
    const seen: unknown[][] = [];
    get.mockImplementation(async (...args: unknown[]) => {
      seen.push(args);
      const { params } = args[1] as Config;
      return envelope(params.page, params.limit, 250);
    });
    const progress = vi.fn();
    const all = await customerService.getAllMatchingCustomers(
      { search: "ade", page: 4, limit: 20 },
      progress,
    );
    expect(all).toHaveLength(250);
    expect(seen).toHaveLength(3);
    expect((seen[0][1] as Config).params).toMatchObject({ search: "ade", page: 1, limit: 100 });
    expect(progress).toHaveBeenLastCalledWith(250, 250);
  });
});
