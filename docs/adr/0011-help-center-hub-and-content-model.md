# The Help Center becomes an in-app documentation reference for every admin operation

Today `/help` is a one-doc stub: a flat two-column card grid ([[help-index-view]])
driven by a `helpDocs` registry ([[help-docs]]) that holds a single entry —
*Uploading & Managing Parts*. The goal is a real, in-app operations manual that
covers **every** admin operation (catalogue, pricing, orders, customers,
invoices, inventory, chat, RBAC, uploads, socials, security, bank accounts,
settings) so staff can self-serve instead of asking a colleague or the tech team.

The three Pikkam pages were shared as **inspiration along three lenses — UI,
Layout, and Structure** — for the help surface. We are not copying them; we take
what each does well on those three axes and **adapt it creatively** into what
we're building, in the admin's own identity: maroon/navy/gold tokens, `Outfit`,
Solar icons, light + dark ([[0009]]). The three lenses, read once and applied
across all three ADRs:

- **UI** — the component treatments worth borrowing: a welcoming hero, category
  cards, prominent search, callout/tip boxes, numbered step markers, before/after
  comparison cards, requirement checklists, do/don't columns. We rebuild these as
  admin-native components (the Doc Kit), not lifted markup.
- **Layout** — how a page is arranged: the hub as a scannable category grid; a
  guide as a single readable column with a clear top-to-bottom flow; standards as
  paired visuals and side-by-side comparisons.
- **Structure** — the information architecture: progressive disclosure (broad
  categories → specific topics → detail), and the sequencing of a guide
  (orient → steps/rules → validate → reference).

The help center is a reading/reference surface, not a dense data table, so a
warmer, more composed treatment than the rest of the admin is right here — and
the register ([[`PRODUCT.md`]]) still moderates it: our brand, our plain
operational voice, never Pikkam's green art or marketing superlatives. How each
page informs our work:

- **`/help-center`** → the hub: hero band, category **bento mosaic**, search, a
  trust/safety band, and a do's/don'ts framework. **This ADR owns it.**
- **`/how-to-sell`** → task walkthroughs as **bento step-card mosaics** → **[[0012]]**.
- **`/photo-tips`** → standards / golden-rules / before-after guides → **[[0013]]**.

The concrete anatomy below is **read from the Pikkam source**, which lives
locally at `pikkamV2/src/components/features/{help,how-to-sell,photo-tips}/`
(a separate, read-only reference repo — never coupled to ours). It is materially
richer than the pages' rendered summaries suggest, and the teardown drives the
layout decisions in all three ADRs.

This ADR is the spine: it decides the **hub redesign**, the **content model**,
the shared **Doc Kit**, **search**, and **permission-aware relevance**. The two
guide-type ADRs plug their content into what this one establishes. It also holds
the **master coverage map** — the backlog the other ADRs draw from — so the
whole effort can be done a few guides at a time across sessions.

## What we borrow, and how we adapt it

- **Borrow the ideas** (UI / Layout / Structure): a welcoming hero, category-card
  sections, prominent search, a trust/safety band, the do's/don'ts framework, and
  — in the guides — numbered steps and before/after comparisons ([[0012]],
  [[0013]]). These are the moves worth taking; the point is the *idea*, not the
  pixels.
- **Adapt them creatively to us.** Rebuilt as admin-native Doc Kit components in
  maroon/navy/gold, `Outfit`, Solar icons, and plain operational copy ([[0009]]).
  Pikkam's green abstract art, aspirational taglines ("your image is your
  handshake"), and Login/Sign-up chrome are dropped, not translated. The hero is
  a maroon-tinted panel (the existing [[doc-shell]] treatment), not
  photographic/gradient art. Where our domain differs, our version wins — we're
  not bound to Pikkam's exact sections.
- **Not** a CMS. Content stays as versioned React docs composed from the Doc Kit
  (like the existing part-upload doc), reviewed in PRs — not a database.
- **Not** security. Permission-aware rendering here is *relevance*, not access
  control; help content isn't sensitive. Frontend gating only ([[0001]]).

## Reference teardown (from `pikkamV2/` source)

What the three pages actually do, read from source — the shared DNA is the same
across all three and is the real thing to adapt:

- **Full-bleed dramatic hero.** Dark gradient or photographic background, a large
  eyebrow (accent line + tracked label), an oversized `font-black`/extrabold
  heading (Pikkam runs up to `9xl`), a lead paragraph, and a pill CTA. `photo-tips`
  layers a rotated product-image card + circular "certified" badge.
- **Bento / asymmetric mosaic, not a uniform grid.** The signature layout on all
  three (help `SupportCategories`, how-to-sell `StepsSection`, photo-tips
  `CompositionSection`): a 12-col grid mixing `col-span-7/5/4/12` tiles of varied
  size and treatment.
- **Varied card treatments in one grid:** muted cards, **inverted dark cards**
  (`bg-primary` / deep green), white elevated cards, accent-bordered cards, and a
  **giant faded background icon** (`opacity-5–10`, `size-60`+) bleeding off a
  corner. Numbered steps put the number in a **rounded-tile badge inside each
  card**, not on a connecting spine.
- **Image / illustration driven:** split image+content panels, `grayscale→color`
  and `scale-110` hovers, `mix-blend-multiply`, staggered vertical offsets
  (`pt-12`) between adjacent cards, giant faded watermark numbers (`text-9xl
  text-white/5`).
- **Before/after comparison:** two columns — a `destructive`-bordered grayscale
  "Common Mistakes" vs a `primary`-bordered "Ready", each with a bulleted list.
- **CTA band:** dark `rounded-[3rem]` section, radial glow, a pulsing concentric
  graphic, "New Feature / Powered by …" eyebrow.

### Register guardrails (how we tone it for an admin)

The help center may be bolder than the rest of the admin (it's a reading surface,
so a *Committed* treatment is allowed — [[`PRODUCT.md`]] / product register), but
it stays a Blessing Computers tool, not a marketing site. So, deliberately:

- **Substitute the skin:** maroon/navy/gold for Pikkam's greens; **Solar** icons
  for Material Symbols; **our tokens** for every hardcoded hex; drop the
  photographic stock heroes for maroon-tinted panels (or real product imagery
  where we own it).
- **Cap the shout:** hero headings top out near the display scale ([[0009]]), not
  `9xl`; no gradient text; keep the eyebrow to hubs/landing guides, not above
  every section (avoid the tracked-eyebrow reflex).
- **Keep the good bones:** the bento mosaic, inverted cards, faded background
  icons, split panels, staggered offsets, before/after, and CTA bands all carry
  over — they read as *composed*, not noisy, when spent in our palette.
- **Accessibility holds:** WCAG AA contrast on tinted/inverted cards, state via
  icon+label never color alone, and `prefers-reduced-motion` alternatives for the
  scale/hover/pulse motion ([[`PRODUCT.md`]]).

## Decisions

- **Hub layout draws on `/help-center`, adapted to our operations.**
  `HelpIndexView` becomes:
  1. **Hero band** — a welcoming heading + subline ("Need a hand? Everything you
     need to run the shop is here"), on a maroon-tinted panel, with the search
     field inside or directly beneath it (Pikkam's welcome hero).
  2. **Search** — prominent, keyboard-focusable (see below).
  3. **Category bento mosaic** — not a uniform grid. Following Pikkam's
     `SupportCategories`, categories are laid out as an asymmetric 12-col mosaic
     that mixes tile sizes and treatments: a wide muted "hero category" tile with
     "popular topics" chips, an **inverted maroon** tile with a CTA, a compact
     centered tile, and a wide white tile with a giant faded background Solar
     icon. Categories mirror the nav groups ([[nav]]): *Catalogue & Pricing*,
     *Orders & Customers*, *Invoicing*, *Inventory*, *Communication*,
     *Administration*. The existing card (icon tile + category chip + title +
     description + arrow) is one treatment within the mosaic; the mosaic layout,
     inverted tiles, faded icons, and hero are new.
  4. **Trust/safety band** — a featured, visually distinct strip (Pikkam's
     red-tinted "Trust & Safety" badge → our `warning`/`destructive` tint)
     pointing to *Working responsibly* and the do's/don'ts, near the top.

- **Client-side search over the registry.** An inline, keyboard-focusable search
  input at the top of the hub filters docs by `title`, `description`, `keywords`,
  and `category` — instant, no backend, no network. Empty query shows the full
  grouped hub; a query flattens to a ranked result list. Matches the product
  register's "the tool disappears into the task": one input, no modal. (A future
  `⌘K` command-palette entry can reuse the same index; out of scope here.)

- **Extend the content model, keep it pure data.** `HelpDoc` ([[help-types]])
  gains:
  - `keywords: string[]` — search synonyms (e.g. "SKU", "stock", "refund").
  - `type: "walkthrough" | "standards" | "reference"` — which guide pattern the
    doc uses; drives an at-a-glance badge and lets [[0012]]/[[0013]] filter.
  - `requiredPermissions?: string[]` — RBAC keys (same vocabulary as [[nav]]);
    absent = everyone. Powers permission-aware relevance below.
  - `updated?: string` — ISO date, shown as "Updated <date>" so staff can trust
    freshness.
  The registry stays import-free except its type — `config` may import `types`
  only, and icons remain Solar name strings, preserving the server→client prop
  boundary ([[0002]]).

- **Formalize the Doc Kit — content pieces + layout primitives.** The helpers
  currently inlined at the bottom of `uploading-parts-doc.tsx` — `Section`,
  `Path`, `Steps`, `Tile`, `MiniCard`, `Callout`, `FieldTable` — are promoted
  into a shared `features/help/components/doc-kit/` and re-exported from the
  feature barrel, so every doc composes from **one** vocabulary (consistency over
  surprise — product register). `uploading-parts-doc.tsx` is refactored to import
  them (no visual change). The teardown adds a **layout tier** to the kit so the
  bento/editorial structure is reusable rather than re-hand-rolled per page:
  - `DocHero` — the eyebrow + oversized-but-capped heading + lead + optional CTA
    band (maroon-tinted, no stock photo).
  - `Bento` / `BentoTile` — the asymmetric 12-col mosaic and its `span`/`tone`
    tiles (`muted` | `inverted` | `card` | `accent`), with an optional
    `bgIcon` slot for the giant faded Solar glyph.
  - `Eyebrow` — accent-line + label, used sparingly per the guardrails.
  [[0012]] and [[0013]] add their own content pieces (numbered step cards,
  `Compare`, `RuleList`, `Checklist`, `DosDonts`) on top of this same tier rather
  than re-inventing components per doc.

- **Permission-aware relevance.** The hub, and the topbar Help dropdown, show
  only docs whose `requiredPermissions` the viewer satisfies (reuse the same
  RBAC check the sidebar uses to gate [[nav]] items). A sales agent shouldn't
  wade past RBAC-admin guides to find order guides. Docs with no
  `requiredPermissions` (e.g. Settings, Getting Started) show for everyone. This
  is presentation relevance, not gating ([[0001]]) — the routes stay reachable.

- **A "Getting started / Working responsibly" pair anchors the hub.** Two
  always-visible, permission-free entries: a short **Getting started** orientation
  (the shell, sidebar drawer [[0010]], roles & permissions at a glance, theme
  toggle, search) and a **Working responsibly** standards doc (the trust/safety
  analog — customer-data care, least-privilege, IP-block recovery pointer). The
  latter is authored under [[0013]]; the hub just features it near the top like
  Pikkam's trust/safety band.

- **Contextual "Learn how" entry points (progressive).** Individual operation
  screens may link to their guide via a small, unobtrusive "Learn how" link that
  deep-links to `/help/<slug>` (and later to an anchor within it). Not required
  for the hub to ship; added per-screen as guides land. Keeps help one click from
  the work instead of a separate destination.

- **Keep the support footer, make its target configurable.** `DocShell`'s "Still
  stuck?" block stays, but the contact target (system admin / tech team, and
  later a link into internal Chat) comes from config rather than hard-coded prose,
  so it can evolve without touching every doc.

## Master coverage map

The full operation inventory. Each row is owned by a guide-type ADR and tracked
to done there; this table is the single source of truth for "have we covered
everything." `W` = walkthrough ([[0012]]), `S` = standards ([[0013]]),
`R` = reference/orientation.

| Operation | Hub category | Type | Owner | Status |
| --- | --- | --- | --- | --- |
| Getting started (shell, roles, search, theme) | Administration | R | 0011 | ☐ |
| Uploading & managing parts | Catalogue & Pricing | W | 0012 | ✅ (exists) |
| Adding & editing products | Catalogue & Pricing | W | 0012 | ☐ |
| Bulk product upload (AI smart-paste) | Catalogue & Pricing | W | 0012 | ☐ |
| Categories, brands & taxonomy | Catalogue & Pricing | W | 0012 | ☐ |
| Pricing: markup rules | Catalogue & Pricing | W | 0012 | ☐ |
| Pricing: tax rules | Catalogue & Pricing | W | 0012 | ☐ |
| Processing orders (gateway + manual) | Orders & Customers | W | 0012 | ☐ |
| Customers & customer detail | Orders & Customers | W | 0012 | ☐ |
| Bank accounts & checkout config | Orders & Customers | W | 0012 | ☐ |
| Manual invoices (create) | Invoicing | W | 0012 | ☐ |
| Invoice review (pending / rejected) | Invoicing | W | 0012 | ☐ |
| Inventory management | Inventory | W | 0012 | ☐ |
| Customer chat (assignment, replies) | Communication | W | 0012 | ☐ |
| Socials | Communication | W | 0012 | ☐ |
| Users & roles (RBAC) | Administration | W | 0012 | ☐ |
| Staff uploads & upload analytics | Administration | W | 0012 | ☐ |
| Security (IP blocks, emergency unblock) | Administration | W | 0012 | ☐ |
| Settings | Administration | W | 0012 | ☐ |
| Working responsibly (data, least-privilege) | Administration | S | 0013 | ☐ |
| Product & parts photography | Catalogue & Pricing | S | 0013 | ☐ |
| Writing good listings (titles, specs) | Catalogue & Pricing | S | 0013 | ☐ |
| Pricing hygiene (preview-before-apply) | Catalogue & Pricing | S | 0013 | ☐ |
| Order-handling standards (SLAs, outsourcing) | Orders & Customers | S | 0013 | ☐ |
| Chat etiquette & response standards | Communication | S | 0013 | ☐ |
| Invoice accuracy standards | Invoicing | S | 0013 | ☐ |

## Sequencing

1. **Foundation (this ADR):** extend `HelpDoc`, extract the Doc Kit, rebuild
   `HelpIndexView` (categories + search), add permission-aware filtering, author
   *Getting started*. Ship with the one existing doc re-registered under the new
   model. `tsc` + `lint` + `next build` green; verify light **and** dark ([[0009]]).
2. **[[0012]] walkthroughs** — a few per session, top-down by the map above.
3. **[[0013]] standards** — the quality guides, photography first (most literal
   Pikkam adoption).

Each doc is "done" when it composes only Doc Kit pieces, reads for non-technical
staff, is registered with `keywords` + `requiredPermissions` + `updated`, and
renders correctly in both themes.

## Consequences

- `uploading-parts-doc.tsx` is refactored to consume the extracted Doc Kit — a
  behavior-preserving change reviewed alongside the foundation, not a rewrite.
- The registry grows from 1 to ~26 entries over many sessions; the map above is
  the checklist that keeps "cover all admin operations" honest and visible.
- Permission-aware relevance means QA must sanity-check the hub under more than
  one role (e.g. a sales agent vs a super admin) — a small, deliberate cost.
- The hub's hero, search, and grouping are the new surface; the rest is content.
  Reviewers should treat a hub that clearly took its cues from `/help-center` —
  hero, category sections, search, trust band — but is rebuilt in the admin's
  maroon/gold identity and adapted to our operations as **correct** per this ADR.
  The test is "did we adopt the good ideas well," not "does it match Pikkam."
