---
name: Blessing Computers Admin
description: The Operator's Cockpit — a calm, legible operations tool for staff
colors:
  primary: "oklch(0.559998 0.229498 29.2768)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.2781 0.0296 256.85)"
  gold: "oklch(0.735 0.1462 84.27)"
  gold-foreground: "oklch(0.2843 0.0562 83.83)"
  success: "oklch(0.627 0.17 152)"
  warning: "oklch(0.68 0.16 65)"
  info: "oklch(0.5 0.12 256.85)"
  destructive: "oklch(0.577 0.245 27.325)"
  canvas: "oklch(0.97 0.003 256.85)"
  card: "oklch(1 0 0)"
  ink: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.95 0.004 256.85)"
  border: "oklch(0.922 0 0)"
  ring: "oklch(0.559998 0.229498 29.2768)"
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
  sm: "5px"
  md: "6px"
  lg: "8px"
  xl: "11px"
  2xl: "14px"
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
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-success:
    backgroundColor: "oklch(0.627 0.17 152 / 0.15)"
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
---

# Design System: Blessing Computers Admin

## 1. Overview

**Creative North Star: "The Operator's Cockpit"**

This is a calm, instrument-dense control surface for staff who run the business all
day. Every status, count, and action should be legible at a glance — colored badges
read like gauges, one deep brand maroon marks the single action that matters on a
screen, and the cool-gray canvas lets white cards and chrome pop like lit panels. The
tool shares the storefront's identity (Blessing Maroon, Warm Gold, Outfit) but spends
it entirely in service of the work: throughput, accuracy, and low friction, never
spectacle. It should feel competent and in control — the operator trusts it.

Restraint here is tuned for density. Surfaces stay quiet so the data is loud; rows are
compact, padding is disciplined, and status is carried by a tight family of tinted
badges rather than by decoration. The system explicitly rejects the tropes of internal
tooling. It is **not** a cold enterprise/government admin (sterile gray form-walls, no
brand presence), **not** a generic template-SaaS admin (interchangeable card-grid
dashboards, gradient accents, hero-metric clichés), **not** a cluttered, noisy
back-office (competing colors that bury the one action that matters), and **not** flashy
gamer/RGB styling. Gold stays a deliberate accent, never decoration.

**Key Characteristics:**
- A cool-gray canvas with white cards is the core depth device — lit panels on a desk.
- One saturated brand maroon owns real action; a tight semantic set carries status.
- Status is a system: success / warning / danger / info as tinted badges, never ad-hoc.
- A single type family (Outfit) at compact sizes; hierarchy from weight, not decoration.
- Refined and restrained, tuned for density: soft focus, subtle 1px hover lift.

## 2. Colors

A disciplined, near-neutral base (cool-gray canvas, white cards) carrying one brand
maroon for action and a small, semantic status family — no off-palette hues.

### Primary
- **Blessing Maroon** (oklch(0.559998 0.229498 29.2768)): The brand red. Owns the one
  real action per screen — primary buttons, active nav, focus/selection ring, and the
  hero chart series. Also the focus ring color (`--ring`), so focus reads as brand. Text
  on maroon is **On-Maroon White** (oklch(0.985 0 0)).

### Secondary
- **Slate Navy** (oklch(0.2781 0.0296 256.85)): Secondary buttons and grounding
  emphasis where maroon would over-claim.

### Tertiary
- **Warm Gold** (oklch(0.735 0.1462 84.27)): The premium accent — KPI chips and
  intentional highlights only. Its own token, never the primitives' hover slot. Text on
  gold is **Gold Ink** (oklch(0.2843 0.0562 83.83)).

### Status (semantic — a system, not decoration)
- **Success Green** (oklch(0.627 0.17 152)): Paid, in-house, healthy. As a badge, a 15%
  tint fill with green text.
- **Warning Amber** (oklch(0.68 0.16 65)): Pending, outsourced, needs attention.
- **Info Blue** (oklch(0.5 0.12 256.85)): Neutral informational state — the `--info`
  token, a lifted version of the navy secondary so it's legible in tinted chips.
- **Alert Red** (oklch(0.577 0.245 27.325)): Destructive actions, errors, awaiting
  payment.

### Neutral
- **Cool-Gray Canvas** (oklch(0.97 0.003 256.85)): The app background — a slight cool
  gray so white cards and chrome pop.
- **Card White** (oklch(1 0 0)): Cards, popovers, sidebar/topbar chrome.
- **Near-Black Ink** (oklch(0.145 0 0)): Primary text.
- **Muted Gray** (oklch(0.556 0 0)): Secondary and placeholder text — the darkest
  "muted" allowed; still clears 4.5:1 on white/canvas. Never lighter for text.
- **Cool Mist** (oklch(0.95 0.004 256.85)): The neutral hover/focus surface (shadcn
  `accent`) — kept neutral so hovers are never gold-tinted.
- **Hairline** (oklch(0.922 0 0)): Borders and dividers, usually at 60–70% opacity.

### Data Visualization
The chart ramp is strictly the brand palette, in order: **maroon (hero) → gold → blue
→ green → deep maroon** (oklch(0.42 0.15 29.2768)). No off-palette chart hues.

### Named Rules
**The Maroon-Owns-Action Rule.** Blessing Maroon marks the one real action per screen
and the active state. If two things on a screen are maroon, one of them is wrong.

**The Status-Token Rule.** Status uses the semantic tokens — `success`, `warning`,
`destructive`/`danger`, `info` — always. Never hardcode an off-palette color for a
state (e.g. `sky-*` for info); use `--info`. Colors carry meaning, so they must be
consistent and from the system.

**The Gold-As-Jewel Rule.** Gold is a rare accent (KPI chips, one highlight), never a
surface and never a hover. Its rarity is what keeps it premium.

## 3. Typography

**All type:** Outfit (with ui-sans-serif, system-ui fallback). `--font-sans` and
`--font-heading` both resolve to Outfit.

**Character:** One clean geometric-humanist sans at compact, operational sizes.
Hierarchy comes from weight and size, never a second family — this restraint is what
keeps a dense screen calm.

### Hierarchy
- **Display** (600, clamp(1.5rem, 3vw, 2rem), 1.15, -0.01em): Page titles. Modest by
  design — this is a tool, not a landing page; no oversized heroes.
- **Headline** (600, 1.25rem, 1.25): Section headers within a page.
- **Title** (600, 1rem, 1.3): Card titles, table group headers.
- **Body** (400, 0.875rem / 14px, 1.5): The workhorse size for rows, forms, and copy.
- **Label** (500, 0.75rem / 12px, 0.01em): Badges, column headers, meta. Weight 500
  carries it — no all-caps tracked eyebrows.

### Named Rules
**The One-Family Rule.** Outfit only. Differentiate with weight (400 body, 500 UI, 600
headings) and size — never introduce a second sans "for hierarchy".

## 4. Elevation

Soft-lift by default, on a cool-gray canvas. Depth here is a two-part device: the
cool-gray canvas sits behind **white cards that carry a resting `shadow-soft`**, so
cards read as lit panels floating just above the desk. This is the opposite of the
storefront's flat-by-default cards, and it's intentional — in a dense tool, the gentle
lift plus canvas contrast is what separates one surface from the next. Shadows stay
large-spread and very low opacity; a shadow that reads gray is too heavy.

### Shadow Vocabulary
- **Soft (resting card)** (`box-shadow: 0 12px 32px -8px rgb(0 0 0 / 0.06)`): The
  `shadow-soft` token. Default for cards and standing surfaces.
- **Soft-Large (raised)** (`box-shadow: 0 24px 56px -12px rgb(0 0 0 / 0.07)`): The
  `shadow-soft-lg` token. For modals, popovers, and the date-filter panel.

### Named Rules
**The Canvas-and-Card Rule.** Depth = cool-gray canvas + white card + soft shadow.
Reach for that trio before any heavier elevation. Chrome (sidebar/topbar) is white and
borderless against the canvas; cards are white with a hairline and a soft shadow.

**The Low-Opacity Rule.** Shadow opacity stays in the 6–7% range with a wide spread.
This is a control surface, not a gamer UI — if the shadow reads gray, it is too dark.

## 5. Components

Refined and restrained, tuned for density: compact rows, calm surfaces, a subtle 1px
hover lift, and a soft 3px focus ring in brand maroon.

### Buttons
- **Shape:** 6px radius (`rounded-md`), 36px default height (`h-9`), padding 8px 16px.
- **Primary:** Blessing Maroon fill, white text, weight 500, a faint `shadow-sm`. Hover
  darkens ~90% and lifts 1px; active returns to baseline.
- **Secondary:** Slate Navy fill, white text.
- **Outline:** White card background, hairline border at 70% opacity, ink text; hover
  fills Cool Mist.
- **Ghost / Link:** No fill; ghost hovers to Cool Mist, link is maroon with hover
  underline.
- **Focus:** Soft maroon ring (`ring-ring/50`, 3px) with a border shift — never a hard
  outline.
- **Sizes:** xs (24px) · sm (32px) · default (36px) · lg (40px), plus square icon
  variants at matching heights for toolbars and table row-actions.

### Badges (the status system — signature)
- **Shape:** Fully rounded pill (`rounded-full`), 12px label, weight 500, padding 2px 8px.
- **Brand:** default (maroon), secondary (navy) — solid fills for identity/emphasis.
- **Status (tinted chips):** success, warning, danger, info, muted — a **15% tint fill
  with same-hue text** (e.g. `bg-success/15 text-success`). This is the primary way
  operational state is read across orders, invoices, and inventory.
- **Structural:** outline (hairline + ink), ghost, link.

### Cards / Containers
- **Corner Style:** 14px radius (`rounded-2xl`).
- **Background:** Card White with a hairline border at ~60% opacity.
- **Shadow Strategy:** Ships `shadow-soft` at rest (see Elevation). Cards are meant to
  float above the canvas — do not remove the resting shadow.
- **Internal Padding:** 24px (`p-6`), 24px section gaps. Never nest a card in a card.

### Inputs / Fields
- **Style:** Hairline border (~60% opacity), a faint muted fill (`bg-muted/40`) at rest
  so fields read as recessed against white cards, 6px radius, 36px height.
- **Focus:** Background lifts to Card White, border shifts to maroon ring with a soft 3px
  `ring-ring/40` glow. Placeholder is Muted Gray (clears 4.5:1 — never lighter).
- **Error / Disabled:** `aria-invalid` shifts border/ring to Alert Red; disabled drops
  to 50% opacity.

### Navigation / Chrome
- **Sidebar + Topbar:** White (`--sidebar`) and borderless against the cool-gray canvas
  in light; a lighter muted shade in dark. Active nav item is Blessing Maroon in both
  themes (a maroon-tinted surface + maroon text/label). Keep the active-maroon signal
  consistent across breakpoints.

### Tables / Data (density-first)
- Compact rows in Body (14px); column headers in Label. State lives in status badges,
  not colored row backgrounds. Row hover uses Cool Mist. Right-align numerics; keep
  actions in a trailing icon-button cluster.

## 6. Do's and Don'ts

### Do:
- **Do** reserve Blessing Maroon (oklch(0.559998 0.229498 29.2768)) for the one real
  action per screen and the active state — and let it be the focus ring.
- **Do** carry status through the semantic tokens (success / warning / danger / info) as
  tinted badges — and pair color with an icon or text label so state never relies on
  color alone.
- **Do** build depth with the Canvas-and-Card trio: cool-gray canvas, white card,
  `shadow-soft`. Use `shadow-soft-lg` for modals/popovers.
- **Do** keep Warm Gold rare — KPI chips and single highlights, never a surface or hover.
- **Do** keep it dense but legible: 14px body, compact rows, Muted Gray as the text
  floor (still 4.5:1). Cap any long-form prose at 65–75ch.
- **Do** honor `prefers-reduced-motion`; keep transitions to color/shadow/1px lift.

### Don't:
- **Don't** make it a cold enterprise/government admin — no sterile gray form-walls with
  no brand presence.
- **Don't** make it a generic template-SaaS admin — no interchangeable card-grid
  dashboards, no gradient accents, no hero-metric template (big number + small label +
  gradient) as the default dashboard.
- **Don't** make it a cluttered, noisy back-office — never let competing colors or
  controls bury the one action that matters.
- **Don't** make it flashy gamer/RGB tech — no neon gradients, carbon-fiber, or angular
  styling.
- **Don't** hardcode off-palette status colors (e.g. `sky-500` for info) — use the
  `--info` token. *(The current `info` badge variant still uses `sky-*`; migrate it.)*
- **Don't** use gradient text, decorative glassmorphism, or side-stripe accent borders
  (`border-left` > 1px as a colored stripe). Full borders, solid color, weight for
  emphasis.
- **Don't** color entire table rows to signal state, and don't let a shadow read gray.
