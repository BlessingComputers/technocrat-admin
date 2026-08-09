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
  primary-ink: "oklch(0.455 0.183 145)"
  secondary-ink: "oklch(0.2795 0.0296 264)"
  jewel-ink: "oklch(0.485 0.107 275)"
  success-ink: "oklch(0.47 0.146 149)"
  warning-ink: "oklch(0.5 0.134 65)"
  info-ink: "oklch(0.48 0.122 245)"
  destructive-ink: "oklch(0.467 0.221 27.325)"
  whatsapp: "oklch(0.76 0.17 152)"
  whatsapp-foreground: "oklch(0.29 0.08 152)"
  whatsapp-ink: "oklch(0.5 0.13 152)"
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

**The `-ink` Rule (text vs surface).** Every brand and status role exists twice:
**`-foreground`** is text ON that color as a solid surface — pinned, does **not**
flip between themes. **`-ink`** is that color used AS text, on the page, a card, or
a low-alpha tint — it **must** flip. The test is not which color it is, it is what
the text sits **on**. `bg-destructive text-white` does not flip;
`text-destructive-ink` on a form does.

Every `-ink` value in the front-matter is measured against the role's own 15% tint
over `--accent` (the hover surface — the lightest thing a chip can land on) and
clears 4.5:1. Before they existed, every status role failed AA as text: 2.35:1 to
4.30:1 in light, 2.81:1 to 3.37:1 in dark.

⚠️ **`--success-ink` sits only 4.2 OKLab units from `--primary-ink`**, and that is
deliberate — it is the Green-Does-Double-Duty Rule at the text layer. Status green
only ever appears inside a **labelled chip**; primary green as text is a link or an
emphasis. **Do not pull them apart by shifting the hue** — that reintroduces a second
brand green, which is exactly what the one-hue system forbids. Form separates them,
not hue.

⚠️ **A third case the two-name model does not cover: the *inverting* panel.**
`bg-foreground text-background` — the customer profile card and the order customer
card — is near-black in light mode and near-**white** in dark. No hue role can serve
it: `-ink` and the raw token are *both* light in dark mode, so in dark they land on a
white panel. Measured on that panel: `primary-ink` 3.04:1 light / **1.89:1** dark, `success-ink` 3.14:1 / **1.87:1**, and raw `primary` no better at 2.22:1 dark. **On an
inverting panel, text uses the background family only** (`text-background`, `/90`,
`/80`); the accent survives as a **tint fill** (`bg-primary/20`), never as text. Both
cards carry a comment. This is the mirror of the `DoDontColumn` case: pinned surface
→ raw token; inverting surface → no hue at all.

**The WhatsApp Mark — the one sanctioned third green.** `--whatsapp` is WhatsApp's
own channel green, a third-party **mark** rather than a palette role. It is the
single exception to the Green-Does-Double-Duty Rule above, and it earns that only
because recolouring it destroys what it communicates. It is a **surface** only
(2.01:1 on white): text on it is `-whatsapp-foreground`, WhatsApp-as-text is
`-whatsapp-ink`. Its whole surface area is the WhatsApp slice and the chat popup's
channel badge. Never reach for it as an accent, a status, or a stand-in for
`--primary` — at h 152 against primary's h 145 it will read as a botched brand
green, not as WhatsApp, anywhere it isn't clearly identifying the channel.

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
  ⚠️ The same defect also wears a **raw div**: surface + hairline + radius
  spelled out by hand is a card the primitive can't reach. Reach for `<Card>`.
  Legitimate exceptions only *look* like cards — floating menus, input chrome,
  full-height **grid** shells (`<Card>` is flex, so it cannot host
  `lg:grid-cols-[22rem_1fr]`) and anchor tiles. Checked as 3d in §8.
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
- **Labels — `<MetaLabel>`** (`components/shared/meta-label.tsx`). The Label
  role as a primitive: 12px / 500 / `0.01em`, sentence case. Every standalone
  caption — a key in a key/value row, a section kicker, a KPI cell's label —
  goes through it, including `<Stat>`'s. `tone` covers the pinned surfaces
  (`pinned` on `bg-primary`, `inverted` on the `bg-foreground` profile cards);
  `metaLabelVariants()` covers sites that must keep their element. ⚠️ It is
  **not** a form-control label — `components/ui/field.tsx` owns `FieldLabel`,
  which is `htmlFor`-bound. A status chip is a `<Badge>`, an empty state is body
  copy, and a heading is a heading: none of those are captions.
  **Label is a name, not a sentence.** Helper prose, empty states, timestamps
  and values that merely happen to be small and muted stay body copy —
  `MetaLabel` ships `leading-[1.2]`, a single-line device that turns wrapped
  prose cramped. ~26 sites per app match by class string and are deliberately
  left alone: **"its classes match" is not the test, "it names something" is.**
- **Column heads** — `<TableHead>` and every raw `<th>` take their type from
  `metaLabelVariants()` and add only padding and alignment. ⚠️ The primitive
  used to spell the role out by hand at **600**, and six call sites re-spelled
  it again on top — the same call-site-fighting-the-primitive defect the weight
  sweep found on `<Button>`. Column heads are 500 now; a header that looks light
  is the scale, not a regression.
- **12px is the floor.** No `text-[8px]`/`[9px]`/`[10px]`/`[11px]` anywhere.
  Checked as 6d in §8.
- **Filter bars — `<FilterBar>` / `<FilterSearch>`**
  (`components/shared/filter-bar.tsx`). Eight list pages had each rolled their
  own row, search field and status select, in three inconsistent spellings.
  ⚠️ **Every copy overrode the shape of the controls inside it** —
  `h-12 rounded-md border border-border bg-card focus:ring-primary/20` — which
  is the Card-override defect wearing a different tag, and `bg-card` at rest
  additionally cancels the input behaviour described just above. Filter controls
  now take their shape from `<Input>` / `<SelectTrigger>` and nothing else, so a
  filter field is **36px like every other field**, not 48px. `filterControlClass`
  sets width rhythm only.
  ⚠️ **Three copies lived outside any `*filter-bar.tsx` file** — inline
  `<SelectTrigger>`s in the monitor anomalies, monitor stats and payments DLQ
  list views — so the original filter-bar-scoped grep read clean while the drift
  was live. The check in §8 (3e) now scans all of `src`.
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
it four AA failures that were **pre-existing, not introduced here**:
`text-primary`, `text-destructive` on solid fills, `text-info`, and status
colors used as text on their own tint.

**Status: three of the four are fixed** (2026-08-09, sweep class B). The `-ink`
token layer landed in `globals.css` with measured values — see the `-ink` Rule
in §2 — and the call-site migration followed the same day: **409 sites across
183 files**.

Two sites are deliberately **not** migrated, and they are the rule's edge:
`DoDontColumn` in `help/components/help-index-view.tsx` sits inside a
`bg-secondary` panel, which is graphite in *both* themes. Raw `--success` /
`--destructive` stay bright either way (L 0.63 / 0.72) and read on graphite;
`-ink` (L 0.47 light) would go muddy. **On a pinned surface the raw token is the
correct choice, not the defect** — the component carries a comment saying so.
The other 3 residual hits are in `app/design-preview/`, the stale scratch route
§8 says to delete rather than fix.

**Still open, and it is not an `-ink` problem:** `bg-destructive text-white`
measures 2.89:1. Fixing it means moving `--destructive` **as a fill**, which
moves every destructive button and badge in the app. That is a deliberate design
change, not a token addition, and it needs its own decision.

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
| 5a | `-ink` **token layer** (7 roles, measured) | `globals.css` | **done (2026-08-09)** |
| 5b | `-ink` **call-site migration** | 409 sites / 183 files | **done (2026-08-09)** |
| 5c | `--whatsapp` triple (retires the literal `#25D366`) | `globals.css` + 1 site | **done (2026-08-09)** |
| 5d | Weight discipline — nothing above 600 | 216 + 188 sites | **done (2026-08-09)** |
| 6a | Kill the eyebrow device (caps + tracking, sub-12px sizes) | 263 class strings / 124 files | **done (2026-08-09)** |
| 6b | Headings dressed as eyebrows → the **Title** role | 30 sites / 26 files | **done (2026-08-09)** |
| 6c | `<MetaLabel>` adoption for the caption sites | 86 sites (71 + column heads + 2 pinned) | **done (2026-08-09)** |
| 6d | 12px floor — untracked sub-12px sizes 6a could not see | 44 sizes / 30 files | **done (2026-08-09)** |
| 7 | Hand-rolled card surfaces → `<Card>` | 40 divs / 29 files | **done (2026-08-09)** |
| 8a | `<FilterBar>` / `<FilterSearch>` extraction | 8 copies | **done (2026-08-09)** |
| 8b | Dock the filter bar into the table surface | 6 list views + 6 tables | open |

⚠️ Class 6 was specified as one primitive and is **three units**, because
surveying by enclosing tag showed six devices, not one. The dangerous third is
6b: 25 of those 30 are **card titles** that had merely been *styled* as
eyebrows. Wrapping them in a label primitive would have demoted every card title
in the app to 12px muted. **A heading that has been styled as an eyebrow is
still a heading** — it goes to Title (16px / 600 / `--foreground`), not to Label.

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

# 3d. A <Card> spelled out by hand — surface + hairline + radius on a raw div.
#     EXPECT 16, none of them content cards. The scan is deliberately WIDER than
#     a card hunt: it matches any element (div, Input, SelectTrigger, Link) that
#     paints surface + hairline + radius itself, because that is the shape a
#     hand-rolled card takes. The 16 survivors are, by kind:
#       - 3 floating menus  (item-scope-picker, existing-customer-select,
#                            tax-rule-form-dialog) — overlays, not cards.
#       - 3 form fields     (dashboard-date-filter, manual-field,
#                            manual-charges-summary) — input chrome.
#       - 2 workspace shells (chat-workspace-view, whatsapp-workspace-view) —
#                            full-height **grid** frames; <Card> is flex and
#                            cannot host `lg:grid-cols-[22rem_1fr]`.
#       - 2 link tiles      (quick-links-grid, help-index-view) — anchors.
#       - 6 small parts     (composer pill, invoice tab strip, delivery icon
#                            tile, product-parts row, bulk-parts progress
#                            strip, promotion-slide row).
#     ⚠️ A count of 9 was recorded here earlier in ticket 11 from a narrower
#     ACCEPT list; the number below is the one this exact script prints.
#     Anything ABOVE 16 is a new hand-roll — reach for <Card>.
python - <<'PY'
import re, pathlib
n = 0
for p in sorted(pathlib.Path("src").rglob("*.tsx")):
    if "design-preview" in p.as_posix() or p.name == "card.tsx":
        continue
    t = p.read_text(encoding="utf-8")
    for m in re.finditer(r'className="([^"]*)"', t):
        c = m.group(1)
        if "bg-card" in c and re.search(r"\bborder\b", c) and "rounded" in c:
            n += 1
            print(f"{p.as_posix()}:{t[:m.start()].count(chr(10))+1}  {c[:70]}")
print("hand-rolled surfaces:", n)
PY

# 3e. Filter controls must not re-specify their own shape.  EXPECT 0.
#     (`h-12` on a filter field was the app's most-copied primitive override.)
#     ⚠️ Scan ALL of src, not just *filter-bar.tsx: three copies of this exact
#     trigger lived in list views (monitor-anomalies, monitor-stats, payments
#     dlq), so a filter-bar-only grep reported 0 while the defect was live.
#     Use `filterControlClass` from components/shared/filter-bar.
grep -rn 'h-12! data-\[size=default\]:h-12' src --include=*.tsx

# 4. Raw colour values.  EXPECT 3 hits across 2 files, both known:
grep -rEn "#[0-9a-fA-F]{6}|oklch\(" src --include=*.tsx
#    - app/design-preview/page.tsx — stale Blessing-era scratch route; its
#      purpose (locking the sidebar) closed with ADR-0016. Delete it, don't fix it.
#    - chat/components/chat-toast.tsx — `#25D366` was WhatsApp's brand mark;
#      retired 2026-08-09 into the `--whatsapp` triple (see the WhatsApp Mark
#      rule in §2). If this hex reappears here, the token was bypassed.

# 5. Named Tailwind palette hues.  EXPECT 4 — all in app/design-preview/, the
#    stale scratch route §8 says to delete rather than fix. Swept 2026-08-09
#    (class A): was 14. Must not RISE.
grep -rEn "\b(bg|text|border)-(sky|amber|emerald|rose|slate|zinc|indigo|violet)-[0-9]" src --include=*.tsx

# 6a. Eyebrows outside the sidebar.  EXPECT 2 — both in app/design-preview/, the
#     stale scratch route. Was 263 before the 2026-08-09 sweep. Must not RISE.
grep -rEn "uppercase[^\"]*tracking|tracking[^\"]*uppercase" src --include=*.tsx | grep -v "components/layouts/sidebar"

# 6b. A heading still dressed as a caption (small + muted).  EXPECT 0.
#     Single-line tags only — a tag split across lines hides from this. The
#     authoritative pass is the parser in issues/11-restyle-sweep.md.
#     ⚠️ Do NOT widen this to `text-(xs|sm)` alone: ~31 sub-headings sit at
#     `text-sm font-semibold text-foreground` deliberately — a sub-heading
#     *inside* an already-titled surface, one step under Title. That is a
#     device, not debt.
grep -rEn '<(h[1-4]|CardTitle)[^>]*text-(xs|sm)[^>]*text-muted-foreground' src --include=*.tsx | grep -v design-preview

# 6c. Weight: nothing above 600.  EXPECT 2 — design-preview, plus the prose in
#     shared/meta-label.tsx's doc comment (it *describes* the dead device).
grep -rnE 'font-(black|extrabold|bold)|font-\[(7|8|9)00\]' src --include=*.tsx --include=*.ts

# 6d. The 12px floor.  EXPECT 1 — meta-label.tsx's doc comment, which *names*
#     the retired spellings. ⚠️ 6a only lifted sub-12px sizes inside class
#     strings that ALSO paired uppercase with tracking-*, so 44 untracked ones
#     survived every grep above. Same failure shape as the font-black-only and
#     filter-bar-scoped checks: a check scoped to where the defect was FOUND,
#     rather than where it can OCCUR, goes green by construction.
grep -rEn 'text-\[(8|9|10|11)px\]' src --include=*.tsx --include=*.ts | grep -v design-preview

# 6e. A column head spelling out the Label role instead of taking it.  EXPECT 0.
#     <TableHead> and every raw <th> use metaLabelVariants(); they add padding
#     and alignment only.
grep -rEn '<(th|TableHead)[^>]*className="[^"]*(text-xs|font-(medium|semibold)|text-muted-foreground)' src --include=*.tsx | grep -v design-preview

# 7. Brand/status hue as RAW text (the -ink Rule).  EXPECT 7 and no more:
#    3 in app/design-preview (stale scratch route — delete, don't fix), 4 in
#    help-index-view's DoDontColumn (pinned graphite panel — raw is CORRECT there).
#    ⚠️ This grep cannot see the opposite defect: an `-ink` on an INVERTING
#    (`bg-foreground text-background`) panel, where no hue works at all. See the
#    inverting-panel note in §2; the two cards involved carry comments.
#    Anything else is a regression. Note `-P`, not `-E`: a `\b` after the role
#    also matches `text-primary-ink` and `text-primary-foreground` and will
#    silently report ~400 successes as failures.
grep -rnoP 'text-(primary|secondary|destructive|info|success|warning|jewel)(?![-\w])' src --include=*.tsx

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
