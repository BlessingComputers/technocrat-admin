# Upload analytics (per-uploader) — backend asks

Things the backend needs to add so admin can **filter products and parts by the
staff member who created them** and show **per-uploader upload analytics**. The
business driver: the CEO has set uploaders a daily upload target, and we need a
view that shows how each uploader is tracking against it.

Everything below was checked against the OpenAPI types the frontend generates
from (`src/types/api.d.ts`, ADR-0006), not older prose. Ordered by how much each
blocks the feature.

## Current state (what exists today)

- **Products:** the single-product detail (`GET /products/{productId}`) *may*
  return `createdBy: { staffId, fullName }`, but it's gated to **super-admins
  only** and is **not** present on any list row (`ProductSummary`) and **not**
  filterable. The generated `ProductResponse` doesn't even declare it.
- **Parts:** `PartResponse` has **no creator field at all** — on detail or list.
  This strongly implies the backend isn't recording who created a part yet.
- **List filters:** neither `GET /products/all`, `GET /admin/products`, nor
  `GET /products/parts` accepts a creator param or a created-date range.
- **Staff directory exists:** `GET /auth/super-admin/staff` already returns the
  list of staff — that's the uploader dropdown. No ask needed there.

Net: the feature is **not achievable today** for either resource without the
changes below.

## 1. Record the creator on every part (hard blocker for parts)

Products already track their creator (detail exposes `createdBy`). Parts appear
not to. Nothing downstream can work until a part knows who made it.

**Ask:** add a `createdByStaffId` column to the part model and stamp it on
`POST /products/parts` (and the bulk create) from the authenticated staff JWT,
exactly as products do.

## 2. Expose `createdBy` on the list rows (blocking the table + filter display)

The creator must appear on the **list** payloads, not just product detail — a
per-uploader table can't render or group without it.

**Ask:** add to both list-row schemas:

```jsonc
"createdBy": {
  "staffId": "STF-XXXXXXXXXX",   // human-readable id (display)
  "id": "uuid",                   // DB uuid (for the filter param below)
  "fullName": "Ada Obi"
} // nullable — legacy rows created before tracking existed
```

- **Products:** add to `ProductSummary` (the `GET /products/all` row) and keep it
  on `ProductResponse`/detail.
- **Parts:** add to `PartResponse` (used for both list and detail).

**Access:** the products `createdBy` is currently super-admin-only. Please confirm
the role that should see uploader attribution — if only the CEO/super-admin view
needs it, super-admin gating is fine; if team leads review their uploaders,
widen it (e.g. a `products:read` + `staff:read` combination). State the final
rule so the frontend gates the column correctly.

## 3. Filter + date-range params on both list endpoints (blocking drill-down)

To answer "show me everything Ada uploaded today" we need to filter the existing
lists. The **date range is the important half** — "daily target" is meaningless
without scoping to a day.

**Ask:** add these query params to **both** `GET /products/all` and
`GET /products/parts`:

| Param               | Type          | Description                                              |
| ------------------- | ------------- | ------------------------------------------------------- |
| `createdByStaffId`  | uuid          | Filter to items created by this staff member            |
| `createdFrom`       | ISO date-time | Inclusive lower bound on `createdAt`                    |
| `createdTo`         | ISO date-time | Inclusive upper bound on `createdAt`                    |

Also useful (nice-to-have): `sortBy=oldest|newest` already exists on products;
please add an equivalent to the parts list so a reviewer can page a day's uploads
in order.

## 4. A dedicated per-uploader analytics endpoint (the actual CEO view — recommended)

The daily-target dashboard should **not** be built by paginating the whole
catalog client-side and counting rows — that's slow, and it can't cheaply bucket
by day across products *and* parts. A small purpose-built report endpoint is the
right shape.

**Ask:** add an endpoint, e.g.

```
GET /v1/admin/analytics/uploads
    ?from=2026-07-01           // ISO date (inclusive)
    &to=2026-07-07             // ISO date (inclusive)
    &staffId=<uuid>            // optional — omit for all staff
    &groupBy=staff|staff_day   // default: staff
    &resource=products|parts|all   // default: all
```

Response (envelope-wrapped per ADR-0007), shape roughly:

```jsonc
{
  "range": { "from": "2026-07-01", "to": "2026-07-07" },
  "rows": [
    {
      "staff": { "id": "uuid", "staffId": "STF-…", "fullName": "Ada Obi" },
      "products": 42,          // products created in range
      "parts": 18,             // parts created in range
      "total": 60,
      // present only when groupBy=staff_day:
      "byDay": [
        { "date": "2026-07-01", "products": 8, "parts": 3, "total": 11 },
        { "date": "2026-07-02", "products": 6, "parts": 2, "total": 8 }
      ]
    }
  ],
  "totals": { "products": 42, "parts": 18, "total": 60 }
}
```

Notes for the backend:

- Count by `createdByStaffId` and `createdAt`, **including both products and
  parts** in the same call (that's the whole value — one number per uploader per
  day).
- Timezone matters for "a day": bucket in the business's local timezone (project
  timezone is UTC today — confirm which one "daily" means so a 23:00 upload lands
  on the right day).
- **Target is out of scope for the backend** unless you already store it. The
  frontend will hold the daily target (config/env or a small settings row) and
  compare against these counts — unless the backend prefers to own targets, in
  which case expose a `target` per staff and we'll read it.

## Summary — minimum to ship

- **Filter/drill-down only:** items **1, 2, 3**.
- **The CEO's target dashboard:** items **1, 2, 4** (item 4 depends on 1 for
  parts). Item 3 is still worth doing for the "open this uploader's day" link.

Item **1** (parts don't record a creator) is the single hard blocker — nothing
about parts analytics is possible until that lands.
