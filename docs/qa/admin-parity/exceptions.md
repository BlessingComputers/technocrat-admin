# Approved differences

These differences are expected and do not count against behavioral parity when confined to their stated surfaces.

| Area | Approved Blessing-to-Technocrat difference | Boundary |
| --- | --- | --- |
| Product and company identity | Replace Blessing names, title, logo alt text, and support-team name with Technocrat equivalents | User-facing identity must not retain Blessing copy |
| Admin URL | `admin.blessingcomputers.com` becomes `admin.technocratng.com` | Metadata, links, redirects, and deployment settings may differ |
| Storefront URLs | Blessing storefront links become `https://technocratng.com` | Technocrat environment files do not yet set `STOREFRONT_URL`; this remains migration work |
| Assets | Technocrat uses its own full logo, app icon, favicon output, and any future social assets | Blessing asset hashes are forbidden in Technocrat brand slots |
| Brand colors | Blessing maroon primary and ring become Technocrat green values | Shared semantic and referent colors may remain equal |
| Radius | Blessing base radius `0.5rem` becomes Technocrat `0.3725rem` | Derived Tailwind radius scale follows each base token |
| Help copy | Brand names, domains, screenshots, examples, contacts, and brand-specific operating language may change | Workflow meaning and staff instructions should remain behaviorally equivalent |
| Design preview | Preview labels, samples, palettes, and styling may differ to demonstrate each brand | Preview differences do not excuse production UI leaks |
| Deployment and environment | Backend, admin host, storefront host, storage, and deployment-provider settings may differ | Technocrat may temporarily use `https://api.blessingcomputers.com` and `https://hard-berty-elijay-27db4d69.koyeb.app`; final backend is `https://api.technocratng.com`; secrets stay out of evidence |

## Universal colors

Do not flag a value only because both apps share it when it represents:

- success, warning, destructive, or informational state
- neutral background, card, popover, muted, border, input, or text
- WhatsApp's third-party mark
- bronze, silver, gold, or platinum loyalty tiers
- accessibility-specific foreground or ink contrast

Usage decides classification. A semantic red used for an error may match Blessing. The same red used as Technocrat's primary action would be a brand defect.

## Infrastructure markers

Generated API contracts, historical documentation, repository references, tests built around literal URL parsing, and third-party backend identifiers can contain Blessing text without creating a visible brand defect. Session 2 must still record each occurrence and classify it as runtime identity, test fixture, generated evidence, historical documentation, or shared infrastructure.

The Blessing-named DigitalOcean storage hosts are provisional exceptions only. They remain on the forbidden scan list until ownership confirms that Technocrat should use the shared bucket.

`api.blessingcomputers.com` is a time-limited infrastructure exception for Technocrat. Scans should report it as migration evidence, not a current defect. `hard-berty-elijay-27db4d69.koyeb.app` has the same temporary status. The exception ends when `api.technocratng.com` becomes the active backend.

## Excluded implementation

Blessing's temporary `/catalogues/cleanup` route and category-cleanup implementation have no Technocrat parity requirement. Their absence is approved and should not produce missing-route, missing-feature, or missing-navigation findings.
