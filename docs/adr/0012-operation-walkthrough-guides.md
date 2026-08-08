# Operation walkthroughs adapt the ideas behind Pikkam's "How to Sell" page

Task guides — "how do I process an order", "how do I bulk-upload products" — take
their cues from Pikkam's `/how-to-sell` page across the three lenses in [[0011]]
(**UI, Layout, Structure**) and adapt them **creatively** into the admin's
maroon/navy/gold system ([[0009]]) — not a re-skin of Pikkam's markup. What's
worth borrowing from that page:

- **UI** — a hero, large **numbered step markers**, per-step
  illustration/tiles, and highlighted callout boxes (its "Verification Tip" /
  "New Feature" chips).
- **Layout** — a single readable column with a clear top-to-bottom reading order.
- **Structure** — progressive disclosure: a linear step flow that orients first,
  then reveals manageable chunks with the *why*, rather than an exhaustive dump.

We rebuild those ideas as admin-native Doc Kit components with Blessing
Computers' identity, plain copy voice, and Solar icons, and diverge wherever our
operations call for it.

These are the bulk of the [[0011]] coverage map (`type: "walkthrough"`). Each is
one `HelpDoc` slug, composed from the shared **Doc Kit** ([[0011]]). The existing
*Uploading & Managing Parts* doc ([[uploading-parts-doc]]) is the exemplar and is
canonized as the template — it already uses `Section` / `Path` / `Steps` /
`Callout` / `FieldTable`; this ADR aligns it to the Pikkam layout and defines the
pattern the rest follow.

## Decisions

- **The real `/how-to-sell` is a bento step-card mosaic — that is what we adopt.**
  The teardown ([[0011]]) shows `StepsSection` is *not* a single-column spine:
  it's a 12-col grid of asymmetric step cards, each styled differently — Step 01 a
  wide muted card with a nested "Verification Tip" callout and a giant faded
  background icon; Step 02 a narrower **inverted** card with a feature list; Step
  03 a full-width split image+content panel with a 2×2 sub-tip grid; Step 04 a
  compact centered CTA card; Step 05 a wide white card split into copy + mini-tip
  rows. The number sits in a **rounded-tile badge inside each card**, not on a
  spine. Walkthroughs adopt this using the `Bento` / `BentoTile` primitives
  ([[0011]]), so a guide reads like a composed page, not a bulleted list.

- **Two layout tiers, chosen by guide shape:**
  - **Overview / orientation guides** (Getting started, and the top of each area
    guide) use the **bento mosaic** — the richer, magazine-style adaptation of
    `/how-to-sell`.
  - **Deep procedural guides** (long, many precise steps — like the existing
    [[uploading-parts-doc]]) may keep the **vertical numbered spine** (`Steps`
    on `max-w-3xl` per [[doc-shell]]); it's better for dense follow-along-live
    procedures. A single guide can open with a bento overview, then drop into
    spine sections for each detailed flow. This is a deliberate, sanctioned split,
    not an inconsistency.

- **Per-guide anatomy (either tier):** `DocHero` (eyebrow + capped heading +
  intro) → "what is X / when to use it" → the step content (bento cards or spine)
  → callouts (`Callout` — the "Verification Tip" analog) → `FieldTable` reference
  → `DocShell` "Still stuck?" footer.

- **The `Path` breadcrumb replaces Pikkam's CTA buttons.** Pikkam prompts action
  with "Create Listing" links; our register is a task tool, so instead each guide
  shows the exact click-path chips (`Products → Open a product → Parts tab → Add
  Part`) so staff can follow along live. Optionally a single primary "Go to
  <screen>" link deep-links into the real route.

- **Imagery strategy: illustrative, not screenshots.** Pikkam pairs steps with
  product photography and giant faded background icons. We keep the *faded
  background Solar icon* device (`BentoTile bgIcon`) and the `Tile` / `MiniCard`
  visual language ([[0009]]) instead of screenshots — screenshots of an evolving
  admin rot fast and double the maintenance. A guide may embed a static diagram
  where genuinely needed, stored under `docs/design/help/`.

- **Voice: plain, second-person, imperative.** Non-technical staff. "Open the
  product, click the Parts tab." No backend jargon. Mirror the tone already set
  by [[uploading-parts-doc]]. Pikkam's encouraging register is kept; its
  marketing superlatives are not.

- **One flow per slug; split when a screen has genuinely separate jobs.** Orders
  (gateway vs manual) and Invoices (create vs review) each get one guide covering
  the related flows with clear `Section` divisions, not a doc per button.

- **Every guide is registered fully.** `keywords` (search synonyms),
  `requiredPermissions` (so the hub shows it to the right role — [[0011]]),
  `type: "walkthrough"`, and `updated`. Category matches the [[0011]] hub groups.

## Coverage backlog

Walkthroughs to author (from the [[0011]] master map). Suggested order is
top-down by staff frequency.

| # | Guide (slug) | Screen(s) | `requiredPermissions` | Status |
| --- | --- | --- | --- | --- |
| 1 | `uploading-parts` | Parts, bulk parts | `products` | ✅ canon spine template |
| 2 | `managing-products` | Catalogue, product detail/edit | `products` | ✅ |
| 3 | `bulk-product-upload` | `/catalogues/bulk` (AI paste) | `products` | ✅ |
| 4 | `categories-brands-taxonomy` | `/catalogues/taxonomy` | `products` | ✅ |
| 5 | `pricing-markup-rules` | `/pricing` (Products/Parts) | `products` | ✅ |
| 6 | `pricing-tax-rules` | `/pricing` (Tax tab) | `products` | ☐ |
| 7 | `processing-orders` | Orders, gateway + manual detail | `orders` | ✅ |
| 8 | `managing-customers` | Customers, customer detail | `customers` | ✅ |
| 9 | `bank-accounts` | `/checkout/bank-accounts` | `orders` | ✅ |
| 10 | `creating-manual-invoices` | `/invoices/manual/new` | `invoices` | ✅ |
| 11 | `reviewing-invoices` | pending-review, rejected | `invoices` | ✅ |
| 12 | `managing-inventory` | `/inventories` | `inventory` | ☐ |
| 13 | `customer-chat` | `/chat` (assignment, replies) | — (all staff) | ☐ |
| 14 | `managing-socials` | `/socials` | `socials` | ☐ |
| 15 | `users-and-roles` | `/users` (RBAC) | `users` | ☐ |
| 16 | `staff-uploads` | `/users/uploads` + analytics | `products` | ☐ |
| 17 | `security-and-unblock` | `/security`, emergency unblock | `security` | ☐ |
| 18 | `settings` | `/settings` | — | ☐ |

## Consequences

- Writing is parallelizable and low-risk: each guide is pure presentation
  composed from the Doc Kit, addable a few per session without touching app code.
- Aligning `uploading-parts` to the finalized template is the only edit to
  existing content; it must stay visually correct in both themes ([[0009]]).
- A reviewer comparing a guide to Pikkam's `/how-to-sell` should recognize the
  **borrowed ideas** (hero → numbered steps → callouts → reference) clearly
  adapted to our operations in our brand, copy, and Solar icons — creative
  adoption, not fidelity, is the intent of this ADR.
