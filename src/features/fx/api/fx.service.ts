import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  FxCategoryNode,
  FxTaxonomyOption,
  FxCoverage,
  FxHistoryPage,
  FxLinkInput,
  FxLinkResult,
  FxStandingLink,
} from "../types/fx";

const { fx, products } = API_ENDPOINTS;

interface TotalOnly {
  meta?: { total?: number };
}

/**
 * Count rows through a list endpoint: ask for one row and read `meta.total`.
 * Only `/products/all` and `/products/parts` honour `fxLinked` (see
 * `lib/utils/fx-link.ts`), so these are the only two lists used here.
 */
async function countProducts(fxLinked?: "true"): Promise<number> {
  // `/products/all` keeps `meta` beside `data`, so the envelope needs `raw`.
  const res = await api.get<TotalOnly>(products.list, {
    params: { page: 1, limit: 1, fxLinked },
    raw: true,
  });
  return res.meta?.total ?? 0;
}

async function countParts(fxLinked?: "true"): Promise<number> {
  // The parts list nests `meta` with the array, so the plain unwrap keeps it.
  // Staff see inactive parts unless asked, and the products list is active
  // only by default, so ask for active parts to compare like with like.
  const res = await api.get<TotalOnly>(products.parts.list, {
    params: { page: 1, limit: 1, isActive: "true", fxLinked },
  });
  return res.meta?.total ?? 0;
}

export const fxService = {
  /** Active products and parts, all vs linked. Four one-row list calls. */
  getCoverage: async (): Promise<FxCoverage> => {
    const [productsTotal, productsLinked, partsTotal, partsLinked] =
      await Promise.all([
        countProducts(),
        countProducts("true"),
        countParts(),
        countParts("true"),
      ]);
    return {
      products: { linked: productsLinked, total: productsTotal },
      parts: { linked: partsLinked, total: partsTotal },
    };
  },

  /** Every FX decision, newest first. `RECORDED` rows are dry runs. */
  getHistory: (page: number, limit = 20) =>
    api.get<FxHistoryPage>(fx.history, { params: { page, limit } }),

  getStandingLinks: () => api.get<FxStandingLink[]>(fx.standingLinks),

  /** SUPER_ADMIN. Links or unlinks a category/brand scope now. */
  setLinked: (input: FxLinkInput) => api.post<FxLinkResult>(fx.link, input),

  /** The category tree (roots with `children`), for the scope picker. */
  getCategories: () => api.get<FxCategoryNode[]>(products.categories),

  getBrands: () => api.get<FxTaxonomyOption[]>(products.brands),

  /** SUPER_ADMIN. New items in the scope start unlinked; nothing is unlinked. */
  deleteStandingLink: (id: string) =>
    api.delete<{ deleted: true }>(fx.standingLink(id)),
};
