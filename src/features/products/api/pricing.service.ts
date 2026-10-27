import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  MarkupApplyInput,
  MarkupApplyResult,
  MarkupPreviewInput,
  MarkupPreviewResult,
  MarkupResetResult,
  MarkupRule,
  MarkupRuleInput,
  MarkupRuleType,
  MarkupRuleUpdateInput,
  ResetCategoryInput,
} from "../types/pricing";

/**
 * Markup-rules data access (products pricing). All endpoints require the
 * `products:write` permission server-side; the client unwraps the response
 * envelope (ADR-0007), so each call returns the inner payload directly.
 *
 * Path params take the rule's DB UUID (`id`) — never the human `MKP-XXXXXXXX`.
 */

const { pricing } = API_ENDPOINTS.products;

export const pricingService = {
  /**
   * Every rule, or only one half of them.
   *
   * `?type=markup|discount` is server-side and case insensitive; the backend
   * filters in application code after its cache read, and the cache key ignores
   * the param, so a filtered call cannot poison the unfiltered list. An
   * unrecognised value is a 400, not a silent empty list.
   *
   * Omitting the type returns everything, which is what the existing tables do.
   */
  getMarkupRules: (type?: MarkupRuleType) =>
    api.get<MarkupRule[]>(pricing.markupRules, {
      params: { type: type?.toLowerCase() },
    }),

  getMarkupRule: (id: string) => api.get<MarkupRule>(pricing.markupRule(id)),

  createMarkupRule: (data: MarkupRuleInput) =>
    api.post<MarkupRule>(pricing.markupRules, data),

  updateMarkupRule: (id: string, data: MarkupRuleUpdateInput) =>
    api.patch<MarkupRule>(pricing.markupRule(id), data),

  /** Rejected (400) while the rule is active — cancel it first. */
  deleteMarkupRule: (id: string) =>
    api.delete<{ message: string }>(pricing.markupRule(id)),

  /**
   * Dry-run — projects price changes, writes nothing. Accepts either a saved
   * rule (`{ ruleId }`) or an ad-hoc `{ markupPercentage, categoryId/brandId }`,
   * optionally narrowed by `productIds`/`variantIds`.
   */
  previewMarkup: (input: MarkupPreviewInput) =>
    api.post<MarkupPreviewResult>(pricing.markupPreview, input),

  /**
   * Retroactively apply a saved rule to matching variants, optionally narrowed
   * to specific products/variants.
   */
  applyMarkup: (input: MarkupApplyInput) =>
    api.post<MarkupApplyResult>(pricing.markupApply, input),

  /**
   * Cancel a rule: atomically deactivates it (isActive=false) and resets every
   * variant and part in its scope back to base price — the primary "undo".
   * The rule record is kept for audit. Works for brand-only rules too; the
   * old 400 on rules with no categoryId was removed backend-side in 4f7f074.
   * @param ruleId The rule's DB UUID.
   * @returns Counts of variants and parts reset to base.
   */
  cancelMarkupRule: (ruleId: string) =>
    api.post<MarkupResetResult>(pricing.cancelMarkupRule(ruleId)),

  /**
   * Reset all in-scope prices to base but leave the rule active. Prices drift
   * back up as products are created/edited — use cancel for a permanent undo.
   * Like cancel, accepts brand-only rules since 4f7f074.
   */
  resetMarkupRule: (ruleId: string) =>
    api.post<MarkupResetResult>(pricing.resetMarkupRule(ruleId)),

  /**
   * Reset a category (and optionally one brand) to base with no rule required —
   * covers brand-only rules, deleted rules, and manually-bumped prices.
   */
  resetCategory: (input: ResetCategoryInput) =>
    api.post<MarkupResetResult>(pricing.resetCategory, input),

  /**
   * Catalog search powering the exact-product rule scope. The products list
   * keeps `meta` as a top-level sibling of `data`, so the shared client's
   * unwrap would drop it — read raw and pull `data` ourselves.
   *
   * The option `id` is the product's DB UUID, which is what
   * `POST /pricing/markup-rules { productId }` resolves against — NOT the human
   * `productId`/SKU. Active products only; the catalog can be large.
   */
  searchProducts: async (query: string): Promise<MarkupProductOption[]> => {
    const res = await api.get<ProductSearchEnvelope>(
      API_ENDPOINTS.products.list,
      {
        params: { q: query || undefined, limit: 20, page: 1, isActive: "true" },
        raw: true,
      },
    );
    return (res?.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  },
};

/** Minimal option shape the exact-product scope picker consumes. */
export interface MarkupProductOption {
  id: string;
  name: string;
}

/** Minimal slice of the products list envelope the scope picker needs. */
interface ProductSearchEnvelope {
  data: Array<{ id: string; name: string }>;
}
