# Parts feature — backend asks

Things the backend needs to add or change so the Parts feature (admin +
customer) can be fully built. Ordered by how much they block us. Everything here
was checked against the live OpenAPI spec (`/api-docs.json`, snapshot in
`scripts/api-docs.json`), not the older `PROMPT.txt`.

## 0. The parts routes aren't mounted on the deployed backend (hard blocker)

The OpenAPI spec (`/api-docs.json`) documents the full parts API, but on the
running dev server (`hard-berty-elijay-27db4d69.koyeb.app`) **none of the parts
routes are actually registered**. Reproduced unauthenticated:

| Request                                 | Result                                                       |
| --------------------------------------- | ------------------------------------------------------------ |
| `GET /api/v1/products/categories`       | `200` (server is healthy)                                    |
| `GET /api/v1/products/parts`            | `500` — `getProductById("parts")`, "invalid UUID, found `p`" |
| `GET /api/v1/products/parts/part-types` | `404` "Route not found"                                      |
| `GET /api/v1/products/parts/PRT-…`      | `404` "Route not found"                                      |

The list URL falls through to the `/products/:productId` handler (it treats
`"parts"` as a product id), and the others hit the catch-all 404. So the Swagger
doc is **ahead of the deployed code**.

**Ask:** deploy/mount the parts router, and register the literal `/products/parts`
(and `/products/parts/part-types`) routes **before** the parameterized
`/products/:productId` route so the list can never be shadowed by the id route
again. Until this is done, the entire parts feature (admin + customer) has no
working data — the UI is built and verified against the contract, but every call
404s/500s.

## 1. Part responses are missing fields the edit form needs (blocking)

`PartResponse` today does **not** include `categoryId`, `brandId`, `costPrice`,
or `slug` (all are accepted on create/update but not echoed back). Because of
this:

- The **edit form can't pre-select** the part's category or brand, can't show
  its cost price, and can't preserve a custom slug — opening a part to edit comes
  up blank for those, and saving risks wiping them.
- The **list and detail views can't display** a part's category or brand at all.

**Ask:** add `categoryId`, `brandId`, `costPrice`, and `slug` to `PartResponse`
(and to the embedded `part` inside `ProductPartEmbed`). Optionally also include
the resolved `category` / `brand` name objects, like `Product` already does, so
we don't have to look them up separately.

### 1b. Part image rows are missing the fields delete requires (blocks deletion)

`DELETE /parts/{partId}/images/{imageId}` **requires** a body of
`{ storagePublicId, storageProvider }`, but the image objects inside
`PartResponse.images` only carry `id`, `url`, `altText`, `isPrimary`,
`sortOrder` — they don't include `storagePublicId` or `storageProvider`. So the
frontend has nothing to send, and **image deletion can't be performed**.

**Ask:** either add `storagePublicId` + `storageProvider` to each part image row
(like product images have), or change the delete endpoint to derive them
server-side from the `imageId` so no body is needed.

### 1c. Accept `subcategoryId` on part create/update

A part created from a product inherits the product's taxonomy — category,
**subcategory (when the product has one)**, and brand. `CreatePartRequest` /
`UpdatePartRequest` accept `categoryId` and `brandId` but **not `subcategoryId`**.
The frontend now sends `subcategoryId` in the payload regardless; please add it to
both request schemas (and echo it back on `PartResponse`) so the part's
subcategory is persisted, not dropped.

## 2. Part Types can only be created and listed (blocking the management panel)

`/api/v1/products/parts/part-types` exposes only `GET` (list, public) and `POST`
(create, staff). There's no way to rename, deactivate, delete, or reorder a part
type.

**Ask:** add `PATCH /parts/part-types/{id}`, `DELETE /parts/part-types/{id}`, and
(nice to have) a reorder endpoint. Until then the admin panel will only do
create + list.

## 3. No public parts-list endpoint (blocks the customer catalog)

`GET /api/v1/products/parts` is **staff-only** (`cookieAuth`). The customer-facing
browsable parts catalog has nothing public to read from. The single-part GET and
the part-types list are already public, and so is "compatible parts for a
product" — only the _list/browse_ is missing.

**Ask:** a public, paginated, filterable parts-list endpoint (same filters as the
staff one: `categoryId`, `brandId`, `partType`, `isInStock`, `q`, `page`,
`limit`; pinned to active + in-stock for the storefront). We'll build the catalog
UI now and it will show an empty state until this lands.

## 4. Make parts purchasable (the big one — business wants checkout for parts)

> ✅ **DONE (2026-06-30).** The backend shipped B1a: `PartResponse` now includes
> **`variantId`** — "UUID of the backing ProductVariant. Pass this as `variantId`
> to `POST /cart/items` to purchase the part. `null` means the part has no price
> (enquire only)." So the customer "Add to cart" posts `part.variantId` and the
> existing cart → checkout → order → invoice chain carries it, with null-priced
> parts staying enquiry-only. The rest of this section is kept for context.

The entire money path is **variant-keyed** and has no idea parts exist:

- `POST /cart/items` takes `{ variantId, productId, quantity }` — no `partId`.
- `PATCH`/`DELETE /cart/items/{variantId}`, and `CartItem` keys on `variantId`.
- `POST /orders` builds the order **from the cart**; invoices are generated from
  the order. So if a part can't get into the cart, it can't be ordered or
  invoiced.

A part has no variant, so it can't enter any of this. The backend has to give a
part a way onto the rail. Recommended approach (smallest, lowest risk):

### Recommended — B1a: back each part with a variant

Model a purchasable part as a product with one default variant under the hood,
so the existing cart/checkout/order/invoice machinery does all the work. Then:

1. On part create/update, **maintain a backing variant** whose price,
   `compareAtPrice`, `costPrice`, `stockQuantity`, and `availabilityStatus` stay
   in sync with the part's own fields.
2. **Expose that variant's `variantId`** on `PartResponse`, on the embedded
   `ProductPartEmbed.part`, and on the public single-part GET (e.g. a
   `variantId` / `purchasableVariantId` field).
3. Ensure **`POST /cart/items` with that `variantId` works** — stock check,
   reservation, and pricing run exactly as they do for products.
4. **Populate the cart line from the part** so it renders correctly:
   `productName` = part name, `variantName`/`sku` = part number, `imageUrl` =
   primary part image, `unitPrice` = part price.
5. **Order + invoice flow unchanged** (they're cart/variant-derived) — just
   confirm a part-backed line renders right in order detail and on the invoice.
6. **`price: null` parts** ("price on request") get **no** purchasable handle —
   they stay enquiry-only on the storefront.

Frontend cost of B1a: read one new field and add an "Add to cart" button on
parts. **Cart, checkout, order, and invoice screens need zero changes.**

### Alternatives (more work, not recommended)

- **B1b** — teach `POST /cart/items` to accept `partId` (one of
  `variantId | partId`) and carry/render a part line through cart, validate,
  order, and invoice. Forks the cart-item model; roughly B2-lite.
- **B2** — a full parallel part line-item type (`variantId | partId`) through
  every cart/checkout/order/invoice endpoint, schema, and screen. Largest
  surface, highest risk on the money path.

## 4b. How does a part "belong" to a product? (ownerSku vs link)

The business model: parts are added *per product* — a product's battery, keyboard,
and screen all share that product's part number. The `ownerSku` field is described
as "SKU of the product this part belongs to (many parts may share it)", which
matches this exactly.

But the only way to *read* a product's parts is `GET /products/{productId}/parts`,
titled "Get a product's **compatible parts**", which returns parts **linked** via
the link table (each row has a `linkId`). There is **no** `ownerSku` filter on
`GET /products/parts` and no "parts where ownerSku = X" read path.

So today, to make a created part show under its product we must do two writes:
(1) create it with `ownerSku` = the product's part number, and (2) link it via
`POST /products/{productId}/parts`.

**Ask (pick one):**
- **A (preferred):** make `ownerSku` the association — a part created with
  `ownerSku` = a product's SKU appears under that product automatically (or add an
  `ownerSku` filter to `GET /products/parts`), so we don't double-write.
- **B:** confirm create-then-link is the intended approach (re-linking is
  idempotent per the spec, so it's safe).

## 5. Smaller / nice-to-have

- **`Product` schema doesn't declare `parts`.** The live response returns a
  `parts` object, but the documented `Product` schema omits it, so codegen can't
  type it. We'll read compatible parts from the dedicated
  `GET /products/{productId}/parts` (which _is_ typed as `PartsByCategory`)
  instead — but please add `parts` to the `Product` schema for completeness.
- **No part-image reorder endpoint.** Products have
  `PATCH …/images/reorder`; parts don't. We'll set image order at upload time
  only. A parts image-reorder endpoint would let us match the product UX.
- **No by-slug public part lookup.** The public single-part GET takes a `PRT-`
  id or UUID, not a slug. A by-slug endpoint would give parts clean, SEO-friendly
  detail URLs like products have.
