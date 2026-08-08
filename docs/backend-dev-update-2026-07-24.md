# Backend `dev` update — 2026-07-24

Snapshot of what landed on the backend `dev` branch since the last pull, so we
know which admin features to build next.

- **Backend range:** `f056bc7` → `c1fd73e` (fast-forward, 4 commits, +1991 / −68)
- **Key commit:** `19ce947` — _"Add payment customer details, combined order listing, and bulk product/part edit"_ plus `d0de2d6` — _"added PartTax rule"_
- **Migration:** `20260723140000_add_part_tax_rules` (new `part_tax_rules` table)
- **Contract:** OpenAPI docs regenerated (`tax.docs.ts`, `adminOrders.docs.ts`, `part.docs.ts`, `product.docs.ts`, `payment.docs.ts`). Run `npm run gen:api` in the admin app to refresh `src/types/api.d.ts` before wiring these up.

There are **four independent features** here. None have any admin UI yet.

---

## 1. Combined orders list — `GET /api/v1/all-orders`

One endpoint that merges **online gateway orders** (`Order`) and **manual orders**
(`ManualOrder`) into a single filterable, paginated list. This is the backend
finally shipping the unification we were doing client-side (see the
[[two-order-systems]] memory) — we can now drop the two-endpoint merge and call
this instead.

- **Auth:** `orders:read` (same as the two source endpoints)
- **Path note:** deliberately at `/api/v1/all-orders`, NOT under `/api/v1/admin/*` (that path is SUPER_ADMIN-only and already owns an online-only `/admin/orders`).

**Query params**

| param | values | default |
|---|---|---|
| `source` | `ONLINE` \| `MANUAL` \| `ALL` | `ALL` |
| `status` | any of the 14 combined statuses (online + manual enums, deduped) | — |
| `paymentStatus` | `PENDING` \| `PAID` \| `FAILED` \| `REFUNDED` (normalized across both sources) | — |
| `customerId` | uuid | — |
| `search` | matches order number / manual order id / customer email+name | — |
| `from` / `to` | ISO date range on `createdAt` | — |
| `sortBy` | `newest` \| `oldest` \| `amount_desc` \| `amount_asc` | `newest` |
| `page` / `limit` | limit 1–100 | 1 / 20 |

**Response** `{ success, data: AdminOrderRow[], meta }`

```ts
AdminOrderRow = {
  source: 'ONLINE' | 'MANUAL';
  id: string;
  displayId: string;            // orderNumber (online) | manualOrderId (manual)
  customer: { id, firstName, lastName, email, phone: string | null };
  orderStatus: string;
  paymentStatus: string;                    // each source's raw enum
  paymentStatusNormalized: 'PENDING'|'PAID'|'FAILED'|'REFUNDED';
  deliveryMethod: string;
  currency: string;
  totalAmount: number;
  createdAt: Date;
}
meta = { total, totalOnline, totalManual, page, limit, totalPages, hasNextPage, hasPrevPage }
```

Notes: payment status is bridged (`CONFIRMED`→`PAID`, `REJECTED`→`FAILED`,
`PROOF_UPLOADED`/`PENDING`→`PENDING`). A `status` value valid on only one
source's enum automatically skips the other source. Cross-table pagination is
correct (fetches `skip+limit` from each side, merges, re-sorts, slices), capped
at 1000/source as a deep-pagination safety valve.

**Admin work:** replace the client-side gateway+manual merge in the Orders list
with this single call; keep the Source badge/filter and `/orders/gateway/[id]`
detail route.

---

## 2. Part tax rules — `/api/v1/tax/part-rules`

Parts now have their own scoped tax-rate override system, fully isolated from
the product `TaxRule` system (parts are taxed via `PartTaxRule`, never
`TaxRule`). This is the parts-side twin of the tax work in the [[tax-per-markup-rule]]
memory — same split as `PartMarkupRule` vs `PriceMarkupRule` on the pricing side.

New table `part_tax_rules`. All routes require `tax:manage`.

| method | path | purpose |
|---|---|---|
| GET | `/api/v1/tax/part-rules` | list part tax rules |
| GET | `/api/v1/tax/part-rules/:ruleId` | read one |
| POST | `/api/v1/tax/part-rules` | create |
| PATCH | `/api/v1/tax/part-rules/:ruleId` | update (rate / notes / isActive only) |
| DELETE | `/api/v1/tax/part-rules/:ruleId` | delete |

The existing product rules stay at `/api/v1/tax/rules` (note the doc reworded it
to "PRODUCT tax rules").

**Create body**

```ts
{
  // EITHER partId alone (exact override) OR any combo of the three below —
  // mixing partId with the others is rejected.
  categoryId?: uuid;
  brandId?: uuid;
  partTypeId?: uuid;
  partId?: uuid;
  rate: number;           // percent, e.g. 7.50 (Decimal(5,2))
  notes?: string;         // max 500
  isActive?: boolean;     // default true
}
```

**Resolution precedence** (most specific wins, stops at first match): exact part
→ category+brand+type → category+brand → brand+type → category+type → brand →
category → partType → global `TaxSetting`. Category lookups walk the category
tree. A scoped rule **replaces** the global rate, never stacks; if
`TaxSetting.enabled` is false, tax is off store-wide regardless.

**Admin work:** add a **Parts** section/subtab to the Tax UI in `/pricing`
(alongside the existing product Tax tab), reusing the scoped-rule form.

---

## 3. Bulk edit / delete — products AND parts

Multi-select edit and soft-delete for existing products and parts. Synchronous
(`updateMany`, no queue). Uses the **same permissions as the single-item
PATCH/DELETE** routes — NOT `products:bulk:write` (that stays reserved for the
async create/upload flows in [[bulk-upload-cache-strategy]]).

### Products
| method | path | perm |
|---|---|---|
| POST | `/api/v1/products/bulk-edit` | `products:write` |
| POST | `/api/v1/products/bulk-delete` | `products:delete` |

```ts
// bulk-edit body — at least one editable field required
{ productIds: uuid[1..200], categoryId?, brandId?, isActive?, isFeatured?, sourcingType? }
// → { updated: number }   (sourcingType cascades to EVERY variant of each product)

// bulk-delete body — soft delete (isActive:false), matches DELETE /:id (not /permanent)
{ productIds: uuid[1..200] }
// → { deactivated: number }
```

### Parts
| method | path | perm |
|---|---|---|
| POST | `/api/v1/products/parts/bulk-edit` | `products:write` |
| POST | `/api/v1/products/parts/bulk-delete` | `products:delete` |

```ts
{ partIds: uuid[1..200], categoryId?, brandId?, partTypeId?, isActive?, isFeatured?, isInStock? }
// → { updated: number }

{ partIds: uuid[1..200] }
// → { deactivated: number }
```

Only **categorical/shared** fields are bulk-editable by design — name / slug /
price / stock / part number are per-item-unique and excluded. `isActive` /
`isInStock` changes propagate to each part's backing variant; delete also flips
backing variants to `OUT_OF_STOCK`.

**Admin work:** add multi-select + bulk action bar (change category/brand,
toggle active/featured, delete) to the products and parts list pages.

---

## 4. Payment customer details on verify / lookup

`GET` payment verify and `getPaymentById` responses now include a `customer`
object so the frontend can render a confirmation/receipt after returning from
the gateway — no separate customer fetch needed.

Added to `VerifyPaymentResult` and the `getPaymentById` return:

```ts
customer: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;   // Customer.phone, falling back to
                          // order shippingAddress.phone → billingAddress.phone
} | null
```

`phone` fallback matters because online checkout doesn't require a customer
phone (unlike manual checkout), so it's frequently pulled from the delivery
address instead.

**Admin work:** surface customer name/email/phone on the payment/receipt
confirmation screen from the verify response instead of a second lookup.

---

## Implementation status — all four done (2026-07-24)

1. **Combined orders list** — ✅ Admin `features/orders` now uses `GET /all-orders`
   via `useAllOrders` (backend pagination/filter/sort; customer names on gateway
   rows too). Retired the client-side merge (`useUnifiedOrders`,
   `manual/gatewayOrderToRow`). `AdminOrderRow.itemCount` is now `number | null`
   (combined list has no line items → renders "—"). Payment-status filter switched
   to normalized PENDING/PAID/FAILED/REFUNDED.
2. **Bulk edit/delete (products + parts)** — ✅ Row selection + a shared
   `BulkSelectionBar` + `useRowSelection` + per-feature bulk-edit dialogs on
   `/catalogues/all` and `/catalogues/parts`. Services/queries: `useBulkEditProducts`
   / `useBulkDeleteProducts` and the parts equivalents. Only categorical fields;
   soft-delete (deactivate).
3. **Part tax rules** — ✅ Already built and wired in `features/tax`
   (`part-tax-rules.tsx`, Products/Parts scope toggle in the Tax workspace);
   was blocked on this backend, now live. Endpoints match `/v1/tax/part-rules`.
4. **Payment customer details** — ✅ Customer app (`blessingcomputers`)
   `features/payments`: `customer` threaded through verify/detail →
   `use-payment-callback` → personalized success screen ("Thank you, {name}" +
   receipt-sent-to line). Types updated on `PaymentVerifyResponse`/`PaymentDetail`.

Both apps typecheck + lint clean. `npm run gen:api` was run to refresh
`src/types/api.d.ts` (see [[backend-codegen-from-dev]]).
