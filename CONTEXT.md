# Admin (Blessing Computers) — Context

Domain language for the standalone admin app (`admin.blessingcomputers.com`).
Records terms whose meaning is specific to this app, so reviews and refactors
use one consistent vocabulary. Glossary only — decisions live in `docs/adr/`,
structure lives in `docs/ARCHITECTURE.md`.

## Language

### Authorization

**Authorization authority**:
The backend API is the single authority for authorization — it validates tokens
and returns `401`/`403`. The admin frontend never enforces permissions; it only
reflects them. There is no second copy of the permission rules in this app.
_Avoid_: access control layer, auth guard (the frontend does not guard, it presents).

**Presentation gating**:
Frontend permission logic whose only job is UX — filtering the sidebar nav and
hiding affordances (buttons, menu items) the user lacks permission for. It reads
`session.permissions` to decide what to *show*, never to decide what is *allowed*.
A hidden action is a convenience, not a security boundary.
_Avoid_: permission enforcement, access control (those happen at the [[authorization-authority]]).

### Structure

**Feature**:
A bounded domain backed by one backend resource, owning all of its views, data
access, and UI. A feature is *not* a sidebar entry — one feature may expose
several routes (e.g. `orders` owns both the order list and bank-accounts at
`/checkout/bank-accounts`, because both are the `adminCheckout` resource).
Features never import each other; shared shapes promote to [[shared-type]].
Growth within a feature is absorbed by sub-folders under `components/`
(e.g. `products/components/brand/`), never by splitting into sibling features.
_Avoid_: module, section, page (a page is a route shell over a feature).

**Shared type**:
A TypeScript contract needed by two or more features (or by middleware /
route handlers), promoted out of any single feature into `src/types/`. The
trigger is the *second* consumer — types start feature-local and move only when
a second feature genuinely needs them.
_Avoid_: common types, global types.

### Auth & session

**Session-cookie translation**:
Converting between the backend's token representation (JSON payload +
`Set-Cookie` headers) and the admin app's cookies. The pure module
`src/lib/auth/session-cookies.ts` owns this: `extractTokens` (backend → tokens),
`sessionCookieSpecs` (tokens → cookie specs), `clearedCookieNames` (names to
delete), `buildCookieHeader` (cookie store → outbound `Cookie:` header). It
returns specs and never touches `next/headers`; callers apply them. Unlike the
main app's dual-audience version, this one is **staff-only** — no `audience`
parameter, no customer config.
_Avoid_: cookie handling, cookie utils.

**Cookie spec**:
A plain `{ name, value, options }` describing one cookie to set, independent of
where it's applied. The pure output of the [[session-cookie-translation]] module.

### Products

**Products hub**:
The slimmed `/products` landing page. A management surface, *not* a catalog
browser: header actions (Add Product, Brands & Categories, Markup Rules,
Maintenance), the stats bar, a small read-only "recently added" snapshot, and a
prominent CTA into the [[product-browse-view]]. It deliberately carries no
filter bar — searching/filtering is the browse view's job. Stats chips
deep-link into the browse view with a stock filter pre-applied.
_Avoid_: products page, product list (the hub does not host the working list).

**Product browse view**:
The full catalog working view at `/products/all` (named for the `/v1/products/all`
endpoint). Owns search, filters, sort, and pagination — all held in the URL
([[0005]]), making it deep-linkable, reload-safe, and back/forward-aware. This
is where staff actually find and act on products; the [[products-hub]] only
points here.
_Avoid_: products list page, all-products page (it is filtered and searchable,
not merely "all").
