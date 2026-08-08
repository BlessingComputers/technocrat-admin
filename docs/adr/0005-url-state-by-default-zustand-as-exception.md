# URL search params are the default for list state; Zustand is the exception

Filters, pagination, sort, and active tab live in the **URL** by default
(`useSearchParams`), as the source admin already does. This keeps admin list
views deep-linkable, makes back/forward and refresh work, and lets server
components read the state for SSR. React Query remains the server-state cache.
**Zustand is reserved for genuinely ephemeral cross-component UI state** that has
no business in a URL (e.g. a multi-step product-upload wizard's transient draft,
a command palette). Most features will have **no** `store/` folder.

## Consequences

This overrides the original `docs/ARCHITECTURE.md`, which mandates a `store/`
folder per feature and ships `order-filters.store.ts` as a worked example —
both of which must be softened: omitting `store/` is the norm, not the
exception, and filter state must not be standardized into Zustand. Putting
list/filter state in a store would be a capability *regression* (loss of
deep-linking, shareable views, and SSR-readable state), so a reviewer seeing
filters in `useSearchParams` rather than a store should treat that as correct.
