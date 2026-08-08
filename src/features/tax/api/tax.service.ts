import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  PartTaxRule,
  PartTaxRuleInput,
  TaxonomyOption,
  TaxRule,
  TaxRuleInput,
  TaxRuleUpdateInput,
  TaxSetting,
  TaxSettingInput,
} from "../types/tax";

/**
 * Tax data access.
 *
 * The tax endpoints use the backend's `ResponseUtil` envelope
 * (`{ status, message, data }`, a STRING `status`). The shared admin client only
 * unwraps a BOOLEAN `success` envelope, so it leaves tax responses wrapped — we
 * peel `.data` here. (Product/part markup differs: it uses the `ok()` helper,
 * `{ success: true, data }`, which the client DOES unwrap — that's why the
 * markup services return payloads directly and this one doesn't.)
 *
 * Path params take the rule's DB `id` (UUID), never the human `TAX-XXXXXXXX`.
 */

const { tax, products } = API_ENDPOINTS;

/** Peel the `ResponseUtil` envelope the shared client leaves intact for tax. */
function unwrap<T>(root: unknown): T {
  return (
    root && typeof root === "object" && "data" in root
      ? (root as { data: T }).data
      : root
  ) as T;
}

export const taxService = {
  // ── Store-wide setting ──────────────────────────────────────────────
  getSetting: async () => unwrap<TaxSetting>(await api.get(tax.setting)),

  updateSetting: async (data: TaxSettingInput) =>
    unwrap<TaxSetting>(await api.put(tax.setting, data)),

  // ── Product tax rules ───────────────────────────────────────────────
  getRules: async () => unwrap<TaxRule[]>(await api.get(tax.rules)),

  createRule: async (data: TaxRuleInput) =>
    unwrap<TaxRule>(await api.post(tax.rules, data)),

  updateRule: async (id: string, data: TaxRuleUpdateInput) =>
    unwrap<TaxRule>(await api.patch(tax.rule(id), data)),

  deleteRule: async (id: string) =>
    unwrap<{ message: string }>(await api.delete(tax.rule(id))),

  // ── Part tax rules ──────────────────────────────────────────────────
  getPartRules: async () => unwrap<PartTaxRule[]>(await api.get(tax.partRules)),

  createPartRule: async (data: PartTaxRuleInput) =>
    unwrap<PartTaxRule>(await api.post(tax.partRules, data)),

  updatePartRule: async (id: string, data: TaxRuleUpdateInput) =>
    unwrap<PartTaxRule>(await api.patch(tax.partRule(id), data)),

  deletePartRule: async (id: string) =>
    unwrap<{ message: string }>(await api.delete(tax.partRule(id))),

  // ── Taxonomy for scope selects ──────────────────────────────────────
  // These endpoints live in lib (`API_ENDPOINTS`), so calling them here keeps
  // the feature-boundary rule intact — no import from features/products.
  getCategories: async () =>
    unwrap<TaxonomyOption[]>(await api.get(products.categories)),

  getBrands: async () => unwrap<TaxonomyOption[]>(await api.get(products.brands)),

  getPartTypes: async () =>
    unwrap<TaxonomyOption[]>(await api.get(products.parts.types)),

  // ── Product search (exact-product scope) ────────────────────────────
  // Powers the "specific product" tax-rule scope. The list endpoint uses the
  // paginated `{ data, meta }` envelope (NOT the ResponseUtil one), so we read
  // it raw and map to the scope-option shape. The option `id` is the product's
  // DB UUID — exactly what `POST /tax/rules { productId }` expects (the backend
  // resolves it via `product.findUnique({ where: { id } })`), NOT the human
  // `productId`/SKU. Active products only; the catalog can be large.
  searchProducts: async (query: string): Promise<TaxItemOption[]> => {
    // Products list keeps `meta` as a top-level sibling of `data`, so the shared
    // client's unwrap would drop it — read raw and pull `data` ourselves.
    const res = await api.get<ProductSearchEnvelope>(products.list, {
      params: { q: query || undefined, limit: 20, page: 1, isActive: "true" },
      raw: true,
    });
    return (res?.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  },

  // ── Part search (exact-part scope) ──────────────────────────────────
  // Mirrors searchProducts for the part-rule form. The parts list nests
  // `{ data, meta }` INSIDE the envelope's data key, so the shared client's
  // unwrap already lands us on `{ data: Part[], meta }` — no `raw` needed (unlike
  // products). Option `id` is the part's DB UUID, what `POST /tax/part-rules
  // { partId }` resolves against.
  searchParts: async (query: string): Promise<TaxItemOption[]> => {
    const res = await api.get<PartSearchEnvelope>(products.parts.list, {
      params: { q: query || undefined, limit: 20, page: 1, isActive: "true" },
    });
    return (res?.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  },
};

/** Minimal option shape the scope pickers consume (DB id + display name). */
export interface TaxItemOption {
  id: string;
  name: string;
}

/** Minimal slice of the products list envelope we need for the scope picker. */
interface ProductSearchEnvelope {
  data: Array<{ id: string; name: string }>;
}

/** Minimal slice of the (already-unwrapped) parts list payload. */
interface PartSearchEnvelope {
  data: Array<{ id: string; name: string }>;
}
