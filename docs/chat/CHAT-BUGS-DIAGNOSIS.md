# Live Chat: What's Actually Broken, and How to Fix It

**Date:** 2026-07-11
**Audience:** the team (dev + backend engineer) — plain language, no deep jargon
**Based on:** reading the real code across all three apps **and** the live browser
console log captured from `admin.blessingcomputers.com`.

> Companion docs in this folder: `CHAT-CONVEX-MIGRATION-ANALYSIS.md` (should we move
> to Convex) and `admin-blessingcomputers/docs/adr/chat-convex-migration.md` (the
> deep technical version). **This doc is about fixing the chat we already have.**

---

## 1. The short version

The chat has **three separate problems** that got tangled together and made it look
like one big mystery:

1. **The connection problem** — the live connection can't survive in production. It
   never settles, keeps retrying, and dies the moment you send a message. This is an
   **infrastructure/setup** issue, not a code-logic issue.
2. **The history problem** — messages are never being saved to the database, so chat
   history always comes back empty. This is because the part of the system that saves
   messages (a separate background process) isn't doing its job.
3. **The "always online" problem** — when a user logs out, their chat connection isn't
   properly shut off, so they keep looking connected.

The good news: none of these mean the chat is fundamentally wrong. They're fixable
setup and wiring issues. Below is exactly what's happening and what to do.

---

## 2. The console error is misleading — read this first

The browser showed this:

```
GET https://api.blessingcomputers.com/socket.io/?...transport=polling   504 (Gateway Timeout)
Access to XMLHttpRequest ... blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

It **looks** like a CORS (cross-site permission) error. **It is not.** Here's the real
story, in order:

1. The browser asked the backend to open the chat connection.
2. The request hit a **504 Gateway Timeout** — that's an error page produced by the
   **gateway/load-balancer in front of the backend** (the DigitalOcean layer at
   `api.blessingcomputers.com`), _before_ it even reached the app.
3. That gateway error page doesn't include the "you're allowed" (CORS) header, because
   error pages never do.
4. So the browser's _last_ complaint is about the missing CORS header — which is why
   CORS is the loudest line in the log.

**The CORS message is a side effect of the 504.** The admin site's address is already
on the backend's allowed list, and the log even shows the chat _does_ connect for a
moment (`socket connected: IMeEBAuI7y1lBulFAAAB`) before dying again. So: **stop
chasing CORS. Chase the 504.**

---

## 3. Problem #1 — the connection can't survive (the 504 / dropping / endless polling)

This single root cause explains **four** of the symptoms you reported:

- the socket keeps dropping
- it never stops "polling"
- it drops the instant you send a message
- it's perpetually reconnecting

### What's going on, in plain terms

A live chat connection has two ways to talk: a fast, always-open "phone line"
(**WebSocket**), and a slower fallback that works like **rapidly refreshing a web page**
(**polling**). The system is supposed to start on polling and then upgrade to the fast
WebSocket.

Two things are going wrong:

**(a) The upgrade to the fast line never happens.** The gateway in front of the backend
isn't letting the WebSocket upgrade through, so the chat is stuck on the slow
"refreshing" mode forever. That's the endless polling you see.

**(b) The slow mode is fragile because of how the backend is set up.** In polling mode,
every single action — including sending a message — is a _fresh_ request. For that to
work, all of those requests must be handled by the **same backend copy** that started
the conversation, because the backend is currently remembering connections **in its own
memory** (the code literally says _"Using in-memory adapter (single instance mode)"_ and
the shared-memory option is switched off).

If the backend is running **more than one copy** (instance/container) behind the load
balancer, and the load balancer isn't pinned to send a user back to the same copy every
time ("sticky sessions"), then:

- Your first request lands on copy **A** and starts a conversation.
- Your next request — or your "send message" — lands on copy **B**, which has never
  heard of you.
- Copy B hangs, the gateway gives up after a timeout, and you get a **504**.
- The chat gives up and reconnects… and the cycle repeats.

That is _exactly_ the "connects for a second, then drops, especially when I hit send"
behaviour.

**One aggravating detail in the backend code:** if any single chat action throws an
unexpected error, the server is currently wired to **shut the whole server down and
restart** (it treats it as a fatal crash). During each restart, _everyone_ gets 504s.
So one bad message can briefly take the whole chat offline.

### The one question that confirms this

**How many instances/containers does `api.blessingcomputers.com` run?**

- If it's **more than one** → this is almost certainly the root cause. ✅
- If it's **exactly one** → then the 504 is the gateway timing out the slow polling
  requests, and the fix is mostly about the WebSocket upgrade + gateway timeout.

---

## 4. Problem #2 — history is always empty (messages aren't being saved)

This is completely separate from the connection issue and explains:

- "chat history doesn't persist"
- "the response returns an empty array"
- "I don't know where the messages are stored"

### What's going on, in plain terms

When you send a message, the backend does **not** save it to the database right away.
On purpose, for speed, it does this:

1. Instantly shows the message to the other person (live).
2. Drops a "please save this message" note into a **to-do list** (a background queue).
3. Moves on.

A **separate background program** — the "**worker**" — is supposed to pick notes off
that to-do list and actually write them into the database. **The live chat server and
the worker are two different programs.**

Here's the catch: **starting the chat server does not start the worker.**

- `npm run dev` starts the **API/chat server only**.
- The worker is a totally separate command (`npm run workers`, or the "worker" process
  in the production setup).

So if the worker isn't running, every message is dropped onto the to-do list and
**nobody ever saves it**. The live chat still looks fine (messages appear in real time),
but nothing is written down. Refresh the page and the history is empty — because the
history is read from the database, which never got anything.

### How to confirm in 30 seconds

- Check whether the worker process is running. Its startup log line is:
  `[ChatWorker] Started ✓`
- Or look straight in the database:
  `SELECT count(*) FROM chat_messages;`
  If that number is ~0 (or way lower than the messages you've sent), the worker isn't
  saving. **Confirmed.**

### Bonus clarification: "why don't I see a request for the history?"

That's partly by design. The customer widget only asks the server for history **once**,
at the moment the chat window opens (`GET /api/v1/chat/my-conversation`). There is **no**
"fetch history" request per message — new messages arrive over the live connection, not
by re-fetching. So:

- If the live connection is down (Problem #1), you may never see that one request.
- When you do see it, it returns an **empty** history because of Problem #2.

---

## 5. Problem #3 — users stay "online" after logging out

### What's going on, in plain terms

Two facts:

1. **The backend doesn't actually track customers being online at all** — it only tracks
   _staff_ presence. So a "customer is online" light is either showing staff status, or
   is being guessed from "there's still a live connection."

2. **Logging out doesn't close the chat connection.** The connection is only fully shut
   down when the chat component is _removed from the page_ — it is **not** tied to the
   login/logout state. On top of that, the connection is set to **retry forever**. So a
   user who logs out but leaves the page open keeps a chat connection alive (and keeps
   retrying every few seconds — more endless polling). For **staff**, every reconnect
   re-registers them as "online," so they stay lit up until an internal timer expires.

The fix is to **cut the connection the moment someone logs out**, and to **stop retrying
forever** when the session is clearly gone.

---

## 6. Symptom → cause cheat sheet

| What you saw                          | Real cause                                                           | Which problem |
| ------------------------------------- | -------------------------------------------------------------------- | ------------- |
| CORS error in the console             | Misleading — it's really a 504 from the gateway                      | (see §2)      |
| Socket keeps polling, never upgrades  | Gateway isn't allowing the WebSocket upgrade                         | #1            |
| Connection keeps dropping             | Multiple backend copies + no "sticky sessions" + in-memory setup     | #1            |
| Drops the instant I send              | Same as above — the "send" request hits the wrong backend copy       | #1            |
| Whole chat goes down sometimes        | Server restarts itself on any unexpected error                       | #1            |
| History returns an empty array        | Messages are queued but the **worker that saves them isn't running** | #2            |
| "Where are messages stored?"          | In the `chat_messages` table — but only if the worker writes them    | #2            |
| No history request in the network tab | History is fetched once on open, not per message                     | #2            |
| Customers perpetually online          | No customer presence tracking + logout doesn't close the connection  | #3            |

---

## 7. The fix checklist

Ordered so the **biggest wins come first**. Owner is a suggestion, not a rule.

### 🔴 Do first — makes the connection actually work (Problem #1)

- [ ] **Find out how many instances the backend runs.** (Backend engineer) This decides
      everything below. One command / one look at the DigitalOcean dashboard.
- [ ] **If more than one instance:** either - [ ] scale the backend to **a single instance** (quick, temporary), **or** - [ ] turn on **sticky sessions / session affinity** on the load balancer **and**
      re-enable the **Redis adapter** in the backend (the code block is already
      there, just commented out in `app.ts`). _(Backend engineer)_
- [ ] **Make the WebSocket upgrade work through the gateway.** Ensure the DigitalOcean
      proxy forwards WebSocket upgrade headers and has an idle timeout of **≥ 60 seconds**.
      _(Backend engineer / infra)_
- [ ] **Re-test.** The console should show a clean `socket connected` that **stays**
      connected, and the network tab should show it upgrade from "polling" to
      "websocket" instead of polling forever.

### 🟠 Do next — makes messages actually save (Problem #2)

- [ ] **Confirm the chat worker process is deployed and running** in production
      (log line `[ChatWorker] Started ✓`). _(Backend engineer)_
- [ ] **Check the database:** `SELECT count(*) FROM chat_messages;` — confirm the count
      goes **up** after sending a few test messages once the worker is running.
- [ ] Make sure the worker is part of the normal start/deploy process so it can't be
      "forgotten" again. _(Backend engineer)_

### 🟡 Do after — stops the "always online" and the retry storms (Problem #3)

- [x] **Close the chat connection on logout** — wire the disconnect to the login/logout
      state, not just to the page unmounting. _(Frontend — both customer and admin apps)_
      **Done:** customer widget hangs up when `isAuthenticated` flips false
      (`use-chat.ts`); admin hangs up in the logout handler (`topbar.tsx`) and on
      workspace unmount (`use-chat-socket.ts`).
- [x] **Stop retrying forever** when the session is clearly gone (a logged-out user
      shouldn't keep hammering the server every few seconds). _(Frontend)_
      **Done:** reconnection is now bounded (`reconnectionAttempts: 10`) in both socket
      factories, re-armed on the browser `online` event so transient outages still
      recover without an endless retry storm.
- [ ] Decide whether you actually want a **customer online indicator**. If yes, it needs
      to be built on the backend (it doesn't exist today). If no, make sure the UI isn't
      implying it. _(Product decision, then backend)_

### ⚪ Hardening — cheap safety improvements (recommended regardless)

- [ ] **Wrap the "send message" handler in error handling** so one bad message returns a
      clean error instead of an unhandled crash. Its sibling handlers already do this;
      this one is the odd one out. _(Backend engineer)_
- [ ] **Stop shutting down the whole server on an unexpected error.** Right now one
      uncaught error restarts everything and 504s every user mid-conversation. Log it and
      keep running instead. _(Backend engineer)_

---

## 8. How we'll know it's fixed

- The browser console shows **one** `socket connected` that **persists** (no repeating
  `connect_error` / `xhr poll error`), and the connection **upgrades to websocket**.
- Sending a message **does not** drop the connection.
- After sending messages and **refreshing the page**, the previous messages are still
  there.
- `SELECT count(*) FROM chat_messages` **increases** as you chat.
- After logging out, the chat stops connecting (no endless polling), and the user no
  longer shows as online.

---

## 9. Who owns what (quick split)

- **Backend engineer / infra:** instance count, sticky sessions, Redis adapter,
  WebSocket upgrade through the gateway, the worker process, the two backend hardening
  items. _(These are the ones that fix the biggest symptoms.)_
- **Frontend (customer + admin apps):** disconnect-on-logout and bounded reconnection.
- **Product/decision:** whether a customer "online" indicator should exist at all.

> **Bottom line:** the chat isn't broken at its core — it's mis-deployed. The connection
> needs the right multi-instance setup and a working WebSocket path (Problem #1), the
> message-saving worker needs to actually be running (Problem #2), and logout needs to
> hang up the line (Problem #3). Fix those three and the symptom list clears.
