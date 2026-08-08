# ADR: Chat System Hardening

- **Status:** Accepted — backend complete; frontend tickets complete (2026-07-10, session 2); operational rollout outstanding
- **Date:** 2026-07-10
- **Scope:** Cross-repo — `BlessingComputerBackend` (backend, separately owned), `blessingcomputers` (customer app), `admin-blessingcomputers` (admin app)
- **Spec of record:** [BlessingComputerBackend#92](https://github.com/TechnocratBlessingComputersBackend/BlessingComputerBackend/issues/92) (umbrella spec, `ready-for-agent`)
- **Wire contract of record:** `backend/CHAT_INTEGRATION.md` (prose) + `backend/src/modules/chats/chat.contract.ts` (types)

---

## Context

A two-axis review (2026-07-10) of the Socket.IO live-chat system found the likely cause of
intermittently dropping connections plus privacy leaks and contract drift:

1. **Drops:** the backend CORS allow-list contained `https://www.blessingcomputers.com/`
   (trailing slash — browser Origin headers never match) and no apex domain, so the
   production customer origin failed the Socket.IO handshake. Polling-first transport made
   CORS failures fatal; capped reconnection attempts plus expired-token 401s at the
   socket-token bridge made the failure permanent until page reload.
2. **Privacy:** internal staff messages (`isInternal: true`) and full CRM note contents
   (budget, prices discussed, handover notes) were broadcast to the shared conversation
   room — which contains the customer's socket.
3. **Contract drift:** event names and payload shapes were hand-maintained in three repos
   and had already diverged (clients read an `ack.id` field the server never sends; the
   server-provided `idempotencyKey` was discarded; the admin app hedged on the
   `staffroom:history` shape).

Everything was ticketed: backend #93–#100, customer app (BlessingComputers/frontend)
#13–#16, admin app (blessing-computers/admin-blessingcomputers) #26–#29, all linking to
spec #92 and tagged [P0..P2] in their titles.

**Binding constraint:** the three repos are owned by different developers. The
sibling-directory layout on this machine is a one-time debugging arrangement. Nothing may
couple the repos through the filesystem; every repo must build, test, and deploy
standalone. Cross-repo sharing happens over the network (GitHub or the deployed backend).

## Decisions

1. **Room audience model.** Each conversation has a shared room `conv:{id}` (customer +
   staff) and a staff-only room `conv:{id}:staff` (joined automatically on `chat:join` /
   `chat:assign`). Internal messages, `chat:notes:updated` confirmations, and
   internal-audience typing (`chat:typing:start { internal: true }`) are emitted to the
   staff room only. The notes broadcast carries only `{conversationId, updatedBy, saved}`
   — note contents are never broadcast.
2. **No sender echo.** Public messages broadcast via `socket.to(room)` (excludes sender).
   The sender keeps its optimistic copy and receives `chat:message:saved`
   (`{idempotencyKey, tempId, createdAt}` — there is **no** `id` field). Clients key all
   reconciliation on `idempotencyKey`/`tempId`, never on text matching.
3. **CORS origins are normalized.** Allow-list entries pass through
   `createOriginMatcher` (`src/shared/utils/cors-origin.util.ts`): trailing slashes
   stripped, lowercased; apex and `www` production origins both listed. Unit-tested pure
   function shared by Express CORS and Socket.IO.
4. **Single source of truth for the socket wire contract.**
   `backend/src/modules/chats/chat.contract.ts` — dependency-free, owned by the backend
   (`chat.type.ts` re-exports it). Distribution is **pull-based** per the standalone
   constraint: each frontend has `npm run pull:chat-contract` (source order: `--from
   <local path>` → deployed backend `GET /chat.contract.ts`, gated behind
   `ENABLE_API_DOCS` like `/api-docs.json`, override `CHAT_CONTRACT_URL` → GitHub at
   `--ref` via gh CLI / `GITHUB_TOKEN`) and `npm run check:chat-contract` (LF-normalized
   sha256 against the committed `.sha256`; fails on hand-edits). This mirrors the existing
   REST pipeline (`scripts/gen-api.mjs` → OpenAPI codegen → `src/types/api.d.ts`), which
   covers HTTP only — OpenAPI cannot describe socket events; the contract fills that gap.
   **Rule for the backend developer:** any message-shape change updates `chat.docs.ts`
   (swagger), `chat.contract.ts`, and bumps `CHAT_CONTRACT_VERSION` together.
5. **Socket-scoped handshake tokens.** `GET /api/auth/socket-token` (any authenticated
   audience) mints a 60-second JWT with `scope: 'socket'`, signed with the access secret
   (no new env vars). The REST `authenticate` middleware **rejects** socket-scoped tokens
   (`SOCKET_SCOPE_ONLY`) — including on the exchange endpoint itself — so a leaked socket
   token can neither call the API nor mint successors. Both frontends' bridge routes
   exchange server-side; the long-lived access token never reaches browser JS. Deploy-order
   independent: bridges fall back to the raw token on 404/network, and the socket
   middleware still accepts regular access tokens (the backend dev may later ratchet to
   require `scope: 'socket'`).
6. **Typing auto-clear is client-side.** Clients clear any typing indicator not refreshed
   within 5 s (matches the documented behavior without Redis keyspace notifications).
   Typing events carry and must respect `audience`. *(Frontend tickets — not yet built.)*
7. **Refresh ownership unchanged.** The socket and its bridges never drive token refresh;
   the REST client's single-flight path owns it (admin ADR-0004). The bridge returning 401
   should trigger exactly one refresh-then-retry in the client (frontend tickets #13/#27).
8. **Service structure.** `chat.service.ts` is a barrel over nine single-concern modules
   in `src/modules/chats/services/`; the barrel keeps all imports and `jest.mock`
   targets stable. Socket handler guards are `guardStaffOnly` / `passesRateLimit` /
   `buildMessagePayload` in `chat.socket.ts`.
9. **Test seams** (user-approved): (a) backend in-process Socket.IO integration harness
   with real `socket.io-client` customer+staff sockets asserting who-receives-what
   (`backend/tests/integration/chat/chat.socket.rooms.test.ts`); (b) frontend fake-socket
   at the existing `chat-socket.ts` module boundary (Vitest — not yet set up); (c) unit
   tests on the CORS matcher.
10. **`chat:leave` removed** from the contract (declared, no handler, no client use).
11. **Presence entries carry `staffId`** (was missing from the presence hash — admin
    presence store collapsed all snapshot entries under `undefined`). Stale hashes refresh
    within the 5-minute presence TTL after deploy.

## Current state (as of this ADR)

| Repo | Branch | Unpushed? | Landed |
|---|---|---|---|
| BlessingComputerBackend | `feature/chat-hardening` | **9 commits unpushed** (`1494492`…`7b25b35`) | #93 CORS, #94 staff-only rooms, #95 no-echo + real `chat:start` status, #96 `customerAccessToken` cookie fallback + `chat:leave` removal, #97 contract + HTTP serving, #98 harness, #99 socket-scoped tokens, #100 service split. Full suite 324/325 (see note) |
| BlessingComputerBackend | `fix/auth-test-suite` | pushed | 38 stale auth tests repaired (userCache L1 contamination, errorHandler `writable`, googleOAuth leftover mocks) + ts-jest→`tsconfig.test.json` fix. 298/298 |
| blessingcomputers | `feat/home-page-redesign` | pushed (`cdd0bbd`, 2026-07-10) | contract adoption + bridge exchange; #16 Vitest/fake-socket infra, #13 reconnect recovery + 401 single-flight + connection banner, #14 idempotencyKey reconciliation, #15 internal/audience filters + 5s typing TTL. Suite 35/35 |
| admin-blessingcomputers | `dev` | pushed (`69034a2`, 2026-07-10) | contract adoption + bridge exchange; #29 Vitest/fake-socket infra (app's first tests), #27 reconnect recovery + ADR-0004 401 single-flight + connection banner + pending-preserving seeds, #26 key-routed acks, #28 12-field notes form + 5s typing TTL. Suite 22/22 |

Known-failing test: `auth.customer` "/me 404" fails **only on `feature/chat-hardening`**
— its fix lives on `fix/auth-test-suite`; merging both branches to main resolves it.
Do not fix it again on the feature branch.

## Remaining work

All frontend tickets (#13–#16, #26–#29) are implemented, tested, and committed
(2026-07-10, session 2 — see Current state). Implementation notes that differ from the
original ticket text:

- The `chat:message:saved` ack carries **no `conversationId`** (contract) — admin routes
  acks by locating the conversation holding the pending `idempotencyKey` instead.
- Reconnect refetch is a whole-seed invalidation (`my-conversation` / chat query keys),
  not a since-cursor fetch; dedup by id/idempotencyKey makes this equivalent and the
  admin store's `seedMessages` now preserves still-unacked optimistic sends.
- The reconnect caps were removed (unbounded, 15 s max backoff) rather than paired with
  manual retry; a dead session can't storm the bridge because the 401 path now runs
  through each app's single-flight REST client (failed refresh → customer `auth:logout`
  event now consumed by `AuthProvider`; admin hard-redirects to /login).
- jsdom quirks worth knowing: Node 22+ shadows jsdom's storage globals (fixed in each
  app's `vitest.setup.ts`); radix Select can't resolve a seeded value under jsdom, so the
  notes-form test asserts the 11 input-backed fields and `leadStatus` is covered at the
  schema level.

Outstanding (operational):

1. Both frontend branches pushed (2026-07-10). Still to do: push + PR
   `feature/chat-hardening` for the backend developer; deploy.
2. **Root-cause update (2026-07-10, prod probe):** CORS is NOT the active drop cause.
   Probing `https://api.blessingcomputers.com/socket.io/?EIO=4&transport=polling` with
   `Origin:` set to the admin, www, and apex customer origins all returned 200 with a
   correct `access-control-allow-origin` echo on the RUNNING deploy. The observed admin
   drops are intermittent backend unavailability: bursts where BOTH socket.io polling
   AND the same-origin proxied REST (`/api/v1/chat/conversations`, no CORS involved)
   return **504 Gateway Timeout** from the DigitalOcean gateway (Cloudflare →
   `x-do-app-origin`); gateway error pages carry no CORS headers, which is why the
   browser console shows CORS errors. Websocket `transport close` events coincide.
   → Backend developer should check DO App Platform runtime logs/metrics at the 504
   timestamps: instance restarts, failing health checks (a failing health check makes DO
   recycle the container → exactly this WS-close + 504-window pattern), OOM/CPU, deploys.
   The frontend hardening behaves as designed through these blips (unbounded reconnect,
   seed refetch on reconnect, recovery confirmed in prod logs).
2. Wire `check:chat-contract` (and now `npm test`) into both frontends' CI/build; agree
   decision 4's contract-update rule with the backend developer.

## Consequences

- Customers can no longer receive internal messages or CRM note contents (enforced at the
  server by room membership; frontend defensive filters are still pending as depth).
- Contract drift between the three repos becomes a compile error / CI failure instead of a
  runtime bug — at the cost of a pull step (`pull:chat-contract`) after backend contract
  changes.
- XSS blast radius for chat auth shrinks to a 60-second handshake-only token.
- Until the frontend P0s land, a dropped connection still silently loses messages from
  view and can leave the socket permanently dead — the backend half of the reliability
  story is done, the client half is not.
- The sibling-directory layout can be dissolved at any time; nothing depends on it. Local
  convenience remains via `pull:chat-contract -- --from <path>` and
  `node scripts/sync-chat-contract.mjs <targetDir>`.
