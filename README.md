# Technocrat Admin

Internal staff dashboard for Technocrat. This app is a **wholesale clone of
`admin-blessingcomputers`** (Next 16.3.0, React 19.2.7, vertical-slice
architecture) that is being restyled in place onto Technocrat's design system.

The **first commit on `main` is the pristine copy**, untouched. Everything after
it is the Technocrat divergence, so the whole restyle reads as one diff.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3100
```

Other scripts: `npm run build`, `npm run lint`, `npm test`, `npm run gen:icons`,
`npm run gen:api`.

> **Environment.** No `.env` files were carried over from Blessing (they held
> Blessing's secrets). Until the env & API seam ticket lands, create a local
> `.env.development` pointing `NEXT_PUBLIC_BACKEND_URL` / `API_BASE_URL` at the
> shared dev backend.

## Port allocation

Four apps in this workspace need to run at once. Next auto-increments from 3000
when a port is busy, which makes URLs depend on start order — so the two
Technocrat apps are pinned out of that range.

| App | Port | Pinned? |
| --- | --- | --- |
| `blessingcomputers` (customer storefront) | 3000 | no — owns the default |
| `admin-blessingcomputers` | 3001 | no — auto-increments off 3000 |
| `technocrat-frontend` | 3002 | no — auto-increments |
| **`technocrat-admin` (this app)** | **3100** | **yes — `--port 3100` in `dev`/`start`** |

Only this app is pinned; changing the Blessing repos' scripts is out of scope
here. If start order ever makes 3001/3002 ambiguous, pin those too.

## Branching

- Branches: `main` (pristine clone baseline) and `dev` (working branch).
- **No remote.** GitHub, CI, and deploy are deliberately deferred. The inherited
  cPanel deploy scripts (`zip`/`upload`/`restart`/`deploy`, hardcoded to
  Blessing's box) were **removed**, not repointed.

## Docs

`CLAUDE.md` · `AGENTS.md` · `ARCHITECTURE.md` · `DESIGN.md` · `PRODUCT.md` ·
[`docs/adr/`](docs/adr/README.md) — all inherited from Blessing admin and still
describing Blessing where they haven't been rewritten yet. The ADR index records
which decisions are inherited and how they get superseded.
