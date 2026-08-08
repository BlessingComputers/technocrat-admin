# The main app keeps all admin code until explicit post-stress-test sign-off

The admin integration in the main `blessingcomputers` app is **live in
production**. Until the new standalone admin app has been stress-tested end to
end, the main app retains **all** of its admin code — routes, features, services,
hooks, auth helpers. Nothing is deleted on a timer.

## Consequences

- Admin code is **intentionally duplicated** across the two repos during the
  cutover. A future reader seeing the same admin features in both should not
  "de-duplicate" by deleting from the main app.
- Rollback is therefore just a DNS / redirect change at any point before sign-off
  (see `docs/MIGRATION.md` rollback section) — the main app can serve admin again
  immediately because its code never left.
- The original plan's "delete after one week of stability" is **superseded**:
  deletion is gated on explicit owner sign-off after stress testing, not elapsed
  time. The cleanup phase stays last and stays optional until then.
