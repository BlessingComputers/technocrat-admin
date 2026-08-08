# An AI assistant answers customer chats first, with the backend as plumbing and the brain in this app

**Status:** accepted, blocked on backend implementation
**Decided:** 2026-07-28
**Backend contract:** `AI-CHAT-BACKEND-CONTRACT.md` (BCL workspace root — hand to the
backend maintainer via GitHub, never by filesystem coupling)

Customer chats sit in `WAITING` with no reply until a staff member claims them
from the Queue. There is no auto-assignment — `chat.socket.ts:160` says so
outright — so a customer messaging at 2am, or during a busy afternoon, waits.
This ADR decides that an AI assistant answers **first**, immediately, on every
conversation, and hands over to a human when it should.

The assistant is a **full first-line agent**, not a greeter. It searches the
catalogue, quotes live prices and stock, reads the customer's own order status,
answers policy questions, and recommends products with add-to-cart cards. A
triage-only bot that says "someone will be with you shortly" was considered and
rejected: it adds a message without removing the wait, which is the thing that
actually costs sales.

## The shape we decided

- **Always first responder.** Every new conversation, 24/7, regardless of whether
  staff are online. Not an after-hours fallback — that would create two different
  customer experiences and require presence tracking we don't need.
- **Read-only.** It searches, checks stock, reads orders, quotes policy. It never
  writes: no cart mutations, no cancellations, no discounts, no refunds. Product
  cards carry an add-to-cart button, but the **customer** clicks it.
- **Clearly badged as AI**, with its own name and avatar and a visible
  "connecting you to a team member" moment on handover. A customer discovering
  they were fooled costs more than the warmth of a fake human name buys.
- **Logged-in customers only**, exactly as chat works today ([[use-chat]] gates
  on `isAuthenticated`). Guest chat is explicitly out of scope — it needs guest
  sessions and abuse protection in the backend, and it is a separate decision.
- **Escalates on four triggers:** the customer asks for a human; the AI judges
  itself unable to answer; a hard-blocked topic (refunds, complaints, warranty
  claims, payment failures, negotiation, bulk quotes); or detected frustration.
- **It never dead-ends a refusal.** Whenever it can't do something, it says so
  plainly, says a person who can is being brought in, and escalates in the same
  breath. "I'm not able to do that" on its own is worse than useless.
- **Silent for good once escalated**, for the life of that conversation — even if
  the staff member never replies, or claims and then releases it. One voice at a
  time. The only reset is the conversation being `RESOLVED`, after which the
  customer's next message opens a fresh one and the AI is first responder again.
  This falls out of `ConversationService.startConversation`, which returns the
  existing conversation while it is `WAITING`/`ACTIVE`.
- **Writes the CRM handover notes** on escalation — intent, products discussed,
  budget, why it escalated — so the staffer opens [[notes-panel]] already knowing
  the story instead of reading back through fifteen messages.

## Why the split, and not the two alternatives

The backend calls **out** to an `/ai/reply` endpoint we host. It sends the
transcript and customer context, we return `{ reply, escalate, notes }`, and it
posts the reply as a real `SYSTEM` message through the existing Redis
`chat:events` bridge.

`MessageSenderType.SYSTEM` is already in the Prisma enum, already in
`chat.contract.ts`, already accepted by `MessageService.saveMessage`, and already
rendered by both frontends ([[system-message]]) — **and nothing has ever emitted
one.** There is a bot-shaped hole already cut in the system. Both alternatives
were worse:

- **Everything in the backend.** Architecturally the tidiest thing that could
  exist — one deploy, no hop, no extra infrastructure. Rejected because the
  backend is another dev's repo ([[repos-separately-owned]]). An assistant's
  prompts and rules need tuning weekly in the first months; if every tweak is a
  PR into someone else's release cycle, the tuning stops happening and the
  assistant quietly rots.
- **A standalone service we own,** logging into `/ws` as a staff account.
  Requires no backend changes at all, but needs `SUPER_ADMIN` purely to bypass
  the reply gate at `chat.socket.ts:251` without claiming the thread, posts AI
  replies as `STAFF` rather than `SYSTEM`, and adds an always-on process with its
  own datastore and uptime to watch.

The split keeps the correct data model **and** keeps every frequently-tuned part
deployable from here. It needs no always-on process and no new database — the
backend hands us the whole conversation each call, so the AI's own state is
readable from the transcript.

## What the backend must ship first

Summarised here so this ADR stands alone; the implementable detail is in the
contract document.

1. `AiState` enum (`HANDLING` / `ESCALATED` / `OFF`) plus `aiEscalationReason`
   and `aiReplyCount` on `conversations`, exposed on the conversation REST
   payloads.
2. A fix to `MessageService.saveMessage:43-55` — as written, a `SYSTEM` message
   increments `unreadByStaff` (so every AI-handled chat shows unread to staff,
   defeating the point) and never increments `unreadByCustomer` (so the widget's
   closed-state badge never rises).
3. `aiState` added to the `ConvMetaCache` hash, patched wherever the column
   changes — otherwise the hot path authorises against a stale value for up to
   ten minutes and the AI keeps talking after an escalation.
4. A debounced `AI_REPLY` job on the existing `chat-events` queue, a worker
   handler that calls us, and three new cases in `chat.subscriber.ts` (which
   currently warns on unknown events).
5. `CHAT_CONTRACT_VERSION` 1 → 2, adding `AiState` and a `chat:ai:state` event.

**Nothing in this ADR can be built and verified end-to-end until that lands.**
See "Picking this up" below for what can start early.

## What we build here

### 1. The `/ai/reply` endpoint

A route handler in this app. The AI key belongs with staff-side secrets, and this
app already proxies backend calls server-side ([[0003]]). It is plain
request/response — no persistent connection — which is precisely why the split
needs no always-on process.

Request and response shapes are fixed by the contract document (§8). In outline:
in comes `{ conversationId, aiReplyCount, shadowMode, customer, messages }`; out
goes `{ reply, escalate, notes, meta }`. A `reply` of `null` means post nothing —
a normal outcome, used for every off-switch we own.

**Model: Claude Sonnet 5.** Roughly $0.05 per conversation, ~$77/month at fifty
chats a day, against ~$26 for Haiku 4.5. The ~$50 difference buys judgement on
the two things that matter most: reading a vague budget-and-purpose request
("something for my daughter starting uni, around 400k") and recognising when to
hand over. One extra laptop sold covers it many times.

Prompt caching applies — the system prompt and knowledge base are identical on
every call, so that block costs a tenth of normal input. Output is small. The
headline 3× rate difference overstates the real gap considerably.

Tools available to the model, all read-only, all against public product
endpoints: catalogue search (`/api/v1/products/search`, OpenSearch-backed),
product and variant detail, category/brand lookup, variant stock. Order data is
**not** fetched — it arrives in the request payload, because the order endpoints
are scoped to the customer's own JWT which we don't have and shouldn't have.

**Deployment caveat, unresolved:** a reply involving two or three catalogue
lookups can take 15–30 seconds. The contract specifies a 30s timeout on the
backend side. Confirm this app's hosting permits a request that long before
committing to this location — if it doesn't, the endpoint needs a different home
and that changes the build.

### 2. The knowledge base

Markdown files authored once, loaded into the system prompt:
returns and refunds, warranty, delivery and pickup, payment methods, hours and
locations, order lifecycle.

The customer app has **no** FAQ or policy content today —
`(marketing)/support/page.tsx` is a `ComingSoon` stub, and the only support
surface is the contact forms in `src/features/contact/`. The admin Help Center
([[0011]]) is substantial but is staff-operations content written as TSX
components, not customer answers, and is the wrong source.

The same files should later fill the empty `/support` page, so the policies have
one home rather than two that drift.

> **Blocking content dependency:** the actual policies — real return window,
> warranty terms, delivery zones and times, payment methods, opening hours — must
> come from the business. Do not invent them. An assistant confidently quoting an
> invented return policy is the single most damaging failure mode available to it.

### 3. Customer app — product cards

The AI recommends products with a card: image, name, key specs, exact price,
stock, and an add-to-cart button.

`SendMessageInput` carries only `body: string` — no attachments, no metadata —
and `MessageReceivedEvent` is the same. So cards are encoded as **tokens inside
the message body**, one per line:

```
Two good options in your budget:
[[variant:V-11924]]
[[variant:V-10877]]
Both are in stock today.
```

(That token syntax is unrelated to this ADR's `[[wikilink]]` convention — it is
literal text in a chat message.)

The widget parses tokens out of the body and renders a live card from the public
product endpoint, so price and stock are always current even when re-reading an
old thread. Cards are **variant-level** — the AI names the specific configuration
it is recommending, so add-to-cart is unambiguous. If the choice is genuinely
open, it sends two cards.

Needs a graceful fallback when a variant is later hidden or deleted, and a
compact chip rendering in the admin thread so staff see what the customer saw.

Note the known cart-write dependency ([[cart-writes-cookie-dependency]]): cart
writes need the `Secure cartSessionId` cookie, which is dropped over
`http://localhost`. Add-to-cart from a card will fail in local dev and work in
production — do not chase it as a card bug.

Also: [[use-chat]] currently masks every `STAFF` message as `"Blessing Admin"`
(`AGENT_DISPLAY_NAME`, also enforced in `api/chat.service.ts:80`). `SYSTEM`
messages must route around that and render with the assistant's own identity and
AI badge.

### 4. Admin app — the Queue split, controls, and quality

Because AI-handled conversations stay unassigned and `WAITING` (deliberately —
so staff can still claim them), the Queue tab would otherwise fill with threads
that need nobody. It splits in two, driven by `aiState` off the conversation
list:

- **Needs human** — escalations. Fires the existing desktop notification and
  sound ([[use-desktop-notifications]]).
- **AI handling** — quiet. No notification, no sound.

Live updates come from the new `chat:ai:state` event on `staff:room`, so a row
moves the moment the AI escalates rather than on the 60-second poll.

Controls, all enforced by our endpoint returning `reply: null`:

- **Global on/off**, taking effect in seconds with no deploy. Non-negotiable — if
  the assistant starts saying something wrong at 2am you need it silenced from a
  phone. (`AI_ENABLED` on the backend is a separate, cruder backstop.)
- **Per-conversation "stop the AI"**, so an admin watching a thread go wrong can
  mute it without taking over yet.
- **Business-hours schedule** and **per-topic disable** — both wanted, both
  cheaper here than in the backend.

Quality: staff can flag a specific AI message as wrong with a one-line reason,
and those flags collect into a list that is actually read. Alongside it, counters
for handled / escalated (by reason) / flagged. **Tuning comes from the flags** —
dashboards say what happened, flags say which reply was bad.

## Guardrails

- **Cap AI replies per conversation** (default 15), then forced handover. As much
  a product rule as a cost one: a chat still circling after fifteen AI replies
  needed a person several replies ago. Enforced backend-side via `aiReplyCount`.
- **Daily spend ceiling** that switches the AI off and alerts, rather than
  quietly running up a bill on a loop or a bug. Falling back to the human queue
  is exactly today's behaviour, so the failure mode is safe.
- **Never state a price, stock figure or delivery claim it has not just looked
  up.** No answering from memory or inference. A bot quoting a price you did not
  agree becomes a customer expectation you then have to honour or argue about.
- **Ignore instructions embedded in customer messages.** Blast radius is limited
  because the AI can only read — but a bot promising a discount still creates a
  real argument at checkout. Discounts are always a human decision.
- **On our failure:** the backend retries once, then posts a plain
  acknowledgement and escalates. The customer is never left in silence, and the
  wording stays truthful by not claiming anyone is available right now.

## Rollout

**Shadow mode first, for about a week.** Every AI reply is posted with
`isInternal: true` — staff see exactly what it would have said, customers see
nothing. The team flags what is wrong, we fix the knowledge base against real
questions, then a single env change sends the same replies to customers.

It is nearly free given the design — the same message posted privately instead of
publicly — and it is the only way to learn how the assistant handles *your*
customers before they see it.

## Picking this up

**Blocked on the backend** — cannot be built or verified until the contract
lands: the `/ai/reply` endpoint's integration, the Queue split (needs `aiState`
on the list payload), the `chat:ai:state` wiring, and anything end-to-end.

**Startable now, no backend dependency:**

1. **The knowledge base markdown** — as soon as the business supplies the
   policies. This is the critical path and the most likely thing to delay launch.
2. **Confirm the 30-second request timeout** on this app's hosting. Resolve
   before writing the endpoint; a negative answer relocates it.
3. **The product-card component and token parser** in the customer app. It reads
   from public product endpoints and can be developed against hand-written
   message bodies containing tokens, with no AI and no backend change.
4. **The endpoint's prompt, tools and knowledge-base loading**, testable against
   fixture payloads shaped by contract §8 — the request shape is already fixed,
   so this does not need the backend to exist.

When the backend lands, re-pull the contract in both frontends
(`npm run pull:chat-contract`; CI checksums will fail if a copy drifts) and work
through the acceptance criteria in the contract document §13.

## Open questions

- **The assistant's name.** "Blessing Assistant" is a placeholder throughout.
- **Numbers to confirm:** debounce (default 3s), reply cap (15), spend ceiling.
- **Where `/ai/reply` finally lives**, pending the timeout answer above.
- **Whether escalations should also fire `queueNotifyStaff`** so they reach the
  existing notification bell, or whether `chat:ai:state` alone is enough. Left to
  the backend maintainer.

## Consequences

- We take on an external dependency in the reply path. If our endpoint is down,
  the customer gets an acknowledgement and the chat falls back to the human queue
  — the status quo, not a regression — but it is a second thing that can break
  and it is ours to watch.
- We hold the Anthropic key and the spend. That is the point: it is what keeps
  prompt tuning on our side.
- One conversation-shaped concept now spans three repos. The contract file is the
  only coupling, and it is checksum-verified in CI, so drift is loud rather than
  silent.
- Staff behaviour must change in one respect: the AI un-mutes only when a
  conversation is `RESOLVED`. Threads left unresolved mean that customer never
  sees the assistant again. Worth saying explicitly in the Help Center chat guide
  ([[0012]]) when this ships.
- The knowledge base becomes the canonical home for customer-facing policy. Once
  `/support` is built on the same files, changing a policy in one place changes
  it everywhere — but until then, the files and whatever staff say by hand can
  disagree.
