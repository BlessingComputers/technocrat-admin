/** A help-center document entry. Lives in `types/` so both `config/help-docs`
 *  and the Topbar (a component, which may not import config) can share it. */
export interface HelpDoc {
  slug: string;
  /** One-line summary for the index card + dropdown. */
  description: string;
  title: string;
  /** Iconify Solar name (linear) — resolved by <AppIcon>. */
  icon: string;
  /** Which hub category this doc belongs to (mirrors the nav groups). Grouping +
   *  the category chip both read from `HELP_CATEGORIES` (see `config/help-docs`). */
  category: HelpCategoryId;
  /**
   * Search synonyms so a doc surfaces under the words staff actually type
   * (e.g. "SKU", "stock", "refund"). Matched by the hub's client-side search
   * alongside `title`, `description`, and `category` (ADR-0011).
   */
  keywords: string[];
  /**
   * Which guide pattern the doc uses — drives an at-a-glance badge and lets the
   * guide-type ADRs (0012 walkthroughs / 0013 standards) filter the registry.
   */
  type: HelpDocType;
  /**
   * RBAC group keys (same vocabulary as `nav`) required to see this doc in the
   * hub and Help dropdown. Absent/empty = everyone. This is presentation
   * *relevance*, not access control — routes stay reachable (ADR-0001/0011).
   */
  requiredPermissions?: string[];
  /** ISO date (YYYY-MM-DD) shown as "Updated <date>" so staff can trust freshness. */
  updated?: string;
}

/** Guide pattern a doc follows (ADR-0011 master coverage map). */
export type HelpDocType = "walkthrough" | "standards" | "reference";

/**
 * Hub category ids — mirror the sidebar nav groups (ADR-0011). Display labels,
 * icons, and descriptions live in `HELP_CATEGORIES` (config/help-docs) so the
 * registry stays pure data keyed on these ids.
 */
export type HelpCategoryId =
  | "catalogue"
  | "orders"
  | "invoicing"
  | "inventory"
  | "communication"
  | "administration";
