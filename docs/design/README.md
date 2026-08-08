# Admin UI design system (living spec)

Source of truth for the admin app's visual language. The **designer's comps are
canonical**; this doc systematizes them into tokens + component rules and records
the extensions engineering makes where she hasn't drawn. Decision rationale lives
in [ADR-0009](../adr/0009-admin-ui-design-system.md).

## Reference comps

- `invoice-ui.png` — the canonical screen. Drives layout, table, KPI cards,
  badges, pagination, chrome.
- `blessing-design-system.png` — her palette ramps (black/gray, gold, red→maroon,
  green), typography scale (Title/Header1/2/3), and maroon button states.

## Palette

| Role | Color | Notes |
|------|-------|-------|
| **Primary** | Maroon | Primary actions, active nav, focus rings. Comp's blush table-header = ~5% tint. |
| **Secondary** | Blue/navy | Non-primary highlights. Comp's bright-blue edge = hover/active detail. |
| **Accent** | Gold/yellow | Sparingly — emphasis, highlights. |
| **Success** | Green | `Paid`, `In house` badges. **New token — not yet in `globals.css`.** |
| **Warning** | Amber | `Pending Quotes`, `Outsourced` badges. **New token.** |
| **Destructive** | Red | `Awaiting payment`, `Pending`, errors. Exists today. |

### Token source: port-then-tune

Seed `src/app/globals.css` from `blessingcomputers/src/app/globals.css`, which
already encodes this system in oklch for both themes, then tune to the comp:

| Token | Light (from main app) | Dark |
|-------|----------------------|------|
| `--primary` | `oklch(0.4222 0.1434 18.8)` | `oklch(0.596 0.233 27.2)` |
| `--secondary` | `oklch(0.2781 0.0296 256.85)` | refine existing |
| `--accent` | `oklch(0.735 0.1462 84.27)` | refine existing |
| `--accent-foreground` | `oklch(0.2843 0.0562 83.83)` | refine existing |
| `--destructive` | `oklch(0.577 0.245 27.325)` | refine existing |
| `--success` / `--warning` | **TBD** (derive from her green/gold ramps) | TBD |

> The admin `globals.css` currently still has **generic shadcn colors** (bright-red
> primary, gray charts, neutral accent) — porting is real work. It also has a
> pre-existing **duplicate `--popover-foreground`** line in `:root` to clean up.

**Rules:** semantic tokens only — components never hardcode a raw color. Both
themes swap the same variable names. Comp-specific surfaces (blush header, KPI
icon-chip tints, badge pills, card radius/shadow) are encoded as tokens.

## Theming

- Light **and** dark, both shipped. Mount the dormant `ThemeProvider` in the root
  layout.
- Toggle = **binary sun/moon** (not a select). `next-themes` with
  `defaultTheme="system"` + `enableSystem`; read `resolvedTheme` for the icon,
  `setTheme("light"|"dark")` to flip. Explicit choice persists.
- Dark = refine the existing `.dark` tokens; needs sign-off.

## Components

- **Keep shadcn**, re-skin via the token layer. No primitive swap.
- Tune variants (radius, shadow, font-weight, density) to the comp — generous
  radius, fully-rounded pills, soft card shadows on a light-gray canvas.

## Icons

- **Iconify, app-wide, offline-bundled** (`@iconify/react` + `@iconify-json/*`).
  Remove `lucide-react` once migrated (`lucide:*` covers carryover).
- **Nav = Solar set**, per-item `icon` (linear, inactive) + `iconActive` (bold,
  active). Both serializable strings in `src/config/nav.ts` → drop the current
  `ICONS` Lucide map in the sidebar; render `<Icon icon={...} />`.
- Other sets only when Solar lacks a good glyph — note it here when used.

## Layout / sidebar

- **Chrome (sidebar + topbar) share `--sidebar`** (topbar uses `bg-sidebar`, no
  translucency) — **white** in light, and in dark a shade **slightly lighter &
  more muted than the cards** (no tint). Content canvas is a slight cool gray so
  the white chrome and cards pop.
- Active nav = maroon (primary) surface + Solar **bold**; inactive = muted + Solar
  **linear**. Active stays maroon in both themes.
- `/analytics` is **removed from the nav** (route/view kept dormant).

## Typography

- Font: **Outfit** (already wired). Map her Title/Header1/2/3 scale to heading
  tokens during the foundation pass.

## Responsive

Desktop-first; graceful to tablet; mobile via the existing sidebar sheet. It's an
internal staff tool.

## Verification ("done")

Matches this spec · verified **light and dark** · `tsc` + `lint` + `next build`
green · Vercel preview for auth/data flows.

## Open / to confirm with designer

- Exact `--success` / `--warning` values (derive from her ramps, confirm).
- Dark palette refinements (sign-off).
- Sidebar tint hue (maroon vs secondary vs accent) — pending mockups.
