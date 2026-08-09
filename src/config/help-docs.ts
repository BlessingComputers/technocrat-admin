/**
 * Help-center document registry. Pure data (config may import only types), so it
 * can be injected into the Topbar (a component, which may not import config) via
 * props the same way `nav.ts` is injected into the sidebar. Drives both the
 * header Help dropdown and the `/help` index. Add an entry here + a route/view to
 * publish a new doc.
 *
 * Content model (ADR-0011): every doc carries `keywords` (search synonyms),
 * `type` (which guide pattern it uses), optional `requiredPermissions`
 * (permission-aware relevance — presentation only, not access control), and an
 * `updated` date. Categories mirror the sidebar nav groups; their display labels
 * and icons live in `HELP_CATEGORIES` so the registry stays keyed on ids.
 */
import type { HelpCategoryId, HelpDoc, HelpDocType } from "@/types/help";

export type { HelpDoc, HelpCategoryId, HelpDocType };

/**
 * Hub categories, in display order. Mirrors the nav groups (ADR-0011) so staff
 * find help under the same headings they navigate by. `icon` is the giant faded
 * background glyph + tile icon; `description` is the category tile subline.
 */
export interface HelpCategory {
  id: HelpCategoryId;
  label: string;
  description: string;
  /** Iconify Solar name (linear) — resolved by <AppIcon>. */
  icon: string;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "catalogue",
    label: "Catalogue & Pricing",
    description: "Products, parts, taxonomy, and the rules that price them.",
    icon: "solar:box-linear",
  },
  {
    id: "orders",
    label: "Orders & Customers",
    description: "Working orders end to end and looking after customers.",
    icon: "solar:cart-large-2-linear",
  },
  {
    id: "invoicing",
    label: "Invoicing",
    description: "Raising manual invoices and reviewing what comes in.",
    icon: "solar:bill-list-linear",
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Keeping stock counts accurate across the catalogue.",
    icon: "solar:box-minimalistic-linear",
  },
  {
    id: "communication",
    label: "Communication",
    description: "Customer chat and the shop's social channels.",
    icon: "solar:chat-round-linear",
  },
  {
    id: "administration",
    label: "Administration",
    description: "People, access, security, and how the shop is set up.",
    icon: "solar:shield-user-linear",
  },
];

const CATEGORY_BY_ID = new Map(HELP_CATEGORIES.map((c) => [c.id, c]));

/** Resolve a category id to its display record (label/icon/description). */
export const helpCategory = (id: HelpCategoryId): HelpCategory =>
  CATEGORY_BY_ID.get(id) ?? HELP_CATEGORIES[HELP_CATEGORIES.length - 1];

/** At-a-glance label for a doc's guide pattern (drives the type badge). */
export const HELP_TYPE_LABEL: Record<HelpDocType, string> = {
  walkthrough: "Walkthrough",
  standards: "Standards",
  reference: "Reference",
};

export const helpDocs: HelpDoc[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    description:
      "A quick orientation to the admin: the workspace, the sidebar, roles & permissions, search, and switching theme.",
    icon: "solar:compass-linear",
    category: "administration",
    type: "reference",
    keywords: [
      "orientation",
      "onboarding",
      "workspace",
      "sidebar",
      "navigation",
      "menu",
      "drawer",
      "roles",
      "permissions",
      "access",
      "theme",
      "dark mode",
      "light mode",
      "search",
      "help",
      "first time",
      "new staff",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "managing-products",
    title: "Managing Products",
    description:
      "Create products, add photos and pricing, publish them to the storefront, and keep the catalogue up to date.",
    icon: "solar:box-linear",
    category: "catalogue",
    type: "walkthrough",
    requiredPermissions: ["products"],
    keywords: [
      "product",
      "products",
      "catalogue",
      "catalog",
      "listing",
      "add product",
      "new product",
      "create product",
      "edit product",
      "laptop",
      "monitor",
      "printer",
      "price",
      "pricing",
      "stock",
      "photos",
      "images",
      "publish",
      "active",
      "hidden",
      "featured",
      "sku",
      "part number",
      "ai fill",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "bulk-product-upload",
    title: "Bulk & AI Product Upload",
    description:
      "Paste a supplier list, let AI structure it into rows, review and price them, then create many products in one go.",
    icon: "solar:magic-stick-3-linear",
    category: "catalogue",
    type: "walkthrough",
    requiredPermissions: ["products"],
    keywords: [
      "bulk",
      "bulk upload",
      "mass upload",
      "import",
      "ai",
      "smart paste",
      "paste",
      "supplier list",
      "parse",
      "many products",
      "batch",
      "markup",
      "csv",
      "spreadsheet",
      "draft",
      "review",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "categories-brands-taxonomy",
    title: "Categories & Brands",
    description:
      "Build the category tree, manage subcategories and brands, and keep the catalogue organised for browsing and pricing.",
    icon: "solar:folder-linear",
    category: "catalogue",
    type: "walkthrough",
    requiredPermissions: ["products"],
    keywords: [
      "category",
      "categories",
      "subcategory",
      "subcategories",
      "brand",
      "brands",
      "manufacturer",
      "make",
      "taxonomy",
      "tree",
      "organise",
      "organize",
      "classification",
      "filter",
      "browse",
      "folder",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "pricing-markup-rules",
    title: "Pricing & Markup Rules",
    description:
      "Price products in bulk with percentage rules scoped by category and brand — preview the change, apply it, and reset it.",
    icon: "solar:tag-price-linear",
    category: "catalogue",
    type: "walkthrough",
    requiredPermissions: ["products"],
    keywords: [
      "pricing",
      "price",
      "markup",
      "margin",
      "discount",
      "percentage",
      "rule",
      "rules",
      "reprice",
      "bulk pricing",
      "cost",
      "profit",
      "preview",
      "apply",
      "reset",
      "category",
      "brand",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "processing-orders",
    title: "Processing Orders",
    description:
      "Work orders through the queue — verify bank-transfer payments, fulfil and dispatch, and cancel when needed. Covers both gateway and bank-transfer orders.",
    icon: "solar:cart-large-2-linear",
    category: "orders",
    type: "walkthrough",
    requiredPermissions: ["orders"],
    keywords: [
      "order",
      "orders",
      "queue",
      "fulfil",
      "fulfill",
      "fulfilment",
      "fulfillment",
      "dispatch",
      "delivery",
      "rider",
      "pickup",
      "pick-up",
      "payment",
      "verify",
      "proof",
      "receipt",
      "bank transfer",
      "gateway",
      "confirm payment",
      "reject",
      "cancel order",
      "status",
      "processing",
      "delivered",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "managing-customers",
    title: "Managing Customers",
    description:
      "Find any customer, read their profile, and see their orders, invoices, spend, and loyalty — an inspect-only directory of storefront accounts.",
    icon: "solar:users-group-rounded-linear",
    category: "orders",
    type: "walkthrough",
    requiredPermissions: ["customers"],
    keywords: [
      "customer",
      "customers",
      "account",
      "accounts",
      "directory",
      "profile",
      "contact",
      "email",
      "phone",
      "loyalty",
      "tier",
      "points",
      "bronze",
      "silver",
      "jewel",
      "platinum",
      "lifetime value",
      "spend",
      "history",
      "search",
      "verified",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "creating-manual-invoices",
    title: "Creating Manual Invoices",
    description:
      "Write up an offline sale where the money was already collected — customer, items, charges, and how they paid.",
    icon: "solar:bill-check-linear",
    category: "invoicing",
    type: "walkthrough",
    requiredPermissions: ["invoices"],
    keywords: [
      "invoice",
      "invoices",
      "manual invoice",
      "manual",
      "offline",
      "offline sale",
      "walk in",
      "walk-in",
      "phone order",
      "whatsapp",
      "receipt",
      "create invoice",
      "raise invoice",
      "new invoice",
      "line item",
      "add item",
      "unit price",
      "tax",
      "vat",
      "shipping",
      "payment method",
      "cash",
      "pos",
      "cheque",
      "bank transfer",
      "payment reference",
      "sales channel",
      "issued by",
      "cancel invoice",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "reviewing-invoices",
    title: "Reviewing Invoices",
    description:
      "Work the pending-review queue — read an invoice, confirm availability, record the customer's decision, and process refunds on rejected ones.",
    icon: "solar:bill-list-linear",
    category: "invoicing",
    type: "walkthrough",
    requiredPermissions: ["invoices"],
    keywords: [
      "invoice",
      "invoices",
      "review",
      "pending review",
      "approve",
      "approve invoice",
      "reject",
      "rejected",
      "partially approved",
      "availability",
      "available",
      "unavailable",
      "out of stock",
      "customer decision",
      "agreed to wait",
      "requests refund",
      "refund",
      "refunds",
      "process refund",
      "outsourced",
      "in house",
      "inhouse",
      "representative",
      "reassign",
      "re assign",
      "status",
      "timeline",
      "queue",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "bank-accounts",
    title: "Bank Accounts",
    description:
      "Set up the company accounts customers pay into by bank transfer — adding them, choosing the primary one, and retiring old ones safely.",
    icon: "solar:card-linear",
    category: "administration",
    type: "walkthrough",
    requiredPermissions: ["orders"],
    keywords: [
      "bank",
      "bank account",
      "bank accounts",
      "account number",
      "account name",
      "bank code",
      "sort code",
      "payment details",
      "bank transfer",
      "transfer",
      "checkout",
      "primary",
      "make primary",
      "active",
      "inactive",
      "deactivate",
      "payment",
      "collection account",
    ],
    updated: "2026-07-24",
  },
  {
    slug: "uploading-parts",
    title: "Uploading & Managing Parts",
    description:
      "How to add parts to products, bulk upload with AI, set pricing, and manage part types.",
    icon: "solar:cpu-bolt-linear",
    category: "catalogue",
    type: "walkthrough",
    requiredPermissions: ["products"],
    keywords: [
      "parts",
      "components",
      "charger",
      "keyboard",
      "screen",
      "battery",
      "bulk upload",
      "smart paste",
      "ai",
      "part number",
      "part type",
      "sku",
      "markup",
      "pricing",
      "stock",
      "photos",
      "attach",
    ],
    updated: "2026-07-24",
  },
];

export const HELP_BASE = "/help";
export const helpDocHref = (slug: string) => `${HELP_BASE}/${slug}`;

/**
 * Support-footer target for `DocShell`'s "Still stuck?" block — kept in config
 * so it can evolve (contact person, and later a link into internal Chat) without
 * touching every doc (ADR-0011).
 */
export const HELP_SUPPORT = {
  title: "Still stuck?",
  body: "Reach out to your system administrator or the Technocrat tech team for a hand.",
  /** Optional in-app destination (e.g. internal Chat) once wired. */
  href: undefined as string | undefined,
  cta: undefined as string | undefined,
};
