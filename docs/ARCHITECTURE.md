# Admin App Architecture

Source of truth for folder layout, import rules, and naming conventions.
Linked from the README. Read this before adding a new file.

> **Amendments.** Some rules below are amended by decisions in `docs/adr/`. Where
> they conflict, the ADR wins:
> - **ADR-0002** — a feature maps to a *backend resource*, not a sidebar item.
>   Bank Accounts is part of `orders` (the `adminCheckout` resource), and
>   Dashboard + Analytics are one `analytics` feature. ~11 features, not 13.
> - **ADR-0005** — URL search params are the default for filter/list state;
>   `store/` (Zustand) is the rare exception, omitted from most features.
> - **ADR-0006** — `src/types/api.d.ts` is generated *now* from the backend
>   OpenAPI spec (it is no longer a "future" placeholder).

## Top-level tree

```html
admin-blessingcomputers/ ├── src/ │ ├── app/ Next.js routes — thin shells only,
no business logic │ ├── features/ One folder per feature, all hierarchical, all
barreled │ ├── components/ Cross-feature shared UI │ │ ├── ui/ shadcn primitives
(don't hand-edit) │ │ ├── layouts/ Sidebar, Topbar, PageAnimationWrapper │ │ └──
shared/ Modals, atoms (Logo), other reusable bits │ ├── lib/ Shared
infrastructure — fetch client, auth, utils │ │ ├── api/ client.ts, endpoints.ts,
error.ts │ │ ├── auth/ session, jwt, permissions, logout │ │ ├── hooks/
cross-feature React hooks (use-debounce, etc.) │ │ └── utils/ cn, format,
order-utils │ ├── types/ Cross-feature TypeScript contracts │ ├── providers/
query-provider, theme-provider (root layout) │ ├── config/ nav.ts, env.ts (typed
env access) │ └── proxy.ts Next.js middleware ├── docs/ This file and others ├──
scripts/ new-feature.sh and other tooling ├── next.config.ts ├──
eslint.config.mjs ← contains the boundary rules ├── tsconfig.json └──
package.json
```

## The `app/` route layer

App Router stays thin. Pages and layouts may render JSX, but no business logic
lives here. Every page is a thin shell over a feature view.

```txt
app/
├── (auth)/                     Public auth routes
│   ├── login/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── layout.tsx              Minimal auth layout (just centers content)
├── (staff)/                    Protected staff routes
│   ├── dashboard/page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── products/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/page.tsx
│   ├── users/page.tsx
│   ├── customers/page.tsx
│   ├── analytics/page.tsx
│   ├── inventories/page.tsx
│   ├── invoices/page.tsx
│   ├── sales/page.tsx
│   ├── security/page.tsx
│   ├── settings/page.tsx
│   ├── socials/page.tsx
│   ├── checkout/bank-accounts/page.tsx
│   └── layout.tsx              Wraps Sidebar + Topbar + SessionProvider
├── api/                        Next.js route handlers (NOT business logic)
│   ├── auth/staff/refresh/route.ts
│   └── admin/products/ai-parse/route.ts
├── layout.tsx                  Root layout — providers, metadata (noindex)
├── globals.css
└── robots.ts
```

**A page file looks like this:**

```tsx
// app/(staff)/orders/page.tsx
import { OrdersListView } from "@/features/orders";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return <OrdersListView />;
}
```

That's it. No data fetching, no state, no JSX beyond the wrapper. If you find
yourself writing more than 10 lines in a page file, the logic belongs in the
feature.

## The `features/` layer

One folder per feature. Every feature has the same 8 subfolders, even if some
hold only one file. Predictability beats compactness.

```txt
features/<feature>/
├── api/                Services and React Query hooks
│   ├── <feature>.service.ts
│   └── <feature>.queries.ts
├── components/         All UI for this feature
│   ├── <feature>-list.tsx
│   ├── <feature>-detail.tsx
│   └── ...
├── constants/          Enums, status colors, dropdown options
│   └── <feature>-constants.ts
├── hooks/              Custom React hooks for this feature
│   └── use-<feature>-filters.ts
├── schemas/            Zod schemas (request validation, form validation)
│   └── <feature>.schema.ts
├── store/              Zustand stores for feature-local UI state
│   └── <feature>.store.ts
├── types/              TypeScript types specific to this feature
│   └── <feature>.ts
├── utils/              Pure utilities (formatters, transformers)
│   └── format-<feature>.ts
└── index.ts            Barrel — the ONLY public entry point
```

### Why all 8 always

You picked max separation in the architecture decisions. The benefit: any
developer can open any feature and find `store/` in the same place. The cost:
some features will have `store/` with one tiny file. That's fine.

When a folder genuinely has nothing in it (a feature with no UI state needs no
`store/`), omit it. But don't pre-emptively merge subfolders to "save space"
— if you add state later, you'll have to reorganize.

> **Amended by ADR-0005.** Omitting `store/` is the *norm*, not the exception.
> Filters, pagination, sort, and active tab live in the **URL** (`useSearchParams`),
> not Zustand — that keeps admin views deep-linkable and SSR-readable. Reserve
> `store/` for genuinely ephemeral cross-component UI state (a multi-step wizard
> draft, a command palette). The `order-filters.store.ts` example below is
> illustrative of the *mechanism*, not a recommendation to put filters in a store.

### The barrel rule

`index.ts` is the only file other code outside the feature may import from.

```ts
// features/orders/index.ts
// Re-export ONLY what the outside world needs.

// Views (page-level components)
export { OrdersListView } from "./components/orders-list-view";
export { OrderDetailView } from "./components/order-detail-view";

// Types that other features or routes need
export type { Order, OrderStatus } from "./types/order";

// Hooks that pages call directly
export { useOrders, useOrderById } from "./api/orders.queries";

// Anything not exported here is internal to the feature.
```

What goes in the barrel: anything routes or other layers need.
What stays internal: internal-only components (e.g. `OrderRow`, `StatusBadge`),
internal helpers, the underlying service functions, internal schemas.

The lint rule (see eslint.config.mjs) enforces this. Importing
`@/features/orders/components/order-row` from outside `features/orders/` will
fail the build.

## The `lib/` layer — shared infrastructure

This is for things that aren't tied to a single feature but also aren't UI.

```txt
lib/
├── api/
│   ├── client.ts       The api.{get,post,patch,put,delete} fetch wrapper
│   ├── endpoints.ts    The API_ENDPOINTS map (was api-config.ts)
│   └── error.ts        ApiError class
├── auth/
│   ├── get-server-session.ts
│   ├── jwt-helper.ts
│   ├── logout-action.ts
│   └── permissions.ts  filterNavByPermissions, hasPermission helpers
├── hooks/
│   └── use-debounce.ts (and other generic hooks used by 2+ features)
└── utils/
    ├── cn.ts           (was lib/utils.ts — Tailwind class merger)
    ├── format.ts       (was helpers.ts — formatPrice, formatDate)
    ├── order-utils.ts  Only here if shared by 2+ features
    └── product-image-cache.ts
```

Rule of thumb: **a thing lives in `lib/` only if it's needed by at least two
features OR by middleware/route handlers OR by another lib module.** Anything
used by exactly one feature lives inside that feature, not here.

## The `types/` layer

Reserved for cross-feature contracts and (later) backend codegen output.

```txt
types/
├── api.d.ts            (FUTURE) generated from OpenAPI — don't create yet
├── session.ts          StaffSession, Permission — consumed by middleware, lib/auth, features
├── common.ts           Paginated<T>, ApiResponse<T>, generic shapes
└── index.ts            Optional re-export barrel
```

A type moves from `features/<x>/types/` to `src/types/` the moment a _second_
feature needs it. Don't pre-emptively put types here.

The folder exists from day one so that when you adopt OpenAPI codegen later,
`api.d.ts` has an obvious home and nothing else has to move.

> **Amended by ADR-0006.** Codegen is adopted *now*, not later. `api.d.ts` is
> generated from the backend OpenAPI spec via `openapi-typescript` and committed.
> Feature `types/` alias the generated **response** schemas; Zod schemas own
> **request/form inputs**.

## The `components/` layer

Cross-feature UI. Three subfolders, each with a distinct purpose.

```txt
components/
├── ui/                 shadcn primitives (Button, Card, Dialog, Input, etc.)
│                       Generated by shadcn CLI. Avoid hand-editing.
├── layouts/            Layout shells consumed by app/(staff)/layout.tsx
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   └── page-animation-wrapper.tsx
└── shared/             Everything else reusable across 2+ features
    ├── logo.tsx
    ├── confirm-modal.tsx
    ├── logout-confirm-modal.tsx
    └── emergency-unblock.tsx
```

Note `shared/` replaces the old `atoms/` folder. One file in a folder isn't a
folder. Logo is just shared.

## The `providers/` and `config/` layers

```txt
providers/              Cross-cutting React providers used by root layout
├── query-provider.tsx
├── theme-provider.tsx
└── (feature-specific providers like SessionProvider stay in features/auth)

# Session context split (don't re-merge): the staff-session React *context*
# (SessionContext + useStaffSession) lives in `lib/auth/session-context.tsx`,
# while the data-fetching *provider* (SessionProvider) lives in
# `features/auth`. Reason: presentation-gating helpers every feature uses —
# `usePermissions`, `<PermissionGate>` — must read the session, and features
# can't import other features. Keeping the context in `lib/auth` lets those
# shared helpers (also in `lib/auth`) read it without crossing a feature
# boundary. Merging the context back into the feature provider would force
# lib→features imports and break the boundary lint.

config/
├── nav.ts              Sidebar navigation config (was admin-nav.ts)
└── env.ts              Typed env access — recommended addition
```

## Import rules (enforced by lint)

The boundary lint rule (`eslint-plugin-boundaries`) enforces these.
"Can import" means "is allowed to import from."

| Layer           | Can import from                                                                           |
| --------------- | ----------------------------------------------------------------------------------------- |
| `app/`          | `features/*` (barrel only), `components/*`, `lib/*`, `types/*`, `providers/*`, `config/*` |
| `features/<x>/` | `components/*`, `lib/*`, `types/*`, `config/*` — **never** `features/<y>/`                |
| `components/`   | `lib/*`, `types/*` — never `features/*`, never `app/*`                                    |
| `lib/`          | `types/*` only — must stay framework- and feature-agnostic                                |
| `providers/`    | `lib/*`, `types/*`                                                                        |
| `types/`        | nothing — pure type definitions                                                           |
| `config/`       | `types/*` only                                                                            |

Two corollaries worth stating explicitly:

- **Features cannot import other features.** If `analytics` needs `OrderStatus`,
  the type moves to `src/types/`. If `customers` needs `useOrders`, the hook
  was misplaced — either move it to `lib/hooks/`, or refactor the feature
  boundary itself (maybe both should be one feature).
- **The barrel is the only entry point into a feature.** Deep imports like
  `@/features/orders/components/orders-row` fail lint, even from another
  feature, even from app/.

## Naming conventions

| Thing               | Convention                       | Example                            |
| ------------------- | -------------------------------- | ---------------------------------- |
| Folders             | kebab-case                       | `bank-accounts/`                   |
| Component files     | kebab-case                       | `order-status-badge.tsx`           |
| Component exports   | PascalCase                       | `export function OrderStatusBadge` |
| Hook files          | kebab-case, `use-` prefix        | `use-order-filters.ts`             |
| Hook exports        | camelCase, `use` prefix          | `export function useOrderFilters`  |
| Service files       | kebab-case, `.service.ts` suffix | `orders.service.ts`                |
| Query hook files    | kebab-case, `.queries.ts` suffix | `orders.queries.ts`                |
| Zod schema files    | kebab-case, `.schema.ts` suffix  | `order-update.schema.ts`           |
| Zustand store files | kebab-case, `.store.ts` suffix   | `order-filters.store.ts`           |
| Type files          | kebab-case                       | `order.ts`                         |
| Constants files     | kebab-case                       | `order-status.ts`                  |
| Utility files       | kebab-case                       | `format-order.ts`                  |

No `admin-` prefix on anything in the new repo. The whole app is admin; the
prefix is noise. So:

- `admin-sidebar.tsx` → `sidebar.tsx`
- `admin-topbar.tsx` → `topbar.tsx`
- `admin-login-form.tsx` → `login-form.tsx` (inside `features/auth/components/`)
- `admin-session-provider.tsx` → `session-provider.tsx` (inside `features/auth/components/`)
- `admin-nav.ts` → `nav.ts`

The `Admin` prefix on TypeScript types follows the same logic:

- `AdminOrder` → `Order`
- `AdminBankAccount` → `BankAccount`

If a type name collides with something more generic (e.g. you also have a
customer-facing `Order` shape), prefix with the context, not with "Admin":
`StaffOrder` vs `CustomerOrder`.

## Worked example: the orders feature

The canonical, full structure with one file per subfolder:

```txt
features/orders/
├── api/
│   ├── orders.service.ts       # Raw API calls — wraps lib/api/client.ts
│   └── orders.queries.ts       # React Query hooks calling the service
├── components/
│   ├── orders-list-view.tsx    # Top-level view, exported via barrel
│   ├── order-detail-view.tsx   # Top-level view, exported via barrel
│   ├── order-row.tsx           # Internal — not in barrel
│   ├── order-status-badge.tsx  # Internal
│   ├── payment-confirm-modal.tsx
│   └── order-filters-bar.tsx
├── constants/
│   └── order-status.ts         # Status enum, status→color map, status→label map
├── hooks/
│   └── use-order-filters.ts    # Wraps the store + URL state sync
├── schemas/
│   ├── update-status.schema.ts # Zod schema for the status-update form
│   └── reject-payment.schema.ts
├── store/
│   └── order-filters.store.ts  # Zustand: filter UI state (date range, status)
├── types/
│   └── order.ts                # Order, OrderListParams, OrderStatusValue
├── utils/
│   └── format-order.ts         # Display formatters
└── index.ts                    # Public API — see below
```

### Example: `features/orders/index.ts`

```ts
// Views — consumed by app/(staff)/orders/page.tsx and [id]/page.tsx
export { OrdersListView } from "./components/orders-list-view";
export { OrderDetailView } from "./components/order-detail-view";

// Types — consumed cross-app where needed (only if truly cross-feature;
// otherwise move to src/types/order.ts and re-export from there)
export type { Order, OrderStatus, OrderListParams } from "./types/order";

// Query hooks — pages call these
export { useOrders, useOrderById } from "./api/orders.queries";

// Anything else is internal to the feature.
```

### Example: `features/orders/api/orders.service.ts`

```ts
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Order, OrderListParams } from "../types/order";

// The client unwraps the response envelope (ADR-0007): api.get<T>() returns the
// inner payload as T directly — no `response.data`, no `{ success, data }`.
export const ordersService = {
  list: (params?: OrderListParams) =>
    api.get<{ orders: Order[]; total: number }>(
      API_ENDPOINTS.adminCheckout.orders.base,
      { params },
    ),

  getById: (id: string) =>
    api.get<Order>(API_ENDPOINTS.adminCheckout.orders.id(id)),
};
```

### Example: `features/orders/api/orders.queries.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { ordersService } from "./orders.service";
import type { OrderListParams } from "../types/order";

export const orderKeys = {
  all: ["orders"] as const,
  list: (params: OrderListParams) =>
    [...orderKeys.all, "list", params] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersService.list(params),
  });
}

export function useOrderById(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersService.getById(id),
    enabled: Boolean(id),
  });
}
```

### Example: `features/orders/store/order-filters.store.ts`

```ts
import { create } from "zustand";
import type { OrderStatus } from "../types/order";

interface OrderFiltersState {
  status: OrderStatus | "all";
  dateFrom: string | null;
  dateTo: string | null;
  setStatus: (status: OrderStatus | "all") => void;
  setDateRange: (from: string | null, to: string | null) => void;
  reset: () => void;
}

export const useOrderFiltersStore = create<OrderFiltersState>((set) => ({
  status: "all",
  dateFrom: null,
  dateTo: null,
  setStatus: (status) => set({ status }),
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  reset: () => set({ status: "all", dateFrom: null, dateTo: null }),
}));
```

## Old → New mapping

For Phase 5 of the migration. Use this as a translation table when moving each
feature over.

| Old location                                            | New location                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/app/admin/(staff)/orders/page.tsx`                 | `src/app/(staff)/orders/page.tsx`                                                         |
| `src/app/admin/(staff)/orders/[id]/page.tsx`            | `src/app/(staff)/orders/[id]/page.tsx`                                                    |
| `src/features/admin/orders/orders-list.tsx` and similar | `src/features/orders/components/*.tsx`                                                    |
| `src/lib/api/services/admin-checkout.service.ts`        | `src/features/orders/api/orders.service.ts` (ADR-0002: bank-accounts stay *inside* `orders` — same `adminCheckout` resource — at route `/checkout/bank-accounts`, **not** a separate feature) |
| `src/hooks/queries/use-admin-checkout.ts`               | `src/features/orders/api/orders.queries.ts` (split)                                       |
| `src/components/admin-login-form.tsx`                   | `src/features/auth/components/login-form.tsx`                                             |
| `src/components/providers/admin-session-provider.tsx`   | `src/features/auth/components/session-provider.tsx`                                       |
| `src/app/admin/login/adminLoginAction.ts`               | `src/features/auth/api/login-action.ts`                                                   |
| `src/components/layouts/admin-sidebar.tsx`              | `src/components/layouts/sidebar.tsx`                                                      |
| `src/components/layouts/admin-topbar.tsx`               | `src/components/layouts/topbar.tsx`                                                       |
| `src/config/admin-nav.ts`                               | `src/config/nav.ts`                                                                       |
| `src/services/api/api.ts` (the fetch client)            | `src/lib/api/client.ts`                                                                   |
| `src/config/api-config.ts`                              | `src/lib/api/endpoints.ts`                                                                |
| `src/lib/auth/get-server-session.ts`                    | unchanged path                                                                            |
| `src/lib/auth/jwt-helper.ts`                            | unchanged path                                                                            |
| `src/lib/auth/logout-action.ts`                         | unchanged path                                                                            |
| `src/lib/permissions.ts`                                | `src/lib/auth/permissions.ts`                                                             |
| `src/lib/utils.ts`                                      | `src/lib/utils/cn.ts`                                                                     |
| `src/helpers/helpers.ts`                                | `src/lib/utils/format.ts`                                                                 |
| `src/lib/utils/order-utils.ts`                          | unchanged path if shared by 2+ features, else into the feature                            |
| `src/components/atoms/logo.tsx`                         | `src/components/shared/logo.tsx`                                                          |
| `src/components/modals/confirm-modal.tsx`               | `src/components/shared/confirm-modal.tsx`                                                 |

## When to add a new feature

```bash
./scripts/new-feature.sh <feature-name>
```

This scaffolds the 8 subfolders with stub files. Edit the stubs.

## When to break the rules

These rules optimize for a team of 2–10 developers maintaining a growing
codebase over 12–24 months. They're not laws.

- If a feature has obvious sub-features (e.g. products has products + brands +
  categories), still keep them inside one feature folder. Sub-features go in
  subfolders inside `components/`: `features/products/components/brand/...`,
  `features/products/components/category/...`. Don't split into separate top-level
  features — that's exactly the cross-feature import trap.
- If the lint rule fires and the right fix is genuinely "this should be in
  lib/", do that. If the right fix is "merge these two features," do that.
  If the right fix is "I need to make an exception," resist — exceptions
  compound and the rule loses its meaning. Prefer refactoring the structure
  over adding eslint-disable comments.
