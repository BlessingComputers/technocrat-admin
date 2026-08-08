# The fetch client unwraps the backend response envelope; services speak payloads

The backend wraps responses in `{ success, data, message }`. We unwrap in **one
place** — the fetch client — so services and the generated types speak *payloads
only* and the envelope never leaks into the ~11 features. `api.get<T>()` returns
the inner `data` typed as `T`; feature types and codegen schemas alias the inner
payload, never `{ success, data: T }`.

## Unwrapping rules (robust to unconfirmed envelope behavior)

Two backend facts are not yet confirmed, so the client is written to be safe
either way:

- **Check the `success` flag, not just the HTTP status.** If a parsed body is an
  envelope with `success === false`, throw `ApiError(message, status, body)` —
  *even on HTTP 200*. This covers backends that ride failures on a 200.
- **Pass through non-envelope bodies unchanged.** If the parsed body isn't an
  `{ success, data }` object (a bare array, a raw object, plain text), return it
  as `T` as-is, so a non-conforming endpoint doesn't break.
- **Escape hatch:** a `{ raw: true }` request option (or `api.raw()`) bypasses
  unwrapping for any caller that genuinely needs the full envelope.

## The one risk to verify against the spec

If list endpoints put pagination metadata as a **sibling** of `data`
(`{ success, data: [...], total }`) rather than nested
(`{ success, data: { items, total } }`), then unwrapping to `.data` drops
`total`. Confirm the real shape when the OpenAPI spec is wired ([[0006]]); if
metadata is a sibling, the client must return the inner `data` *plus* the
sibling meta (or those endpoints use the `raw` hatch).

## Consequences

A reader sees `api.get<Order>()` return an `Order`, not the client's
`{ data, status, ok }` wrapper and not the backend envelope — that double
unwrap (transport wrapper + business envelope) is deliberate and lives only in
the client. `ApiError` remains the single error type (`.status`, `.data`,
`.response`).
