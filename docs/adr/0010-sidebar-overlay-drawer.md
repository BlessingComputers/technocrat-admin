# The desktop sidebar is an on-demand overlay drawer, not a persistent rail

> **Revision (2026-07-17) — superseded for large screens.** The dashboard
> redesign reintroduced a **persistent docked rail at `lg`+ (≥1024px)**; the
> overlay drawer is now the **small-screen-only** path (below `lg`). Rationale:
> once the dashboards became chart-dense landing pages, always-on navigation
> earns its width back on large displays, and the earlier "full canvas at all
> costs" trade (driven by the products table) no longer dominates the home
> experience. The drawer, its zustand `open` state, and the full-canvas width
> rules below still hold **verbatim below `lg`**; the topbar `☰` trigger + brand
> now render only below `lg` (the docked rail owns them above it). Implemented
> via `useIsLargeScreen` (desktop-first SSR snapshot) in
> `components/ui/sidebar.tsx`; the docked rail is CSS-hidden (`hidden lg:flex`)
> below the breakpoint so there is no hydration flash. Everything below this
> callout is the original 2026 decision, kept for history.

---

The `(staff)` shell sidebar collapses to an **overlay drawer** on desktop —
the same `Sheet` (with backdrop) that already serves mobile — and is **closed
by default** on every route. The previous desktop behavior (`collapsible="icon"`,
an always-visible icon rail when collapsed) is retired. Navigation is reached
on demand via the topbar's existing `☰` `SidebarTrigger`; the content canvas is
full-width on every page.

This emerged from the products-list redesign: the new [[product-browse-view]]
needs real horizontal room, and the icon-only rail was judged visually poor.
Rather than special-case one route, the chrome changes app-wide.

## Decisions

- **One render path: the drawer.** The sidebar always renders the `Sheet`
  overlay (backdrop, slides over content) regardless of viewport — desktop no
  longer has a distinct "push the layout / icon rail" mode. `collapsible="icon"`
  in `components/layouts/sidebar.tsx` is dropped; the `state`-driven icon-collapse
  styling becomes dead and is removed.
- **Closed by default, app-wide.** Fresh page loads show no sidebar and
  full-width content. The user opens nav via the topbar trigger and dismisses by
  picking an item or clicking the backdrop. The trigger is therefore the single,
  always-present entry point on **both** desktop and mobile.
- **State stays in the zustand exception.** Open/closed remains
  `useSidebarStore` ([[0005]] — sidebar UI state is the sanctioned zustand case,
  not URL state). "Closed by default" is the initial state, not a per-route
  override; we do not auto-open/auto-close based on pathname.
- **Full-canvas width is the app-wide standard.** The `max-w-7xl` per-view cap
  is removed everywhere (view roots, `PageContainer`, and the matching route
  `loading.tsx`/skeletons), so every staff page fills the shell's
  `max-w-[1600px] mx-auto` canvas — the same width [[product-browse-view]]
  established. `/products/all` was the first to drop its cap; the rest followed
  so the width is uniform. Content-reading form pages keep their intentional
  narrower `max-w-5xl` container — that is the one sanctioned exception.

## Consequences

- Desktop loses always-visible navigation — a deliberate trade of persistent
  nav for full canvas + on-demand nav. Every screen in the app inherits this, so
  the topbar trigger's discoverability matters more than before.
- The change is app-wide and reviewed as part of the products redesign, not in
  isolation; a regression here affects every staff route, not just products.
- A reviewer seeing the desktop sidebar behave like the mobile drawer (and no
  icon rail) should treat that as **correct**, per this ADR, not a port mistake
  from the source admin.
