# A feature maps to a backend resource, not to a sidebar entry

Because the architecture forbids cross-feature imports, the granularity of a
"feature" is expensive to get wrong: slice too finely and sibling features must
share types/services across a boundary that bans it. We decided a feature is a
**bounded domain backed by one backend resource**, owning all of its routes and
UI — not one-feature-per-sidebar-item. Growth within a domain is absorbed by
sub-folders under the feature's `components/` (e.g. `products/components/brand/`),
never by splitting into a sibling feature.

## Consequences

Two merges follow that contradict the original `docs/ARCHITECTURE.md` old→new
table and `docs/MIGRATION.md` Phase 5, which must be corrected:

- **Bank Accounts folds into `orders`.** It is the `adminCheckout` backend
  resource (`/v1/checkout/admin/bank-accounts`, types extend `BankAccount`, CRUD
  lived in `admin-checkout.service.ts`) and shares the `orders` permission. Route
  stays `/checkout/bank-accounts`; there is no top-level `bank-accounts` feature.
- **Dashboard + Analytics become one `analytics` feature** (two route views over
  one `admin-dashboard` service, both gated by the `analytics` permission).

Thin domains with their own backend resource and permission group (Sales,
Socials, Security, Invoices, Customers, Inventory) stay their own feature even as
one-screen stubs — small size is never a reason to merge, and a feature with one
tiny file per folder is acceptable. Net: ~11 features, not 13.
