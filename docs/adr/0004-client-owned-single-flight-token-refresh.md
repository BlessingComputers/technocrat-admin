# Token refresh is client-owned, single-flight across tabs; middleware never refreshes

The backend rotates refresh tokens and **detects reuse** (`TOKEN_REUSE_DETECTED`):
two concurrent refreshes spend the same refresh token and the backend revokes the
whole session. Refresh must therefore be **single-flight across all tabs**. We own
this on the client (the fetch client's `401 → refresh → retry` cycle) and keep the
middleware a dumb cookie-presence gate that **never** triggers a refresh — if both
middleware and the client interceptor refreshed, they would race and trip reuse
detection.

## Consequences

- Cross-tab single-flight is mandatory, not optional — it is a requirement
  imposed by the backend's rotation policy, not a performance nicety.
- The initial migration ports the existing `localStorage`-timeout lock verbatim
  to establish a known-good baseline (verified by the 5-tab race test on a Vercel
  preview).
- It is then hardened to the **Web Locks API** (`navigator.locks`) as a separate,
  independently-verified change — a real cross-tab mutex that auto-releases when a
  tab dies, removing the 10-second timeout guess and the cross-tab clock
  arithmetic. "Did the move work?" stays separate from "did the improvement work?"
