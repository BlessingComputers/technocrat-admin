# Technocrat Admin parity audit

## Purpose

This folder records evidence for a staged comparison of Technocrat Admin against Blessing Admin. Blessing Admin is the behavioral reference. Technocrat must match its supported behavior unless an approved brand or deployment difference applies.

This audit does not claim parity. Session 1 defines scope and brand rules only.

## Repository baseline

| Repository | Branch | Commit | Working tree |
| --- | --- | --- | --- |
| Blessing Admin | `main`, 2 commits ahead of `origin/main` | `b41240c85b21a6fc85f5b13a3f195e80b3414a5d` | Clean |
| Technocrat Admin | `dev`, 2 commits ahead of `origin/dev` | `52117edcdd21a65c1c1af8662ff500c891813369` | Clean before this evidence was added |

Git emitted permission warnings for the sandbox user's global ignore file. These did not prevent status or hash collection.

## Completed session

Session 1, scope and canonical branding rules, completed 2026-09-17.

No application code changed. No issues were filed. No fixes were attempted.

## Evidence files

- `scope.md`: comparison boundary, reference rules, and exclusions
- `branding-inventory.md`: names, domains, assets, fonts, tokens, environment seams, and forbidden Blessing markers
- `exceptions.md`: approved differences and rules for classifying them

## Open questions

- Technocrat's environment files do not yet set the confirmed storefront URL, `https://technocratng.com`.
- Technocrat temporarily uses `https://api.blessingcomputers.com` and `https://hard-berty-elijay-27db4d69.koyeb.app`. The final backend origin will be `https://api.technocratng.com`. Session 2 should classify the temporary hosts as approved infrastructure, not branding defects.
- May Technocrat keep the Blessing-named object-storage host `technocratblessingcomputers.fra1.digitaloceanspaces.com` while both apps share media storage?
- Technocrat's shared `globals.css` still contains fixed Blessing maroon values in chart and sidebar tokens. Session 2 must classify each occurrence as shared design-system behavior, preview-only styling, or a brand leak before reporting a defect.
- Blessing has an ignored `.env.local` despite its architecture guidance saying it should not. It was not read or changed. Confirm whether its presence matters to later runtime QA.

## Next session

Session 2 should build route and feature parity matrices, scan Technocrat for forbidden Blessing markers with the exceptions in this folder, and classify findings. It must continue excluding `/catalogues/cleanup` and the category-cleanup implementation. Do not treat shared semantic success, warning, or destructive colors as brand leaks without usage evidence.
