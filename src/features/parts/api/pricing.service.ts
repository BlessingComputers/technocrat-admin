import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  PartMarkupApplyInput,
  PartMarkupApplyResult,
  PartMarkupPreviewInput,
  PartMarkupPreviewResult,
  PartMarkupResetResult,
  PartMarkupRule,
  PartMarkupRuleInput,
  PartMarkupRuleType,
  PartMarkupRuleUpdateInput,
} from "../types/pricing";

/**
 * Parts markup-rules data access. Mirrors the product pricing service against the
 * `/products/parts/markup-rules` endpoints. Path params take the rule's DB UUID.
 */
const { markup } = API_ENDPOINTS.products.parts;

export const partsPricingService = {
  /**
   * Every rule, or only one half of them. `?type=markup|discount` is
   * server-side and case insensitive, and an unrecognised value is a 400 rather
   * than a silent empty list. Omitting it returns everything.
   */
  getMarkupRules: (type?: PartMarkupRuleType) =>
    api.get<PartMarkupRule[]>(markup.rules, {
      params: { type: type?.toLowerCase() },
    }),

  createMarkupRule: (data: PartMarkupRuleInput) =>
    api.post<PartMarkupRule>(markup.rules, data),

  updateMarkupRule: (id: string, data: PartMarkupRuleUpdateInput) =>
    api.patch<PartMarkupRule>(markup.rule(id), data),

  /** Rejected (400) while the rule is active — cancel it first. */
  deleteMarkupRule: (id: string) =>
    api.delete<{ message: string }>(markup.rule(id)),

  /** Dry-run — projects price changes, writes nothing. */
  previewMarkup: (input: PartMarkupPreviewInput) =>
    api.post<PartMarkupPreviewResult>(markup.preview, input),

  /** Retroactively apply a saved rule to matching parts. */
  applyMarkup: (input: PartMarkupApplyInput) =>
    api.post<PartMarkupApplyResult>(markup.apply, input),

  /** Reset in-scope prices to base but keep the rule active. */
  resetMarkupRule: (ruleId: string) =>
    api.post<PartMarkupResetResult>(markup.reset(ruleId)),

  /** Cancel: deactivate the rule AND reset its scope to base (the undo). */
  cancelMarkupRule: (ruleId: string) =>
    api.post<PartMarkupResetResult>(markup.cancel(ruleId)),

  /**
   * Catalog search powering the exact-part rule scope. The parts list nests
   * `{ data, meta }` INSIDE the envelope's data key, so the shared client's
   * unwrap already lands us on `{ data: Part[], meta }` — no `raw` needed
   * (unlike the products list).
   *
   * The option `id` is the part's DB UUID, which is what
   * `POST /parts/markup-rules { partId }` resolves against. Active parts only.
   */
  searchParts: async (query: string): Promise<PartMarkupOption[]> => {
    const res = await api.get<PartSearchEnvelope>(
      API_ENDPOINTS.products.parts.list,
      {
        params: { q: query || undefined, limit: 20, page: 1, isActive: "true" },
      },
    );
    return (res?.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  },
};

/** Minimal option shape the exact-part scope picker consumes. */
export interface PartMarkupOption {
  id: string;
  name: string;
}

/** Minimal slice of the (already-unwrapped) parts list payload. */
interface PartSearchEnvelope {
  data: Array<{ id: string; name: string }>;
}
