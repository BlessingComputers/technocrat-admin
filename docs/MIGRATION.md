# Admin Migration Checklist (re-baselined)

Keep this open during the cutover. Tick boxes as you go.

> **Why "re-baselined."** The previous version's "YOU ARE HERE → Phase 2" marker
> was wrong in both directions: most of Phase 2 (shared infra) is already done,
> some Phase 5 data-plumbing was scaffolded out of order, but Phase 3 (auth — the
> gating risk) is barely started and **no UI was ported**. This version reflects
> the *actual* repo state and the architecture decisions in `docs/adr/`
> (0001–0008). Legend: `[x]` done · `[~]` started/needs follow-up · `[ ]` not started.

> **UI uplift now in scope (ADR-0009).** A design-system pass was folded into the
> migration mid-flight. The designer's comps (`docs/design/`) are canonical:
> maroon primary · blue secondary · gold accent · green success; light **and**
> dark; shadcn re-skinned via semantic tokens; Iconify (Solar) icons app-wide;
> theme-following sidebar. This **reopens already-"done" UI screens** (login,
> shell, dashboard, orders) as needing a restyle — see **Phase 2.6** and the
> `[~] restyle pending` markers below. Spec: `docs/design/README.md`.

## Ground truth (verified against the repo)

- **Infrastructure: done.** `lib/api/client.ts` (the real slimmed staff client),
  `endpoints.ts`, `error.ts`, `lib/utils/{cn,format,logger}.ts`,
  `lib/auth/jwt-helper.ts`, `components/shared/{confirm-modal,logo,logout-confirm-modal}.tsx`,
  `providers/{query,theme}-provider.tsx`, `proxy.ts`, `robots.ts`,
  `scripts/new-feature.sh`, same-origin `/api` rewrite in `next.config.ts`.
- **Auth foundation: ~10%.** Only `jwt-helper.ts`. Missing: `get-server-session.ts`,
  `permissions.ts`, `logout-action.ts`, and the **hidden dependency
  `session-cookies.ts`** (imported by `get-server-session` and the login action —
  it was in *no* phase of the old plan). The session provider is still misplaced
  at `components/providers/admin-session-provider.tsx`.
- **Features: empty scaffolds.** `features/{auth,orders,products}` are
  `new-feature.sh` stubs (generic `Orders`/`Products`/`Auth` types, `TODO`s,
  literal paths) — **not** real ports. The other features aren't scaffolded.
- **Routes: none** beyond root `layout.tsx` + `robots.ts`.
- **`staff-profile.server.ts` does not exist** — it was a vestigial reference in
  the old plan. Removed here.
- **Dead code:** `services/api/api.ts` is an orphan (nothing imports it).

Target topology:

- **Main app** (`blessingcomputers.com`) — unchanged hosting (cPanel/PM2),
  customer-only after cutover. **Keeps all admin code** until sign-off (ADR-0008).
- **Admin app** (`admin.blessingcomputers.com`) — new Next 16 app on Vercel,
  feature-sliced, routes at root (no `/admin` prefix).

---

## Phase 0 — Pre-flight

- [x] Admin subdomain → `admin.blessingcomputers.com` (DNS live).
- [~] Confirm with the backend engineer:
  - [ ] CORS allowlist includes `https://admin.blessingcomputers.com` (only matters
    for any *direct* call; the browser uses the same-origin `/api` proxy — ADR-0003)
  - [ ] `Access-Control-Allow-Credentials: true`
  - [ ] `x-client: nextjs-ssr` whitelisted
  - [~] **Raw OpenAPI JSON route** `GET /api-docs.json` (agreed, not yet done — used
    by codegen, ADR-0006). Until then, codegen self-extracts from
    `/api-docs/swagger-ui-init.js`.
- [~] Vercel project created; note the `*.vercel.app` URL (don't attach domain yet).
- [~] Vercel env vars:
  - `API_BASE_URL=https://technocratblessingcomputers-q8gon.ondigitalocean.app/api`
  - `NEXT_PUBLIC_API_BASE_URL=/api`
  - `NEXT_PUBLIC_BACKEND_URL=https://technocratblessingcomputers-q8gon.ondigitalocean.app`
  - `GROQ_API_KEY=…` (AI parse route). **Rotate it** — it was committed in
    `.env.local`. `.env.local` **is gitignored** (confirmed via `git check-ignore`),
    so it won't be re-committed; the rotation is still required because the old
    key already landed in history.
  - No `SMTP_*` / `RESEND_API_KEY` (customer/marketing only). `grep -r "RESEND\|SMTP" src` → nothing.

---

## Phase 1 — Scaffold ✅ mostly done

- [x] `create-next-app` (Next 16, TS, Tailwind, App Router), config files, build passes.
- [x] Admin `next.config.ts` — same-origin `/api` rewrite; `cacheComponents` **off**
  (per decision: 100%-authenticated app, no caching benefit).
- [x] `scripts/new-feature.sh` present.
- [x] Boundary lint rules wired (`eslint-plugin-boundaries`).
- [x] **Sanity-check lint fires:** verified a cross-feature deep import
  (`features/orders` → `@/features/products/api/...`) errors under both
  `boundaries/element-types` (features→features) and `boundaries/entry-point`
  (non-barrel), then removed the probe.

---

## Phase 2 — Shared infrastructure ✅ mostly done; finish cleanup

- [x] `components/ui/**`, `components/shared/**`, `lib/utils/**`, `lib/api/**`,
  `providers/**` in place at the new paths.
- [x] **Deleted the orphan `src/services/api/api.ts`** (the live client is
  `lib/api/client.ts`; nothing imported the old one). Empty `src/services/`
  removed too.
- [x] **Added `src/config/env.ts`** — one validated, dependency-free env module.
  `publicEnv` holds `NEXT_PUBLIC_*` as static literals (inlined, safe everywhere);
  `serverEnv()` holds server-only secrets (`API_BASE_URL`, `GROQ_API_KEY`) and
  **throws if read in the browser**, so a server var can't leak to the client.
  Fail-fast with clear messages on missing `API_BASE_URL`. Wired all six consumers:
  `endpoints.ts`, `logger.ts` (`isDev`), `lib/ai/product-parser.ts` (GROQ),
  `features/emergency-unblock` (`publicEnv`), and `next.config.ts` (the `/api`
  rewrite, via a relative import since `@/` isn't resolved in config context).
  - **Boundary rule updated:** `lib → config` now allowed (`eslint.config.mjs`).
    `endpoints`/`logger`/`product-parser` are `lib` and must read env; `config`
    imports only `types`, so it's a safe leaf with no cycle. tsc + lint + build green.
- [x] `noindex, nofollow` wired in `app/layout.tsx` — full `robots` metadata block
  (`index:false, follow:false, nocache` + googleBot variants); the
  `X-Robots-Tag: noindex, nofollow, noarchive` header is also set in `next.config.ts`.

---

## Phase 2.6 — UI design system foundation (ADR-0009)

> **Engineering portion complete** — tokens, theming, icons, primitives, sidebar,
> and all screen retrofits done; lucide removed from custom components (retained for
> vendored shadcn primitives by owner decision, see below). The only open items are
> **designer/owner-gated** comp-tuning + sign-off (Invoice-comp fine-tuning, full
> heading scale, `.dark` refinement) — they don't block Phase 5.

Lightweight foundation only — tokens + core primitives, expand on demand. Spec:
`docs/design/README.md`. Canonical comps in `docs/design/`.

**Tokens (port-then-tune):**
- [x] Port `:root` + `.dark` + `@theme inline` from `blessingcomputers/globals.css`
  (maroon/navy/gold, oklch, both themes) into the admin `globals.css`, replacing
  today's generic shadcn colors. Cleaned up the duplicate `--popover-foreground`
  and the circular `--font-sans` (now `var(--font-outfit)`; also moved the font
  var to `<html>` in `layout.tsx` so it actually applies).
- [ ] Tune to the Invoice comp: blush table-header tint, KPI icon-chip tints,
  badge pills, card radius/shadow — all as tokens, no hardcoded colors.
- [x] **Add `--success` / `--warning`** (+ `-foreground`). Values are interim —
  `TODO(designer)` to confirm against her green/gold ramps.
- [~] `--font-heading` token wired (→ Outfit) and used on `PageHeader`; the full
  Title/Header1/2/3 size scale still to be mapped.

**Theming:**
- [x] Mounted `ThemeProvider` in the root layout (`attribute="class"`,
  `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`).
- [x] Binary sun/moon toggle in the topbar (`components/shared/theme-toggle.tsx`) —
  CSS `dark:` glyph swap (no hydration flash), `setTheme` flips + persists.
- [~] `.dark` tokens ported (maroon palette); **refine to comp + designer/owner
  sign-off** still pending.

**Icons (Iconify, app-wide, offline):**
- [x] Offline Solar set: `scripts/build-icons.mjs` (`npm run gen:icons`) extracts
  only the icons we use into `src/lib/icons/solar-subset.json`; `<AppIcon>`
  (`components/shared/app-icon.tsx`) registers it via `addCollection` — **no CDN
  calls**, tiny bundle. `@iconify-json/solar` + `@iconify/utils` installed.
- [x] Nav config gains per-item `icon` (Solar linear) + `iconActive` (Solar bold);
  dropped the sidebar's `ICONS` Lucide map; renders `<AppIcon icon={...} />`.
- [x] Migrated all **custom/app-authored** `lucide-react` usages to Solar
  `<AppIcon>`: `confirm-modal`, `logout-confirm-modal`, `refresh-button`,
  `session-provider`, `(staff)/layout` (`AlertTriangle`→`danger-triangle-bold`,
  `LogOut`→`logout-2-linear`, `RefreshCw`/`Loader2`→`refresh-linear` + `animate-spin`).
  No icon regen needed (bases already in the subset). tsc + lint + `next build` green.
  **Scoping decision (owner):** lucide-react is **deliberately retained** for the
  vendored shadcn primitives (`components/ui/{sidebar,sheet,select,accordion,
  dropdown-menu,dialog,checkbox,sonner}.tsx`) so newly-added shadcn components work
  out of the box without re-wiring their internal glyphs. So the package stays a
  dependency by design — "app-wide Solar" applies to authored UI, not vendored
  primitive internals.

**Core primitives + sidebar:**
- [x] Re-skinned shadcn primitives to the comp via tokens: **card** (rounded-2xl,
  soft shadow, lighter border), **input** (gray fill → white on focus), **button**
  (shadow on filled, card-surface outline), **table** (blush header tint, muted
  labels), **badge** (new soft `success`/`warning`/`danger` status pills), and
  bumped base `--radius` to 0.5rem. Tuned `--warning` to a readable amber.
- [x] Redesigned the sidebar + topbar: **share one chrome token** (`--sidebar`;
  topbar uses `bg-sidebar`) — white in light, a shade lighter/more muted than the
  cards in dark, no tint; content canvas a slight cool gray; active = maroon +
  Solar bold, inactive = muted + Solar linear. (Maroon/blue rail tints dropped.)
- [x] Removed `/analytics` from the sidebar nav (route/view code kept dormant).

**Retrofit backlog (reopened — verify each in BOTH themes):**
- [x] `(auth)/login` — logo brand mark, Solar icons (no lucide), design-system
  card/inputs/button, faint maroon glow + theme toggle on the auth layout.
- [x] `(staff)/layout` shell — sidebar + topbar done in the Phase 2.6 chrome work.
- [x] `analytics` dashboard (`/dashboard`) — all sub-components migrated off Lucide
  to Solar `<AppIcon>`; status pills use the new badge variants; hardcoded
  palette colors (slate/emerald/amber/rose/violet) moved to semantic tokens
  (success/warning/destructive) + `sky`/`info` for categorical accents; blush
  table header; verified both themes (tsc + lint clean).
- [x] `orders` (list, detail, bank-accounts) — all 14 components migrated off
  Lucide to Solar `<AppIcon>`; status pills now token-based via `order-utils`
  (`orderStatusTone`/`paymentStatusTone` → success/info/warning/danger/muted);
  hardcoded gray/emerald/amber/rose palette → semantic tokens; KPI icon-chips
  tinted (warning/primary/success); the two dark `bg-gray-900` cards (stats
  "Potential Revenue", detail "Customer Profile") are now theme-aware
  `bg-foreground text-background`; blush table header (`bg-primary/[0.04]`).
  Icon subset regenerated (`gen:icons`, 108 icons). tsc + lint clean, `next
  build` green. **Visual light/dark spot-check still recommended in a browser.**

Per-screen "done": matches `docs/design/README.md` · verified light **and** dark ·
`tsc` + `lint` + `next build` green · preview for auth/data flows.

---

## Phase 3 — Auth foundation (auth logic done; login UI restyle tracked in Phase 2.6)

Auth is its own **feature**: login UI, login action, session provider live under
`features/auth/`; shared server/session helpers stay in `lib/auth/`.

**lib/auth (port from main app, new paths):**
- [x] `src/lib/auth/session-cookies.ts` — **the hidden dependency.** Ported
  **staff-only** (no `audience` param / customer config): `extractTokens`,
  `sessionCookieSpecs`, `clearedCookieNames`, `buildCookieHeader`. Typechecks clean.
- [x] `src/lib/auth/permissions.ts` (was `lib/permissions.ts`) — `StaffSession`,
  `UserPermission`, `hasPermission`, `hasAnyPermissionInGroup`, `isSuperAdmin`,
  `filterNavByPermissions`. Nav types extracted to `src/types/nav.ts` so this
  stays boundary-legal (lib → types only). **`role` bug fixed:** `isSuperAdmin`
  now matches `role.id` *or* `role.name` against `"SUPER_ADMIN"`, with a
  `TODO(codegen)` to pin to one field once the OpenAPI StaffProfile schema lands.
- [x] `src/lib/auth/get-server-session.ts` — ported; server-side fetch of the
  staff profile via the full `API_BASE_URL` (ADR-0003), cookies forwarded via
  `buildCookieHeader`, wrapped in React `cache`.
- [x] `src/lib/auth/logout-action.ts` — ported; uses the staff-only no-arg
  `clearedCookieNames()` + `buildCookieHeader`; export renamed `logoutAction`.
- [x] `src/lib/auth/permission-gate.tsx` + `use-permissions.ts` — **presentation
  gating only** (ADR-0001): hide UI affordances the user lacks. No server-action
  re-checks; the backend's 403 is the authority. Built fresh (the main app's
  `usePermissions` was an RBAC *data* hook, not a gate).
  - **Placement correction:** the resume note said these "depend on the relocated
    provider," but a gate in `lib/auth` importing the provider in `features/auth`
    is **lib→features (illegal)**. Since every feature must use `<PermissionGate>`
    and features can't import features, the gate must live in a shared layer. So
    the React session *context* was split into `src/lib/auth/session-context.tsx`
    (`SessionContext` + `useStaffSession`); `features/auth` `SessionProvider` now
    fills that context, and the lib/auth gate reads it. `useStaffSession` is
    therefore imported from `@/lib/auth/session-context`, not the auth barrel.
- [x] **Lint fixed (was broken).** Two bugs, the first masking the second:
  (1) the config routed `eslint-config-next` through `@eslint/eslintrc`'s
  `FlatCompat`, which threw `Converting circular structure to JSON` under ESLint
  9 — fixed by spreading Next 16's native flat configs
  (`eslint-config-next/core-web-vitals` + `/typescript`) directly, no FlatCompat;
  (2) `boundaries/entry-point` used `default: disallow` with only a `features`
  rule, so it forbade importing any file from lib/components/types and flagged
  every legal import — fixed by allowing `**` entry for the non-feature layers
  (only features stay barrel-restricted). Boundary rules now genuinely enforce
  (verified). Also fixed the two real findings this surfaced: `decodeJwt`'s
  `any` return → `Record<string, unknown> | null`; `use-mobile` rewritten with
  `useSyncExternalStore` (no setState-in-effect). `eslint src` exits 0.
- [x] **Migrated to eslint-plugin-boundaries v6.** Replaced the deprecated
  `element-types` + `entry-point` pair with a single `boundaries/dependencies`
  rule using object selectors (`from: { type }` / `allow: { to: { type } }`).
  Barrel enforcement now rides on `to: { type: "features", internalPath:
  "!index.ts" }` as the last rule (last-match-wins overrides the per-layer
  allowances for deep feature imports). No more deprecation warnings. Re-verified
  enforcement with probes: app→feature *barrel* allowed; app/lib→feature *deep*
  blocked; features→features blocked even via barrel.

**Fetch client / refresh (ADR-0004):**
- [x] `src/lib/api/client.ts` — slimmed staff client present.
- [ ] Verify the **verbatim** `localStorage`-lock refresh baseline behaves on a
  Vercel preview (5-tab race test). Single-flight is mandatory (backend rotates
  refresh tokens + detects reuse). Middleware never refreshes.
- [~] **Hardened the cross-tab lock to the Web Locks API** (`lib/api/client.ts`).
  Web Locks now serialize the named refresh lock across all same-origin tabs and
  auto-release on settle/tab-death — replacing the localStorage poll + 50ms-race +
  storage-event dance (kept as a **fallback** for browsers without Web Locks, so
  the verified baseline survives). Same-tab 401s coalesce onto one
  `currentRefreshPromise`; a cross-tab `auth_refresh_ts_staff` marker makes a tab
  that wins the lock *after* a sibling refreshed **skip** its own refresh (true
  single-flight). Reuse→`auth:session-revoked`→`/login` path and server no-op
  preserved; `markRefreshed()` is unreachable on failure so a failed refresh isn't
  treated as fresh. Removed the old queue (`isRefreshing`/`refreshQueue`/
  `processQueue`). tsc + lint + build green. **Still needs the 5-tab race test on
  a Vercel preview** (exactly one `/api/auth/staff/refresh` fires) to tick fully.
- [x] Envelope unwrapping (ADR-0007): `api.*` now returns the inner `data`
  (double-unwrap = transport wrapper + business envelope, both in `client.ts`);
  throws `ApiError` on `success:false` even at HTTP 200; passes through
  non-envelope bodies; `{ raw: true }` request option keeps the full envelope.
  401/refresh logic untouched. Call sites updated: `auth.service` profile uses
  unwrap, its reset/forgot/login mutations use `{ raw: true }` (they need the
  envelope `message`). The `new-feature.sh` service template, the orders/products
  scaffold stubs, and the ARCHITECTURE worked example were all moved off the old
  `response.data` pattern. **Still TODO:** verify the list-pagination shape once
  codegen lands — if `total` is a sibling of `data`, unwrapping drops it.

**auth feature + routes:**
- [x] `src/features/auth/api/auth.service.ts` — real port. Kept `staffLogin`,
  `getStaffProfileClient`, `resetPassword`, `forgotPassword`; dropped
  `getCustomerProfile`. Raw→`StaffSession` mapping extracted to `mapStaffProfile`.
  Updated for the envelope unwrap (profile unwraps; mutations use `{ raw: true }`).
- [x] `src/features/auth/api/auth.queries.ts` — replaced the generic
  `useAuth`/`useAuthById` stubs with `useStaffProfileQuery` (seeds `initialData`
  from the server session; `retry: false`).
- [x] `src/features/auth/api/login-action.ts` (was `adminLoginAction.ts`) — uses
  the no-arg `extractTokens`/`sessionCookieSpecs`; paths root-relative
  (`/dashboard`, `/login`); export renamed `loginAction` / `LoginState`.
- [x] `src/features/auth/components/login-form.tsx` (was `admin-login-form.tsx`) —
  binds `loginAction`; `cn` from `@/lib/utils/cn`; default redirect `/dashboard`.
- [x] `src/features/auth/components/session-provider.tsx` — moved from
  `components/providers/admin-session-provider.tsx`; renamed
  `SessionProvider` / `useStaffSession`; old file + empty `providers/` dir deleted.
- [x] `src/app/api/auth/staff/refresh/route.ts` — ported. No-arg session
  helpers; uses `API_ENDPOINTS.staffAuth.refresh`; never retries; GET fallback
  redirects to root `/login`.
- [x] `src/app/(auth)/login/page.tsx` — thin shell over `LoginForm` (from the
  auth barrel), wrapped in `<Suspense>` (LoginForm reads `useSearchParams`).
  Added `src/app/(auth)/layout.tsx` (centers content).
- [x] `src/proxy.ts` — confirmed already the slimmed admin version (no `/admin`
  prefix, cookie-presence gate, never refreshes). No change needed.
- [~] Login E2E **verified locally against the live backend — works.** (One run
  hit the backend's IP-block security — `code: IP_BLOCKED`, surfaced as "Access
  Denied" with no logs because it's a *handled* envelope error; recover via the
  emergency unblock key. This is why `EmergencyUnblock` must be ported — Phase 6.)
  Prod-domain smoke-test deferred to Phase 7. A Vercel preview run is optional.
  **Ready:** `next build` is green locally (tsc clean; 9/9 pages; routes
  `/login` static, `/dashboard` + `/api/auth/staff/refresh` dynamic; middleware
  active). Note: Next 16 does **not** run ESLint during `next build`, so the
  broken lint config (below) does not block the build or Vercel — it only
  affects `npm run lint`.
- [ ] **Stop and verify login works before Phase 4.**

> **Build blockers — CLEARED (were pre-existing scaffold stubs, not from the
> auth work).** All four are resolved; the build is green:
> - `src/services/api/api.ts` — **deleted** (orphan; Phase 2 item).
> - `src/components/ui/sidebar.tsx` — imports re-pointed to new
>   `src/lib/hooks/use-mobile.ts` (standard shadcn `useIsMobile`) and
>   `src/lib/hooks/sidebar-store.ts` (zustand sidebar UI state — the documented
>   ADR-0005 exception). The component is still unused until the Phase 4 layout
>   chrome wires it in.
> - `src/components/shared/logo.tsx` — copied the real assets from the main app
>   (`public/assets/logo.png`, `src/app/icon.png`); `next-env.d.ts` (generated
>   by the build) supplies the `*.png` module types.
> - `src/features/products/utils/product-image-cache.ts` — `UploadedImageMeta`
>   moved into `features/products/types/products.ts`; import re-pointed there.

---

## Phase 3.5 — Type codegen (ADR-0006)

- [ ] Add `openapi-typescript` + a `gen:api` script. **Interim source:** fetch
  `…/api-docs/swagger-ui-init.js`, strip wrapper → `openapi.json` → generate
  `src/types/api.d.ts`. **Target:** switch source to `/api-docs.json` when the
  backend exposes it (one-line change).
- [ ] **Commit** `src/types/api.d.ts`. Run `gen:api` after backend changes + in CI.
- [ ] Convention: feature `types/` alias the generated **response** schemas; Zod
  schemas own **request/form inputs**.

---

## Phase 4 — Layout shell

- [x] `src/config/nav.ts` (was `admin-nav.ts`). **Deviation from "content
  unchanged":** `icon` is now a **string key** (`"LayoutDashboard"`), not a
  `LucideIcon`. The nav flows from the (staff) layout to the client sidebar as
  props, which must be serializable — component refs can't cross that boundary —
  and `config` may import `types` only. The string→component map lives in the
  sidebar. `types/nav.ts` updated to `icon: string`.
- [x] `src/components/layouts/sidebar.tsx` (was `admin-sidebar.tsx`). Exported as
  **`AppSidebar`** (not `Sidebar`, which would clash with the `ui/sidebar`
  primitive it imports). `fullHref = item.href` (no `/admin` prefix); Logo →
  `/dashboard`. **Boundary adaptation:** `components` can't import `config`, so
  `navGroups` is a **prop** injected by the layout, not a direct import. An
  `ICONS` map resolves the string keys to Lucide components.
- [x] `src/components/layouts/topbar.tsx` — ported (`logoutAction`,
  `@/lib/utils/cn`, `LogoutConfirmModal` from `components/shared`, redirect to
  `/login`). `src/components/layouts/page-animation-wrapper.tsx` — ported (the
  `page-animate` class already exists in globals.css).
- [x] `src/app/(staff)/layout.tsx` — now the full shell: Suspense →
  `TooltipProvider` → `SessionProvider` → `SidebarProvider` → `AppSidebar` +
  `SidebarInset`(`Topbar` + `main.page-animate`). Imports `navGroups` from
  `config` and passes it + the server session down.
- [x] `src/app/(staff)/dashboard/page.tsx` — stub greeting `{session.firstName}`
  via `getStaffSessionServer()` (cached, dedupes with the layout call).
- [ ] Deploy preview; log in; confirm dashboard renders with sidebar/topbar/session.
  **Ready:** `next build` green locally (tsc + lint clean; the shell composes,
  no server→client serialization errors).

---

## Phase 5 — Move features (one at a time) — ~11 features, not 13 (ADR-0002)

Per feature: scaffold with `new-feature.sh`, replace the stub content with the
real port, create the route shell(s), **build + commit**. Conventions:
URL-state by default, **no `store/`** unless there's genuine ephemeral UI state
(ADR-0005); responses typed from codegen, inputs from Zod; `<PermissionGate>` for
affordances; services rely on the client's envelope unwrap (ADR-0007). Use
`features/orders` as the reference (see `docs/ARCHITECTURE.md`). **All new screens
are built directly in the design system (ADR-0009): semantic tokens, Iconify/Solar
icons, verified in light + dark.**

- [x] **`analytics`** (routes `/dashboard`, `/analytics`) — Dashboard + Analytics
  are one feature (same `analytics` permission, same dashboard resource). Ported
  the full super-admin/staff dashboard (live KPI cards, ops snapshot, summary
  grid, date filter, recent-orders table, skeleton) into `features/analytics`;
  `/analytics` is the placeholder view for now. Adaptations:
  - Service returns **unwrapped** payloads (ADR-0007).
  - Gating uses **`useStaffSession`** (`@/lib/auth/session-context`) + the
    `isSuperAdmin` helper, not the auth feature's query (features can't import
    features).
  - Added `analyticsService.getRecentOrders` hitting the orders endpoint so the
    dashboard widget stays self-contained — it does **not** import the `orders`
    feature.
  - All `any` removed (lint forbids it): loose payloads typed as `unknown`/named
    shapes; `DashboardData = SuperAdminLiveKpiData | StaffDashboardData`.
  - Dropped the unreachable super-admin **cached** path (`getAdminDashboard` +
    `buildSuperAdminCachedKpis`); super admins always get the live KPI payload.
  - Shared `AdminPageHeader`/`AdminRefreshButton` → `components/shared/{page-header,
    refresh-button}.tsx` (`PageHeader`/`RefreshButton`). `build-summary-kpis`
    moved to the feature's `utils/`. Verified: tsc + lint clean, `next build`
    green (`/dashboard`, `/analytics`).
- [x] **`orders`** (routes `/orders`, `/orders/[id]`, `/checkout/bank-accounts`) —
  Orders **+ Bank Accounts** in one feature (both the `adminCheckout` resource).
  Ported the full list (table/filters/stats/pagination), order detail (payment
  verification, fulfillment manager, items, audit trail, sidebar, cancel) and
  bank-accounts CRUD (grid, cards, add/edit dialog). Adaptations:
  - `callWithFallback` kept (primary/fallback URLs) but typed, **`any`-free**.
  - ADR-0007 unwrap: methods return inner payloads; **`getOrders` uses
    `{ raw: true }`** to keep the sibling pagination `meta` (the documented
    list-meta risk — resolved via the raw hatch).
  - `getErrorMessage` ported to `lib/api/error-message.ts` (shared, `any`-free).
  - Detail view takes `manualOrderId` as a prop from the awaited route `params`
    (no `useParams`). Bank-account form dialog resets via a **remount `key`**
    (no setState-in-effect — lint rule). `order-utils` already lived in the
    feature's `utils/`. `<img>` proof previews keep an eslint-disable for
    `no-img-element` (remote S3 URLs).
  - Shared `AdminPageHeader`/`AdminRefreshButton` reused from `components/shared`.
    Verified: tsc + lint clean, `next build` green (all 3 routes).
- [x] **`products`** (`/products`, `/[id]`, `/[id]/edit`, `/new`, `/taxonomy`,
  `/bulk`) — shipped in 6 vertical slices, each tsc+lint+build green:
  - **0 data foundation** — types/service/queries (ADR-0007 unwrap; list uses
    `{ raw:true }` for sibling meta+facets); any-free. Endpoint quirks ported
    verbatim with `TODO(codegen)`.
  - **1 list** (`/products`) — stats, filter bar (tabs/search/selects), sortable
    table, pagination, status toggle + delete (shared `ConfirmModal`).
  - **2 detail** (`/products/[id]`) — media/overview/variants/specs/gallery,
    line tabs.
  - **3 create/edit** (`/new`, `/[id]/edit`) — RHF + Zod form (general/variants/
    specs/status/image-upload sections); create → edit handoff for images.
  - **4 brands & categories** (`/taxonomy`) — **redesigned** off the list page
    into a dedicated subroute: brand card-grid + master-detail category/
    subcategory CRUD. (Reorder/move deferred.)
  - **5 bulk + AI** (`/bulk`) — `src/app/api/admin/products/ai-parse/route.ts`
    (GROQ via plain REST, `GROQ_API_KEY`, parser in `lib/ai/`); AI smart-paste →
    editable review table → bulk-create with batch-status progress polling.
  - brands & categories live as **sub-folders under `components/`**, not sibling
    features (ADR-0002).
- [x] **`users`** (`/users`) — ported from `use-rbac` + `rbac.service` into
  `features/users` (route `/users`). Three tabs (Permissions / Roles / Staff) under
  one `users` resource: permission CRUD, role CRUD + sync-permissions picker, staff
  list (search/status filter/pagination) with role-assign + onboard. Adaptations:
  - **Service** speaks inner payloads (ADR-0007 unwrap); **`getStaff` uses
    `{ raw: true }`** to keep the sibling pagination `meta`, then normalizes the
    array-or-paginated shape. Dropped unused `add/removeRolePermissions` (UI only
    uses **sync**; the admin client's `delete` takes no body anyway). `onboardStaff`
    returns the unwrapped `{ staffId }`.
  - **Queries** use `react-hot-toast` + shared `getErrorMessage`.
  - **ADR-0009 restyle:** all lucide → Solar `<AppIcon>`; `getPermissionBadgeColor`
    → `permissionBadgeTone()` returning semantic Badge variants
    (success/warning/danger/info); status pills → `success`/`danger`; system pills →
    `warning`. Added `key` + `user-plus-rounded` to the icon subset (`gen:icons`,
    140 icons). Browser `confirm()` deletes → shared `ConfirmModal`.
  - **Lint-safe:** staff pagination resets to page 1 in the change handlers (no
    `setState`-in-effect). Dropped the source's two dead no-op dropdown items
    (Revoke/Delete had no backend) — kept only the functional Assign Role.
  - Page is a thin shell over `UsersView` (header + `RbacTabs`, tab URL-seeded via
    `?tab=`). tsc + lint + `next build` green (`/users`). **Browser light/dark
    spot-check recommended.**
- [~] **`customers`** (`/customers`) — **backend-blocked.** No admin
  customer-listing endpoint exists (only aggregate dashboard counts +
  per-customer `/auth/customer/me`); can't build fresh without a contract.
  Shipped a **design-system placeholder** so the route renders instead of 404-ing
  (`components/shared/feature-placeholder.tsx` — reusable empty-state; the
  `(staff)/customers/page.tsx` uses it). Swap in the real view once the backend
  admin customers endpoint lands. tsc + lint clean. **TODO(backend):** confirm/add
  `GET /v1/admin/customers` (list + detail).
- [~] **`invoices` · `inventories` · `socials` · `security`** — all
  **backend-blocked** (no endpoints in either app's config). Each shipped a
  design-system **`FeaturePlaceholder`** page so the nav route renders instead of
  404-ing; swap in the real view when its backend lands. tsc + lint + build green.
  **TODO(backend):** confirm/add the admin endpoints for each.
- [x] ~~**`sales`** (`/sales`)~~ — **dropped** (owner: no longer needed; origin
  unknown). Removed the nav item in `config/nav.ts`; no route was ever created.
- [x] **`settings`** (`/settings`) — ported into `features/settings` (route
  `/settings`). **Mock `staffSession` removed:** `SecuritySettings` now reads the
  real session from the provider via `useStaffSession()`
  (`@/lib/auth/session-context`) — the email drives the request-token flow.
  Adaptations:
  - **Self-contained password service/queries** (`settings.service.ts` +
    `settings.queries.ts`) hitting the shared `staffAuth.forgotPassword`/
    `resetPassword` endpoints — settings can't import the auth feature (boundary
    rule), same as analytics' own data calls. Mutations use `{ raw: true }` for
    the envelope `message` (ADR-0007); reset surfaces per-field validation errors.
  - **ADR-0009 restyle:** lucide → Solar `<AppIcon>` (lock/key/info/letter/
    shield-check/refresh — all already in the subset, no regen); tokens throughout.
  - Page is a thin shell over `SettingsView` (header + `SecuritySettings`).
  - tsc + lint + `next build` green (`/settings`). **Browser check recommended:**
    request-token + reset round-trip against the live backend.
- [ ] Reset/forgot-password routes under `(auth)/` if separate pages.

After each route: `grep -r "/admin/" src/` and replace any leftover hardcoded
admin paths with root-relative ones.

---

## Phase 6 — Bot/crawler defense (the reason this migration exists)

- [x] **Ported + mounted `EmergencyUnblock`** at `src/features/emergency-unblock/`
  (barrel + component), mounted in `app/layout.tsx`. Restyled (Solar icons,
  destructive tokens), `any` removed, and the unblock URL moved to env:
  **`NEXT_PUBLIC_EMERGENCY_UNBLOCK_URL`** (set in `.env.local` / Vercel — the
  feature errors gracefully if unset). Listens for the client's `api:ip-blocked`.
  - **Fix (was broken):** the component was left **commented out** in
    `app/layout.tsx` (scaffold-template leftover), so the modal never showed.
    Now actually mounted. Also: the IP block is most often hit at **login**, which
    runs in a **server action** that can't dispatch a browser event — so
    `loginAction` now surfaces the backend `code` in `LoginState`, and `LoginForm`
    re-dispatches `api:ip-blocked` on `IP_BLOCKED` so the recovery UI appears on
    the login page too. (Client-side `api.*` blocks already dispatch in `client.ts`.)
- [x] `src/app/robots.ts` → `Disallow: /`.
- [x] `noindex, nofollow` in `app/layout.tsx` (full `robots` metadata block) + the
  `X-Robots-Tag` header in `next.config.ts`.
- [~] Vercel Firewall rules — **drafted, ready to apply** in the Vercel console
  (`docs/deploy/vercel-firewall.md`): deny `^/api/` without `staffAccessToken`,
  rate-limit login to 10/min/IP, optional bot-UA block on `/`. **Correction baked
  in:** the allowlist must also exempt `/api/auth/staff/refresh` (it runs without
  a valid access token) — a blanket deny would break silent session refresh.
  *Applying the rules is a Vercel-console step (can't be done from code).*
- [~] Enable Vercel Bot Protection — steps in `docs/deploy/vercel-firewall.md`
  (start in monitor mode, then challenge/deny). *Console step.*
- [x] Confirmed the subdomain is in no sitemap/robots/HTML link from the main site:
  no `admin.blessingcomputers.com` reference anywhere in `blessingcomputers/src`;
  the main `sitemap.ts` emits only `www.` marketing/product URLs; the main
  `robots.ts` is per-host (`www.`) so it can't expose the subdomain; the admin
  app's own `robots.ts` is `Disallow: /`. The `/admin` links that exist render
  only on auth-gated admin pages, never on public pages. _Optional pre-Phase-8
  hardening: add `/admin` to the **main** app's `robots.ts` disallow as
  belt-and-suspenders until Phase 8 deletes `/admin` from the main app._

---

## Phase 7 — DNS cutover

- [ ] Vercel → Domains → add `admin.blessingcomputers.com`; add the DNS record.
- [ ] Wait for SSL; `curl -I https://admin.blessingcomputers.com/login` → 200.
- [ ] Log in via the real domain; test one read and one write action.

---

## Phase 8 — Clean up the main app — GATED ON SIGN-OFF, NOT TIME (ADR-0008)

**Do not start until the new app is stress-tested and the owner signs off.** The
main app keeps **all** admin code until then — that is what makes rollback a pure
DNS/redirect change. The old "after one week" rule is superseded. When (and only
when) cleared, delete the admin routes/features/services/hooks/auth helpers listed
below from `blessingcomputers` (old paths, unchanged on purpose; recover via git):

- `src/app/admin/**`, `src/app/api/admin/**`, `src/app/api/auth/staff/**`
- `src/features/admin/**`, `src/components/admin-login-form.tsx`
- `src/components/layouts/admin-{sidebar,sidebar-wrapper,topbar,page-animation-wrapper}.tsx`
- `src/components/providers/admin-session-provider.tsx`, `src/config/admin-nav.ts`
- `src/lib/auth/{get-server-session,logout-action}.ts`, `src/lib/permissions.ts`
- `src/hooks/queries/{use-admin-checkout,use-admin-dashboard,use-rbac}.ts`
- `src/lib/api/services/{admin-checkout,admin-dashboard,rbac}.service.ts`
- Then prune `auth-queries.ts`, `auth.service.ts`, `use-products.ts`,
  `api-config.ts`, `services/api/api.ts`, `proxy.ts` of staff-only branches; run
  `npx depcheck`; add the `/admin/:path*` → `admin.blessingcomputers.com` redirect.

---

## Known things to test after cutover

- [ ] Login → dashboard · expired-access transparent refresh · expired-refresh bounce to `/login`
- [ ] **Multi-tab refresh race (5 tabs)** — exactly one `/api/auth/staff/refresh` fires (verbatim baseline AND after Web Locks)
- [ ] Logout clears cookies · permission gating hides sidebar/affordances for non-super-admins
- [ ] Order detail: payment confirm/reject, status update, cancel · bank-account CRUD
- [ ] Product create + bulk upload (AI parse needs `GROQ_API_KEY`) · image upload (S3)
- [ ] `success:false`-on-200 surfaces as an error (ADR-0007) · paginated list `total` intact
- [ ] Main site still works (it still has all admin code — ADR-0008)

---

## Rollback plan

Before sign-off, rollback is a DNS/redirect change only — the main app never lost
its admin code (ADR-0008): repoint DNS / remove the Vercel domain, revert the
redirect commit. That's why Phase 8 is last and gated on sign-off, not a timer.
