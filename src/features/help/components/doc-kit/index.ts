/**
 * The Doc Kit — the single vocabulary every help doc composes from (ADR-0011).
 *
 * Two tiers:
 * - Content pieces: Section, Path, Steps, Tile, MiniCard, Callout, FieldTable.
 * - Layout primitives: DocHero, Bento/BentoTile, Eyebrow.
 *
 * Guide-type ADRs (0012/0013) add their own content pieces on top of this tier
 * rather than re-inventing components per doc. ADR-0012's bento step mosaic adds
 * StepCard/StepPoint (numbered step cards); 0013 will add its standards pieces
 * (Compare, RuleList, Checklist, DosDonts).
 */
export { Section } from "./section";
export { Path } from "./path";
export { Steps } from "./steps";
export { StepCard, StepPoint } from "./step-card";
export { Tile } from "./tile";
export { MiniCard } from "./mini-card";
export { Callout } from "./callout";
export { FieldTable } from "./field-table";
export { DocHero } from "./doc-hero";
export { Bento, BentoTile } from "./bento";
export { Eyebrow } from "./eyebrow";
