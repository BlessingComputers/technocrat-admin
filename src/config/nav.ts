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
 * Note: `/analytics` is intentionally not in the nav (ADR-0009) — the dashboard
 * shows the at-a-glance KPIs; the route/view stays dormant for a future deep-dive.
 *
 * The dashboard is the home route (`/`), reachable via the sidebar Logo and the
 * "Dashboard Overview" nav item below.
 *
 * Grouping, ordering and labels follow Figma `404:1729` (ADR-0016), which is why
 * MAIN leads with Orders/Customers rather than the catalogue: the frame reads the
 * nav as a day's work queue first and a data surface second. Two deliberate
 * divergences from that frame, both recorded in the ADR — `Settings` is dropped
 * from ADMIN because the footer gear already owns it, and `WhatsApp` is kept
 * despite not being drawn, because the slice ships and the nav is its only entry
 * point.
 */
export const navGroups: NavGroup[] = [
  {
    label: "MAIN",
    items: [
      {
        // Unrestricted: every staff/admin lands on the dashboard at `/`.
        title: "Dashboard Overview",
        href: "/",
        icon: "solar:widget-5-linear",
        iconActive: "solar:widget-5-bold",
      },
      {
        title: "Orders",
        href: "/orders",
        icon: "solar:cart-large-2-linear",
        iconActive: "solar:cart-large-2-bold",
        requiredPermissions: ["orders"],
      },
      {
        title: "Customers",
        href: "/customers",
        icon: "solar:users-group-rounded-linear",
        iconActive: "solar:users-group-rounded-bold",
        requiredPermissions: ["customers"],
      },
      {
        title: "Catalogues",
        href: "/catalogues",
        icon: "solar:box-linear",
        iconActive: "solar:box-bold",
        requiredPermissions: ["products"],
      },
      {
        // Markup rules for products + parts, promoted out of the catalogue into
        // a standalone route with Products/Parts tabs. Gated on `products` like
        // the catalogue, since pricing is a product-write concern.
        title: "Pricing",
        href: "/pricing",
        icon: "solar:tag-price-linear",
        iconActive: "solar:tag-price-bold",
        requiredPermissions: ["products"],
      },
      {
        title: "Invoices",
        href: "/invoices",
        icon: "solar:bill-list-linear",
        iconActive: "solar:bill-list-bold",
        requiredPermissions: ["invoices"],
      },
      {
        title: "Inventories",
        href: "/inventories",
        icon: "solar:box-minimalistic-linear",
        iconActive: "solar:box-minimalistic-bold",
        requiredPermissions: ["inventory"],
      },
      {
        // No requiredPermissions on purpose: the backend grants chat to every
        // staff/admin role (integration guide), so there's no permission key to
        // gate on — all staff see it.
        title: "Chat",
        href: "/chat",
        icon: "solar:chat-round-linear",
        iconActive: "solar:chat-round-bold",
      },
      {
        // Same reasoning as Chat: every staff/admin role can work the WhatsApp
        // inbox (`requireStaff` on the backend routes), so there's no permission
        // key to gate on. Reassign is the only SUPER_ADMIN-gated action, and
        // that's handled inside the view.
        // The real WhatsApp mark, not a generic chat bubble — a nav row for a
        // named third-party product should show that product's logo, and the
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
    label: "ADMIN",
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
        href: "/users/uploads",
        icon: "solar:cloud-upload-linear",
        iconActive: "solar:cloud-upload-bold",
        requiredPermissions: ["products"],
      },
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
      {
        title: "Security",
        href: "/security",
        icon: "solar:shield-keyhole-linear",
        iconActive: "solar:shield-keyhole-bold",
        requiredPermissions: ["security"],
      },
      {
        title: "Bank accounts",
        href: "/checkout/bank-accounts",
        icon: "solar:card-linear",
        iconActive: "solar:card-bold",
        requiredPermissions: ["orders"],
      },
      {
        // Role-gated, not permission-gated: the backend's `/admin/transactions`
        // and `/payments/*` mutation routes require SUPER_ADMIN, not an RBAC
        // permission group, and a page half of whose data a plain admin can't
        // reach is worse than a clean boundary (BACKEND-CONTRACT-DELTA §5.2).
        title: "Payments",
        href: "/payments",
        icon: "solar:wallet-money-linear",
        iconActive: "solar:wallet-money-bold",
        superAdminOnly: true,
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
