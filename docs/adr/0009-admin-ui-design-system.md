# The admin app adopts a maroon design system (light + dark), shadcn re-skinned, Iconify icons

The migration also delivers a UI uplift. A human designer owns the visual
language; her work is **canonical**. Engineering's job is to *systematize* that
language into reusable tokens + components and *extend* it (creatively, with
sign-off) only where she hasn't drawn — e.g. dark mode. We do **not** invent a
parallel look.

Reference comps live in `docs/design/` (`invoice-ui.png`, the canonical screen;
`blessing-design-system.png`, her palette/type/button system). The living spec
is `docs/design/README.md`.

## Decisions

- **Palette:** maroon = primary, blue = secondary, gold/yellow = accent, green =
  success. Maroon drives primary actions, active nav, focus rings; the comp's
  blush table-header is a ~5% tint of it.
- **Tokens: port-then-tune.** Seed the admin `globals.css` `:root` + `.dark` +
  `@theme inline` from `blessingcomputers/globals.css` (which already encodes the
  maroon/navy/gold system in oklch for both themes), **then** tune to the Invoice
  comp. Today the admin `globals.css` still holds generic shadcn colors, so this
  is real work, not a no-op. The admin **owns its tokens after seeding** and
  documents any deliberate divergence from the main app.
- **Semantic tokens only** — no hardcoded colors anywhere. Add `--success` /
  `--warning` (+ `-foreground` + tint variants), which `globals.css` lacks today
  but the green/amber badges require.
- **Light + dark, both shipped.** The dormant `ThemeProvider` is mounted in the
  root layout. Toggle is a **binary sun/moon** (not a 3-way select): default
  follows the OS (`defaultTheme="system"` + `enableSystem`), and an explicit
  user choice persists. The dark palette refines the *existing* `.dark` tokens
  rather than inventing one; still needs designer/owner sign-off.
- **Keep shadcn, re-skin via the token layer.** No primitive swap — its
  CSS-variable theming is exactly what light+dark needs. Re-skinning does not
  mean settling for the default shadcn look.
- **Icons: Iconify, app-wide, offline-bundled.** `lucide-react` is removed once
  migrated (Iconify ships Lucide as `lucide:*` for 1:1 carryover). The nav uses
  the **Solar** set with per-item `icon` (linear) + `iconActive` (bold) — both
  serializable strings, keeping `config` → `types`-only and the server→client
  prop boundary intact ([[0002]]). No runtime calls to Iconify's CDN (this is an
  auth-gated internal tool). Other sets only when Solar lacks a glyph, documented.
- **Chrome (sidebar + topbar) share one surface token** (`--sidebar`; the topbar
  uses `bg-sidebar`, no translucency, so they can't drift): **pure white** in
  light, and in dark a shade **slightly lighter and more muted than the cards**
  (no tint — maroon and blue rail tints were both tried and dropped). The light
  content canvas is a slight cool gray so the white chrome and cards pop (matches
  the comp). Active nav item is **maroon (primary)** in both themes. The sidebar
  UI state continues to use the zustand exception ([[0005]]).
- **`/analytics` removed from the sidebar nav.** The route/view code stays
  dormant for a future deep-dive; dashboard already shows the at-a-glance KPIs.

## Sequencing

Lightweight foundation first, then retrofit, then resume porting:

1. Foundation pass (tokens, Iconify+Solar, `ThemeProvider`, core primitives
   re-skinned, sidebar redesign) — tracked as **Phase 2.6** in `MIGRATION.md`.
2. Retrofit `login` (the login E2E already passes locally; a prod smoke-test is
   deferred to post-cutover).
3. Retrofit shell + dashboard + orders, verified in **both themes**.
4. Resume Phase 5 (products next) built directly in the new system.

Per-screen "done" = matches the design system · verified light **and** dark ·
`tsc` + `lint` + `next build` green · preview for auth/data flows.

## Consequences

- Already-"done" screens (login, shell, dashboard, orders) **reopen** as
  needing a restyle; `MIGRATION.md` reflects this honestly rather than marking
  them finished.
- Every screen carries ~1.3–1.5× the QA (two themes).
- The `EmergencyUnblock` infra component (IP-block recovery) gets ported and
  mounted as part of this work — see `MIGRATION.md` Phase 6 — restyled with
  Solar icons and its unblock URL/secret moved to env config.
