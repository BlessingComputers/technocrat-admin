# Chat System — Frontend Integration Guide

> Complete reference for connecting to the live chat system: authentication, REST endpoints, all Socket.IO events with payloads, and end-to-end flow walkthroughs.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Connecting to the Socket](#connecting-to-the-socket)
4. [REST API — Staff Endpoints](#rest-api--staff-endpoints)
5. [REST API — Customer Endpoints](#rest-api--customer-endpoints)
6. [Socket Events — Client → Server](#socket-events--client--server)
7. [Socket Events — Server → Client](#socket-events--server--client)
8. [End-to-End Flows](#end-to-end-flows)
9. [Debugging & Verification](#debugging--verification)

---

## Overview

The chat system uses two communication channels together:

- **REST API** — for loading data on page load (conversation list, history, notes). Uses standard HTTP with a Bearer token header.
- **Socket.IO over WebSocket** — for all real-time events: sending messages, typing indicators, presence, assignment notifications, and the queue. Authenticated via the Socket.IO handshake.

> **Important:** The socket connects to the `/ws` namespace specifically. Connecting to the root or any other namespace will not work for chat.

There are two user types with different permissions:

| Role | Capabilities |
|------|-------------|
| **Customer** | Start one conversation, send messages, see typing indicators, receive assignment and resolution events, track queue position |
| **Staff / Admin** | See all conversations, join any conversation, send messages, self-assign, resolve, write internal notes, use staff room, see staff presence |

---

## Authentication

### REST API — HTTP Bearer Token

All REST endpoints require an `Authorization` header with a Bearer JWT obtained from the login endpoint.

```
Authorization: Bearer <your_jwt_token>
```

```js
const res = await fetch('/api/v1/chat/conversations', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```

---

### Socket.IO — Handshake Auth Object

The socket does **not** use an HTTP Authorization header. The token must be passed via the Socket.IO `auth` object when connecting. The server reads it from `socket.handshake.auth.token`.

```js
import { io } from 'socket.io-client';

const socket = io('https://your-api.com/ws', {
  auth: {
    token: 'your_jwt_token_here'   // ← required
  },
  transports: ['websocket'],   // recommended — skip polling
});
```

> **Warning:** Passing `extraHeaders: { Authorization: 'Bearer ...' }` will **not** work. The middleware does not check HTTP headers for the socket — it will reject the connection with *"Unauthorized — no token provided"*.

#### Fallback options (lower priority)

If the `auth` object is not available, the server also checks:

1. **Query param:** `?token=your_jwt` — works but the token appears in server logs
2. **Cookie:** `staffAccessToken` or `accessToken` — browser sets automatically if using cookie-based auth

#### Connection error handling

```js
socket.on('connect_error', (err) => {
  console.error(err.message);
  // Possible messages:
  // "Unauthorized — no token provided"
  // "Session expired — please log in again"
  // "Unauthorized — invalid token"
  // "Account not found"
  // "Account deactivated"
});
```

---

## Connecting to the Socket

Connect to the `/ws` namespace on the API server. On successful connection, the server automatically places your socket in a personal room `user:{userId}` and runs the appropriate on-connect logic based on your role.

```js
const socket = io('https://your-api.com/ws', {
  auth: { token: getToken() },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (err) => {
  console.error('Auth failed:', err.message);
});
```

### What happens on connect — Staff

1. Server adds staff to the `staff:room` broadcast room
2. Server marks the staff as online in Redis (presence system)
3. Server emits `presence:list` — current snapshot of all online staff
4. Server emits `staffroom:history` — recent staff room messages
5. All other connected staff receive `presence:staff:online`
6. Server drains the waiting queue — assigns any pending conversations to this staff member

### What happens on connect — Customer

1. Server checks if the customer has an active or waiting conversation in the database
2. If one exists, the socket is automatically joined to `conv:{conversationId}` room
3. Server emits `chat:conversation:updated` with the conversation's current status

> **Staff heartbeat:** Send `presence:heartbeat` every 30 seconds after connecting. The server's presence TTL is 5 minutes — if heartbeats stop, the server will mark the staff offline and redistribute their conversations.

```js
socket.on('connect', () => {
  socket.emit('presence:heartbeat');
  const hb = setInterval(() => socket.emit('presence:heartbeat'), 30_000);
  socket.on('disconnect', () => clearInterval(hb));
});
```

---

## REST API — Staff Endpoints

Base path: `/api/v1/chat`  
All staff endpoints require: `Authorization: Bearer <token>`

---

### `GET /conversations`

Returns all active (`WAITING` + `ACTIVE`) live-chat conversations. Use this to populate the admin queue on page load.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `mine` | boolean | If `true` — returns conversations assigned to the requesting staff member **plus** all unassigned `WAITING` conversations. Omit for all conversations. |

**Response**

```json
[
  {
    "id": "uuid",                          // ← use this in all socket events
    "conversationId": "CONV-XXXXXXXXXX",  // ← display only
    "status": "WAITING",
    "customerId": "uuid",
    "assignedStaffId": "uuid | null",
    "subject": "Order #12345 delayed",
    "lastMessageAt": "2024-01-15T10:30:00Z",
    "unreadByStaff": 3,
    "messageCount": 7,
    "customers": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "avatarUrl": null
    }
  }
]
```

---

### `GET /conversations/:id`

Returns full detail of a single conversation including customer info, assigned staff, participants, paginated message history, and internal notes.

Use `nextCursor` from the history to load older messages by passing it as `?cursor=`.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `cursor` | ISO date string | For pagination — pass `nextCursor` from the previous response to fetch older messages |

**Response**

```json
{
  "conversation": {
    "id": "uuid",
    "conversationId": "CONV-XXXXXXXXXX",
    "status": "ACTIVE",
    "channel": "LIVE_CHAT",
    "subject": "Order #12345 delayed",
    "initialMessage": "Hi, I need help with my order.",
    "firstResponseAt": "2024-01-15T10:31:00Z",
    "messageCount": 7,
    "unreadByStaff": 0,
    "customers": { "firstName": "Jane", "customerId": "CUST-XXX", "..." : "..." },
    "staff": { "firstName": "John", "staffId": "STF-XXX" },
    "conversation_participants": [{ "staffId": "uuid", "joinedAt": "..." }]
  },
  "history": {
    "messages": [
      {
        "id": "uuid",
        "senderType": "CUSTOMER",
        "senderId": "uuid",
        "senderName": "Jane Doe",
        "senderAvatar": null,
        "body": "Hello, I need help with my order.",
        "isInternal": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "nextCursor": null
  },
  "notes": { "..." : "..." }
}
```

---

### `GET /conversations/:id/notes`

Returns internal CRM notes for a conversation. Returns `null` if no notes have been saved yet.

**Response**

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "leadName": "Jane Doe",
  "leadEmail": "jane@example.com",
  "leadPhone": "+2348012345678",
  "leadStatus": "QUALIFIED",
  "productsDiscussed": "MacBook Pro 14, iPhone 15",
  "pricesDiscussed": "₦850,000 for MacBook",
  "budgetRange": "₦500,000 – ₦900,000",
  "customerIntent": "Home office setup",
  "handoverNotes": "Follow up Thursday",
  "followUpDate": "2024-01-18T09:00:00Z",
  "followUpNote": "Send pricing sheet"
}
```

---

### `GET /staffroom/history`

Returns paginated message history for the internal staff room. Supports cursor-based pagination.

Also sent automatically over the socket as `staffroom:history` on staff connect — only use this endpoint for loading older messages.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `cursor` | ISO date string | For pagination |

---

## REST API — Customer Endpoints

---

### `GET /my-conversation`

Returns the authenticated customer's current active or waiting conversation with full message history.  
Returns `null` if the customer has no active conversation.

**Use on page load** to resume an existing chat without the customer having to start again.

**Response**

```json
{
  "conversation": {
    "id": "uuid",
    "conversationId": "CONV-XXXXXXXXXX",
    "status": "WAITING",
    "assignedStaffId": null,
    "subject": "My order is delayed",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "history": {
    "messages": [ "..." ],
    "nextCursor": null
  }
}
```

---

## Socket Events — Client → Server

Use `socket.emit(eventName, payload)` for all events below.

---

### `chat:start` — Start a conversation
**Who:** Customer only

Only one active conversation per customer is allowed. If one already exists the server returns it instead of creating a new one.

```js
socket.emit('chat:start', {
  initialMessage: 'Hi, I need help with my order',  // required
  subject: 'Order #12345 delayed',                   // optional
  pageUrl: 'https://shop.com/orders/12345',          // optional
});
```

**Payload fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `initialMessage` | string | ✅ | The opening message. Must not be empty. |
| `subject` | string | ❌ | Short topic for the conversation |
| `pageUrl` | string | ❌ | Page the customer was on when they opened chat |

**Response:** Server emits `chat:conversation:created` back to the customer.

---

### `chat:message` — Send a message
**Who:** Customer + Staff

Hot path — Redis only. Zero database calls on send. DB write is queued asynchronously.  
**Rate limit: 30 messages per minute per user.**

```js
socket.emit('chat:message', {
  conversationId: 'uuid-of-conversation',   // the internal id field, not conversationId
  body: 'When will my order arrive?',
  idempotencyKey: crypto.randomUUID(),      // optional but recommended
});
```

**Payload fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | string (UUID) | ✅ | Internal UUID (`id` field, not `conversationId`) |
| `body` | string | ✅ | Message text. Must not be empty. |
| `isInternal` | boolean | ❌ | Staff only. `true` hides the message from the customer. |
| `idempotencyKey` | string | ❌ | Prevents duplicates on retry. Generate with `crypto.randomUUID()`. |

**Response:** Sender receives `chat:message:saved`; all other room members receive `chat:message:received`.

---

### `chat:join` — Join a conversation room
**Who:** Staff only

Staff **must** emit this before they can receive `chat:message:received` for a conversation. Emit every time a conversation is opened in the UI.

```js
socket.emit('chat:join', { conversationId: 'uuid' });
```

No response event is emitted.

---

### `chat:assign` — Self-assign a conversation
**Who:** Staff only

Staff claims a conversation for themselves. Updates DB and Redis cache, then emits `chat:conversation:assigned` to the conversation room.

```js
socket.emit('chat:assign', { conversationId: 'uuid' });
```

---

### `chat:resolve` — Resolve a conversation
**Who:** Staff only

Closes the conversation (sets status to `RESOLVED`). Emits `chat:conversation:resolved` to the room and directly to the customer.

```js
socket.emit('chat:resolve', { conversationId: 'uuid' });
```

---

### `chat:typing:start` / `chat:typing:stop` — Typing indicators
**Who:** Customer + Staff

Broadcasts a typing indicator to other participants. The server auto-clears after 5 seconds if `chat:typing:stop` is missed (e.g. browser crash).

```js
// User starts typing
socket.emit('chat:typing:start', { conversationId: 'uuid' });

// User stops typing (emit when input clears or loses focus)
socket.emit('chat:typing:stop', { conversationId: 'uuid' });
```

---

### `chat:read` — Mark conversation as read
**Who:** Customer + Staff

Resets the unread counter (`unreadByStaff` or `unreadByCustomer`) to zero in the database.

```js
socket.emit('chat:read', { conversationId: 'uuid' });
```

---

### `chat:notes:update` — Update internal CRM notes
**Who:** Staff only

Creates or updates CRM notes on a conversation. All fields optional except `conversationId`. Only send the fields you want to update.

```js
socket.emit('chat:notes:update', {
  conversationId: 'uuid',
  leadName: 'Jane Doe',
  leadEmail: 'jane@example.com',
  leadPhone: '+2348012345678',
  leadAddress: '123 Main St, Lagos',
  leadStatus: 'QUALIFIED',           // NEW | CONTACTED | QUALIFIED | CONVERTED | LOST
  productsDiscussed: 'MacBook Pro 14, iPhone 15',
  pricesDiscussed: '₦850,000 for MacBook',
  budgetRange: '₦500,000 – ₦900,000',
  customerIntent: 'Home office setup',
  handoverNotes: 'Follow up Thursday — customer wants a quote',
  followUpDate: '2024-01-18T09:00:00.000Z',
  followUpNote: 'Send pricing sheet and availability',
});
```

**Response:** Server emits `chat:notes:updated` to the sender with `saved: true`.

---

### `staffroom:message` — Send a staff room message
**Who:** Staff only

Broadcasts a message to all connected staff. Persisted to the database asynchronously.

```js
socket.emit('staffroom:message', {
  body: 'Heads up — customer in CONV-ABC is escalating',
  idempotencyKey: crypto.randomUUID(),  // optional
});
```

---

### `staffroom:typing` — Staff room typing indicator
**Who:** Staff only

```js
socket.emit('staffroom:typing', { isTyping: true });
socket.emit('staffroom:typing', { isTyping: false });
```

---

### `presence:heartbeat` — Keep presence alive
**Who:** Staff only

No payload. Send every 30 seconds after connecting.

```js
socket.emit('presence:heartbeat');
```

---

## Socket Events — Server → Client

Use `socket.on(eventName, callback)` for all events below.

---

### `chat:conversation:created`
**Who receives:** The customer who called `chat:start`

```json
{
  "conversationId": "uuid",          // store this — use in all future socket events
  "publicId": "CONV-AB12CD34EF",     // human-readable — display to user
  "status": "WAITING",
  "isExisting": false                // true if customer already had an open conversation
}
```

```js
socket.on('chat:conversation:created', (data) => {
  setConversationId(data.conversationId);
  setStatus(data.status);
});
```

---

### `chat:conversation:assigned`
**Who receives:** Everyone in the conversation room + the assigned staff member's personal room (`user:{staffId}`)

Emitted when the system (round-robin auto-assign) or a staff member (`chat:assign`) assigns the conversation.

```json
{
  "conversationId": "uuid",
  "assignedStaffId": "uuid"
}
```

```js
socket.on('chat:conversation:assigned', ({ conversationId, assignedStaffId }) => {
  // Customer: show "You're connected to an agent"
  // Staff: move conversation from WAITING → ACTIVE in the UI
  updateConversationStatus(conversationId, 'ACTIVE');
});
```

---

### `chat:conversation:resolved`
**Who receives:** Everyone in the conversation room + the customer's personal room

```json
{
  "conversationId": "uuid",
  "resolvedBy": "staffId"   // omitted in the personal-room copy sent to the customer
}
```

---

### `chat:conversation:updated`
**Who receives:** Customer only — sent on socket connect if they have an active conversation

Allows the UI to restore state without making a REST call first.

```json
{
  "conversationId": "uuid",
  "publicId": "CONV-AB12CD34EF",
  "status": "WAITING"
}
```

---

### `chat:message:received`
**Who receives:** All participants in the conversation room except the sender. Internal messages (`isInternal: true`) are only delivered to staff.

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "senderType": "CUSTOMER",
  "senderName": "Jane Doe",
  "senderAvatar": null,
  "body": "Hello, I need help.",
  "isInternal": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "idempotencyKey": "msg:uuid"
}
```

```js
socket.on('chat:message:received', (msg) => {
  appendMessageToChat(msg);
});
```

---

### `chat:message:saved`
**Who receives:** The sender only — acknowledgement that the message was queued for persistence

Use this to clear any "sending…" state in the UI. The `idempotencyKey` matches what was sent in `chat:message`.

```json
{
  "idempotencyKey": "msg:uuid",
  "tempId": "uuid",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### `chat:typing:start` / `chat:typing:stop`
**Who receives:** All other participants in the conversation room

```json
{
  "conversationId": "uuid",
  "userId": "uuid",
  "audience": "customer"
}
```

> `audience` field is only present on `chat:typing:start`, not on `chat:typing:stop`.

---

### `chat:queue:position`
**Who receives:** The conversation room — emitted when no staff is available and the conversation enters the waiting queue

```json
{
  "conversationId": "uuid",
  "position": 3
}
```

```js
socket.on('chat:queue:position', ({ position }) => {
  setStatus(`You are #${position} in the queue`);
});
```

---

### `chat:dashboard:new`
**Who receives:** All connected staff (broadcast to `staff:room`)

Emitted the moment a customer creates a new conversation. Use this to add a new row to the admin queue in real time — no refresh required.

```json
{
  "conversationId": "uuid",
  "publicId": "CONV-AB12CD34EF",
  "customerId": "uuid",
  "subject": "Order delay",
  "preview": "Hi, I need help with my ord...",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

```js
socket.on('chat:dashboard:new', (conv) => {
  addConversationToQueue(conv);
});
```

---

### `staffroom:message:received`
**Who receives:** All connected staff

Same shape as `chat:message:received`.

---

### `staffroom:history`
**Who receives:** The connecting staff member only — sent once on connect

```json
{
  "messages": [],
  "nextCursor": null
}
```

---

### `staffroom:typing`
**Who receives:** All other staff in the staff room

```json
{ "userId": "uuid", "isTyping": true }
```

---

### `presence:list`
**Who receives:** The connecting staff member only — current snapshot of all online staff

```json
[
  {
    "staffId": "uuid",
    "socketId": "abc123",
    "isOnline": true,
    "activeChats": 2,
    "name": "John Smith",
    "avatarUrl": null,
    "lastHeartbeat": 1705312200000
  }
]
```

---

### `presence:staff:online`
**Who receives:** All currently connected staff when a new staff member connects

```json
{
  "staffId": "uuid",
  "socketId": "abc123",
  "name": "John Smith",
  "avatarUrl": null
}
```

---

### `presence:staff:offline`
**Who receives:** All connected staff when a staff member disconnects

```json
{ "staffId": "uuid" }
```

---

### `notification:new`
**Who receives:** The assigned staff member's personal room (`user:{staffId}`) — sent when a customer sends a new message in a conversation already assigned to that staff member

```json
{
  "type": "NEW_MESSAGE",
  "conversationId": "uuid",
  "preview": "First 100 chars of the message...",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### `chat:notes:updated`
**Who receives:** All staff in the conversation room

```json
{
  "conversationId": "uuid",
  "updatedBy": "staffId",
  "saved": true
}
```

> `saved: true` is only present on the sender's copy.

---

### `chat:error`
**Who receives:** The sender of the failed event

Always listen for this to handle failures gracefully.

```json
{ "message": "Conversation is resolved" }
```

```js
socket.on('chat:error', ({ message }) => {
  showToast(message, 'error');
});
```

**Common error messages:**

| Message | Cause |
|---------|-------|
| `"Message cannot be empty"` | Empty body in `chat:message` or `chat:start` |
| `"Too many messages — slow down"` | 30/min rate limit exceeded |
| `"Conversation not found"` | Invalid or expired `conversationId` |
| `"Conversation is resolved"` | Attempted to message a closed conversation |
| `"Access denied"` | Customer tried to message a conversation they don't own |
| `"Customers only"` | Staff called `chat:start` |
| `"Staff only"` | Customer called a staff-only event |

---

## End-to-End Flows

### Customer Flow

```
1. Page load
   → GET /api/v1/chat/my-conversation          (restore history if conversation exists)

2. Connect socket
   io('/ws', { auth: { token } })
   ← chat:conversation:updated                 (if existing conv — auto-joined to room)

3. Start a new chat (if no existing conversation)
   → chat:start { initialMessage, subject?, pageUrl? }
   ← chat:conversation:created { conversationId, publicId, status: 'WAITING' }

4. Waiting for agent
   ← chat:queue:position { position: 2 }       (if no staff available)
   ← chat:conversation:assigned                 (when a staff member is assigned)

5. Messaging
   → chat:message { conversationId, body, idempotencyKey }
   ← chat:message:saved   { idempotencyKey, tempId, createdAt }   (ack — sender only)
   ← chat:message:received { ... }                                  (staff replies)

6. Typing
   → chat:typing:start { conversationId }
   → chat:typing:stop  { conversationId }
   ← chat:typing:start { conversationId, userId, audience: 'staff' }

7. Mark read
   → chat:read { conversationId }

8. Chat closed by staff
   ← chat:conversation:resolved { conversationId }
```

**Customer — full setup example:**

```js
// 1. Restore existing conversation on page load
const res = await fetch('/api/v1/chat/my-conversation', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
if (data.data) renderHistory(data.data.history);

// 2. Connect socket
const socket = io('/ws', { auth: { token } });

socket.on('chat:conversation:updated', (data) => setActiveConversation(data));
socket.on('chat:message:received', (msg) => appendMessage(msg));
socket.on('chat:conversation:assigned', () => setStatus('Connected to an agent'));
socket.on('chat:queue:position', ({ position }) => setStatus(`#${position} in queue`));
socket.on('chat:conversation:resolved', () => showEndedMessage());
socket.on('chat:error', ({ message }) => showErrorToast(message));
```

---

### Staff / Admin Flow

```
1. Page load
   → GET /api/v1/chat/conversations             (load queue)

2. Connect socket
   io('/ws', { auth: { token } })
   ← presence:list                             (who is online)
   ← staffroom:history                         (recent staff room messages)
   → presence:heartbeat                        (start 30-second interval)

3. New chat arrives in real time
   ← chat:dashboard:new { conversationId, publicId, preview, ... }
   → add to queue UI

4. Open a conversation
   → GET /api/v1/chat/conversations/:id        (load history + notes)
   → chat:join { conversationId }              ← must emit before receiving messages

5. Self-assign (if not auto-assigned by the system)
   → chat:assign { conversationId }
   ← chat:conversation:assigned { conversationId, assignedStaffId }

6. Send a message
   → chat:message { conversationId, body }
   ← chat:message:saved                        (ack)
   ← chat:message:received                     (customer replies)

7. Send an internal note (not visible to customer)
   → chat:message { conversationId, body, isInternal: true }

8. Update CRM notes
   → chat:notes:update { conversationId, leadStatus, followUpDate, ... }
   ← chat:notes:updated { saved: true }

9. Resolve
   → chat:resolve { conversationId }
   ← chat:conversation:resolved                (broadcast to room + customer)

10. Notifications (assigned conversations only)
    ← notification:new { type: 'NEW_MESSAGE', conversationId, preview }
```

**Staff — full setup example:**

```js
// 1. Load queue via REST
const queueRes = await fetch('/api/v1/chat/conversations', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data: conversations } = await queueRes.json();
setQueue(conversations);

// 2. Connect socket
const socket = io('/ws', { auth: { token }, transports: ['websocket'] });

// 3. Heartbeat
socket.on('connect', () => {
  socket.emit('presence:heartbeat');
  const hb = setInterval(() => socket.emit('presence:heartbeat'), 30_000);
  socket.on('disconnect', () => clearInterval(hb));
});

// 4. Real-time events
socket.on('chat:dashboard:new', (conv) => addToQueue(conv));
socket.on('chat:conversation:assigned', ({ conversationId, assignedStaffId }) => {
  updateQueueItem(conversationId, { assignedStaffId, status: 'ACTIVE' });
});
socket.on('chat:conversation:resolved', ({ conversationId }) => {
  removeFromQueue(conversationId);
});
socket.on('notification:new', (notif) => showNotificationBadge(notif));
socket.on('presence:list', (list) => setOnlineStaff(list));
socket.on('presence:staff:online', (s) => addOnlineStaff(s));
socket.on('presence:staff:offline', ({ staffId }) => removeOnlineStaff(staffId));
socket.on('chat:error', ({ message }) => showToast(message, 'error'));

// 5. When opening a conversation
function openConversation(conversationId) {
  socket.emit('chat:join', { conversationId });
}
```

---

## Debugging & Verification

### Verify socket is connected and authenticated

```js
console.log('Connected:', socket.connected);  // true
console.log('Socket ID:', socket.id);         // "abc123..."
```

### Test the full flow manually in the browser console

**As Customer:**
```js
const s = io('https://your-api.com/ws', { auth: { token: 'CUSTOMER_JWT_HERE' } });
s.on('connect', () => console.log('Customer connected', s.id));
s.on('chat:conversation:created', console.log);
s.on('chat:conversation:assigned', console.log);
s.on('chat:queue:position', console.log);
s.on('chat:message:received', console.log);
s.on('chat:error', console.error);

s.emit('chat:start', { initialMessage: 'Hello, I need help!' });
```

**As Staff (separate tab):**
```js
const a = io('https://your-api.com/ws', { auth: { token: 'STAFF_JWT_HERE' } });
a.on('connect', () => {
  console.log('Staff connected', a.id);
  a.emit('presence:heartbeat');
});
a.on('chat:dashboard:new', (conv) => {
  console.log('New conversation:', conv);
  a.emit('chat:join', { conversationId: conv.conversationId });
  a.emit('chat:message', {
    conversationId: conv.conversationId,
    body: 'Hi! How can I help?',
  });
});
a.on('chat:message:received', console.log);
a.on('presence:list', console.log);
a.on('chat:error', console.error);
```

---

### Verification Checklist

| What to verify | How to confirm |
|----------------|----------------|
| Socket auth works | `socket.connected === true`, no `connect_error` |
| Customer starts chat | Receives `chat:conversation:created` with `conversationId` |
| Staff sees new chat | Staff socket receives `chat:dashboard:new` without refreshing |
| Auto-assignment | Customer receives `chat:conversation:assigned`; staff receives it in their personal room |
| No staff online | Customer receives `chat:queue:position` with a number |
| Messaging works | Sender gets `chat:message:saved`; other side gets `chat:message:received` |
| Staff receives messages | Only works **after** `chat:join` is emitted for that conversation |
| Notifications | Staff personal room receives `notification:new` on new customer message |
| Resolve | Both sides receive `chat:conversation:resolved` |
| Presence | Other staff receive `presence:staff:online` when someone connects |

---

### Critical rules — don't miss these

1. **Staff must emit `chat:join` before receiving messages.** Skipping this is the most common reason messages don't arrive on the staff side.

2. **Use `id` (UUID), not `conversationId` (CONV-XXXXX), in socket events.** The human-readable `conversationId` is for display only.

3. **Token goes in `auth.token`, not in an HTTP header.** `extraHeaders: { Authorization: '...' }` does not work for the socket.

4. **Staff heartbeat is required.** Without it, the presence key expires and the staff member gets marked offline.
