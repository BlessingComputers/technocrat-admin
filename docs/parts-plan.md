# Parts feature — implementation plan (plain language)

What we're building, in both apps, and the order we'll build it. This reflects
every decision made during planning. The contract comes from the live OpenAPI
spec via codegen, not `PROMPT.txt`.

## The short version

A "Part" is like a simpler product: it has a name, part number, a **part type**
(charger, keyboard, screen…), a category (Laptops, Desktops…), a brand, pricing,
stock, images, and specs — but **no variants**. Parts can be **linked to
products** as "compatible parts", and the business wants customers to be able to
**buy** them.

Two apps:

- **admin-blessingcomputers** — staff create, edit, and manage parts; manage part
  types; and link parts to products.
- **blessingcomputers** (customer site) — customers browse parts, view a part,
  see compatible parts on a product page, and (once the backend supports it) buy
  parts.

## Key decisions already made

- **Code lives in its own `features/parts/` slice**, but the admin **routes are
  nested under `/products/parts`** (no new sidebar item; reached from a card on
  the Products hub). Same `products` permission.
- **Category and brand reuse the existing product taxonomy** — same pickers, no
  new taxonomy.
- **Part type is a managed thing** (its own list, picked from a dropdown). We can
  create and list part types now; edit/delete waits on the backend.
- **No bulk upload for parts** — dropped from scope.
- **AI smart-paste is deferred.** When we do it, one shared AI route will handle
  both products and parts via a per-entity "spec" (decided, not built yet).
- **Parts are purchasable (the business wants checkout).** This needs backend
  work (see `parts-backend-asks.md`, item 4). We build the buy UI now and switch
  it on when the backend exposes a purchasable handle.
- **Both apps generate their API types from the spec** (`npm run gen:api`).

## Foundation (done)

- Stood up codegen in the admin app: `openapi-typescript` + a `gen:api` script
  that fetches the live spec, refreshes a committed snapshot, and regenerates
  `src/types/api.d.ts`. Response types come from here; form inputs stay as Zod.

---

## Admin app — build order

**1. Data layer.** A `parts.service.ts` (list, get, create, update, deactivate,
image upload/delete/set-primary, link/unlink/reorder against a product) and a
`parts.queries.ts` (React Query hooks), plus a small part-types service. Types
alias the generated `PartResponse` / `PartTypeResponse` / `PartsByCategory`; a
Zod schema owns the create/edit form input.

**2. Parts list + hub.** Route `/products/parts`: a stats strip, a filter bar
(search, category, brand, part type, active, in-stock), a table of parts, and
pagination — modeled on the products list. Add a **"Parts" entry-point card** on
the `/products` hub so staff can find it. (Category/brand columns light up once
backend ask #1 lands.)

**3. Create / edit a part.** Routes `/products/parts/new` and
`/products/parts/[id]/edit`: one **flat form** — general details (name, part
number, part type, category, brand, description), pricing (price, compare-at,
cost), stock, status (active/featured/in-stock), and specifications. Part type is
a dropdown from the managed list. **Images are added after the part is saved**
(save first, then upload), through a new same-origin upload handler
(`/api/admin/parts/images/upload`) that avoids the hosting timeout — exactly how
products do it. Delete passes the image's storage id/provider. No drag-reorder of
part images (the backend has no endpoint for it).

**4. Part detail.** Route `/products/parts/[id]`: the part's info, an image
gallery (set-primary, delete), and its specifications.

**5. Part Types panel.** A third tab — **Categories | Brands | Part Types** — in
the existing `/products/taxonomy` view. For now it **creates and lists** part
types; rename/deactivate/delete are wired in when the backend adds them.

**6. Compatible Parts on a product.** A **"Compatible Parts" section on the
product detail page** (`/products/[id]`). It reads the product's linked parts
(grouped by category) from `GET /products/{id}/parts`, and lets staff: search the
parts catalog in a modal and link one or many, edit each link's compatibility
note, reorder them, and unlink. This is the one piece that lives in the products
feature and calls into parts.

---

## Customer app — build order

**0. Codegen.** Set up the same `gen:api` pipeline in `blessingcomputers` so part
(and product) types come from the spec instead of being hand-written.

**1. Data layer.** A `parts.storefront.ts` server service: list parts (points at
the **pending public list endpoint** — returns empty until it ships), get one
part (public, ready), list part types (public, for filters), and read a product's
compatible parts (public, ready). Same retry/caching style as the product
storefront service.

**2. Parts catalog.** Route `/parts`: a browsable, filterable catalog (search,
category, brand, part type, price) modeled on the product catalog, with a
**Part Type** facet. It renders an empty state cleanly until the public list
endpoint exists, then works with no rework.

**3. Part detail.** Route `/parts/[partId]`: image gallery, specs, price
(null price shows "price on request"), and an **"Add to cart" button**. The
button is wired to the part's purchasable handle from the backend; until that
exists it's disabled with a "coming soon / request price" fallback.

**4. Compatible parts on a product page.** On `/product/[slug]`, a section that
shows the product's compatible parts (grouped by category), each linking to its
part detail page.

**5. Header nav.** A **"Parts"** link in the customer site's main navigation so
the catalog is discoverable.

**6. Purchasing wiring.** Once the backend ships B1a (each part exposes a
purchasable `variantId`), flip "Add to cart" on — it posts that id to the
existing cart, and the existing cart → checkout → order → invoice flow carries
the part with no further frontend changes.

---

## What's blocked on the backend

These don't stop us starting — we build around them and switch on when ready:

- Showing/editing a part's **category, brand, cost** → backend ask #1.
- **Editing/deleting part types** → backend ask #2.
- The **customer catalog showing real parts** → backend ask #3 (public list).
- **Buying a part** → backend ask #4 (B1a: part-backed variant + exposed
  `variantId`).

Full details and exact endpoint shapes are in `parts-backend-asks.md`.
