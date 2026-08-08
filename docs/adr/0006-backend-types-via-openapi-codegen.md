# Backend response types come from OpenAPI codegen; Zod owns request inputs

The admin app mirrors a separately-deployed Express backend ("Technocrat
E-commerce API", OpenAPI 3.0.0) across ~11 features. Hand-written contract types
drift silently (e.g. the `role.id` vs `role.name` mismatch). So response/read
shapes are **generated** with `openapi-typescript` into `src/types/api.d.ts`
(the slot `ARCHITECTURE.md` already reserved). Feature `types/` alias from it
(`type Order = components["schemas"]["StaffOrder"]`). **Request/form inputs stay
hand-written as Zod schemas** — the schema is the source of truth, infers the TS
type, and validates the form and the outgoing body. Codegen owns outputs; Zod
owns inputs.

## Spec source (interim → target)

The spec is currently only exposed embedded in Swagger UI's
`/api-docs/swagger-ui-init.js` (the `swaggerDoc` object); there is no clean JSON
endpoint yet (`/api-docs.json` 404s).

- **Interim (no backend dependency):** the `gen:api` script fetches
  `…/api-docs/swagger-ui-init.js`, strips the JS wrapper to `openapi.json`, then
  runs `openapi-typescript`. The extraction is isolated in that one script.
- **Target:** the backend engineer will add
  `app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec))` (agreed, not
  yet done). When it lands, switch the script's source URL to
  `https://…ondigitalocean.app/api-docs.json` — a one-line change; nothing
  downstream moves.

## Consequences

- `src/types/api.d.ts` is **committed** (hermetic builds, reviewable diffs when
  the backend contract changes), regenerated via `npm run gen:api` after backend
  changes and in CI — never in the hot `npm run dev` loop.
- Generated types are type-only and may be imported by any layer; they never add
  runtime code to `lib/`.
- Prod and dev serve Swagger UI at `/api-docs` (prod base
  `https://technocratblessingcomputers-q8gon.ondigitalocean.app`, dev on Koyeb).
