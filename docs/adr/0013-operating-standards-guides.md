# Standards guides adapt the ideas behind Pikkam's "Photo Tips" page

Best-practice guides — "how to do it *right*" — take their cues from Pikkam's
`/photo-tips` page across the three lenses in [[0011]] (**UI, Layout,
Structure**) and adapt them **creatively** into the admin system ([[0009]]) — not
a re-skin. What's worth borrowing from that page:

- **UI** — a **requirements checklist** (its "Authentic Images / Zero Watermarks /
  Accurate Tones / Full Visibility" ticks), **numbered golden rules** with
  supporting imagery, technique tiles with paired visuals, and **before/after
  comparison** cards ("Common Mistakes" vs "Ready").
- **Layout** — paired visuals and side-by-side comparisons that let the reader
  *see* good vs bad, not just read about it.
- **Structure** — the persuasion arc: requirements → rules → technique →
  validation (before/after) → do/don't. It teaches by showing standards, then
  proving them.

We rebuild these as admin-native Doc Kit components in Blessing Computers'
identity and author our own domain content, diverging wherever our operations
differ from selling on a marketplace.

These are the `type: "standards"` rows of the [[0011]] coverage map — the
counterpart to the [[0012]] walkthroughs: not *how to click*, but *what "good"
looks like*. They lean on new Doc Kit pieces this ADR adds.

## Decisions

- **New Doc Kit components** (added under [[0011]]'s `doc-kit/`, on top of its
  `Bento` layout tier, our tokens, both themes). Modeled on the actual
  `/photo-tips` sections from the teardown ([[0011]]):
  - `Checklist` — the `EligibilitySection` pattern: a 1/3 heading + 2/3 grid of
    requirement cards (icon + title + desc, muted→white hover-lift), for
    non-negotiable "must-haves".
  - `RuleList` — the `LightingSection` pattern: numbered "golden rules" as a
    3-col set of cards with an image/illustration slot, a `Rule #n` chip, and a
    **staggered vertical offset** between adjacent cards; an optional giant faded
    watermark number sits behind the section heading.
  - `Compare` — the `BeforeAfterSection` element: a `destructive`-bordered
    grayscale "Common mistakes" column vs a `success`/`primary`-bordered "Ready"
    column, each with a bulleted list and a labelled icon header. The single most
    recognizable `/photo-tips` element; used for photography and listings.
  - `TechniqueBento` — the `CompositionSection` pattern: a mixed bento of a tall
    feature tile (image + overlaid copy), a split image+text tile, a small
    inverted accent tile, and an image-only tile. Reuses [[0011]]'s `Bento`.
  - `DosDonts` — the `SellingRules` two-column **DO / DON'T** framework: paired
    cards with a top accent (green/`success` vs red/`destructive`), numbered
    `01–0n` items, plus a `warning`-tinted "zero-tolerance"–style band.
  These join `Section` / `Callout` / `Tile` so standards docs stay in one
  vocabulary with the walkthroughs.

- **Layout takes its cues from `/photo-tips`, adapted per guide.** A typical arc:
  `DocHero` (editorial eyebrow + capped heading — Pikkam's oversized "The Art of
  the Listing" hero, toned to our display scale, maroon-tinted, no rotated stock
  photo unless we own the image) → `Checklist` (eligibility) → `RuleList` (golden
  rules) → `TechniqueBento` (composition) → `Compare` (before/after) → `DosDonts`
  → a closing CTA `Callout` (Pikkam's "Intelligent Optimization" AI promo becomes
  a pointer to our own AI helpers, e.g. smart-paste / image tools). This is a
  palette of moves, not a fixed template — each guide uses the pieces its subject
  needs, in our maroon/gold identity with a prescriptive-but-encouraging tone and
  the [[0011]] register guardrails (contrast, no gradient text, reduced motion).

- **Photography guide is the flagship, closest adoption.** *Product & parts
  photography* maps almost 1:1 onto `/photo-tips`: eligibility `Checklist`,
  lighting `RuleList`, composition `TechniqueBento`, and a Common-mistakes/Ready
  `Compare`. Build it first so the new Doc Kit pieces are proven on the closest
  analog — this is where "adopt creatively" is most visible.

- **The "Working responsibly" guide is the trust/safety analog.** Pikkam's
  help-center trust-&-safety + zero-tolerance band becomes an admin standards doc
  on customer-data care, least-privilege ([[0001]] mindset), and IP-block /2FA
  hygiene — featured near the top of the hub ([[0011]]). Permission-free.

- **Standards cross-link to their walkthrough.** Each standards guide links to
  the matching [[0012]] how-to (e.g. photography → `managing-products` /
  `uploading-parts`), so "how" and "how well" sit one click apart.

## Coverage backlog

Standards guides to author (from the [[0011]] master map).

| # | Guide (slug) | Pairs with | `requiredPermissions` | Status |
| --- | --- | --- | --- | --- |
| 1 | `photography-standards` | products, parts | `products` | ☐ flagship |
| 2 | `writing-good-listings` | managing-products | `products` | ☐ |
| 3 | `pricing-hygiene` | pricing-markup / tax | `products` | ☐ |
| 4 | `order-handling-standards` | processing-orders | `orders` | ☐ |
| 5 | `chat-response-standards` | customer-chat | — (all staff) | ☐ |
| 6 | `invoice-accuracy-standards` | invoices | `invoices` | ☐ |
| 7 | `working-responsibly` | security, users | — (all) | ☐ trust/safety |

## Consequences

- Adds five components to the Doc Kit (`Checklist`, `RuleList`, `Compare`,
  `TechniqueBento`, `DosDonts`) on top of [[0011]]'s `Bento` tier; once built
  (with the photography guide) the remaining standards docs are pure content.
- `Compare` and `DosDonts` use the semantic `success` / `danger` tint tokens
  ([[0009]]) — state carried by color **and** label/icon, never color alone
  (WCAG AA, `PRODUCT.md`).
- A reviewer comparing the photography guide to Pikkam's `/photo-tips` should
  recognize the **borrowed ideas** (checklist → golden rules → composition →
  before/after → do/don't) clearly adapted to our operations in Blessing
  Computers' brand — creative adoption, not fidelity, is the intent of this ADR.
