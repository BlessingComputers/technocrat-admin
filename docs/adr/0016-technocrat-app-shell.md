# The Technocrat app shell: full-bleed nav, a user-toggled icon rail, and a slim top bar

Status: accepted (2026-08-09)
Supersedes: parts of [[0010]] (the docked-rail revision) and [[0009]]'s sidebar rules

The `(staff)` shell is re-shaped to Figma `404:1729` (sidebar) and `301:920`
(dashboard canvas). Those two frames are the only Technocrat admin screens that
exist; everything else in this ADR is derived from them plus the ~63 routes the
clone actually carries.

## Context

Two things about the frames drove every decision here.

First, **the sidebar frame is Blessing's nav, traced.** Same fifteen items, same
two groups, same icons. It differs in exactly three ways: MAIN leads with
Orders/Customers instead of the catalogue, `Settings` is gone, and `WhatsApp` is
gone. Treating it as a fresh IA proposal would have been a misreading; the real
question was which of those three differences are decisions and which are
tracing slips.

Second, **the dashboard frame has no top bar at all.** Content starts at a bare
bold page title. That is not the same as "delete the top bar" — the frame simply
doesn't draw chrome above the content, and the app has four controls (drawer
trigger, notification bell, theme toggle, help menu) that need somewhere to live.

## Decisions

### 1. Nav IA follows the frame, minus two corrections

Group labels become `MAIN` / `ADMIN`, and MAIN takes the frame's ordering —
Dashboard Overview, Orders, Customers, Catalogues, Pricing, Invoices,
Inventories, Chat. That ordering reads the nav as a day's work queue first and a
data surface second, which is a real and defensible difference from Blessing's
resource-shaped list.

Two divergences from the frame:

- **`Settings` is dropped from ADMIN, as drawn.** This one is a decision, not a
  slip: the frame's footer carries a gear, which *is* the settings affordance.
  `/settings` stays reachable there. Re-adding the nav row would give one route
  two entry points in the same piece of chrome.
- **`WhatsApp` is kept, against the frame.** This one is a slip. The slice ships
  in full, the nav is its only entry point, and dropping the row would strand a
  working route. If Technocrat turns out to have no WhatsApp business number,
  the honest fix is to dark the slice deliberately — not to leave it running
  behind a missing door.

Item labels keep Blessing's plurals (`Catalogues`, `Invoices`, `Inventories`,
`Payments`) rather than the frame's singulars. The frame is internally
inconsistent here — Orders, Customers, Users, Uploads and Socials are all plural
in the same list — so the singulars read as slips rather than a naming system.
`Dashboard Overview` and `Bank accounts` **are** adopted verbatim, the first
because it matches the dashboard's own page title and the second because it's
only a casing change.

### 2. The active row is a solid full-bleed rectangle — and it inverts Blessing

Active = a square, edge-to-edge `sidebar-primary` fill with white text. Blessing
does the opposite: an inset tinted pill with brand-coloured text. In token terms
Technocrat maps **`sidebar-primary` = active** and **`sidebar-accent` = neutral
hover**; Blessing maps those two the other way round.

This is the one piece of chrome that could not be value-swapped, and it has a
structural consequence worth stating plainly: **the nav list carries no
horizontal padding.** The rows carry it instead (`px-5`). Padding on the list
would inset the fill and lose the effect entirely, so a future "tidy up the
sidebar spacing" edit that moves padding back up to the container will silently
break the design.

Two follow-on changes in `components/ui/sidebar.tsx`, both because `AppSidebar`
is that primitive's only consumer:

- the cva's `data-[active=true]:bg-sidebar-accent` default is removed (it
  encoded Blessing's inverted mapping);
- the `!important` collapsed geometry (`size-8!`, `p-2!`) is removed, because it
  forced a 32px inset button inside a 48px full-bleed rail.

### 3. The chevron collapses the docked rail to icons — restoring what 0010 removed

[[0010]] retired `collapsible="icon"` on the grounds that an icon-only rail was
"visually poor", then its own revision re-docked the rail permanently. The frame
draws a collapse chevron beside the wordmark, which that state cannot express.

The rail now collapses to the 3rem icon rail — but as a **user toggle**, not the
automatic desktop mode it used to be. That distinction is what makes 0010's
objection stop applying: nobody lands in the icon rail unasked, so it costs
nothing to offer it to someone reading a wide table. The `group-data-[collapsible=icon]:*`
rules throughout the primitive survived 0010 intact, so this is a re-wiring
rather than a rewrite.

**State lives on two independent axes**, and conflating them is the trap:

| axis | drives | default | control |
| --- | --- | --- | --- |
| `open` | the small-screen drawer, below `lg` | closed | topbar `☰` |
| `railCollapsed` | the docked rail, `lg`+ | expanded | header chevron |

One flag cannot serve both, because the drawer defaults closed and the rail
defaults expanded.

`railCollapsed` persists in a `sidebar_rail` cookie that the `(staff)` layout
reads **server-side**, so the first paint is already the persisted width. A
localStorage read in an effect would collapse the rail after paint and shove the
whole canvas sideways on every load.

This also fixes an inherited bug: `SidebarMenuButton`'s tooltip was gated on the
*drawer's* derived `state`, which is `"collapsed"` whenever the drawer is shut —
i.e. always, on desktop. Every desktop nav hover fired a tooltip duplicating a
label that was right there. It now gates on `railCollapsed`, which is what
actually hides the label.

### 4. The top bar survives, slimmed

Kept at 56px (was 64px) with a plain `background` fill instead of the tinted
`sidebar/80`, so it reads as a control strip rather than a second band of chrome
competing with the page header directly beneath it. Contents are unchanged:
drawer trigger + logo below `lg`, then notification bell, theme toggle, help
menu.

Deleting it to match the frame literally would have pushed three controls into a
250px sidebar footer that already holds an avatar, a name, an email and a gear.
The frame's silence here is an omission, not an instruction.

### 5. `PageHeader` is unchanged, and the dashboard is the special case

The component already matches the frame's pattern — bold title, no eyebrow, no
breadcrumb, actions slot on the right — and its `description` is already
optional. The dashboard passes a title only; the other 57 call sites keep their
descriptions, which is what disambiguates routes like `/invoices/pending-review`
from `/invoices/rejected`.

### 6. Density is unchanged

The frame reads roomier than Blessing's admin, but the shell's existing
`p-4 md:p-8` canvas inside a `max-w-[1600px]` column is already close to it. Any
real density change should be measured against a built dense screen rather than
guessed at from the one pretty frame, so this is deferred to
[[0008-dashboard-reference]] and the restyle sweep.

## Consequences

- **The nav list's zero horizontal padding is load-bearing.** See §2.
- **The `sidebar-primary`/`sidebar-accent` inversion is easy to undo by
  accident.** Anyone porting a component back from Blessing admin will bring the
  opposite mapping with it.
- **Nav labels intentionally disagree with the Figma** in four places (§1). This
  is recorded so it isn't "fixed" later as a mismatch.
- **The icon rail is now a supported state again**, which means every future
  sidebar addition has to work at 48px wide, not just at 250px.
- Blessing admin is untouched by all of the above except the WhatsApp mark
  (below), so the two shells now genuinely diverge — the first real instance of
  the map's "shared-component drift" question.

## Also landed here (out of the ticket's stated scope)

- **The token layer.** `DESIGN.md` and `src/app/globals.css` were still
  Blessing's maroon/navy/gold when this ticket started; the design system was
  decided but never applied, and no other open ticket owned applying it. The
  shell could not be built against the wrong tokens, so the two files decided in
  the design-system ticket were moved into the clone verbatim. ⚠️ There are
  **~20 remaining `gold` references** across analytics, chat, help and customers
  that now resolve to a deleted token; they do not fail the build, they just
  render nothing. They belong to the restyle sweep.
- **A `brand:` icon collection.** The WhatsApp nav row used
  `solar:chat-square-call` — a generic chat bubble — for a named third-party
  product. Solar ships no WhatsApp mark, so `scripts/build-icons.mjs` now also
  emits a tiny hand-authored `brand` collection alongside the Solar subset. The
  glyph is the same Simple Icons path the storefront already inlines in
  `shared/ui/whatsapp-icon.tsx`, so the mark is identical across all three apps.
  It is single-form (a brand mark has one official shape), so `icon` and
  `iconActive` point at the same name and colour alone carries the active state.
  **This change was also applied to `admin-blessingcomputers`** at the user's
  request.
