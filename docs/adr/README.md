# Architecture Decision Records

> **ADRs 0001–0014 were inherited from Blessing admin** (`admin-blessingcomputers`),
> which this app is a wholesale clone of. They are kept verbatim so the reasoning
> behind the architecture travels with the code.
>
> They describe decisions made **for Blessing**, not for Technocrat. Where this
> effort overturns one — most likely 0009 (maroon design system), 0010 (sidebar
> overlay drawer), and 0011–0013 (help centre, whose content is Blessing-specific
> prose) — the overturning decision gets its **own superseding ADR in this repo**,
> numbered 0015 onward. The inherited file is left in place and marked superseded
> rather than edited or deleted.
>
> New numbering therefore starts at **0015**.

## Inherited from Blessing admin

| # | Decision |
| --- | --- |
| [0001](0001-frontend-is-presentation-gating-only.md) | Frontend does presentation-gating only; the backend is the sole authorization authority |
| [0002](0002-features-map-to-backend-resources.md) | A feature maps to a backend resource, not to a sidebar entry |
| [0003](0003-same-origin-api-proxy-for-first-party-cookies.md) | The browser calls a same-origin `/api` proxy, never the backend directly |
| [0004](0004-client-owned-single-flight-token-refresh.md) | Token refresh is client-owned, single-flight across tabs; middleware never refreshes |
| [0005](0005-url-state-by-default-zustand-as-exception.md) | URL search params are the default for list state; Zustand is the exception |
| [0006](0006-backend-types-via-openapi-codegen.md) | Backend response types come from OpenAPI codegen; Zod owns request inputs |
| [0007](0007-client-unwraps-the-response-envelope.md) | The fetch client unwraps the backend response envelope; services speak payloads |
| [0008](0008-main-app-retains-admin-code-until-signoff.md) | The main app keeps all admin code until explicit post-stress-test sign-off |
| [0009](0009-admin-ui-design-system.md) | The admin app adopts a maroon design system (light + dark), shadcn re-skinned, Iconify icons |
| [0010](0010-sidebar-overlay-drawer.md) | The desktop sidebar is an on-demand overlay drawer, not a persistent rail |
| [0011](0011-help-center-hub-and-content-model.md) | The Help Center becomes an in-app documentation reference for every admin operation |
| [0012](0012-operation-walkthrough-guides.md) | Operation walkthroughs adapt the ideas behind Pikkam's "How to Sell" page |
| [0013](0013-operating-standards-guides.md) | Standards guides adapt the ideas behind Pikkam's "Photo Tips" page |
| [0014](0014-ai-first-responder-for-customer-chat.md) | An AI assistant answers customer chats first, with the backend as plumbing and the brain in this app |

## Technocrat decisions

| # | Decision |
| --- | --- |
| [0015](0015-single-backend-origin-seam.md) | `NEXT_PUBLIC_BACKEND_URL` is the single backend seam; the API base, unblock URL, sockets and codegen all derive from it |
