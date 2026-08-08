# Vercel Firewall + Bot Protection (Phase 6)

The reason this migration exists: keep bots/crawlers and unauthenticated traffic
off the admin app **at the edge**, before they cost a function invocation or hit
the backend. The app already gates in `proxy.ts` (cookie-presence) and `robots.ts`
(`Disallow: /`); these WAF rules are the outer, defense-in-depth layer.

These are configured in the **Vercel dashboard** (Project → Firewall) or via the
Firewall API — there is no `vercel.json` form for WAF custom rules. Apply them to
the **admin project only**.

## Facts the rules depend on (verified in code)

- Session cookie: **`staffAccessToken`** (refresh cookie `staffRefreshToken`) —
  `src/proxy.ts`.
- The browser never calls the backend cross-origin; it calls the same-origin
  proxy **`/api/*`** (ADR-0003, `next.config.ts` rewrite). So the WAF sees admin
  API traffic as `/api/*` on the Vercel domain.
- **Public, token-less paths that must NOT be denied:**
  - `POST /api/auth/staff/login`
  - `POST /api/auth/staff/forgot-password`
  - `POST /api/auth/staff/reset-password`
  - `GET|POST /api/auth/staff/refresh` ← **critical:** refresh runs *without* a
    valid `staffAccessToken` (that's its whole job). A blanket "deny `/api/*`
    without `staffAccessToken`" rule WILL break silent session refresh if this
    isn't exempted.
- Public page paths (no cookie): `/login`, `/forgot-password`, `/reset-password`,
  `/robots.txt`, `/icon.png`, `/_next/*`, `/favicon.ico`.

## Custom rules (evaluated top-down, first match wins)

### Rule 1 — Rate-limit staff login (anti-brute-force)
- **Condition:** Path equals `/api/auth/staff/login` AND Method is `POST`
- **Action:** Rate Limit — **10 requests / 60s**, keyed by **IP**
- **On exceed:** Deny (429)

> Tightens the brute-force surface; the backend's own IP-block
> (`code: IP_BLOCKED`) is the deeper layer, recoverable via EmergencyUnblock.

### Rule 2 — Allow the public auth endpoints
- **Condition:** Path is one of:
  `/api/auth/staff/login`, `/api/auth/staff/forgot-password`,
  `/api/auth/staff/reset-password`, `/api/auth/staff/refresh`
- **Action:** Allow (stop evaluation — so Rule 3 can't deny them)

### Rule 3 — Deny unauthenticated API traffic
- **Condition:** Path matches `^/api/` **AND** Cookie header does **not** contain
  `staffAccessToken=`
- **Action:** Deny (403)

> This is the workhorse: every API route except the public-auth allowlist requires
> a session cookie at the edge. Bots and direct `/api/*` probes get a 403 without
> ever reaching a function.

### Rule 4 (optional) — Block obvious non-browser traffic on the root
- **Condition:** Path equals `/` AND User-Agent matches a known bad-bot /
  scraper / empty-UA pattern
- **Action:** Deny or Challenge

> Prefer **Bot Protection** (below) over hand-maintained UA lists; keep this only
> for specific offenders you actually see in the Firewall logs.

## Bot Protection
- Enable **Vercel Bot Protection** (Project → Firewall → Bot Protection). Start in
  **log/monitor** mode, watch the Firewall observability tab for false positives
  on legitimate staff, then switch to **challenge/deny**.

## Rollout & verification
1. Add rules in **monitor/log** mode first; watch traffic for a day.
2. Verify, with rules enforcing:
   - Logged-out `curl https://admin…/api/v1/products` → **403** (Rule 3).
   - Staff login still works; an **expired access token still silently refreshes**
     (Rule 2 exemption for `/refresh`) — the 5-tab race test still passes.
   - `/login`, `/forgot-password`, `/reset-password`, `/robots.txt` load fine.
   - `> 10` rapid login POSTs from one IP → **429** (Rule 1).
3. Confirm the subdomain is in **no** sitemap / robots / HTML link from the main
   marketing site (so it isn't discoverable in the first place).

## Notes
- Don't rule on `/_next/*`, `/favicon.ico`, `/icon.png`, `/robots.txt` — Rule 3 is
  scoped to `^/api/` so it won't touch them, and `proxy.ts` already lets them pass.
- Cookie matching is on the raw `Cookie` request header containing the substring
  `staffAccessToken=`. That's presence-only (matches `proxy.ts`); the backend's
  401/403 remains the real authority (ADR-0001).
