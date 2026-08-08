# Upload analytics — remaining backend asks (the date half of ask #3)

The per-uploader analytics feature is live. The admin already has:

- `GET /analytics/uploaders` (the report) and `GET/PUT/DELETE /analytics/targets*`
- `createdBy` on product **and** part list rows
- `createdByStaffId` filter on `GET /products/all` and `GET /products/parts`

Building the **Upload Management page** (drilling from an uploader into the
actual items they created) surfaced two gaps. Both are the **date half of the
original ask #3** — `createdByStaffId` shipped, but the date-range filter never
did. Checked against the regenerated `src/types/api.d.ts` (ADR-0006), not prose.

## 1. `createdFrom` / `createdTo` on both item lists — blocks day-scoped drill-down

Today `createdByStaffId` narrows to an uploader, but there is **no way to scope
to a day/range server-side**. "Show me exactly what Ada uploaded on 2026-07-03"
cannot be expressed as a query — we'd have to page `sortBy=newest` and stop
client-side once `createdAt` crosses the window (and parts can't even be sorted,
see #2). That's fragile and fights pagination.

**Ask:** add to **both** `GET /products/all` and `GET /products/parts`:

| Param         | Type          | Description                            |
| ------------- | ------------- | -------------------------------------- |
| `createdFrom` | ISO date-time | Inclusive lower bound on `createdAt`   |
| `createdTo`   | ISO date-time | Inclusive upper bound on `createdAt`   |

These pair with the existing `createdByStaffId` so the whole drill-down is one
query:

```
GET /products/all?createdByStaffId=<uuid>&createdFrom=2026-07-03T00:00:00Z&createdTo=2026-07-03T23:59:59Z
```

Use the same timezone the `/analytics/uploaders` report buckets days in, so the
counts there and the items here agree.

## 2. `sortBy` on `/products/parts` — parts can't be ordered at all

`GET /products/all` already exposes `sortBy` (`newest`, `oldest`, `price_asc`, …).
`GET /products/parts` exposes none, so a day's parts come back in default order
and can't be paged newest-first.

**Ask:** add `sortBy` to `GET /products/parts` with at least
`newest | oldest`, matching the products list.

## 3. (Future / nice-to-have) pagination + sort on `/analytics/uploaders`

The report returns **all** uploaders in one array, sorted by today's total, with
no `page` / `limit` / `sort` / `q`. That's fine at the current staff count — the
admin sorts and searches client-side. If staff grows into the hundreds, add
`page` / `limit` and a `sort` param. **Not needed now** — flagging for the
roadmap only.

## Minimum to unblock the management page drill-down

Items **1 + 2**. Item 1 is the one that actually blocks day-scoped drill-down;
item 2 makes the parts side usable. Item 3 is future-proofing.
