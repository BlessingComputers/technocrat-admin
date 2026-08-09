---
name: Technocrat Stores Admin
description: The Operator's Cockpit, in green — a calm, legible operations tool for staff
colors:
  primary: "oklch(0.55 0.2 145)"
  primary-foreground: "oklch(0.99 0 0)"
  secondary: "oklch(0.2795 0.0296 264)"
  success: "oklch(0.63 0.17 149)"
  warning: "oklch(0.68 0.16 65)"
  info: "oklch(0.55 0.13 245)"
  destructive: "oklch(0.577 0.245 27.325)"
  canvas: "oklch(0.972 0.002 150)"
  card: "oklch(1 0 0)"
  ink: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.95 0.003 150)"
  border: "oklch(0.925 0.002 150)"
  ring: "oklch(0.55 0.2 145)"
typography:
  display:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.01em"
rounded:
  sm: "4px"
  md: "5px"
  lg: "6px"
  xl: "8px"
  2xl: "11px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  badge-success:
    backgroundColor: "oklch(0.63 0.17 149 / 0.15)"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "0px"
    padding: "12px 16px"
---

# Design System: Technocrat Stores Admin

> **Status:** resolved by
> [`issues/02-design-system.md`](../issues/02-design-system.md).
> Paste target once the clone exists: `technocrat-admin/DESIGN.md`.
> The token layer that implements this doc is
> [`02-globals.css`](02-globals.css).

## 0. What this is, and what it inherits

Technocrat admin is a **restyle of Blessing Computers admin**, not a new system.
The structure below — the four-tier type scale, the radius multipliers, the
canvas-and-card depth device, the tinted-chip status family — is carried over
verbatim because it is already proven in a dense staff tool and because
carrying it makes the restyle a *value swap* rather than a redesign.

What actually changes is small and specific:

| | Blessing admin | Technocrat admin |
|---|---|---|
| Brand hue | Maroon `oklch(0.56 0.229 29.3)` | **Green** `oklch(0.55 0.2 145)` |
| Second tier | Slate Navy | **Graphite** `#1F2937` |
| Third tier | Warm Gold (jewel accent) | **none — deleted** |
| Chart ramp | brand-only (maroon→gold→blue→green) | **five categorical families** |
| Active nav | tinted surface + brand text | **solid full-bleed fill + white text** |
| Everything else | — | unchanged |

**Sources and how they were weighed.** Two disagreed, and the split is by domain:

- **Figma `301:920`** (dashboard) and **`404:1729`** (sidebar) — the only two
  admin screens drawn. **These decide shape, surface, depth, and chrome.**
- **`technocrat-frontend/src/app/globals.css`** — the shipped storefront.
  **This decides hue.** Its shape tokens are explicitly rejected: `--radius:
  0.3725rem` is far too tight for the drawn admin, and its darker-card-on-
  lighter-canvas inverts the depth device the frames actually use.

**Two things in the Figma were deliberately NOT adopted.** Both frames are set
in **Inter**; this system stays on **Outfit**, matching the storefront and
letting Blessing's entire type scale carry over untouched — the Inter reads as
an unchanged default rather than a decision, since Technocrat's own storefront
is already Outfit. The frames also use **all-caps tracked section labels**
(`MAIN`, `ADMIN`) in the sidebar, which Blessing's Label rule bans; here they
are permitted **in sidebar section headers only** (see §5).

## 1. Overview

**Creative North Star: "The Operator's Cockpit, in green."**

A calm, instrument-dense control surface for staff who run the business all day.
Every status, count, and action legible at a glance — colored badges read like
gauges, one saturated green marks the single action that matters on a screen,
and the near-white canvas lets cards and chrome pop like lit panels. The tool
shares the storefront's identity (Technocrat Green, Outfit) but spends it
entirely in service of the work: throughput, accuracy, low friction, never
spectacle.

Restraint here is tuned for density. Surfaces stay quiet so the data is loud;
rows are compact, padding is disciplined, and status is carried by a tight
family of tinted badges rather than by decoration. It is **not** a cold
enterprise admin, **not** a generic template-SaaS card-grid dashboard, **not** a
cluttered back-office, and **not** flashy gamer/RGB styling.

**Key characteristics:**
- Near-white canvas + white cards + a crisp hairline — the core depth device.
  (Amended by ticket 07: the resting shadow was removed. See §4.)
- **One** brand hue. No jewel tier, no secondary accent competing for the eye.
- Status is a system: success / warning / danger / info as tinted chips.
- A single type family (Outfit) at compact sizes; hierarchy from weight.
- Chrome is white and quiet; the active nav row is the loudest thing in it.

## 2. Colors

### Primary
- **Technocrat Green** `oklch(0.55 0.2 145)`: The brand. Owns the one real
  action per screen — primary buttons, the active nav row, the focus/selection
  ring, and the hero chart series. Text on green is `oklch(0.99 0 0)`.

### Secondary
- **Graphite** `oklch(0.2795 0.0296 264)` (the frames' `Secondary/main`
  `#1F2937`): Secondary buttons and grounding emphasis where green would
  over-claim. Also the hue the entire dark theme is built on.

### Status
- **Success** `oklch(0.63 0.17 149)`: Delivered, paid, healthy. As a badge, a
  15% tint with same-hue text — exactly the frame's `Delivered` chip.
- **Warning** `oklch(0.68 0.16 65)`: Pending, needs attention.
- **Info** `oklch(0.55 0.13 245)`: Neutral informational state. Shares the
  chart ramp's blue so an info chip and an info series agree.
- **Destructive** `oklch(0.577 0.245 27.325)`: Errors, destructive actions,
  negative trend arrows.

### Neutral
- **Canvas** `oklch(0.972 0.002 150)`: The app background — tinted toward the
  brand hue at chroma 0.002, enough that white cards read as lit panels,
  not enough to register as "green".
- **Card White** `oklch(1 0 0)`: Cards, popovers, sidebar/topbar chrome.
- **Ink** `oklch(0.145 0 0)`: Primary text.
- **Muted Gray** `oklch(0.556 0 0)`: Secondary and placeholder text — the
  darkest "muted" allowed and the text floor. Never lighter for text.
- **Stone** `oklch(0.325 0.005 75)`: Sidebar nav label ink — the frame's warm
  `#343330`, deliberately softer than the cool content ink.
- **Hairline** `oklch(0.925 0.002 150)`: Borders and dividers.

### Data visualization
Five families, from the dashboard donut: **green → blue → orange-red →
periwinkle → charcoal**, regularised to an even lightness band so no slice
dominates and each lifts cleanly for dark mode. `chart-1` is the brand green
and is the hero for single-series charts (the revenue line in the frame).

This is **the one place the system leaves the brand hue**, and it is a
deliberate reversal of Blessing's brand-only ramp: a five-slice categorical
donut cannot be read in tints of a single green. Categorical encoding needs
distinct hues; everything else in the app does not.

### Named rules

**The Green-Owns-Action Rule.** Technocrat Green marks the one real action per
screen and the active state. If two things on a screen are green fills, one of
them is wrong.

**The Green-Does-Double-Duty Rule.** Unlike Blessing, the brand hue *is* the
success hue. They are separated by **lightness and by form**, never by
assuming the reader can tell two greens apart: an **action** is a solid green
fill; a **status** is a 15% tint with green text. Never render a success chip
as a solid fill, and never render a primary button as a tint — with one hue
carrying both meanings, form is the only thing keeping them apart.

**The Status-Token Rule.** Status uses `success` / `warning` / `destructive` /
`info`, always. Never hardcode an off-palette color for a state.

**The No-Jewel-Tier Rule.** There is no gold, and amber is not decorative — it
means "needs attention" and nothing else. When a KPI or highlight wants to
stand out, it earns it through weight, size, or position, not a fourth color.

## 3. Typography

**All type:** Outfit (with `ui-sans-serif, system-ui` fallback). `--font-sans`
and `--font-heading` both resolve to Outfit.

Scale carried from Blessing unchanged — Display (600, clamp(1.5rem, 3vw, 2rem)),
Headline (600, 1.25rem), Title (600, 1rem), Body (400, 0.875rem), Label
(500, 0.75rem). See the front-matter for exact metrics.

**The One-Family Rule.** Outfit only. Differentiate with weight (400 body,
500 UI, 600 headings) and size — never a second family "for hierarchy". This
is why the frames' Inter was not adopted.

## 4. Elevation

**Amended by ticket 07.** 02 carried Blessing's soft-lift device — every card
resting on a `shadow-soft`. Technocrat reverses that half: **a card at rest is
flat**, defined by a full-opacity hairline against the canvas. Shadow no longer
means "this is a card"; it means "this is genuinely raised".

- **Flat (resting card)** — no shadow; `border-border` at full opacity
- **Soft (raised / hover)** — `0 12px 32px -8px rgb(0 0 0 / 0.06)` (`shadow-soft`)
- **Soft-Large (overlays)** — `0 24px 56px -12px rgb(0 0 0 / 0.07)` (`shadow-soft-lg`)
  — dialogs, popovers, dropdowns: things that float over the page.

**A resting card carrying `shadow-soft` is now a defect**, and the greppable
acceptance check in §8 looks for exactly that.

**The Low-Opacity Rule.** Shadow opacity stays in the 6–7% range with a wide
spread. If the shadow reads gray, it is too dark. The Figma cards' shadows are
near-invisible, which is the same instinct.

**Radius.** `--radius: 0.3725rem` with Blessing's multipliers. **Amended by
ticket 07** — 02 kept Blessing's `0.5rem` base because it measured well against
frame `301:920`, and that measurement still holds. It was overturned because the
frame is *Blessing-shaped* (it was traced from Blessing's admin, exactly as the
sidebar frame was — see ADR-0016), so matching it guarantees the two admins
resemble each other. The base now matches **technocrat-frontend**, which makes
the shape read as *Technocrat's*, not merely as un-Blessing. Cards land at
`rounded-2xl` = 10.7px (was 14.4), controls at `rounded-md` = 4.8px (was 6.4).
The multipliers are untouched, so this is one line.

## 5. Components

Carried from Blessing unchanged except where noted.

- **Buttons** — 4.8px radius, 36px default height. Primary = green fill, white
  text. Secondary = graphite fill. Outline = white with hairline. Focus is a
  soft 3px green ring, never a hard outline. **No shadow, and no hover lift** —
  ticket 07 removed Blessing's `hover:-translate-y-[1px]`: a control on an
  instrument panel changes state, it does not rise to meet the cursor.
  Feedback is colour, on a 150ms `transition-colors`.
- **Badges** — fully rounded pill, 12px label, weight 500. Status chips are a
  15% tint with same-hue text. This is how operational state is read
  everywhere; the frame's `Delivered` chip is exactly this.
- **Cards** — `rounded-2xl` (10.7px), white, **full-opacity hairline, no resting
  shadow**, 24px padding. Call sites must not re-specify radius, border or
  shadow: ticket 07 stripped 91 such overrides precisely so the primitive stays
  the single place card shape is decided.
- **KPIs — `<StatsBar>` + `<Stat>`** (`components/shared/stats-bar.tsx`).
  **This is the default look for every KPI surface in the app**, not just list
  pages. A KPI row is **one ruled panel**, never N floating cards: cells butt
  together on a shared surface and the divider *is* the gap (`gap-px` over
  `bg-border`, which stays correct at every breakpoint, including the 2-column
  wrap where per-cell borders leave dangling edges).

  **The Joined-Panel Rule.** If two readings belong to the same instrument they
  share one surface. Never render a KPI as a standalone card, and ⚠️ **never put
  a `<Card>` inside a `<StatsBar>`** — `StatsBar` *is* a card, so a nested one
  draws its own radius and border and reads as a broken cell. This is the
  never-nest-a-card rule with teeth; it is checked in §8.

  Richer cells stay in the panel via the `footer` slot rather than forking a
  second card style — the dashboard's split ratio bars and breakdown rows all
  render through `<Stat>`. Supports `trend`, `description`, `badge`, `href`,
  `loading`, and 2–5 columns.

  Ticket 07 unified **nine** separate KPI implementations onto this: the four
  list-page stats bars, the dashboard's `KpiCard` and `KpiSplitCard`,
  `NewCustomersCard`, invoice, monitor, customer-detail and the uploader strip.
  **Exception from Blessing:** the frame's Leasing card nests inner cards and a
  tinted stats strip, breaking the never-nest-a-card rule. Permitted **only**
  for a card's own summary strip, never as a general layout device.
- **Inputs** — full-opacity hairline, faint muted fill at rest, 4.8px radius,
  36px height. Focus lifts to white with a soft green ring. The crisp border is
  what makes a field read as a slot cut into the panel.
- **Page header** (`components/shared/page-header.tsx`) — title + description,
  **ruled off with a bottom hairline**. Appears on all 62 routes, so it is the
  most-repeated piece of the surface language.
- **Tables** — compact rows in Body, headers in Label on a faintly tinted
  header row. State lives in badges, never colored row backgrounds.
- **Sidebar** (per Figma `404:1729`) — white, right hairline, sections labelled
  in small tracked caps (`MAIN`, `ADMIN`) — the one sanctioned exception to the
  no-eyebrows rule. Nav rows are icon + label at generous vertical rhythm.
  **The active row is a solid, full-bleed green rectangle with white text** —
  square, edge to edge, not an inset pill. Hover is a neutral lift, never
  green. Footer carries avatar + name + email + a settings control; the
  collapse control sits top-right by the wordmark.

  In token terms: **active = `sidebar-primary`, hover = `sidebar-accent`.**
  Blessing maps these the other way around (tinted accent surface carries the
  active state), so this is the one piece of chrome that cannot be
  value-swapped — it needs its component touched.

## 6. Do's and Don'ts

### Do
- **Do** reserve Technocrat Green for the one real action per screen and the
  active state — and let it be the focus ring.
- **Do** keep action-green and status-green apart by **form**: solid fill =
  action, 15% tint = status.
- **Do** build depth with canvas + white card + a crisp full-opacity hairline.
  Reserve `shadow-soft` for raised things and `shadow-soft-lg` for overlays.
- **Do** pair status color with an icon or text label so state never relies on
  color alone.
- **Do** keep it dense but legible: 14px body, compact rows, Muted Gray as the
  text floor.

### Don't
- **Don't** introduce a gold/jewel accent, or use amber for anything but
  warning. The system is deliberately one-hue.
- **Don't** use green for a neutral or secondary action — with one brand hue,
  every stray green fill dilutes the signal faster than it would in Blessing.
- **Don't** render the active nav row as a tinted pill; it is a solid
  full-bleed rectangle.
- **Don't** adopt Inter, or add a second family for hierarchy.
- **Don't** use all-caps tracked labels anywhere except sidebar section headers.
- **Don't** nest cards, except for a card's own summary strip — and **never**
  inside a `<StatsBar>`, which is itself a card.
- **Don't** build a bespoke KPI card. Every KPI goes through `<Stat>`; if it
  needs more, use the `footer` slot.
- **Don't** color entire table rows to signal state, and don't let a shadow
  read gray.
- **Don't** put a resting shadow on a card, or re-specify a card's radius,
  border or shadow at the call site. The primitive owns card shape.
- **Don't** reintroduce a hover lift on buttons or cards.
- **Don't** use `jewel` to signal state. It is decorative variety only —
  status is `success` / `warning` / `info` / `destructive`, always.

## 7. Known debt, inherited

The dark theme carries Blessing's measured lightness ladder verbatim, and with
it four AA failures that are **pre-existing, not introduced here**:
`text-primary`, `text-destructive` on solid fills, `text-info`, and status
colors used as text on their own 10% tint. The fix is the `-ink` text-only
token pattern (see the customer app's `globals.css`), which is a component-level
change rather than a token swap. Deliberately out of scope for this ticket —
it belongs with the restyle sweep, and it should be filed as its own ticket
when [Restyle batching](../issues/09-restyle-batching.md) cuts the work up.

**Status:** ticket 07 adopted the `-ink` model and made it sweep ticket #1.
See §8.

## 8. Scope of the restyle

Decided by [`07-restyle-depth.md`](../issues/07-restyle-depth.md).

### The depth decision

**Token swap + primitive reshaping. No per-screen redesign.**

Layouts stay Blessing's; the *surface language* becomes Technocrat's. This is
affordable because the app is genuinely token-driven — before the sweep began
there were **three** hardcoded colour values in 62 routes — and because ~63
routes are composed from ~20 primitives, so six files reach every screen.

Per-screen redesign was rejected: Technocrat's operations are identical to
Blessing's by definition, so a screen that is right for one is right for the
other. Only two exceptions are sanctioned, both because the *component* was
wrong rather than the layout: the sidebar's active row (ADR-0016) and the
list-page stats strip (§5).

**The Figma is not the source of difference.** Frames `301:920` and `404:1729`
were traced from Blessing's admin — ADR-0016 established this for the sidebar,
and §4's radius measurement showed the same for the dashboard. Following them
faithfully would guarantee the two admins resemble each other. Where this
document deviates from the frames, that is deliberate and recorded.

### What the sweep actually is

Defect-shaped, not route-shaped. Each unit cuts *across* routes, which is the
input [Restyle batching](../issues/09-restyle-batching.md) needs: **batch by
defect class, not by slice or route.**

| # | Class | Size | Status |
|---|---|---|---|
| 0 | Restore dropped `globals.css` tail | 1 file | **done (07)** |
| 1 | Surface language: `--radius` + 6 primitives | 7 files | **done (07)** |
| 2 | Strip local Card shape overrides | 91 tags / 72 files | **done (07)** |
| 3 | `gold` → `jewel`, repointed to chart-4 | 15 sites | **done (07)** |
| 4 | `<StatsBar>` as the app-wide KPI default | 9 implementations → 1 | **done (07)** |
| 5 | `-ink` migration (4 roles) | ~401 sites + 8 pinned | open |
| 6 | `<FieldLabel>` (kill tracked-caps eyebrows) | 294 sites / 138 files | open |
| 7 | `<FilterBar>` extraction + dock into table surface | 8 copies / 1166 lines | open |

### Is DESIGN.md enforced or aspirational?

**Enforced.** Every rule in this document is true of the code, or has an open
ticket above that makes it true. The failure mode being avoided is the customer
app's, which bans tracked-caps eyebrows and then uses them ~164 times.

Two consequences, both deliberate:

- **A rule we would not enforce does not go in this document.** Direction that
  isn't a contract belongs in `PRODUCT.md`.
- **New code must not add to an open ticket's debt.** `stats-bar.tsx` ships
  sentence-case labels today even though ticket 6 hasn't run, because writing
  fresh violations and promising to sweep them later is how 164 happens.

### Per-screen acceptance checklist

Every item is a command, so a session can self-check without asking. Run from
`technocrat-admin/`.

Numbers below are **verified as of ticket 07**, not aspirations. Where a count
is non-zero the reason is stated; a check with no stated exception must be 0.

```bash
# 1. No reference to the deleted jewel tier survives.  EXPECT 0
grep -rn "gold" src --include=*.tsx --include=*.ts | grep -v design-preview
#    (Case-sensitive on purpose: the backend loyalty tiers "GOLD"/"Gold +
#     Platinum" are real data and must never be renamed.)

# 2. No hover lift on a card or control.  EXPECT 0
grep -rn "hover:-translate-y" src --include=*.tsx | grep -v "group-hover"
#    (`group-hover:-translate-y` on an arrow glyph is a nudge, not a lift, and
#     is allowed — hence the exclusion.)

# 3. Card shape is decided by the primitive, not the call site.  EXPECT 0
grep -rEn '<Card[^>]*(rounded-|shadow-|border-border/)' src --include=*.tsx
#    NOTE: do NOT use `grep -A2` here. It matches nested icon-chip divs on the
#    following line and reports ~9 false positives. Only the Card tag counts.

# 3b. No <Card> nested inside a <StatsBar> (the Joined-Panel Rule).  EXPECT none.
python - <<'PY'
import re, pathlib
for p in sorted(pathlib.Path("src").rglob("*.tsx")):
    t = p.read_text(encoding="utf-8")
    for m in re.finditer(r"<StatsBar[^>]*>(.*?)</StatsBar>", t, re.S):
        if "<Card" in m.group(1):
            print(f"NESTED CARD {p.as_posix()}:{t[:m.start()].count(chr(10))+1}")
print("scan complete")
PY

# 3c. Hand-rolled card divs must not carry a resting shadow either.  EXPECT 0.
#     (`shadow-soft-lg` on an overlay — popover, dropdown — is correct and is
#      excluded. Check 3 only sees <Card> tags; this catches the bare divs.)
grep -rEn 'className="[^"]*bg-card[^"]*shadow-soft(-lg)?[^"]*"' src --include=*.tsx | grep -v "shadow-soft-lg"

# 4. Raw colour values.  EXPECT 3 hits across 2 files, both known:
grep -rEn "#[0-9a-fA-F]{6}|oklch\(" src --include=*.tsx
#    - app/design-preview/page.tsx — stale Blessing-era scratch route; its
#      purpose (locking the sidebar) closed with ADR-0016. Delete it, don't fix it.
#    - chat/components/chat-toast.tsx — `#25D366` is WhatsApp's brand mark.
#      Legitimately off-palette, but it wants a `--whatsapp` token like the
#      customer app has. Currently untokenised.

# 5. Named Tailwind palette hues.  EXPECT 14 — open debt, must not RISE.
grep -rEn "\b(bg|text|border)-(sky|amber|emerald|rose|slate|zinc|indigo)-[0-9]" src --include=*.tsx

# 6. Eyebrows outside the sidebar.  EXPECT 280 — sweep ticket 6; must not RISE.
grep -rEn "uppercase[^\"]*tracking|tracking[^\"]*uppercase" src --include=*.tsx | grep -v "components/layouts/sidebar"

# 7. Brand hue as text, pending -ink.  EXPECT ~396 — sweep ticket 5; must not RISE.
grep -rEn "text-(primary|destructive|info)\b" src --include=*.tsx

# 8. Gates that must be green.
npm run build     # 62/62 pages
npm test          # 15 files, 92/92  (a partial run showing 8 files / 63 tests is
                  #                   a flaky timeout, not a regression — re-run)
npm run lint      # 5 errors + 1 warning — INHERITED from admin-blessingcomputers,
                  # byte-identical. Not clone breakage; do not "fix" as part of a
                  # restyle ticket.
npx tsc --noEmit  # clean
```

**What grep cannot see** — layout, rhythm, contrast in dark mode, and whether a
screen still reads correctly. That is covered by a **batched check-and-expect
list handed to the user per defect class**, not per screen, and not by driving a
browser. See the standing preferences in the map.

### Traps

- **Tailwind 4 `@utility`.** A custom class defined as a plain `.foo {}` will
  not accept variants (`hover:foo`, `dark:foo`) — it must be declared with
  `@utility`. Currently moot: `globals.css` defines **no** hand-written
  utilities, and the theme's `--shadow-*` / `--color-*` entries generate
  variant-capable utilities automatically. It becomes live the moment someone
  adds a bare class. Prefer a component (as `<FieldLabel>` and `<StatsBar>` do).
- **The `globals.css` tail.** `@layer base` is the only thing applying Outfit,
  the canvas background, and the hairline border colour. Ticket 06 dropped it
  while pasting the token block and **nothing failed** — the build stayed green
  and 92/92 passed, because CSS does not error. If the app ever looks
  unaccountably wrong in font, background and every border at once, check the
  tail before anything else.
- **`Gold`/`Platinum` are backend loyalty-tier names**, not the deleted colour
  token. Never let a `gold` rename touch them.
