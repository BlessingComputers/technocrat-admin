"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { usePermissions } from "@/lib/auth/use-permissions";
import { filterHelpDocsByPermissions } from "@/lib/auth/permissions";
import {
  helpDocs,
  helpDocHref,
  helpCategory,
  HELP_CATEGORIES,
  HELP_TYPE_LABEL,
  type HelpCategory,
  type HelpDoc,
} from "@/config/help-docs";
import { DocHero, Bento, BentoTile } from "./doc-kit";
import { MetaLabel } from "@/components/shared/meta-label";

/**
 * Span/tone rhythm for the category mosaic. Widths pair to 12 columns and the
 * tones stay light + varied (jewel, muted, accent) — the two *dark* surfaces
 * on the page are the green hero deck and the graphite CTA band, so the mosaic
 * doesn't double up on inverted panels (green-owns-action, DESIGN.md).
 */
const MOSAIC_PATTERN = [
  { span: 7, tone: "card" },
  { span: 5, tone: "jewel" },
  { span: 5, tone: "muted" },
  { span: 7, tone: "accent" },
] as const;

/**
 * Help center hub (route `/help`) — "Command Deck" (ADR-0011). A reading surface,
 * so it's allowed a bolder, Committed treatment than the rest of the admin: a
 * full-width split hero with an inverted at-a-glance deck, a staggered category
 * mosaic with prominent faded glyphs, and a navy "Working responsibly" CTA band.
 * Search filters the registry instantly (no backend); permission-aware relevance
 * decides what each viewer sees (presentation only — routes stay reachable).
 */
export function HelpIndexView() {
  const { session } = usePermissions();
  const [query, setQuery] = useState("");

  const visibleDocs = useMemo(
    () => filterHelpDocsByPermissions(helpDocs, session),
    [session],
  );

  const groups = useMemo(() => groupByCategory(visibleDocs), [visibleDocs]);
  const gettingStarted = visibleDocs.find((d) => d.slug === "getting-started");
  const results = useMemo(
    () => searchHelpDocs(visibleDocs, query),
    [visibleDocs, query],
  );
  const isSearching = query.trim().length > 0;

  return (
    <div className="w-full space-y-10 pb-16">
      <DocHero
        eyebrow="Help center"
        title="Need a hand? Start here."
        lead="Everything you need to run the shop, in one place — plain-language guides for every part of the admin, from the catalogue to chat."
        aside={
          <GlanceDeck
            guides={visibleDocs.length}
            areas={groups.length}
            gettingStarted={gettingStarted}
          />
        }
      >
        <SearchField value={query} onChange={setQuery} />
      </DocHero>

      {isSearching ? (
        <SearchResults results={results} query={query} />
      ) : (
        <>
          <CategoryMosaic groups={groups} />
          <ResponsibilityBand />
        </>
      )}
    </div>
  );
}

/* ── Hero deck (inverted maroon) ──────────────────────────────────────── */

function GlanceDeck({
  guides,
  areas,
  gettingStarted,
}: {
  guides: number;
  areas: number;
  gettingStarted?: HelpDoc;
}) {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-7">
      <AppIcon
        icon="solar:book-linear"
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-6 size-56 text-primary-foreground/10"
      />
      <div className="relative">
        <MetaLabel tone="pinned" className="block">
          At a glance
        </MetaLabel>
        <div className="mt-4 flex items-end gap-6">
          <Stat value={guides} label={guides === 1 ? "guide" : "guides"} />
          <span className="mb-2 h-8 w-px bg-primary-foreground/20" />
          <Stat value={areas} label={areas === 1 ? "area" : "areas"} />
        </div>
      </div>

      <div className="relative mt-6 flex flex-col gap-2">
        {gettingStarted && (
          <DeckLink
            href={helpDocHref(gettingStarted.slug)}
            icon="solar:compass-linear"
            title="New here? Start with Getting started"
          />
        )}
        <DeckLink
          href="#working-responsibly"
          icon="solar:shield-check-linear"
          title="Working responsibly"
        />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="leading-none">
      <div className="text-4xl font-semibold tracking-tight">{value}</div>
      <MetaLabel tone="pinned" className="block mt-1.5">
        {label}
      </MetaLabel>
    </div>
  );
}

function DeckLink({
  href,
  icon,
  title,
}: {
  href: string;
  icon: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-primary-foreground/20 motion-reduce:transition-none"
    >
      <AppIcon icon={icon} className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">{title}</span>
      <AppIcon
        icon="solar:alt-arrow-right-linear"
        aria-hidden
        className="size-4 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </Link>
  );
}

/* ── Search ───────────────────────────────────────────────────────────── */

function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <AppIcon
        icon="solar:magnifer-linear"
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search guides — try “parts”, “refund”, “stock”…"
        aria-label="Search help guides"
        className="h-13 w-full rounded-xl border border-border bg-background/80 py-3.5 pl-12 pr-4 text-sm text-foreground shadow-soft outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
      />
    </div>
  );
}

function SearchResults({
  results,
  query,
}: {
  results: HelpDoc[];
  query: string;
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <AppIcon icon="solar:inbox-linear" className="size-8 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">
          No guides match “{query.trim()}”.
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Try a different word, or clear the search to browse every guide by area.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <MetaLabel className="block">
        {results.length} {results.length === 1 ? "guide" : "guides"}
      </MetaLabel>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {results.map((doc) => (
          <li key={doc.slug}>
            <DocRow doc={doc} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A single doc as a result row. */
function DocRow({ doc }: { doc: HelpDoc }) {
  const category = helpCategory(doc.category);
  return (
    <Link
      href={helpDocHref(doc.slug)}
      className="group flex h-full items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/20 motion-reduce:transition-none"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-ink">
        <AppIcon icon={doc.icon} className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {doc.title}
          </h3>
          <TypeBadge doc={doc} />
        </div>
        <p className="text-sm text-muted-foreground">{doc.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium">
            {category.label}
          </span>
          {doc.updated && <UpdatedStamp iso={doc.updated} />}
        </div>
      </div>
      <AppIcon
        icon="solar:alt-arrow-right-linear"
        aria-hidden
        className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </Link>
  );
}

/* ── Category mosaic ──────────────────────────────────────────────────── */

interface CategoryGroup {
  category: HelpCategory;
  docs: HelpDoc[];
}

function CategoryMosaic({ groups }: { groups: CategoryGroup[] }) {
  if (groups.length === 0) return null;
  const total = groups.length;

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Browse by area
        </h2>
        <MetaLabel>
          {total} {total === 1 ? "area" : "areas"}
        </MetaLabel>
      </div>

      <Bento className="items-start">
        {groups.map(({ category, docs }, i) => {
          const pattern = MOSAIC_PATTERN[i % MOSAIC_PATTERN.length];
          const span = i === total - 1 && total % 2 === 1 ? 12 : pattern.span;
          return (
            <BentoTile
              key={category.id}
              span={span}
              tone={pattern.tone}
              bgIcon={category.icon}
              // Staggered vertical offset for editorial rhythm (lg+ only).
              className={i % 2 === 1 ? "lg:mt-12" : undefined}
            >
              <CategoryTileBody category={category} docs={docs} tone={pattern.tone} />
            </BentoTile>
          );
        })}
      </Bento>
    </section>
  );
}

function CategoryTileBody({
  category,
  docs,
  tone,
}: {
  category: HelpCategory;
  docs: HelpDoc[];
  tone: (typeof MOSAIC_PATTERN)[number]["tone"];
}) {
  const jewel = tone === "jewel";
  return (
    <>
      <div
        className={cn(
          "mb-4 flex size-12 items-center justify-center rounded-2xl",
          jewel ? "bg-jewel/15 text-jewel-ink" : "bg-primary/10 text-primary-ink",
        )}
      >
        <AppIcon icon={category.icon} className="size-6" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {category.label}
      </h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
        {category.description}
      </p>

      <ul className="mt-5 flex flex-1 flex-col gap-2">
        {docs.map((doc) => (
          <li key={doc.slug}>
            <Link
              href={helpDocHref(doc.slug)}
              className="group flex items-center gap-3 rounded-xl bg-background/70 px-3.5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5 hover:text-primary-ink motion-reduce:transition-none"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  jewel
                    ? "bg-jewel/15 text-jewel-ink"
                    : "bg-primary/10 text-primary-ink",
                )}
              >
                <AppIcon icon={doc.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate">{doc.title}</span>
              <TypeBadge doc={doc} />
              <AppIcon
                icon="solar:alt-arrow-right-linear"
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary-ink motion-reduce:transition-none"
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ── Working-responsibly CTA band (inverted navy) ─────────────────────── */

const RESPONSIBLE_DOS = [
  "Open only what your role needs, and lock your screen when you step away.",
  "Handle customer details with care — look, don’t copy or share.",
  "Preview pricing and invoices before you apply or send them.",
];

const RESPONSIBLE_DONTS = [
  "Share your login, or work from a colleague’s signed-in session.",
  "Export or forward customer data outside the tools here.",
  "Bypass a block or warning you don’t understand — ask an admin first.",
];

function ResponsibilityBand() {
  return (
    <section
      id="working-responsibly"
      className="relative scroll-mt-8 overflow-hidden rounded-3xl border border-secondary bg-secondary p-8 text-secondary-foreground sm:p-10 lg:p-12"
    >
      <AppIcon
        icon="solar:shield-check-linear"
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -right-8 size-80 text-secondary-foreground/[0.06]"
      />
      <div className="relative grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-secondary-foreground/10 text-secondary-foreground">
            <AppIcon icon="solar:shield-check-linear" className="size-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Working responsibly
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-secondary-foreground/80">
            You&apos;re working with real customer data and live money. A few
            habits keep the shop — and its customers — safe.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
          <DoDontColumn tone="do" items={RESPONSIBLE_DOS} />
          <DoDontColumn tone="dont" items={RESPONSIBLE_DONTS} />
        </div>
      </div>
    </section>
  );
}

function DoDontColumn({
  tone,
  items,
}: {
  tone: "do" | "dont";
  items: string[];
}) {
  const isDo = tone === "do";
  const icon = isDo ? "solar:check-circle-linear" : "solar:close-circle-linear";
  // These two sit inside ResponsibilityBand, a `bg-secondary` panel — graphite in
  // BOTH themes. So the -ink Rule inverts here: raw `--success`/`--destructive`
  // stay bright in either theme (L 0.63 / 0.72) and read on graphite, while
  // `-ink` (L 0.47 in light) would go muddy. Do not "finish" the -ink migration
  // on this component.
  return (
    <div className="rounded-2xl bg-secondary-foreground/[0.06] p-5 ring-1 ring-inset ring-secondary-foreground/10">
      <p className="mb-3 flex items-center gap-2 text-xs font-medium text-secondary-foreground">
        <AppIcon
          icon={icon}
          className={cn("size-4", isDo ? "text-success" : "text-destructive")}
        />
        {isDo ? "Do" : "Don’t"}
      </p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-sm leading-relaxed text-secondary-foreground/85"
          >
            <AppIcon
              icon={icon}
              aria-hidden
              className={cn(
                "mt-0.5 size-4 shrink-0",
                isDo ? "text-success" : "text-destructive",
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Small pieces ─────────────────────────────────────────────────────── */

function TypeBadge({ doc }: { doc: HelpDoc }) {
  return (
    <Badge variant="muted" className="text-xs">
      {HELP_TYPE_LABEL[doc.type]}
    </Badge>
  );
}

function UpdatedStamp({ iso }: { iso: string }) {
  const label = useMemo(() => formatUpdated(iso), [iso]);
  return (
    <span className="inline-flex items-center gap-1">
      <AppIcon icon="solar:clock-circle-linear" aria-hidden className="size-3" />
      Updated {label}
    </span>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Group docs by category, keeping HELP_CATEGORIES order, dropping empty areas. */
function groupByCategory(docs: HelpDoc[]): CategoryGroup[] {
  return HELP_CATEGORIES.map((category) => ({
    category,
    docs: docs.filter((d) => d.category === category.id),
  })).filter((g) => g.docs.length > 0);
}

/**
 * Ranks docs against a query over title, category label, keywords, and
 * description. Title matches rank highest; a blank query returns nothing (the
 * caller shows the grouped hub instead).
 */
function searchHelpDocs(docs: HelpDoc[], query: string): HelpDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return docs
    .map((doc) => {
      const title = doc.title.toLowerCase();
      const category = helpCategory(doc.category).label.toLowerCase();
      const keywords = doc.keywords.join(" ").toLowerCase();
      const description = doc.description.toLowerCase();

      let score = 0;
      if (title.includes(q)) score += title.startsWith(q) ? 100 : 60;
      if (category.includes(q)) score += 30;
      if (keywords.includes(q)) score += 20;
      if (description.includes(q)) score += 10;

      return { doc, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .map((r) => r.doc);
}

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
