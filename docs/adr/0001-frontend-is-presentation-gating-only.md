# Frontend does presentation-gating only; the backend is the sole authorization authority

The admin app is a client to a separate backend API and has no database of its
own, so it cannot truly enforce authorization — only the backend can, and it
already returns `401`/`403`. We therefore decided the frontend models
authorization for **UX only**: it filters the sidebar nav and hides affordances
the user lacks permission for (reading `session.permissions`), and the
middleware is a coarse cookie-*presence* gate. Mutating server actions are thin
forwarders that relay the backend's `403`; they do **not** re-check permissions.

## Considered Options

- **(A) Presentation-gating only** — chosen. One source of truth (backend); each
  of the ~11 features adds near-zero authorization code; nothing can drift out of
  sync with the backend's rules.
- **(B) Defense-in-depth replication** — re-encode permission rules in middleware
  and server actions (the "4-layer" plan). Rejected: it duplicates the rule set
  across two codebases and 11 features for no enforcement the backend's own `403`
  doesn't already provide.

## Consequences

A future reader will see no permission checks inside server actions and may try
to "fix" that. That is deliberate — see option (B). If a button must be hidden,
gate it in the UI with the session's permissions; never add a server-side
permission check as a security measure here.
