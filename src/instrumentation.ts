/**
 * Server bootstrap. `register()` runs once per Next.js server instance, before
 * the first request is handled.
 *
 * ── Why this exists: HTTP/2 kill switch for outbound fetch ──────────────────
 *
 * Node 26's `fetch` negotiates HTTP/2 by default; Node 22 (what the cPanel host
 * runs, `ea-nodejs22`) does not. On some local networks the h2 path corrupts
 * TLS records the moment a request carries a *body*, and every server-side
 * POST/PATCH/DELETE dies with `ERR_SSL_SSL/TLS_ALERT_BAD_RECORD_MAC`, then
 * `ERR_HTTP2_INVALID_SESSION` once the pooled session is poisoned. GETs have no
 * body and sail through, which is what makes it look like a login-only bug:
 * `loginAction`'s fetch throws, so the catch returns its generic
 * "Something went wrong" and nothing reaches the backend at all.
 *
 * Diagnosed 2026-08-20 against both Koyeb and api.blessingcomputers.com. `curl`
 * to the same hosts worked throughout (curl uses HTTP/1.1 for POST), and the
 * deployed site was never affected — this is a local network + Node-version
 * interaction, not an app or backend fault.
 *
 * ── How it works ────────────────────────────────────────────────────────────
 *
 * Node's built-in `fetch` is an *internal* copy of undici, not the one in
 * `node_modules`. They cooperate anyway: both read the current dispatcher from
 * `globalThis[Symbol.for("undici.globalDispatcher.1")]`, so calling the npm
 * package's `setGlobalDispatcher` does reconfigure the built-in `fetch`. This
 * is the same mechanism the ecosystem uses to install an outbound proxy agent.
 *
 * ── Scope ───────────────────────────────────────────────────────────────────
 *
 * Development only by default. Production runs Node 22, where h2 is already off,
 * and `undici` reaches us only as a transitive dev dependency (via `jsdom`) —
 * the deploy runs `npm install --production`, so the package may simply not be
 * there. Hence the dev gate, the dynamic import, and the swallowed failure: a
 * missing workaround must never stop the server from booting.
 *
 * Override with `DISABLE_HTTP2_FETCH`:
 *   - unset      → disabled in development, untouched in production
 *   - `"true"`   → force the h1-only dispatcher in any environment
 *   - `"false"`  → never touch the dispatcher (restore stock behaviour)
 *
 * Delete this file once local Node matches production at 22.x.
 */

function shouldDisableHttp2(): boolean {
  const override = process.env.DISABLE_HTTP2_FETCH;
  if (override === "true") return true;
  if (override === "false") return false;
  return process.env.NODE_ENV === "development";
}

export async function register() {
  // Edge runtime has no undici and no Node TLS stack — nothing to configure.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!shouldDisableHttp2()) return;

  try {
    const { Agent, setGlobalDispatcher } = await import("undici");
    setGlobalDispatcher(new Agent({ allowH2: false }));
  } catch (error) {
    // `undici` absent (production install) or its shape changed. Booting with
    // stock fetch is strictly better than not booting.
    console.warn(
      "[instrumentation] Could not disable HTTP/2 for outbound fetch; " +
        "continuing with Node's default dispatcher.",
      error,
    );
  }
}
