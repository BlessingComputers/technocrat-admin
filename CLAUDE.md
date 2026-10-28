@AGENTS.md


## Design Context

Strategic design context for this app lives in `PRODUCT.md` (project root). Read it
before any UI/design work. In brief:

- **Register:** `product` — this is an internal staff tool; design serves the work
  (throughput, accuracy, low friction), not spectacle.
- **Positioning:** *Expert-backed tech retail — real people behind every order* —
  turned inward: the tool must let staff deliver that service.
- **Personality:** trustworthy, expert, premium, carried in service of the work —
  confident and calm, never toy-like or noisy. Gold stays a deliberate accent.
- **Not:** cold enterprise/government admin, generic template-SaaS card-grid
  dashboards, cluttered back-office, or flashy gamer/RGB styling.
- **Accessibility:** WCAG 2.1 AA (≥4.5:1 body contrast incl. status badges, keyboard
  nav for dense tables/forms, visible focus, reduced-motion, never color-only state).

The visual system (OKLCH maroon/navy/gold tokens, `Outfit`, shadcn/ui, offline Solar
icons, soft shadows, light+dark; see ADR-0009) is defined in `src/app/globals.css`.
Run `/impeccable document` to capture it into a `DESIGN.md`.

---
