# ADR-0015: One backend origin, everything derived

**Status:** Accepted (2026-08-08) · **Extends:** [ADR-0003](0003-same-origin-api-proxy-for-first-party-cookies.md), [ADR-0006](0006-backend-types-via-openapi-codegen.md)

## Context

Technocrat has no backend of its own. The plan is a clone of the Blessing backend —
same schema, same operations, different base URL — built later. That plan is only
cheap if pointing this app at the new backend is **one change**.

The clone inherited three runtime variables that each named a backend host, plus two
scripts and one config block that hardcoded one:

| | Where | Consumers |
|---|---|---|
| 1 | `API_BASE_URL` | `next.config.ts` rewrite, `lib/api/endpoints.ts`, `lib/api/upload-proxy.ts` |
| 2 | `NEXT_PUBLIC_BACKEND_URL` | chat socket, WhatsApp socket, payments webhook card |
| 3 | `NEXT_PUBLIC_EMERGENCY_UNBLOCK_URL` | the emergency IP-unblock widget |
| 4 | `scripts/gen-api.mjs` | hardcoded Koyeb default |
| 5 | `scripts/pull-chat-contract.mjs` | hardcoded Koyeb default |
| 6 | `next.config.ts` `images.remotePatterns` | hardcoded object-storage host |

Nothing tied 1–3 together. They *happened* to agree. Change only `API_BASE_URL` to a
new host and the app boots, serves, and looks correct while chat, WhatsApp, and the
unblock widget keep talking to the **old** backend — a failure with no error message.
Meanwhile 4–5 meant "repoint the app" silently left codegen generating types from the
previous backend.

## Decision

**`NEXT_PUBLIC_BACKEND_URL` is the single backend seam. It holds an origin. Everything
else is derived.**

`src/config/env.ts` owns the derivation:

```
NEXT_PUBLIC_BACKEND_URL=https://host       ← the only host in the system
  ├─ serverEnv().apiBaseUrl        → https://host/api
  ├─ publicEnv.emergencyUnblockUrl → https://host/internal/emergency-unblock
  └─ publicEnv.backendUrl          → https://host   (sockets connect direct)
```

- `API_BASE_URL` and `NEXT_PUBLIC_EMERGENCY_UNBLOCK_URL` **no longer exist.** They are
  not deprecated-but-honoured; they are gone, so a stale value cannot half-repoint the
  app. Setting them does nothing.
- Trailing slashes are stripped once, at the seam.
- `serverEnv()` keeps the fail-fast contract `API_BASE_URL` had: missing origin throws
  at `next.config.ts` load, before anything serves.
- `publicEnv.backendUrl` stays **optional** at module scope. Sockets and the unblock
  widget degrade quietly when it is unset, as before — throwing there would crash a
  client render rather than fail a boot.
- **Scripts follow the seam.** `scripts/backend-origin.mjs` parses the env files
  (dependency-free, same spirit as `config/env.ts`) so `gen:api` and
  `pull:chat-contract` resolve the same origin the app uses. `$API_DOCS_URL` /
  `$CHAT_CONTRACT_URL` remain as one-off overrides.
- **Asset hosts are configurable, not hardcoded.** `IMAGE_ASSET_HOSTS`
  (comma-separated) feeds `images.remotePatterns`, defaulting to today's storage and
  avatar hosts. Build-time: changing it needs a rebuild, not a restart. It is
  deliberately *not* derived from the seam — object storage is a different host from
  the API even today.

### Not part of the seam

`NEXT_PUBLIC_API_BASE_URL` (default `/api`) survives. It is a **path on our own
origin** — the ADR-0003 proxy mount point — not a host. It never needs to change when
the backend moves.

### Env file layering

Two per-mode files, `.env.development` and `.env.production`. **Every env file stays
gitignored — no committed template.** With a one-variable seam a template earns
nothing: the variable table in `ARCHITECTURE.md` *is* the template, and it is one less
file to drift out of date. **No `.env.local`.** Next loads `.env.local` in every mode,
so it silently overrides `.env.production` during a local production build — a trap
that has bitten the Blessing apps. The `.gitignore` says so where someone would look.

### Which backend, and whose accounts

The shared **Blessing dev backend on Koyeb**
(`hard-berty-elijay-27db4d69.koyeb.app`) — not production DigitalOcean. Disposable
data, and it matches what `technocrat-frontend` already borrows for auth. Technocrat
has no staff accounts there: **we log in with Blessing admin credentials**, inside
someone else's tenant. That is the strongest argument for the map's standing
"read-mostly, destructive actions off the table" rule — it is not our data.

## Consequences

- Repointing the app is one line. Verified below.
- `config/env.ts` is no longer a thin pass-through; it computes. That is the point,
  and it is the one file where computation belongs.
- The backend origin is in the client bundle. It always was (sockets connect direct,
  ADR-0003), so nothing new is exposed. A backend origin is not a secret.
- Cookies are unaffected. They are written by *our* Next server for *our* origin with
  no `Domain=` attribute, and CSRF is double-submit through the same-origin rewrite —
  so the backend's hostname is invisible to auth. Verified below.

## Verification

Run at adoption (2026-08-08), all against the real Koyeb backend:

| Check | Result |
|---|---|
| `vitest run` | 92/92 pass, suite driven by `NEXT_PUBLIC_BACKEND_URL=http://test.local` |
| `next build` | green |
| Variable removed | build dies at config load: *"Missing required environment variable: NEXT_PUBLIC_BACKEND_URL"* — one error, one place |
| Variable set to `https://bogus-seam-test.invalid` | build green; the real host appears in **zero** client chunks, the bogus host in exactly one |
| `gen:api` with a bogus origin | resolves the seam, fails the fetch, falls back to the committed snapshot |
| `gen:api` live | fetched from Koyeb; **zero diff** — and `src/types/api.d.ts` is byte-identical to `admin-blessingcomputers`. No contract drift between the two admins |
| `pull:chat-contract` + `check:chat-contract` | pulled via the seam, "contract in sync" |
| `POST /api/auth/staff/refresh` through our proxy | `401`, identical to hitting Koyeb directly; `Set-Cookie` returns **host-only, no `Domain=`** |

## How to point this app at the Technocrat backend when it exists

Change `NEXT_PUBLIC_BACKEND_URL` in `.env.development` and `.env.production` (and in
the deploy platform's settings) to the new origin — no trailing slash, no `/api`
suffix. Then run `npm run gen:api && npm run pull:chat-contract` to regenerate types
against it, and `npm run build`. If the new backend serves images from a different
bucket, add that host to `IMAGE_ASSET_HOSTS` and rebuild. There is no other host to
find: `grep -rn "koyeb\.app\|ondigitalocean\.app" src/ scripts/*.mjs next.config.ts`
returns nothing but `scripts/api-docs.json`, which is the backend's own OpenAPI
snapshot and is regenerated by `gen:api`. Everything else — the rewrite, server
fetches, the upload proxy, both sockets, the unblock widget, and codegen — follows
automatically. What this ADR does *not* promise is that the new backend behaves the
same; it only guarantees the address is a single, provable seam.
