// Types for the dollar pricing (FX) slice, ask 45.
//
// Hand-written: the spec types every /pricing/fx response as `content?: never`.
// Shapes come from the backend's `fx.service.ts` (Blessing dev 9978f21). Prisma
// Decimal columns arrive as strings, so rate fields are `number | string`.

/** Which new items a standing link starts linked. */
export type FxAppliesTo = "ALL" | "PRODUCTS" | "PARTS";

export interface FxNamedRef {
  id: string;
  /** Null when the category or brand was deleted after the link was saved. */
  name: string | null;
  slug: string | null;
}

/** `GET /pricing/fx/standing-links` row. */
export interface FxStandingLink {
  id: string;
  appliesTo: FxAppliesTo;
  categories: FxNamedRef[];
  brands: FxNamedRef[];
  createdByStaffId: string | null;
  createdAt: string;
}

/** `POST /pricing/fx/link` body, scope form only (no per-item ids here). */
export interface FxLinkInput {
  categoryIds?: string[];
  brandIds?: string[];
  linked: boolean;
  /** Also save the scope, so items created later in it start linked. */
  standing?: boolean;
  appliesTo?: FxAppliesTo;
}

/** `POST /pricing/fx/link` response: how many items changed state. */
export interface FxLinkResult {
  products: number;
  parts: number;
  linked: boolean;
  standingLink: { id: string } | null;
}

export type FxLogStatus =
  | "QUEUED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "APPLYING"
  | "APPLIED"
  | "INITIALIZED"
  | "SKIPPED"
  | "HELD"
  | "REJECTED"
  | "SUPERSEDED"
  | "FAILED"
  | "RECORDED"
  | (string & {});

/** The loose JSON the backend keeps per decision. Only the keys we show. */
export interface FxLogSummary {
  trigger?: string;
  reason?: string;
  /** `RECORDED` only: what the rules would have done with auto-update on. */
  wouldDo?: string;
  officialRate?: number;
  gapPercent?: number;
  [key: string]: unknown;
}

/** `GET /pricing/fx/history` row. */
export interface FxLog {
  id: string;
  triggeredByStaffId: string | null;
  rateUsdNgn: number | string;
  previousRateUsdNgn: number | string | null;
  rateChangePercent: number | string | null;
  productsAffected: number;
  variantsUpdated: number;
  summary: FxLogSummary | null;
  status: FxLogStatus;
  errorMessage: string | null;
  triggeredAt: string;
}

export interface FxHistoryPage {
  data: FxLog[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface FxTaxonomyOption {
  id: string;
  name: string;
}

/** `GET /products/categories` node: roots carry their `children`. */
export interface FxCategoryNode extends FxTaxonomyOption {
  children?: FxCategoryNode[];
}

/** Linked vs all active items, for one catalogue. */
export interface FxCoverageCount {
  linked: number;
  total: number;
}

export interface FxCoverage {
  products: FxCoverageCount;
  parts: FxCoverageCount;
}
