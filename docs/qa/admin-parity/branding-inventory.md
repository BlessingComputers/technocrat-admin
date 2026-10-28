# Branding inventory

## Canonical identity

| Item | Blessing Admin | Technocrat Admin |
| --- | --- | --- |
| Product/company name | Blessing Computers | Technocrat Nigeria |
| Package name | `blessingcomputers` | `technocrat-admin` |
| Admin title | `Admin · Blessing Computers` | `Admin · Technocrat` |
| Logo alt text | `Blessing Online Stores Logo` | `Technocrat Nigeria Logo` |
| Support team copy | `Blessing Computers tech team` | `Technocrat tech team` |
| Admin domain | `admin.blessingcomputers.com` | `admin.technocratng.com` |
| Storefront domain | `www.blessingcomputers.com` | `technocratng.com` |
| Current backend hosts | `api.blessingcomputers.com` | `api.blessingcomputers.com` and `hard-berty-elijay-27db4d69.koyeb.app` |
| Final backend host | `api.blessingcomputers.com` | `api.technocratng.com` |

Canonical Technocrat copy must use the Technocrat column. Blessing names and domains are forbidden in user-facing Technocrat identity unless `exceptions.md` allows the exact context.

## Assets

| App | Role | Path | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| Blessing | Full logo | `public/assets/logo.png` | 23,236 | `72e1abd27b8de8186d4d5affd5e50bee10ad5456232076346eb3e40080b5127b` |
| Blessing | App icon and favicon source | `src/app/icon.png` | 258,168 | `631607cf136c92a1a409c650e2c1eebac4cb1d4d8c563d73ddd5702fc51f5947` |
| Technocrat | Full logo | `public/assets/logo.png` | 45,475 | `c45dee5633ef6a3ff961f80004ff5e115769ffeb7f36b402af3b8cff6de4cda3` |
| Technocrat | App icon and favicon source | `src/app/icon.png` | 10,091 | `804a21b1b47fdde70ab82e820dbf4924160acc55d8f1b79e678249200a792753` |

Neither repository contains separate social-card, Open Graph, Twitter-card, or `.ico` assets. Root metadata deliberately omits marketing social-card data. `Logo` uses the full logo or app icon. Both apps use the same committed Iconify Solar and third-party brand subsets for interface icons. Those subsets are shared UI resources, not company marks.

## Fonts

Both apps self-host the Outfit variable family through `next/font/local` and expose it as `--font-outfit`. Tailwind maps both `--font-sans` and `--font-heading` to it.

| File | SHA-256 |
| --- | --- |
| `src/assets/fonts/outfit-latin.woff2` | `6c18d579fd87c3776be068b762cbc83fde3acb543d49eabd3ade842eb987e887` |
| `src/assets/fonts/outfit-latin-ext.woff2` | `0f53d1c03b3918d744a843b5039001ee31695ca1e255e3914188df81beb461e9` |

Matching hashes confirm the font files are identical.

## Brand tokens

| Token | Blessing light | Blessing dark | Technocrat light | Technocrat dark |
| --- | --- | --- | --- | --- |
| Primary | `oklch(0.559998 0.229498 29.2768)` | same | `oklch(0.55 0.2 145)` | `oklch(0.63 0.17 149)` |
| Ring | `oklch(0.559998 0.229498 29.2768)` | same | `oklch(0.55 0.2 145)` | `oklch(0.63 0.17 149)` |
| Base radius | `0.5rem` | same | `0.3725rem` | same |

Blessing's primary is maroon. Technocrat's primary is green. These values live in `src/app/brand-tokens.css` and feed `--primary`, `--ring`, and the derived radius scale.

## Shared CSS and Tailwind theme

The two `src/app/globals.css` files have no content diff at this baseline. Both import their local brand-token file, then expose these Tailwind mappings:

- Fonts: `sans`, `heading`
- Surfaces and text: background, foreground, card, popover, muted, border, input, ring
- Brand and emphasis: primary, primary ink, secondary, secondary ink, accent, gold, info
- Semantics: success, warning, destructive, plus foreground and ink companions
- Referents: WhatsApp and bronze, silver, gold, and platinum loyalty tiers
- Data and chrome: five chart colors and the sidebar token family
- Radius scale: `sm` 0.6x, `md` 0.8x, `lg` 1x, `xl` 1.4x, `2xl` 1.8x, `3xl` 2.2x, `4xl` 2.6x
- Shadows: `soft` is `0 12px 32px -8px rgb(0 0 0 / 0.06)`; `soft-lg` is `0 24px 56px -12px rgb(0 0 0 / 0.07)`

### Shared palette values

The shared file currently defines:

| Role | Light | Dark |
| --- | --- | --- |
| Secondary | `oklch(0.2781 0.0296 256.85)` | same |
| Accent hover surface | `oklch(0.95 0.004 256.85)` | `oklch(0.34 0.018 256.85)` |
| Gold jewel | `oklch(0.735 0.1462 84.27)` | `oklch(0.78 0.15 84.27)` |
| Success | `oklch(0.627 0.17 152)` | `oklch(0.7 0.16 152)` |
| Warning | `oklch(0.68 0.16 65)` | `oklch(0.78 0.15 70)` |
| Destructive | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| Info | `oklch(0.5 0.12 256.85)` | `oklch(0.64 0.13 256.85)` |

Primary is brand-specific. Secondary and gold are part of the inherited visual system and need a session 2 usage review before they can be called Technocrat brand colors. Success, warning, destructive, and info are semantic roles. Matching values do not prove a brand leak.

## Environment and hosts

Both apps use `NEXT_PUBLIC_BACKEND_URL` as the sole backend host seam. They derive the server API base as `<backend>/api`, use `NEXT_PUBLIC_API_BASE_URL` for the browser's same-origin proxy path with default `/api`, and derive the emergency-unblock endpoint from the backend origin.

Supported variables found in source or repository environment files:

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_API_BASE_URL`, default `/api`
- `IMAGE_ASSET_HOSTS`, optional comma-separated override
- `STOREFRONT_URL`, optional server-only storefront origin
- `NEXT_PUBLIC_SOCKET_POLLING_FALLBACK`, enabled only when equal to `true`
- `CLAUDE_API_KEY`, `GROQ_API_KEY`, and legacy/local `GEMINI_API_KEY`
- `API_DOCS_TOKEN` and `API_DOCS_TOKEN_HOST` for code generation

Default image hosts in both apps:

- `technocratblessingcomputers.fra1.digitaloceanspaces.com`
- `lh3.googleusercontent.com`
- `res.cloudinary.com`
- `i.pravatar.cc`

Blessing development uses storefront `http://localhost:3000`; production uses `https://www.blessingcomputers.com`. Technocrat's canonical storefront is `https://technocratng.com`, but its environment files do not set `STOREFRONT_URL` at this baseline.

Technocrat temporarily uses `https://api.blessingcomputers.com` and `https://hard-berty-elijay-27db4d69.koyeb.app` as backend origins. Its final backend origin is `https://api.technocratng.com`.

## Forbidden Blessing marker seed list

Use case-insensitive scans where text case is not meaningful. Verify context before filing a finding.

### Names and copy

- `Blessing Computers`
- `Blessing Online Stores`
- `Blessing Computers tech team`
- `Admin · Blessing Computers`
- package or repository identity `blessingcomputers` and `admin-blessingcomputers`

### Domains and hosts

- `blessingcomputers.com`
- `www.blessingcomputers.com`
- `admin.blessingcomputers.com`
- `api.blessingcomputers.com`
- `technocratblessingcomputers.fra1.digitaloceanspaces.com`
- `technocratblessingcomputers.fra1.cdn.digitaloceanspaces.com`
- legacy deployment host `technocratblessingcomputers-q8gon.ondigitalocean.app`

The shared storage hosts need an explicit decision before session 2 treats them as defects.

`api.blessingcomputers.com` is an approved temporary Technocrat backend host. Keep it in scan results for migration tracking, but do not classify it as a branding defect until the move to `api.technocratng.com` is due.

### Asset hashes

- Full logo SHA-256: `72e1abd27b8de8186d4d5affd5e50bee10ad5456232076346eb3e40080b5127b`
- Icon SHA-256: `631607cf136c92a1a409c650e2c1eebac4cb1d4d8c563d73ddd5702fc51f5947`

### Exact Blessing brand-color representations found

- Canonical primary and ring: `oklch(0.559998 0.229498 29.2768)`
- Light primary text ink: `oklch(0.47 0.185 29.2768)`
- Dark primary text ink: `oklch(0.8 0.13 29.2768)`
- Light primary sidebar tint: `oklch(0.95 0.022 29.2768)`
- Dark primary sidebar tint: `oklch(0.35 0.09 29.2768)`
- Light deep-maroon chart endpoint: `oklch(0.42 0.15 29.2768)`
- Dark primary chart value: `oklch(0.62 0.2 29.2768)`
- Dark deep-maroon chart endpoint: `oklch(0.74 0.17 29.2768)`
- Design-preview primary hover: `oklch(0.52 0.225 29.28)`
- Design-preview ring alpha form: `oklch(0.559998 0.229498 29.2768 / 0.5)`
- Design-preview ring alpha form: `oklch(0.559998 0.229498 29.2768 / 0.4)`
- Text labels `Blessing Maroon`, `maroon`, and `brand maroon`

No hex, RGB, or HSL representation of the canonical Blessing primary was found. Hex values beside loyalty-tier metals are referent colors, not Blessing primary representations.
