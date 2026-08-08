# AGENTS.md

Read this file in full before writing or modifying any code in this repository.
Re-read the relevant sections whenever you start a new task.

This is an admin-only Next.js app. There is no customer-facing code here.
The customer site lives in a separate repo.

---

## CRITICAL RULES (never violate)

1. **No `admin-` prefix on anything.** Files, components, types, hooks. The
   whole app is admin; the prefix is noise. Old codebase used it; this one does not.
2. **Features may NEVER import from other features.** This is lint-enforced.
   If two features need to share, the shared thing moves to `lib/`, `types/`,
   or `components/shared/`. Do not add `eslint-disable`.
3. **Features are imported via their barrel only.** `@/features/orders` is
   allowed. `@/features/orders/components/order-row` is not. Lint-enforced.
4. **Pages in `src/app/` are thin shells.** A page file should import a View
   from a feature and render it. No data fetching, no state, no business
   logic in `app/`. If a page exceeds 10 lines, the logic belongs in the
   feature.
5. **`lib/` is feature-agnostic.** Never import from `features/` inside `lib/`.
   `lib/` may only import from `types/`.
6. **`types/` is pure types.** No runtime imports. No exports of values, only
   `type` and `interface`.
7. **No `localStorage`/`sessionStorage` calls in shared code.** The fetch
   client uses them for refresh locks; other code must not. State goes in
   Zustand stores under `features/<x>/store/`.
8. **Server-only env vars (`API_BASE_URL`, `CLAUDE_API_KEY`, etc.) must NOT be
   referenced in client components.** Only `NEXT_PUBLIC_*` is safe in client code.

---

## Before writing any code

Run this checklist mentally on every task:

1. Identify which layer the change lives in: `app/`, `features/`, `lib/`,
   `components/`, `types/`, `providers/`, or `config/`.
2. If `features/`, identify which feature. If unsure, ask the user.
3. Open the relevant feature's existing files to match the established style.
4. Check `docs/ARCHITECTURE.md` for the worked example if this is the first
   time touching the feature.
5. Verify the import rules table (below) allows the imports you're planning.
6. If creating a new feature, run `./scripts/new-feature.sh <name>` first.
   Do NOT hand-create the structure.

---

## Layer responsibilities

| Layer | Contains | May import from |
| ----- | -------- | --------------- |

| `app/` | Route shells, route handlers, root layout | `features`, `components`, `lib`, `types`, `providers`, `config` |
| `features/<x>/` | Domain UI + state + API | `components`, `lib`, `types`, `config` |
| `components/` | Cross-feature shared UI (ui/, layouts/, shared/) | `lib`, `types` |
| `lib/` | Fetch client, auth, utils, generic hooks | `types` |
| `providers/` | Cross-cutting React providers (query, theme) | `lib`, `types` |
| `config/` | Static config (nav, env) | `types` |
| `types/` | Cross-feature TypeScript contracts | nothing |

**Reading the table:** "may import from" is exclusive. `lib/` may import from
`types/` but nothing else. `features/<x>/` may NEVER import from another
`features/<y>/`. If you need to violate this, the structure is wrong, not the rule.

---

## Folder structure (canonical)

```html
src/ ├── app/ │ ├── (auth)/ login, forgot-password, reset-password │ ├──
(staff)/ all authenticated routes; shared layout │ ├── api/ Next.js route
handlers │ ├── layout.tsx root layout (providers, noindex metadata) │ ├──
globals.css │ └── robots.ts ├── features/<feature
  >/ │ ├── api/
  <feature
    >.service.ts,
    <feature
      >.queries.ts │ ├── components/ all UI for this feature │ ├── constants/
      enums, status colors, dropdown options │ ├── hooks/ feature-specific React
      hooks │ ├── schemas/ zod schemas (forms + request validation) │ ├── store/
      Zustand stores (feature-local UI state) │ ├── types/ feature-specific
      TypeScript types │ ├── utils/ pure utilities (formatters, transformers) │
      └── index.ts barrel — the ONLY external entry point ├── components/ │ ├──
      ui/ shadcn primitives — do not hand-edit │ ├── layouts/ Sidebar, Topbar,
      PageAnimationWrapper │ └── shared/ Logo, ConfirmModal, etc. ├── lib/ │ ├──
      api/ client.ts, endpoints.ts, error.ts │ ├── auth/ session, jwt,
      permissions, logout │ ├── hooks/ generic hooks (use-debounce, etc.) │ └──
      utils/ cn, format, etc. ├── types/ │ ├── api.d.ts (future) codegen output
      — do not write by hand │ ├── session.ts StaffSession, Permission │ └──
      common.ts Paginated<T
        >, ApiResponse<T>
          ├── providers/ query-provider, theme-provider ├── config/ nav.ts,
          env.ts └── proxy.ts Next.js middleware</T
        ></T
      ></feature
    ></feature
  ></feature
>
```

**Always create all 8 subfolders when scaffolding a feature**, even if some
hold one file. Use `./scripts/new-feature.sh <name>`. Do NOT skip subfolders.

---

## Decision tree: where does this file go?

### "I'm adding a component."

- Is it specific to one feature? → `features/<feature>/components/`
- Is it used by 2+ features? → `components/shared/`
- Is it a layout shell (sidebar, topbar, page wrapper)? → `components/layouts/`
- Is it a shadcn primitive? → `components/ui/` (use shadcn CLI, do not hand-write)

### "I'm adding a hook."

- Does it call an API and return data? → `features/<feature>/api/<feature>.queries.ts`
  (React Query hook)
- Does it manage state for one feature? → `features/<feature>/hooks/`
- Is it generic (debounce, media query, etc.)? → `lib/hooks/`

### "I'm adding a type."

- Used only inside one feature? → `features/<feature>/types/`
- Used across 2+ features OR by middleware OR by `lib/`? → `src/types/`
- Generated from OpenAPI? → `src/types/api.d.ts` (do not edit by hand)

### "I'm adding state (Zustand store)."

- Always feature-local. → `features/<feature>/store/<feature>.store.ts`
- Never put Zustand stores in `lib/` or `src/store/`.

### "I'm adding a Zod schema."

- Form validation or request body validation for one feature → `features/<feature>/schemas/`
- API response validation (future, with codegen) → `src/types/` or generated

### "I'm adding constants (enums, colors, labels)."

- Specific to a feature? → `features/<feature>/constants/`
- Used app-wide (route names, permissions, env)? → `src/config/`

### "I'm adding a utility function."

- Specific to one feature? → `features/<feature>/utils/`
- Used by 2+ features? → `lib/utils/`

### "I'm adding an API service call."

- Always inside a feature. → `features/<feature>/api/<feature>.service.ts`
- The service file calls `api.get/post/...` from `@/lib/api/client`.
- The corresponding React Query hooks live in
  `features/<feature>/api/<feature>.queries.ts` and call the service.

### "I'm adding a route."

1. Create the route page at `src/app/(staff)/<route>/page.tsx`
2. The page imports a `View` component from the feature barrel:

   ```tsx
   import { OrdersListView } from "@/features/orders";
   export default function OrdersPage() {
     return <OrdersListView />;
   }
   ```

3. The View component lives at `features/<feature>/components/<feature>-list-view.tsx`
4. Export the View from the feature's `index.ts` barrel.

---

## File templates

### `features/<feature>/index.ts` (the barrel)

```ts
// Public API of the <feature> feature.
// Add ONLY what other layers need to consume.

// Views consumed by route pages
export { <Feature>ListView } from "./components/<feature>-list-view";
export { <Feature>DetailView } from "./components/<feature>-detail-view";

// Types — only export if cross-feature; otherwise keep internal
export type { <Feature>, <Feature>ListParams } from "./types/<feature>";

// Hooks called directly by pages
export { use<Feature>, use<Feature>ById } from "./api/<feature>.queries";
```

### `features/<feature>/api/<feature>.service.ts`

```ts
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { <Feature>, <Feature>ListParams } from "../types/<feature>";

export const <feature>Service = {
  list: async (params?: <Feature>ListParams) => {
    const response = await api.get<{ items: <Feature>[]; total: number }>(
      API_ENDPOINTS.<group>.<endpoint>,
      { params },
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<<Feature>>(
      API_ENDPOINTS.<group>.byId(id),
    );
    return response.data;
  },
};
```

### `features/<feature>/api/<feature>.queries.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { <feature>Service } from "./<feature>.service";
import type { <Feature>ListParams } from "../types/<feature>";

export const <feature>Keys = {
  all: ["<feature>"] as const,
  list: (params: <Feature>ListParams) =>
    [...<feature>Keys.all, "list", params] as const,
  detail: (id: string) => [...<feature>Keys.all, "detail", id] as const,
};

export function use<Feature>(params: <Feature>ListParams = {}) {
  return useQuery({
    queryKey: <feature>Keys.list(params),
    queryFn: () => <feature>Service.list(params),
  });
}

export function use<Feature>ById(id: string) {
  return useQuery({
    queryKey: <feature>Keys.detail(id),
    queryFn: () => <feature>Service.getById(id),
    enabled: Boolean(id),
  });
}
```

### `app/(staff)/<route>/page.tsx`

```tsx
import { <Feature>ListView } from "@/features/<feature>";

export const metadata = { title: "<Feature>" };

export default function <Feature>Page() {
  return <<Feature>ListView />;
}
```

If the page is dynamic:

```tsx
import { <Feature>DetailView } from "@/features/<feature>";

export default async function <Feature>DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <<Feature>DetailView id={id} />;
}
```

---

## Naming rules (mechanical)

| Element | Convention | Example |
| ------- | ---------- | ------- |

| Folders | kebab-case | `bank-accounts/` |
| Component files | kebab-case | `order-status-badge.tsx` |
| Component exports | PascalCase | `export function OrderStatusBadge` |
| Hook files | kebab-case with `use-` prefix | `use-order-filters.ts` |
| Hook exports | camelCase with `use` prefix | `useOrderFilters` |
| Service files | `<feature>.service.ts` | `orders.service.ts` |
| Query files | `<feature>.queries.ts` | `orders.queries.ts` |
| Schema files | `<thing>.schema.ts` | `order-update.schema.ts` |
| Store files | `<thing>.store.ts` | `order-filters.store.ts` |
| Service exports | camelCase const | `export const ordersService` |
| Store hook exports | `use<Name>Store` | `useOrderFiltersStore` |
| Type files | kebab-case | `order.ts` |
| Type exports | PascalCase | `export interface Order` |
| Constants files | kebab-case | `order-status.ts` |
| Constants exports | UPPER_SNAKE for values, PascalCase for type-like | `ORDER_STATUS`, `OrderStatus` |
| Utility files | kebab-case | `format-order.ts` |
| Utility exports | camelCase | `formatOrderTotal` |

No `Admin` prefix on types. `AdminOrder` → `Order`. `AdminBankAccount` → `BankAccount`.
If a name collides with a concept elsewhere, use the role as prefix:
`StaffOrder` / `CustomerOrder`, not `AdminOrder`.

---

## Anti-patterns — refuse to write code matching these

### Cross-feature import

```ts
// DO NOT DO THIS — features may not import from other features.
import { useOrders } from "@/features/orders"; // inside features/customers/
```

**Fix:** if both features genuinely need `useOrders`, the hook is wrongly
located. Move the underlying service to `lib/api/` or rethink the feature
boundary. Ask the user.

### Deep feature import

```ts
// DO NOT DO THIS — only barrel imports allowed.
import { OrderRow } from "@/features/orders/components/order-row";
```

**Fix:** if `OrderRow` is needed outside the feature, re-export it from
`features/orders/index.ts`. If not, it shouldn't be imported.

### Business logic in a page

```tsx
// DO NOT DO THIS — page files are thin shells only.
export default function OrdersPage() {
  const { data } = useOrders();
  const [filter, setFilter] = useState("");
  return <div>{/* 80 lines of JSX */}</div>;
}
```

**Fix:** move everything into `features/orders/components/orders-list-view.tsx`,
have the page render `<OrdersListView />`.

### Feature import in lib/

```ts
// DO NOT DO THIS — lib/ cannot depend on features/.
import { Order } from "@/features/orders"; // inside lib/utils/
```

**Fix:** if `Order` needs to be in `lib/`, the type is cross-cutting. Move
it to `src/types/order.ts`.

### Storing UI state outside Zustand

```tsx
// DO NOT DO THIS — global UI state (filters, modal open) belongs in a store,
// not a top-level useState that gets prop-drilled.
const [filterStatus, setFilterStatus] = useState("all");
// then passes through 4 components...
```

**Fix:** `features/<feature>/store/<feature>-filters.store.ts` with Zustand.
Read it from any descendant component directly.

### `localStorage`/`sessionStorage` access

```ts
// DO NOT DO THIS — these break SSR and the existing refresh-token machinery.
localStorage.setItem("filter", value);
```

**Fix:** use Zustand. If persistence is needed, use Zustand's `persist`
middleware, which handles SSR correctly.

### Adding an `admin-` prefix

```tsx
// DO NOT DO THIS — the app is admin; prefix is noise.
// File: src/features/orders/components/admin-orders-list.tsx
```

**Fix:** `src/features/orders/components/orders-list.tsx`.

### Creating a feature with missing subfolders

features/customers/
├── components/
└── index.ts

**Fix:** run `./scripts/new-feature.sh customers` instead of hand-creating.

### eslint-disable for boundary violations

```ts
// eslint-disable-next-line boundaries/element-types
import { useOrders } from "@/features/orders"; // inside features/customers/
```

**Fix:** never. The lint rule is the architecture. Refactor the structure or
ask the user.

---

## Procedures for common tasks

### Adding a new feature

1. `./scripts/new-feature.sh <feature-name>`
2. Fill in `features/<feature>/types/<feature>.ts` with the data shape.
3. Add the endpoint(s) to `src/lib/api/endpoints.ts` under the appropriate group.
4. Fill in `features/<feature>/api/<feature>.service.ts`.
5. Fill in `features/<feature>/api/<feature>.queries.ts`.
6. Build the View component(s) in `features/<feature>/components/`.
7. Update `features/<feature>/index.ts` to export the View and any cross-feature types/hooks.
8. Create the route at `app/(staff)/<feature>/page.tsx` as a thin shell.
9. Add a nav entry to `src/config/nav.ts` if the feature has a sidebar link.
10. Run `npm run lint && npx tsc --noEmit && npm run build` to verify.

### Adding a new endpoint to an existing feature

1. Add the endpoint to `src/lib/api/endpoints.ts` under the right group.
2. Add the method to the feature's `<feature>.service.ts`.
3. Add the React Query hook to `<feature>.queries.ts`.
4. Update the feature's `index.ts` barrel if the hook is consumed by pages or
   shared components.
5. Consume the hook in a component.
6. Run the verification commands.

### Adding shared UI used by multiple features

1. Place it in `src/components/shared/<name>.tsx`.
2. The component may only import from `lib/`, `types/`, and `components/ui/`.
3. If you find yourself needing feature-specific data, the component does NOT
   belong in `shared/`. Reconsider whether it should be a `features/<x>/`
   component receiving props.

### Adding a shared type

1. Place it in `src/types/<domain>.ts`.
2. If it's a re-export of a feature-internal type (because a second feature
   now needs it), move the original out of `features/<x>/types/` into
   `src/types/`, not re-export through both.
3. Update both consuming features to import from `@/types/<domain>`.

---

## Verification before completing a task

Run all three of these and fix any output before considering work done:

```bash
npm run lint       # boundary violations and standard ESLint
npx tsc --noEmit   # full TypeScript check
npm run build      # Next.js production build
```

If `npm run lint` reports a boundary violation, **do not silence it**. The
structure is wrong, not the rule.

If `tsc` reports an `any` type or implicit casts, address them. Generated
files (`src/types/api.d.ts`, `.next/`, `node_modules/`) are excluded.

---

## Environment variables

Set in Vercel and locally via `.env.local`:

| Variable | Visibility | Purpose |
| -------- | ---------- | ------- |

| `API_BASE_URL` | server-only | Backend URL, used by Next.js rewrites |
| `NEXT_PUBLIC_API_BASE_URL` | public | Client-side base, normally `/api` |
| `NEXT_PUBLIC_BACKEND_URL` | public | Full backend URL when needed in components |
| `NEXT_PUBLIC_SOCKET_POLLING_FALLBACK` | public | Set to `"true"` to restore Socket.IO's polling→websocket upgrade for chat + WhatsApp. Default is WebSocket-only (App Platform 504s held-open long-polls). Escape hatch only — no code change needed |
| `GROQ_API_KEY` | server-only | AI smart-paste routes (products + parts), primary provider |
| `CLAUDE_API_KEY` | server-only | AI smart-paste routes, Claude Haiku 4.5 fallback on Groq rate-limit |

**Never reference `API_BASE_URL`, `GROQ_API_KEY` or `CLAUDE_API_KEY` in client components.** If
a client component needs to call the backend, it goes through the relative
`/api/...` path that the Next.js rewrite forwards.

---

## Lib module reference

`@/lib/api/client` — the fetch wrapper. Use `api.get/post/patch/put/delete`.
Never use raw `fetch()` for backend calls.

`@/lib/api/endpoints` — `API_ENDPOINTS` constant. All endpoint URLs go through
this. Never hardcode endpoint URLs in services.

`@/lib/api/error` — `ApiError` class. All errors from `api.*` calls are
instances of this. Check `error instanceof ApiError` for handling.

`@/lib/auth/get-server-session` — server-side helper for reading the staff
session from cookies. Use in server components and server actions.

`@/lib/auth/permissions` — `filterNavByPermissions`, `hasPermission`. Pure
functions, no state.

`@/lib/auth/logout-action` — server action for logout. Imported by the topbar
logout button.

`@/lib/utils/cn` — Tailwind class merger. Standard shadcn pattern.

`@/lib/utils/format` — `formatPrice`, `formatDate`, etc. Pure formatters.

---

## When in doubt

- Ask the user before guessing on architecture decisions.
- Read an existing feature (start with `features/orders/`) to see the pattern.
- Run lint/typecheck after each meaningful change, not at the end.
- If the lint rule blocks something that seems reasonable, the lint rule is
  almost always correct. The fix is structural, not a disable.
