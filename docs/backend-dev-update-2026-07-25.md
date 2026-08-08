# Backend `dev` update — 2026-07-25

Follows on from [backend-dev-update-2026-07-24.md](./backend-dev-update-2026-07-24.md),
whose four features are all shipped.

- **Backend range:** `c1fd73e` → `e4fbf93` (fast-forward, 2 commits, +352 / −3)
- **Key commit:** `ffafa2e` — _"Add customer profile self-edit, and enrich the combined order list with items"_
- **Migration:** none
- **Contract:** OpenAPI regenerated (`customer.docs.ts` new, `adminOrders.docs.ts` updated).
  `chat.contract.ts` **unchanged** (sha `ccdb805…` in both apps).

Note: the customer app's `src/types/api.d.ts` was much staler than admin's — the
refresh also pulled in `/tax/*`, `/payments/dlq` and the chat endpoints it had
been missing. Those are admin-side surfaces; no customer-app work follows from them.

---

## 1. Customer profile self-edit — `PATCH /api/v1/customer/me`

Lets the authenticated customer update their own `firstName`, `lastName`,
`phone`, `dateOfBirth` and `gender`. At least one field required — an empty body
is a 400.

- **Auth:** `authenticate` + `requireCustomer` (customer app, not admin)
- `phone` / `dateOfBirth` / `gender` accept `null` to clear them
- `firstName` / `lastName` are non-nullable columns — omit rather than clear
- `phone` is validated Nigerian-format: `^(\+234|0)[789]\d{9}$`
- Response returns **only the editable subset**, not the full profile

**`email` is deliberately not editable.** The signup address comes verified from
Google OAuth; `emailVerifyToken`/`emailVerifyExpires` exist as columns but nothing
sends or checks them, so there is no way to verify a *new* address. Allowing a
change would let a customer claim any email with no proof of ownership.

Distinct from `PATCH /api/v1/addresses/me/phone`, which sets a delivery-contact
phone on one address rather than the customer's own profile phone.

**Status: ✅ done (customer app).** New `features/profile` slice, editor at the
dedicated route `/(customer)/[user]/profile` (forms as pages, not modals):

- `model/profile-form.schema.ts` — zod mirror of the backend rules, plus
  `profileToFormValues` / `buildProfilePatch`. The patch builder diffs against
  the loaded profile and sends **only changed fields**, returning `null` when
  nothing moved so the empty-body 400 is unreachable. Emptied nullable fields go
  as explicit `null`, never `""` (which the phone regex would reject).
- `model/use-update-profile.ts` — invalidates `authKeys.customerProfile()` so the
  header, dashboard greeting and completeness meter re-read.
- `ui/profile-form.tsx` — RHF + zodResolver; `GENDER_UNSET` sentinel because
  Radix `<SelectItem>` can't hold an empty value.
- `ui/profile-completeness-card.tsx` — the dashboard's existing
  `getProfileCompleteness` score, now with the per-field breakdown behind it.
- `ui/account-identity-card.tsx` — states plainly why email isn't editable here.

This closes a real gap: `profile-completeness.ts` already scored the user on
`phone`, `dateOfBirth`, `gender` and `avatarUrl`, but nothing in the app could
set any of them — the meter was unactionable.

Also fixed en route: `QuickActions` linked to `${userPrefix}/settings`, a route
that never existed (now `/profile`), and `useUpdateProfilePhone` invalidated
`["user"]`, a key nothing is cached under (now `authKeys.customerProfile()`), so
an address-phone edit left a stale phone in the header until the 5-minute
`staleTime` lapsed.

---

## 2. Combined order list now carries line items

`GET /api/v1/all-orders` rows gained an `items[]` array — the enrichment the
[[two-order-systems]] note called out as missing:

```ts
items: {
  id, productName, variantName, sku, imageUrl,
  quantity, unitPrice, totalPrice,
  taxRate, taxAmount, taxSource,
  sourcingType: 'INHOUSE' | 'OUTSOURCED' | null,  // null on every MANUAL row
}[]
```

Items are fetched only for the rows actually returned on the current page, not
for every candidate row considered while computing the merged sort order — so
cost doesn't grow with `page`.

**Status: ✅ done (admin).** `AllOrdersItem` added to `features/orders/types`;
`allOrdersRowToAdminRow` now maps `itemCount: items.length` and
`firstItemName: items[0]?.productName`. `AdminOrderRow.itemCount` tightened from
`number | null` back to `number`, and the "unknown → render —" branch in
`order-table-row.tsx` is gone; both sources show real product names and counts.
The normalizer falls back to `[]` if `row.items` is absent, so an older backend
deploy degrades to "No items" instead of throwing.

---

## 3. Address phone-update cache invalidation (backend-only)

`updateCustomerPhone` now calls `invalidateUserCache(customerId, 'customer')`.
`authenticate()` caches customer data (L1 in-memory + L2 Redis), so before this
a phone change didn't surface until the cache expired naturally. No frontend
work — behaviour improves once dev redeploys.

---

Both apps typecheck, lint (no new findings) and build clean.
