import type { NavGroup } from "@/types/nav";

/**
 * Sidebar navigation config (was `admin-nav.ts`). Pure data: `icon`/`iconActive`
 * are Iconify Solar name strings (linear = inactive, bold = active), resolved by
 * `<AppIcon>` in the sidebar (ADR-0009). String-keyed so this config crosses the
 * server→client boundary as props and stays import-free except for its type
 * (config may import `types` only).
 *
 * Hrefs are root-relative — this app is served at the root of the admin host,
 * with no `/admin` prefix.
 *
 * ## Six groups, nested where a parent has real sub-surfaces
 *
 * The rail carried flat rows in two catch-all groups ("MAIN", "ADMIN") with
 * three more surfaces queued behind it. It now reads as six groups named after
 * the job being done, and Pricing and Payments own nested children that are
 * **real routes**, not tabs. The in-page tab row on `/pricing` is gone.
 *
 * Deals sits under Pricing rather than Marketing on purpose: a deal is literally
 * the same `PriceMarkupRule` row as a markup at the same target, and starting
 * one can overwrite the other, so whoever runs a sale has to see the standing
 * markup one row away. That matters more here than at Blessing — Technocrat is
 * seeded at clean base prices with no pricing rules at all, so this section is
 * the only place the store ever gets a margin.
 *
 * Gates name the group the *backend* checks, not the nearest neighbour's. That
 * fixes a live mismatch: `/pricing` was gated on `products` while every write
 * inside it needs `priceMarkup`/`partMarkup`, so a products-only admin could
 * open the screen and be refused on save.
 *
 * ## Divergences from the Blessing admin
 *
 * Same six groups, same nesting, same gates — one information architecture,
 * restyled, not a second one. Two things differ, both already-recorded identity
 * rather than drift:
 *
 * - **Sales leads the labelled groups**, where Blessing leads with Catalog.
 *   Figma `404:1729` reads this nav as a day's work queue first and a data
 *   surface second (ADR-0016), and regrouping does not change that reading.
 * - **Three rows are absent**: there is no Pre-orders route and no Coupons route
 *   in this app, and `Settings` stays out of the rail because the footer gear
 *   already owns it (ADR-0016). Marketing is therefore a group of one.
 *
 * Note: `/analytics` is intentionally not in the nav (ADR-0009) — the dashboard
 * shows the at-a-glance KPIs; the route/view stays dormant for a future deep-dive.
 *
 * The dashboard is the home route (`/`), reachable via the sidebar Logo and the
 * "Dashboard Overview" nav item below.
 */
export const navGroups: NavGroup[] = [
  {
    // No label: a heading over a single overview row says nothing twice.
    items: [
      {
        // Unrestricted: every staff/admin lands on the dashboard at `/`.
        title: "Dashboard Overview",
        href: "/",
        icon: "solar:widget-5-linear",
        iconActive: "solar:widget-5-bold",
      },
    ],
  },
  {
    label: "SALES",
    items: [
      {
        title: "Orders",
        href: "/orders",
        icon: "solar:cart-large-2-linear",
        iconActive: "solar:cart-large-2-bold",
        requiredPermissions: ["orders"],
      },
      {
        title: "Invoices",
        href: "/invoices",
        icon: "solar:bill-list-linear",
        iconActive: "solar:bill-list-bold",
        requiredPermissions: ["invoices"],
      },
      {
        // The parent carries no gate of its own: its two children answer to
        // different authorities (role vs. the `orders` group), so gating the
        // parent would hide Bank accounts from the orders staff who run it.
        // Visibility falls out of the children instead.
        title: "Payments",
        icon: "solar:wallet-money-linear",
        iconActive: "solar:wallet-money-bold",
        children: [
          {
            // Role-gated, not permission-gated: the backend
            // `/admin/transactions` and `/payments/*` mutation routes require
            // SUPER_ADMIN, not an RBAC permission group, and a page half of
            // whose data a plain admin cannot reach is worse than a clean
            // boundary (BACKEND-CONTRACT-DELTA §5.2).
            title: "Transactions",
            href: "/payments",
            icon: "solar:card-transfer-linear",
            iconActive: "solar:card-transfer-bold",
            superAdminOnly: true,
          },
          {
            title: "Bank accounts",
            href: "/payments/bank-accounts",
            icon: "solar:card-linear",
            iconActive: "solar:card-bold",
            requiredPermissions: ["orders"],
          },
        ],
      },
    ],
  },
  {
    label: "CATALOG",
    items: [
      {
        title: "Catalogues",
        href: "/catalogues",
        icon: "solar:box-linear",
        iconActive: "solar:box-bold",
        requiredPermissions: ["products"],
      },
      {
        title: "Inventories",
        href: "/inventories",
        icon: "solar:box-minimalistic-linear",
        iconActive: "solar:box-minimalistic-bold",
        requiredPermissions: ["inventory"],
      },
      {
        // Parent only — `/pricing` itself just redirects to Markup. Products vs
        // parts is a segmented toggle inside Markup (`?kind=parts`), not nav
        // weight: they are one feature over two catalogues, not two features.
        title: "Pricing",
        icon: "solar:tag-price-linear",
        iconActive: "solar:tag-price-bold",
        children: [
          {
            title: "Markup",
            href: "/pricing/markup",
            icon: "solar:graph-up-linear",
            iconActive: "solar:graph-up-bold",
            requiredPermissions: ["priceMarkup", "partMarkup"],
          },
          {
            title: "Deals",
            href: "/pricing/deals",
            icon: "solar:sale-linear",
            iconActive: "solar:sale-bold",
            requiredPermissions: ["priceMarkup", "partMarkup"],
          },
          {
            // One named permission, not a group: `tax:manage` is the exact gate
            // the backend applies to every tax write, and it is what the Tax
            // view itself already checks.
            title: "Tax",
            href: "/pricing/tax",
            icon: "solar:calculator-linear",
            iconActive: "solar:calculator-bold",
            requiredPermission: "tax:manage",
          },
        ],
      },
    ],
  },
  {
    label: "CUSTOMERS",
    items: [
      {
        title: "Customers",
        href: "/customers",
        icon: "solar:users-group-rounded-linear",
        iconActive: "solar:users-group-rounded-bold",
        requiredPermissions: ["customers"],
      },
      {
        // No requiredPermissions on purpose: the backend grants chat to every
        // staff/admin role (integration guide), so there is no permission key to
        // gate on — all staff see it.
        title: "Chat",
        href: "/chat",
        icon: "solar:chat-round-linear",
        iconActive: "solar:chat-round-bold",
      },
      {
        // Same reasoning as Chat: every staff/admin role can work the WhatsApp
        // inbox (`requireStaff` on the backend routes), so there is no
        // permission key to gate on. Reassign is the only SUPER_ADMIN-gated
        // action, and that is handled inside the view.
        // The real WhatsApp mark, not a generic chat bubble — a nav row for a
        // named third-party product should show that product logo, and the
        // storefront already sets that precedent. Single-form (see BRAND_ICONS
        // in `scripts/build-icons.mjs`), so both states point at one name and
        // colour alone carries active.
        title: "WhatsApp",
        href: "/whatsapp",
        icon: "brand:whatsapp",
        iconActive: "brand:whatsapp",
      },
    ],
  },
  {
    label: "MARKETING",
    items: [
      {
        title: "Socials",
        href: "/socials",
        icon: "solar:share-linear",
        iconActive: "solar:share-bold",
        // Backend RBAC group is "promotions" (promotions:write/publish/delete),
        // not "socials" — see rbac.seed.ts. Gate on the real group so this only
        // shows for staff who can actually act on it (e.g. CONTENT_CREATOR).
        requiredPermissions: ["promotions"],
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: "solar:shield-user-linear",
        iconActive: "solar:shield-user-bold",
        requiredPermissions: ["users"],
      },
      {
        title: "Uploads",
        href: "/uploads",
        icon: "solar:cloud-upload-linear",
        iconActive: "solar:cloud-upload-bold",
        requiredPermissions: ["products"],
      },
      {
        title: "Security",
        href: "/security",
        icon: "solar:shield-keyhole-linear",
        iconActive: "solar:shield-keyhole-bold",
        requiredPermissions: ["security"],
      },
      {
        // No `Settings` row: Figma `404:1729` draws the settings affordance as
        // the footer gear instead, and `/settings` stays reachable there
        // (ADR-0016). Re-adding it here would give one route two entry points
        // in the same chrome.
        title: "Help",
        href: "/help",
        icon: "solar:question-circle-linear",
        iconActive: "solar:question-circle-bold",
      },
    ],
  },
];
