# Audit scope

## Reference and target

- Behavioral reference: `../admin-blessingcomputers`
- Audit target: `../technocrat-admin`
- Baseline commits: Blessing `b41240c85b21a6fc85f5b13a3f195e80b3414a5d`; Technocrat `52117edcdd21a65c1c1af8662ff500c891813369`

Blessing defines expected routes, workflows, permissions, validation, loading and error states, API integration, and staff-facing behavior. A difference is not a defect when `exceptions.md` approves it.

## Included in later parity checks

- Route and navigation coverage
- Feature behavior and state transitions
- Forms, validation, tables, filters, pagination, dialogs, loading, empty, error, and success states
- Authentication, authorization, session handling, API proxying, sockets, uploads, and image-host behavior
- Accessibility and responsive behavior
- Brand-marker scans and visible identity checks
- Help content after applying the approved brand and storefront substitutions

## Excluded

- Blessing route `/catalogues/cleanup`
- Blessing category-cleanup implementation, including its service, view, constants, store, types, exports, navigation, tests, and any behavior used only by that temporary route
- Intentional brand, storefront URL, asset, help-copy, and design-preview styling differences listed in `exceptions.md`
- Deployment work, issue filing, and application fixes during session 1

The cleanup exclusion is narrow. Other catalogue routes and product behavior remain in scope.

## Classification rules

1. Compare behavior before styling.
2. Apply an approved exception only to the stated surface. An exception for a logo does not excuse a Blessing name in unrelated copy.
3. Separate brand colors from semantic colors. Shared success, warning, destructive, info, WhatsApp, loyalty-tier, neutral surface, and accessibility tokens are not defects by value alone.
4. Treat a Blessing brand marker in Technocrat as a candidate finding, not an automatic defect. Check generated contracts, historical docs, tests, third-party identifiers, and shared infrastructure before classifying it.
5. Record evidence with file and line references. Do not claim parity until all included routes and behaviors have been checked.

## Session 1 boundary

Session 1 establishes evidence only. It changes files under `docs/qa/admin-parity/` and leaves application code untouched.
