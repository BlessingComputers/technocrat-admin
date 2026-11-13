"use client";

import type { ReactNode } from "react";

import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppIcon } from "@/components/shared/app-icon";
import { HoldToConfirmButton } from "@/components/shared/hold-to-confirm-button";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import {
  impactDelta,
  impactKind,
  impactSentence,
  impactShort,
  type ImpactKind,
  type ImpactRow,
  type ImpactSummary,
  type LadderRow,
} from "@/lib/utils/markup-impact";

/*
 * The markup rule dialog, shared by the products and parts pricing screens
 * (ask 41). The slices own the state, the API calls and the copy that differs;
 * these pieces own the layout. Visual spec:
 * docs/design/markup-rule-dialog-comp.html (states A, B, C and phone width).
 *
 * Below `sm` the dialog is a full-height sheet: head and footer stay put, the
 * body scrolls, the columns stack.
 */

// ── Frame ─────────────────────────────────────────────────────────────

export function MarkupDialogContent({ children }: { children: ReactNode }) {
  return (
    <DialogContent
      showCloseButton={false}
      className={cn(
        "flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-[14px] border-border bg-card p-0 shadow-soft-lg sm:max-w-[980px]",
        // Phone: a bottom sheet the height of the screen.
        "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:h-[min(100dvh,800px)] max-sm:max-h-[100dvh] max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none",
      )}
    >
      {children}
    </DialogContent>
  );
}

export function MarkupDialogHead({
  title,
  description,
  onClose,
}: {
  title: ReactNode;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 pt-5.5 pb-4.5 max-sm:px-4 max-sm:pt-4 max-sm:pb-3.5">
      <div className="min-w-0">
        <DialogTitle className="text-xl leading-snug font-medium tracking-[-0.01em] text-balance max-sm:text-base">
          {title}
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground max-sm:text-xs">
          {description}
        </DialogDescription>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <AppIcon icon="solar:close-circle-linear" className="size-5" />
      </button>
    </div>
  );
}

/** One token of the title sentence. `empty` shows a dashed placeholder. */
export function Tok({
  children,
  empty,
  pct,
}: {
  children: ReactNode;
  empty?: boolean;
  pct?: boolean;
}) {
  return (
    <span
      className={cn(
        "border-b-2 px-px font-semibold",
        empty
          ? "border-dashed border-input font-medium text-muted-foreground"
          : pct
            ? "border-transparent text-primary-ink tabular-nums"
            : "border-primary/45 text-foreground",
      )}
    >
      {children}
    </span>
  );
}

/** The two-column body: the form, then the muted side panel. */
export function MarkupDialogBody({
  form,
  side,
}: {
  form: ReactNode;
  side: ReactNode;
}) {
  return (
    <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain sm:grid-cols-[minmax(0,1fr)_388px]">
      <div className="grid min-w-0 content-start gap-6.5 px-6 pt-5.5 pb-6 max-sm:gap-5.5 max-sm:p-4">
        {form}
      </div>
      <aside className="grid min-w-0 content-start border-border bg-background/70 max-sm:border-t sm:border-l [&>section]:px-5 [&>section]:py-4.5 max-sm:[&>section]:p-4 [&>section+section]:border-t [&>section+section]:border-border">
        {side}
      </aside>
    </div>
  );
}

export function FormGroup({
  title,
  htmlFor,
  children,
}: {
  title: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {title}
        </label>
      ) : (
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      )}
      {children}
    </div>
  );
}

// ── Scope ─────────────────────────────────────────────────────────────

/** Shown under the scope cards in "All" mode. `noun` is "product" / "part". */
export function AllScopeNote({ noun, label }: { noun: string; label: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[11px] border border-border bg-background/70 px-3.5 py-3">
      <AppIcon
        icon="solar:layers-minimalistic-linear"
        className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
      />
      <div>
        <p className="text-sm text-foreground">
          Every active {noun} gets this markup unless a more specific rule
          covers it.
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Lowest priority. Only one “{label}” rule can exist.
        </p>
      </div>
    </div>
  );
}

/** Scope of a rule being edited: fixed, so text, not a control. */
export function FixedScope({ tier, scope }: { tier: string; scope: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2 overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{tier}</span>
      <span className="text-sm font-semibold whitespace-nowrap text-foreground" title={scope}>
        {scope}
      </span>
    </div>
  );
}

// ── Percentage ────────────────────────────────────────────────────────

const QUICK_VALUES = [5, 10, 15, 20];
/** The example line prices a round base so the % reads at a glance. */
const EXAMPLE_BASE = 500_000;

export function MarkupPercentField({
  id,
  value,
  onChange,
  min,
  max,
  note,
  error,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  min: number;
  max: number;
  /** Text after the example line, e.g. "Applies to the selling price." */
  note?: string;
  error?: string | null;
}) {
  const pct = Number(value) || 0;
  const example = Math.round(EXAMPLE_BASE * (1 + pct / 100));
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 max-sm:grid max-sm:gap-2.5">
        <div
          className={cn(
            "flex h-15 min-w-40 items-center gap-0.5 rounded-[11px] border bg-card px-4 tabular-nums transition-shadow focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 max-sm:w-full max-sm:justify-center",
            error ? "border-destructive" : "border-input",
          )}
        >
          <span aria-hidden className="text-xl font-medium text-muted-foreground">
            +
          </span>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            aria-describedby={`${id}-hint`}
            aria-invalid={!!error || undefined}
            value={value}
            // A negative percentage is a deal, not a markup.
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-[4ch] min-w-0 bg-transparent text-right text-[32px] font-semibold tracking-[-0.02em] text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <span aria-hidden className="text-xl font-medium text-muted-foreground">
            %
          </span>
        </div>
        <div
          role="group"
          aria-label="Quick values"
          className="flex flex-wrap gap-1.5 max-sm:grid max-sm:grid-cols-4"
        >
          {QUICK_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={pct === v}
              onClick={() => onChange(String(v))}
              className={cn(
                "h-8 rounded-full border px-3 text-xs font-semibold tabular-nums transition-colors max-sm:h-10",
                pct === v
                  ? "border-primary bg-primary/[0.07] text-primary-ink"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              +{v}%
            </button>
          ))}
        </div>
      </div>
      <p id={`${id}-hint`} className="text-sm text-muted-foreground tabular-nums">
        {pct > 0 ? (
          <>
            A {formatPrice(EXAMPLE_BASE)} base price sells at{" "}
            <strong className="font-semibold text-foreground">{formatPrice(example)}</strong>.
          </>
        ) : (
          `Enter ${min} to ${max}%.`
        )}
        {note ? ` ${note}` : ""}
      </p>
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive-ink">
          {error}
        </p>
      )}
    </>
  );
}

// ── Replace ───────────────────────────────────────────────────────────

export function ReplaceOption({
  id,
  checked,
  onChange,
  count,
  disabled,
  keepsRunning,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Active standing markups that would turn off. */
  count: number;
  /** True while Active is off: the backend refuses replace on an inactive rule. */
  disabled: boolean;
  /** e.g. "Deals, hunts and flash sales keep running." */
  keepsRunning: string;
}) {
  const none = count === 0;
  return (
    <div className="rounded-[11px] border border-warning/45 bg-warning/[0.06]">
      <div className="flex items-start gap-3 p-3.5">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(v) => onChange(v === true)}
          disabled={disabled || none}
          className="mt-0.5"
        />
        <label htmlFor={id} className={cn("min-w-0", (disabled || none) && "opacity-70")}>
          <span className="block text-sm font-semibold text-foreground tabular-nums">
            {none
              ? "No other markups are active"
              : `Turn off the other ${count} markup${count === 1 ? "" : "s"}`}
          </span>
          <span className="block text-xs text-muted-foreground">
            {none
              ? "There is nothing to turn off. This rule prices whatever no other rule covers."
              : disabled
                ? "Turn Active on first. Only an active rule can turn the others off."
                : `They switch off and stay in the list, so you can turn them back on. ${keepsRunning} The ladder shows which ones.`}
          </span>
        </label>
      </div>
    </div>
  );
}

// ── Details ───────────────────────────────────────────────────────────

export function DetailsGroup({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-dashed border-border pt-4.5">
      {children}
    </div>
  );
}

// ── Ladder ────────────────────────────────────────────────────────────

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString("en-NG")} ${n === 1 ? one : many}`;

function offList(rules: LadderRow["turnsOff"]) {
  const shown = rules.slice(0, 2).map((r) => `${r.label}, +${r.percentage}%`);
  const more = rules.length - shown.length;
  return more > 0 ? `${shown.join("; ")} and ${more} more` : shown.join("; ");
}

export function PriorityLadder({
  id,
  rows,
  selfDetail,
  replace,
  hidden,
  expanded,
  onToggle,
  totalTiers,
}: {
  id: string;
  /** Already folded by the caller when the ladder is long. */
  rows: LadderRow[];
  /** Sub-line on the rule's own tier, e.g. "Laptops". */
  selfDetail: string;
  replace: boolean;
  /** Rows the fold dropped; 0 hides the toggle. */
  hidden?: number;
  expanded?: boolean;
  onToggle?: () => void;
  totalTiers?: number;
}) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="text-sm font-semibold text-foreground">
        Where it sits
      </h3>
      <ol className="relative mt-3 grid gap-0.5 before:absolute before:top-3.5 before:bottom-3.5 before:left-[11px] before:w-[1.5px] before:bg-border">
        {rows.map((row) => {
          const self = row.relation === "self";
          const off = row.turnsOff.length > 0;
          const sub = self
            ? selfDetail
            : off
              ? offList(row.turnsOff)
              : row.activeCount
                ? plural(row.activeCount, "active rule", "active rules")
                : row.relation === "below"
                  ? "None yet"
                  : "None";
          const rel = self
            ? "This rule"
            : off
              ? row.turnsOff.length === 1
                ? "turns off"
                : `${row.turnsOff.length} turn off`
              : row.relation === "above"
                ? "beats this"
                : "this beats";
          return (
            <li
              key={row.key}
              className={cn(
                "relative grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg py-1.5 pr-2",
                self && "bg-card ring-1 ring-primary",
              )}
            >
              <span aria-hidden className="z-10 grid size-6 place-items-center">
                <span
                  className={cn(
                    "rounded-full border-[1.5px]",
                    self
                      ? "size-[11px] border-primary bg-primary ring-4 ring-primary/18"
                      : "size-[9px] border-muted-foreground bg-card",
                  )}
                />
              </span>
              <span className={cn("min-w-0 text-sm", self && "font-semibold")}>
                {row.label}
                <small className="block truncate text-xs font-normal text-muted-foreground tabular-nums">
                  {off ? <s className="decoration-[1.5px]">{sub}</s> : sub}
                </small>
              </span>
              <span
                className={cn(
                  "text-right text-xs whitespace-nowrap",
                  self
                    ? "font-semibold text-primary-ink"
                    : off
                      ? "font-medium text-warning-ink"
                      : "text-muted-foreground",
                )}
              >
                {rel}
              </span>
            </li>
          );
        })}
      </ol>
      {!!onToggle && (!!hidden || expanded) && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="mt-2.5 text-xs font-medium text-primary-ink underline-offset-4 hover:underline"
        >
          {expanded ? "Show fewer steps" : `Show all ${totalTiers} steps`}
        </button>
      )}
      {replace && (
        <p className="mt-2.5 text-xs text-muted-foreground">
          Turned-off rules stay in the list as Inactive.
        </p>
      )}
    </section>
  );
}

// ── Impact ────────────────────────────────────────────────────────────

export type ImpactStatus = "idle" | "loading" | "missing" | "error" | "ready";

const GLYPH: Record<ImpactKind, string> = { up: "+", down: "−", same: "=", kept: "=" };
const KIND_TEXT: Record<ImpactKind, string> = {
  up: "Goes up",
  down: "Goes down",
  same: "No change",
  kept: "Another rule keeps it",
};
/** Rows the ledger shows before "and N more". */
const LEDGER_ROWS = 6;

export function ImpactSection({
  id,
  status,
  updating,
  errorMessage,
  missingMessage,
  summary,
  rows,
  replace,
  noun,
}: {
  id: string;
  status: ImpactStatus;
  /** A newer answer is on its way (debounce or refetch). */
  updating: boolean;
  errorMessage?: string;
  /** The 404 text, e.g. "No active products match this scope yet." */
  missingMessage: string;
  summary: ImpactSummary | null;
  /** Already sorted, changing rows first. */
  rows: ImpactRow[];
  replace: boolean;
  noun: { one: string; many: string };
}) {
  return (
    <section aria-labelledby={id} aria-busy={updating || status === "loading"}>
      <div className="flex items-center justify-between">
        <h3 id={id} className="scroll-mt-4 text-sm font-semibold text-foreground">
          Impact
        </h3>
        {status === "ready" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <i
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                updating ? "animate-pulse bg-muted-foreground" : "bg-success",
              )}
            />
            {updating ? "Updating" : "Updated"}
          </span>
        )}
      </div>

      {status === "idle" && (
        <p className="mt-2.5 text-sm text-muted-foreground">
          Pick a scope and a percentage to see the impact.
        </p>
      )}
      {status === "loading" && (
        <p className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
          <AppIcon icon="solar:refresh-linear" className="size-4 animate-spin motion-reduce:animate-none" />
          Working out the new prices…
        </p>
      )}
      {status === "missing" && (
        <p className="mt-2.5 text-sm text-muted-foreground">{missingMessage}</p>
      )}
      {status === "error" && (
        <p role="alert" className="mt-2.5 text-sm text-destructive-ink">
          {errorMessage || "Couldn’t work out the impact."}
        </p>
      )}

      {status === "ready" && summary && (
        <ImpactBody summary={summary} rows={rows} replace={replace} noun={noun} />
      )}
    </section>
  );
}

function ImpactBody({
  summary,
  rows,
  replace,
  noun,
}: {
  summary: ImpactSummary;
  rows: ImpactRow[];
  replace: boolean;
  noun: { one: string; many: string };
}) {
  const sentence = impactSentence(summary, noun, formatPrice, replace);
  const pct = (n: number) => `${(n / Math.max(summary.total, 1)) * 100}%`;
  const rest = summary.same + summary.kept;
  const shown = rows.slice(0, LEDGER_ROWS);
  const more = summary.total - shown.length;
  const kinds = (["up", "down", "kept"] as const).filter((k) => summary[k] > 0);

  return (
    <>
      <p className="mt-2.5 text-base leading-snug tabular-nums" aria-live="polite">
        <strong className="font-semibold">{sentence.lead}</strong>
        {sentence.rest}
        {sentence.sub && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{sentence.sub}</span>
        )}
      </p>

      <div aria-hidden className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted">
        {summary.up > 0 && <div className="bg-primary" style={{ width: pct(summary.up) }} />}
        {summary.down > 0 && <div className="bg-info-ink" style={{ width: pct(summary.down) }} />}
        {rest > 0 && <div className="bg-muted-foreground/40" style={{ width: pct(rest) }} />}
      </div>
      {kinds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
          {kinds.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <b
                aria-hidden
                className={cn(
                  "w-2.5 text-center font-bold",
                  k === "up" && "text-primary-ink",
                  k === "down" && "text-info-ink",
                )}
              >
                {GLYPH[k]}
              </b>
              {KIND_TEXT[k]}
            </span>
          ))}
        </div>
      )}

      {shown.length > 0 && (
        <ul className="mt-3.5 overflow-hidden rounded-[11px] border border-border bg-card tabular-nums">
          {shown.map((row) => (
            <LedgerRow key={row.id} row={row} replace={replace} />
          ))}
          {more > 0 && (
            <li className="border-t border-border p-2 text-center text-xs text-muted-foreground">
              and {more.toLocaleString("en-NG")} more
            </li>
          )}
        </ul>
      )}
    </>
  );
}

function LedgerRow({ row, replace }: { row: ImpactRow; replace: boolean }) {
  const kind = impactKind(row, replace);
  const delta = impactDelta(row, replace);
  const moves = kind === "up" || kind === "down";
  const takenOver = replace && row.covered;
  const tag = takenOver ? (
    <Badge variant="warning" className="rounded-full px-1.5 py-0.5 text-xs">
      Rule turns off
    </Badge>
  ) : kind === "kept" ? (
    <Badge variant="muted" className="rounded-full px-1.5 py-0.5 text-xs">
      Other rule
    </Badge>
  ) : null;
  const shownPrice = moves ? row.projected : row.current;

  return (
    <li className="grid grid-cols-[26px_minmax(0,1fr)_auto] gap-x-2.5 border-t border-border py-2 pr-3 first:border-t-0">
      <span
        className={cn(
          "row-span-2 -my-2 grid place-items-center border-r border-border text-sm font-bold",
          kind === "up" && "bg-primary/[0.06] text-primary-ink",
          kind === "down" && "bg-info-ink/[0.08] text-info-ink",
          (kind === "same" || kind === "kept") && "text-muted-foreground",
        )}
      >
        <span aria-hidden>{GLYPH[kind]}</span>
        <span className="sr-only">{KIND_TEXT[kind]}:</span>
      </span>
      <span
        className={cn(
          "truncate text-sm",
          kind === "kept" ? "text-muted-foreground" : "font-medium text-foreground",
        )}
        title={row.name}
      >
        {row.name}
      </span>
      <span
        className={cn(
          "text-right text-sm whitespace-nowrap",
          kind === "kept" ? "text-muted-foreground" : "font-semibold text-foreground",
        )}
      >
        {moves && row.current != null && (
          <s className="mr-1 text-xs font-normal text-muted-foreground max-sm:mr-0 max-sm:block">
            <span className="sr-only">was </span>
            {formatPrice(row.current)}
          </s>
        )}
        {shownPrice != null ? formatPrice(shownPrice) : "No price"}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
        {tag ?? row.detail}
      </span>
      <span
        className={cn(
          "text-right text-xs font-medium whitespace-nowrap",
          kind === "up" && "text-primary-ink",
          kind === "down" && "text-info-ink",
        )}
      >
        {delta != null && (delta > 0 ? `+${formatPrice(delta)}` : `−${formatPrice(-delta)}`)}
      </span>
    </li>
  );
}

// ── Footer ────────────────────────────────────────────────────────────

export function MarkupDialogFooter({
  children,
  confirm,
}: {
  children: ReactNode;
  /** The warning-strip look of the replace confirm step. */
  confirm?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-4 border-t px-6 py-3.5 max-sm:flex-wrap max-sm:gap-2.5 max-sm:px-4 max-sm:pt-3 max-sm:pb-[calc(12px+env(safe-area-inset-bottom))]",
        confirm
          ? "border-warning/40 bg-warning/[0.09] max-sm:flex-col max-sm:items-stretch"
          : "border-border bg-card",
      )}
    >
      {children}
    </div>
  );
}

export function FooterNote({ children }: { children: ReactNode }) {
  return <span className="text-xs text-muted-foreground max-sm:hidden">{children}</span>;
}

/** Phone only: the Impact section sits below the form, so give a line here. */
export function MiniImpact({
  summary,
  targetId,
}: {
  summary: ImpactSummary | null;
  targetId: string;
}) {
  if (!summary) return null;
  const [first, ...others] = impactShort(summary);
  return (
    <span className="hidden w-full text-xs text-muted-foreground tabular-nums max-sm:block">
      <strong className="font-semibold text-foreground">{first}</strong>
      {others.map((o) => ` · ${o}`)}
      <a
        href={`#${targetId}`}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById(targetId)?.scrollIntoView({ block: "start" });
        }}
        className="ml-1 font-medium text-primary-ink underline-offset-[3px] hover:underline"
      >
        See impact
      </a>
    </span>
  );
}

export function FooterButtons({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 gap-2 max-sm:w-full max-sm:[&>*]:h-11 max-sm:[&>*]:flex-1">
      {children}
    </div>
  );
}

/** The replace step: a warning strip with Back and a hold-to-confirm save. */
export function ReplaceConfirm({
  title,
  detail,
  holdLabel,
  onBack,
  onConfirm,
  pending,
}: {
  title: string;
  detail: string;
  holdLabel: string;
  onBack: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <>
      <div className="flex items-start gap-2.5" role="group" aria-label={title}>
        <AppIcon
          icon="solar:danger-triangle-linear"
          className="mt-px size-5 shrink-0 text-warning-ink"
        />
        <div>
          <p className="text-sm font-semibold text-foreground tabular-nums">{title}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
      <FooterButtons>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={pending}
          className="h-10 rounded-lg font-medium"
        >
          Back
        </Button>
        <HoldToConfirmButton
          onConfirm={onConfirm}
          disabled={pending}
          className="h-10 min-w-59 rounded-lg font-semibold max-sm:min-w-0"
        >
          {pending ? "Saving…" : holdLabel}
        </HoldToConfirmButton>
      </FooterButtons>
    </>
  );
}

// ── Result ────────────────────────────────────────────────────────────

export interface ReplacedRow {
  ruleId: string;
  scope: string;
  tier: string;
  percentage: number | null;
}

export function ReplaceResult({
  facts,
  rows,
}: {
  facts: { value: number; label: string }[];
  rows: ReplacedRow[];
}) {
  return (
    <div className="grid min-h-0 flex-1 content-start gap-5 overflow-y-auto overscroll-contain px-6 py-7 max-sm:px-4 max-sm:py-5">
      <div className="flex items-start gap-3.5" role="status">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/14 text-success-ink">
          <AppIcon icon="solar:check-circle-linear" className="size-5.5" />
        </span>
        <div>
          <p className="text-xl font-semibold text-foreground">Prices are live</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The storefront shows the new prices now.
          </p>
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 rounded-[11px] border border-border bg-background/70 px-4 py-3.5 tabular-nums max-sm:gap-x-5">
        {facts.map((f) => (
          <div key={f.label} className="grid">
            <dt className="order-2 text-xs text-muted-foreground">{f.label}</dt>
            <dd className="order-1 text-xl font-semibold text-foreground">
              {f.value.toLocaleString("en-NG")}
            </dd>
          </div>
        ))}
      </dl>

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-[11px] border border-border tabular-nums">
          <div className="flex items-baseline justify-between gap-3 border-b border-border px-3.5 py-3 max-sm:flex-col max-sm:gap-0.5">
            <p className="text-sm font-semibold text-foreground">Turned off</p>
            <p className="text-xs text-muted-foreground">
              Still in the list as Inactive. Edit one to turn it back on.
            </p>
          </div>
          <ul>
            {rows.map((r) => (
              <li
                key={r.ruleId}
                className="grid grid-cols-[minmax(0,1fr)_120px_56px_84px_76px] items-center gap-4 border-t border-border px-3.5 py-2.5 text-sm first:border-t-0 max-sm:grid-cols-[minmax(0,1fr)_auto_auto] max-sm:gap-3"
              >
                <span className="truncate" title={r.scope}>{r.scope}</span>
                <span className="text-xs text-muted-foreground max-sm:hidden">{r.tier}</span>
                <span>{r.percentage != null ? `+${r.percentage}%` : "—"}</span>
                <span className="font-mono text-xs text-muted-foreground max-sm:hidden">{r.ruleId}</span>
                <Badge variant="muted" className="justify-self-start rounded-full text-xs">
                  Inactive
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
