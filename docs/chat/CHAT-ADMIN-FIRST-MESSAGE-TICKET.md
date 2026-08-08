# Backend Ticket: Admin misses the customer's first message

**Date:** 2026-07-12
**Owner:** Backend engineer (repo: `BlessingComputerBackend` — read-only to the frontend team)
**Related:** `CHAT-BUGS-DIAGNOSIS.md` (Problem #2, worker persistence)
**Component:** `backend/src/modules/chats/chat.socket.ts` → `START_CONVERSATION` handler

> **✅ RESOLVED (2026-07-12).** The backend implemented this as specified: after
> the `NEW_CONVERSATION` emit, `START_CONVERSATION` now emits the customer's
> first message to `staff:room` as a standard `MESSAGE_RECEIVED`
> (`chat:message:received`) built with `buildMessagePayload`, reusing the
> `msg:${conv.id}:init` idempotency key so the later-persisted REST copy dedups
> instead of duplicating. **No wire-contract change** — the synced
> `chat.contract.ts` is byte-identical (still v1), so the frontends need no
> contract update. The admin already consumes `chat:message:received`, and the
> new `previewByConversation` map surfaces it in the left-rail row. Ship the two
> frontend apps to complete it.

---

## Summary

When a customer starts a live chat, staff **do not receive the customer's first
message over the live socket**. Every subsequent message is delivered fine. The
first one is only recoverable via the REST detail fetch, which depends on the
background worker having already persisted it — so it races the moment staff
open the conversation, and disappears entirely when the worker isn't running.

## What's happening (in the code)

The first message travels a different path from all later messages.

- **First message:** customer emits `chat:start` → `START_CONVERSATION`
  (`chat.socket.ts:123`). That handler:
  - emits `CONVERSATION_CREATED` to the **customer** only,
  - emits `NEW_CONVERSATION` (`chat:dashboard:new`) to `staff:room` with a
    **truncated 100-char `preview`** (`chat.socket.ts:182`),
  - `queueSaveMessage(...)` with idempotency key `msg:{conv.id}:init` — a DB
    write only.
  - **It never emits `MESSAGE_RECEIVED` to any staff.**
- **Later messages:** customer emits `chat:message` → `SEND_MESSAGE`, which
  emits `MESSAGE_RECEIVED` to the conversation room (`chat.socket.ts:260`) — so
  staff who have joined the room get it live.

Result on the admin side: the dashboard row shows only the truncated preview;
the actual first message appears in the thread **only** after the worker
persists it *and* the admin refetches the REST detail (`GET
/chat/conversations/{id}` → `history.messages`). Hence the reported symptom:
"admin doesn't get the first message, but everything after works."

## Proposed fix

After the conversation is created in `START_CONVERSATION`, emit the initial
message to staff as a **real message payload**, the same way `SEND_MESSAGE`
does — not just the `NEW_CONVERSATION` preview.

- Build the payload with the existing `buildMessagePayload(...)` helper
  (`chat.socket.ts:72`), `senderType: 'CUSTOMER'`, `body:
  data.initialMessage.trim()`, `isInternal: false`.
- **Reuse the same idempotency key** the queued DB write already uses:
  `msg:{conv.id}:init` (`chat.socket.ts:159`). This is the critical detail — the
  frontends dedup by `idempotencyKey`/`id`, so when the persisted copy later
  arrives via a REST refetch it reconciles against the live copy instead of
  duplicating.
- Emit it to staff. Recommended target: the conversation room (`conv:{id}`) —
  new-conversation allocation joins the assigned staff to that room. If
  allocation is asynchronous and staff may not be joined yet at emit time, also
  emit to `staff:room` (or keep the dashboard `NEW_CONVERSATION` doing the
  "unopened" signalling and let the room emit cover the opened case). Do **not**
  emit to the customer's own socket for this init message — the customer already
  rendered it optimistically.

Sketch (mirrors the existing `SEND_MESSAGE` emit, placed right after the
`NEW_CONVERSATION` emit in the `if (!conv.isExisting)` block):

```ts
const initPayload = buildMessagePayload({
  conversationId: conv.id,
  senderId: userId,
  senderType: 'CUSTOMER',
  senderInfo,                       // already resolved above
  body: data.initialMessage.trim(),
  isInternal: false,
  idempotencyKey,                   // === `msg:${conv.id}:init`
});

// Deliver the first message to staff over the live channel, same shape as
// SEND_MESSAGE, so it lands in the staff thread immediately (not just as a
// dashboard preview) and dedups against the later-persisted REST copy.
ws.to('staff:room').emit(SERVER_EVENTS.MESSAGE_RECEIVED, initPayload);
```

(Keep the existing `NEW_CONVERSATION` emit — it still drives the list/queue.)

## Acceptance criteria

- With the worker **running**: a brand-new conversation's first message appears
  in the admin thread immediately on the dashboard / on open — no refetch race.
- With the worker **stopped**: the admin still sees the first message live
  (delivery no longer depends on persistence).
- **No duplication:** when the REST detail is later fetched (worker persisted
  the row), the first message reconciles by `idempotencyKey` and appears once.
- Internal notes and customer-visibility rules are unchanged (this message is
  public, `isInternal: false`).

## Notes for coordination

- Frontend has already shipped a companion change: the admin conversation-list
  preview now derives from the live message store
  (`admin-blessingcomputers/.../use-chat-workspace.ts`), so once this init
  message reaches the store the left-rail preview updates live too. The two
  changes are complementary.
- The admin client already handles `chat:message:received` (adds to thread,
  dedups by `id`/`idempotencyKey`), so **no frontend change is required** to
  consume this — it just needs the event to be emitted.
