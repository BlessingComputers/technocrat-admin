# Product list stock filter — backend ask

The admin catalog's **Low Stock** and **Out of Stock** filters don't filter —
selecting either returns the full catalog. Traced to the backend; the frontend
is correct.

## Root cause

The admin list hits `GET /api/v1/products/all` → `controller.listProducts` →
`product.service.getProducts` (the DB-backed path, **not** the OpenSearch one).
That query only implements the `IN_STOCK` case of `availabilityStatus`:

```ts
// product.service.ts — getProducts()
...(query.availabilityStatus === 'IN_STOCK' && { hasInStock: true }),
```

`LOW_STOCK` and `OUT_OF_STOCK` get **no `where` clause**, so the filter is a
no-op and every product comes back.

Confirmed live against `hard-berty-elijay-27db4d69.koyeb.app`:

| Request (`/api/v1/products/all?…`)     | First product returned |
| -------------------------------------- | ---------------------- |
| `availabilityStatus=LOW_STOCK`         | same as unfiltered     |
| `availabilityStatus=OUT_OF_STOCK`      | same as unfiltered     |
| `availabilityStatus=IN_STOCK`          | filtered (works)       |

(The OpenSearch `GET /api/v1/products` path *does* filter all three via its
`variants.availabilityStatus` term — only the `/all` DB path is broken.)

## Frontend is correct — no change needed on our side

`products.service.ts` maps the stock filter to the documented param:

```ts
if (params?.stock === "low") q.availabilityStatus = "LOW_STOCK";
else if (params?.stock === "out") q.availabilityStatus = "OUT_OF_STOCK";
else if (params?.stock === "ok") q.availabilityStatus = "IN_STOCK";
```

## Ask

Handle `LOW_STOCK` and `OUT_OF_STOCK` in `getProducts`. Since availability is a
per-variant field, extend the variant `some` filter it already uses for
`condition` / `sourcingType`:

```ts
...(query.availabilityStatus === 'IN_STOCK' && { hasInStock: true }),
...((query.availabilityStatus === 'LOW_STOCK' ||
    query.availabilityStatus === 'OUT_OF_STOCK' ||
    query.condition || query.sourcingType) && {
  variants: {
    some: {
      isActive: true,
      ...(query.availabilityStatus &&
        query.availabilityStatus !== 'IN_STOCK' && {
          availabilityStatus: query.availabilityStatus,
        }),
      ...(query.condition && { condition: query.condition }),
      ...(query.sourcingType && { sourcingType: query.sourcingType }),
    },
  },
}),
```

Note the `some` semantics: a product matches `OUT_OF_STOCK` if it has *any*
out-of-stock active variant, even if another variant is in stock. If you'd
rather match on the product's overall state, use the denormalized flags instead
(e.g. `hasInStock: false` for OUT_OF_STOCK); a `LOW_STOCK` equivalent would need
a new denormalized product-level flag. Either is fine for us — the filter just
needs to actually narrow the list.
