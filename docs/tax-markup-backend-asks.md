# Tax system — adopted design & frontend plan

**Status: decided 2026-07-23.** This supersedes the earlier "tax-on-markup-rule"
asks. The backend shipped tax as a *separate, integrated `TaxRule` system*
(`feature/tax-module`, merged into `dev` @ `f056bc7`) rather than the tax-flag-
on-markup-rule model this doc originally requested. **We adopt the backend model
as-is** — no backend rework — and build the admin UI around it. The original ask
list is preserved at the bottom for history.

---

## What the backend provides (adopted)

**Models**
- `TaxRule` — `{ id, ruleId (TAX-XXXXXXXX), categoryId?, brandId?, productId?,
  rate Decimal(5,2), isActive, notes, createdByStaffId }`. Unique per
  `(categoryId, brandId, productId)` scope. A rule is EITHER product-scoped OR
  category/brand-scoped (schema rejects mixing product with category/brand).
- `TaxSetting` (pre-existing) — store-wide `{ enabled, rate }`. Master switch +
  fallback rate.

**Resolution** (most-specific wins, resolver stops at first match; see
`taxRule.service.ts`):
1. product (`productId` match)
2. category+brand exact (walks category chain self→parent, max 5)
3. category-only (walks chain) — checked *before* brand-only
4. brand-only
5. global `TaxSetting` fallback

If `TaxSetting.enabled` is false, tax is off store-wide regardless of any active
rule. A scoped rule *replaces* the global rate — it never stacks.

**Compute & persistence**
- `computeOrderTax(items, discount)` — per-line: discount prorated by each line's
  subtotal share, rate resolved per line, Redis-cached (5 min). **No variant
  denormalization** — resolved live, not stamped onto variants.
- `order_items` + `manual_order_items` gained `taxRate / taxAmount / taxSource`.
  Snapshotted at checkout; invoices sum each item's own tax.
- Already wired into `order.service.createOrder`, `manualCheckout.service`, and
  the cart estimate (`cart.controller`).

**Endpoints** (mounted at `/api/v1/tax`, `tax:manage` unless noted)
- `GET /api/v1/tax` — global setting (any authed user; cart/checkout read it)
- `PUT /api/v1/tax` — set rate / toggle
- `GET /api/v1/tax/rules` · `GET /rules/:ruleId` · `POST /rules` ·
  `PATCH /rules/:ruleId` · `DELETE /rules/:ruleId`
- `GET /api/v1/tax/how-tax-works` — explanatory doc

**Permission:** new `tax:manage` (group `tax`). Admin gates via
`hasPermission(perms, "tax:manage")` / `PermissionGate`.

---

## Contract status (blocker for the admin UI)

`npm run gen:api` on 2026-07-23 pulled the **live Koyeb dev** spec. It includes
`GET/PUT /api/v1/tax`, `how-tax-works`, and the cart/order per-line tax fields
(`taxRate/taxAmount/taxSource`, cart `estimatedTax`) — but **NOT `/api/v1/tax/rules`
yet** (deploy lag: git `dev` is ahead of the deployed build).

**Action:** backend dev to redeploy Koyeb `dev`; then re-run `npm run gen:api`
before building the admin tax-rules UI. Do not hand-author `TaxRule` types.

---

## Frontend plan

**Admin (`admin-blessingcomputers`) — a "Tax" tab in `/pricing`:**
Mount point: add a third tab to `src/app/(staff)/pricing/pricing-workspace.tsx`
(alongside Products / Parts markup), gated on `tax:manage`.
- **Top — global Tax Setting panel:** Enabled toggle + Rate % (`GET/PUT /api/v1/tax`).
- **Below — scoped Tax Rules:** list + create/edit/delete, mirroring the
  `MarkupRulesView` patterns (table, form dialog, scope label). Scope = product
  OR category/brand; fields rate, notes, active.
- New feature slice `src/features/tax` (service/queries/components + barrel); the
  tab shell composes it in the `app` layer (app→features is allowed; features
  cannot import features — same constraint that moved `pricing-workspace` out of
  `features/`).
- **Blocked** until `/tax/rules` is in the spec (see above).

**Customer (`blessingcomputers`) — already unblocked by the current contract:**
- Cart lines carry `taxRate/taxSource`; cart carries `estimatedTax`.
- Render a VAT line from the cart estimate; after `POST /orders` show the order's
  authoritative `taxAmount/totalAmount` as final. **Never send a tax value.**

---

## Open gaps to confirm with backend
- **Parts:** `TaxRule` scopes product/category/brand only — **no partType**. Parts
  are taxable only via shared category/brand rules. Confirm acceptable, or ask for
  a partType scope to match `PartMarkupRule`.
- **No variant `taxable` field:** intentional (live resolution). Frontend reads
  resolved values off cart lines, not off products — fine for cart/checkout, but
  product/catalogue pages can't cheaply show "is this taxed" without resolving.

---

<details>
<summary>Original ask list (superseded — kept for history)</summary>

The earlier plan asked to add `taxEnabled/taxName/taxRate` onto `PriceMarkupRule`
and `PartMarkupRule`, stamp `taxable/taxRate` onto variants, and retire the
store-wide model. The backend instead built the standalone `TaxRule` system above,
which meets the same goals (mixed taxable/exempt, per-item at checkout) with
cleaner tax↔pricing separation. Decision: adopt the backend model; this ask list
is closed.

</details>
