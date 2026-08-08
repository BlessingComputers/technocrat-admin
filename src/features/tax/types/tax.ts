// Types for the tax feature: the store-wide setting plus scoped product/part
// tax rules.
//
// TODO(codegen, ADR-0006): alias these response shapes to the generated OpenAPI
// schemas once the tax paths stabilise; Zod owns the request/form inputs (see
// schemas/). Sourced from the backend tax module.
//
// Wire quirks the backend hands us (verified against source):
//  - Scoped-rule `rate` arrives as a Prisma Decimal STRING (e.g. "7.50") because
//    the controllers return the raw record without coercion. Coerce with
//    rateToNumber() before display/logic (utils/tax-format.ts).
//  - The store setting's `rate` IS a number (its service coerces server-side).
//  - Path params take the rule's DB `id` (UUID), never the human `TAX-XXXXXXXX`.

/** Rate bounds shared by the global setting and every scoped rule. Percent, ≤2dp. */
export const TAX_RATE_MIN = 0;
export const TAX_RATE_MAX = 100;

/** How a resolved rate was chosen — mirrors the backend `TaxSource` union. */
export type TaxSource =
  | "product"
  | "category+brand"
  | "category"
  | "brand"
  | "part"
  | "partType"
  | "global"
  | "disabled";

/** Store-wide tax setting (`GET/PUT /tax`) — the master switch + fallback rate. */
export interface TaxSetting {
  enabled: boolean;
  rate: number; // percent, already coerced server-side
  updatedAt: string | null;
}

export interface TaxSettingInput {
  enabled: boolean;
  rate: number;
}

/** Minimal category / brand / part-type shape used to populate scope selects. */
export interface TaxonomyOption {
  id: string;
  name: string;
  slug: string;
}

/** Staff creator, present on list/detail responses (not on create/update). */
export interface TaxRuleCreator {
  id: string;
  firstName: string;
  lastName: string;
}

/** A scoped product tax rule (`GET /tax/rules`). */
export interface TaxRule {
  id: string; // DB UUID — the value path params expect
  ruleId: string; // human reference, e.g. TAX-XXXXXXXX
  categoryId: string | null;
  brandId: string | null;
  productId: string | null;
  rate: number | string; // Decimal string on the wire — coerce before display
  isActive: boolean;
  notes: string | null;
  createdByStaffId: string;
  category: TaxonomyOption | null;
  brand: TaxonomyOption | null;
  product: TaxonomyOption | null;
  createdBy: TaxRuleCreator | null;
  createdAt: string;
  updatedAt: string;
}

/** A scoped part tax rule (`GET /tax/part-rules`). Adds part-type / part scope. */
export interface PartTaxRule {
  id: string;
  ruleId: string;
  categoryId: string | null;
  brandId: string | null;
  partTypeId: string | null;
  partId: string | null;
  rate: number | string;
  isActive: boolean;
  notes: string | null;
  createdByStaffId: string;
  category: TaxonomyOption | null;
  brand: TaxonomyOption | null;
  // The backend names the part-type relation `partTypeRef` (the scalar is
  // `partTypeId`), so keep the wire name here.
  partTypeRef: TaxonomyOption | null;
  part: TaxonomyOption | null;
  createdBy: TaxRuleCreator | null;
  createdAt: string;
  updatedAt: string;
}

/** Either scoped rule — the shared display/CRUD paths accept both. */
export type AnyTaxRule = TaxRule | PartTaxRule;

/** Create payload for a product tax rule (≥1 of category/brand required). */
export interface TaxRuleInput {
  categoryId?: string;
  brandId?: string;
  productId?: string;
  rate: number;
  notes?: string;
  isActive?: boolean;
}

/** Create payload for a part tax rule (≥1 of category/brand/partType required). */
export interface PartTaxRuleInput {
  categoryId?: string;
  brandId?: string;
  partTypeId?: string;
  partId?: string;
  rate: number;
  notes?: string;
  isActive?: boolean;
}

/**
 * Partial update — scope is fixed once a rule exists, so only these three
 * fields change. Shared by product and part rules (identical backend DTO).
 */
export interface TaxRuleUpdateInput {
  rate?: number;
  notes?: string;
  isActive?: boolean;
}
