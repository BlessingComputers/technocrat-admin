# The browser calls a same-origin `/api` proxy, never the backend directly

The browser talks only to `admin.blessingcomputers.com/api/*`; `next.config.ts`
rewrites `/api/:path*` to the DigitalOcean backend server-side. This keeps the
staff session cookies **first-party httpOnly** on the admin origin, so
`credentials: 'include'` works without cross-site cookie rules — and stays
working as browsers phase out third-party cookies.

## Consequences

A future reader may try to "simplify" by pointing the client at the backend URL
directly with CORS. Do not — that turns the session cookies into third-party
cookies, which modern browsers block, silently breaking auth. The direct backend
URL (`API_BASE_URL`) is for **server-side** use only (rewrites, server actions,
`get-server-session`); client code always uses the relative `/api` prefix.

## Amendment (2026-07): the chat WebSocket is the one sanctioned exception

Chat's Socket.IO connection (`features/chat/api/chat-socket.ts`) connects the
browser **directly** to `NEXT_PUBLIC_BACKEND_URL/ws`. It cannot ride the
same-origin rewrite: Next's trailing-slash redirect (308 `/socket.io/` →
`/socket.io`) strips the slash the Socket.IO handshake requires, so the proxied
poll 404s at the backend, and the WebSocket upgrade doesn't traverse the rewrite
either. Because the HttpOnly cookie can't flow cross-origin, the handshake
authenticates via `handshake.auth.token`, fetched from the same-origin
`/api/auth/staff/socket-token` bridge route. REST traffic remains exclusively
on the `/api` proxy; the backend's Socket.IO CORS must allowlist the admin
origin(s).
