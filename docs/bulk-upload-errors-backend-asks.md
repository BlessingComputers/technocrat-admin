# Bulk upload — humanize per-row errors (backend asks)

Things the backend should change so bulk-upload failures return **clean, stable
error messages** instead of raw Prisma strings. The frontend already has a
safety-net humanizer (`humanizeBulkRowError` in
`src/features/products/components/bulk/bulk-helpers.ts`), but that only masks the
symptom in one client — the canonical fix belongs server-side.

## The problem (observed)

Re-uploading a sheet whose part numbers already exist returns per-row errors
like this, verbatim, from `GET /products/bulk/{batchId}`:

```jsonc
{
  "row": 1,
  "name": "DELL XPS 13 9340 …",
  "success": false,
  "error": "\nInvalid `prisma.product.create()` invocation:\n\n\nUnique constraint failed on the fields: (`sku`)"
}
```

This leaks the ORM name, the method, and the schema field to the admin UI, and
it reads as a scary internal error rather than "you already have this product".

## Root cause

The product worker stores the **raw** `err.message` on the failed row.

`backend/src/workers/Product.worker.ts` — the per-row catch (~L316-328):

```ts
} catch (err) {
    const message = (err as Error).message;   // ← raw Prisma text
    logger.error('[ProductWorker] Product creation failed', { … });
    // …
    error: message,                            // ← surfaced to the client as-is
}
```

Prisma throws a `PrismaClientKnownRequestError` here with everything needed to
produce a good message:

- `err.code === 'P2002'` — unique-constraint violation
- `err.meta.target` — the colliding field(s), e.g. `['sku']`

## Ask 1 — translate P2002 before storing the row error (primary)

In that catch block, detect the known Prisma error codes and store a
human-readable `error` plus a **stable machine `code`** so clients can style or
branch without string-matching. Never store `prisma.*.invocation` text.

Suggested mapping:

```ts
import { Prisma } from '@prisma/client';

function toRowError(err: unknown, sku?: string): { code: string; error: string } {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = String(err.meta?.target ?? '');
    if (target.includes('sku'))
      return {
        code: 'DUPLICATE_SKU',
        error: sku
          ? `A product with part number "${sku}" already exists.`
          : 'A product with this part number (SKU) already exists.',
      };
    if (target.includes('slug') || target.includes('name'))
      return { code: 'DUPLICATE_NAME', error: 'A product with this name already exists.' };
    return { code: 'DUPLICATE', error: 'This product duplicates one that already exists.' };
  }
  // Foreign-key / not-found, etc. can map here too (P2003, P2025…).
  return { code: 'CREATE_FAILED', error: 'Could not create this product.' };
}
```

Then persist both fields on the failed row:

```jsonc
{ "row": 1, "name": "…", "success": false, "code": "DUPLICATE_SKU",
  "error": "A product with part number \"XXXX\" already exists." }
```

**Note:** the human `error` string is enough for the frontend today — the
`code` field is additive and non-breaking. If it's easy, please include it; if
not, the clean `error` string alone already fixes the UX.

## Ask 2 — scrub raw ORM text everywhere as a policy (defense in depth)

Any un-mapped failure should still avoid returning `prisma`, `invocation`,
`Unique constraint`, or SQL fragments to a client. A final `catch` that replaces
unknown messages with a generic "Could not create this product." keeps internals
from leaking even for errors we didn't special-case.

## Out of scope (product decision, not this ticket)

Whether a duplicate SKU should be a **hard failure** (current), a **skip**
("already exists, left unchanged"), or an **upsert** (update the existing
product) is a behavior question we've deliberately parked. For now we keep it a
failure — this ticket is **only** about making the failure message readable. If
we later choose "skip", a distinct `code: 'SKIPPED_DUPLICATE'` (with
`success: true` or a third state) would let the UI show it neutrally instead of
red.

## Frontend status

Shipped now, independent of this ticket: `humanizeBulkRowError` maps the known
raw patterns (unique-constraint → "…part number (SKU) already exists") and
scrubs any remaining technical text before rendering in the results modal and
the progress card. Once Ask 1 lands, that humanizer becomes a redundant safety
net rather than the primary translator — no frontend change required to adopt
the cleaner backend messages.
