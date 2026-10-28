"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonDetailPage } from "@/components/shared/skeletons";
import { ApiError } from "@/lib/api/error";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePermissions } from "@/lib/auth/use-permissions";

import {
  useDeal,
  useDealBrands,
  useDealCategories,
  useDealPartTypes,
  useDealStartResult,
  useEndDeal,
  useStartDeal,
} from "../api/deals.queries";
import {
  failedTargetCount,
  startedTargetCount,
  type Deal,
  type DealStartResult,
  type DealTarget,
} from "../types/deals";
import {
  dealExpiry,
  dealStart,
  formatDealDistance,
  formatDealTime,
} from "../utils/deal-timing";
import { entityLabel, targetScopeLabel } from "../utils/deal-scope";
import { DealStatusBadge } from "./deal-status-badge";

/**
 * `/pricing/deals/[id]` — one deal, and the two buttons that move prices.
 *
 * This is where a deal is started, because starting is where partial failure
 * happens: the response carries one result per target, and a deal can come back
 * ACTIVE with three of twelve targets never materialised. The list has no room
 * for twelve rows of explanation, and the `results` array exists in that one
 * response and nowhere else — so it is caught here, parked in the query cache,
 * and rendered against the target table.
 */
export function DealDetailView({ dealId }: { dealId: string }) {
  const { can } = usePermissions();
  const canWrite = can("priceMarkup:write");

  const { data: deal, isLoading, isError, error, refetch } = useDeal(dealId);
  const startResult = useDealStartResult(dealId);
  const startDeal = useStartDeal();
  const endDeal = useEndDeal();

  const { data: categories = [] } = useDealCategories();
  const { data: brands = [] } = useDealBrands();
  const { data: partTypes = [] } = useDealPartTypes();

  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  if (isLoading) return <SkeletonDetailPage />;

  if (isError || !deal) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Card className="mx-auto max-w-2xl items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AppIcon icon="solar:sale-linear" className="size-7" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {notFound ? "That deal is gone" : "Couldn’t load this deal"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {notFound
              ? "It may have been created against a different environment."
              : "Reading a deal needs the priceMarkup:read permission."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
          <Button asChild variant="ghost">
            <Link href="/pricing/deals">Back to deals</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const canStart = deal.status === "DRAFT" || deal.status === "SCHEDULED";
  const canEnd = deal.status === "ACTIVE";

  const doStart = () => {
    const promise = startDeal.mutateAsync(deal.id);
    toast.promise(promise, {
      loading: "Starting the deal…",
      // A 200 is not a success on its own — read the per-target counts.
      success: (res) =>
        res.targetsFailed > 0
          ? `Started with ${res.targetsFailed} of ${res.results.length} targets not applied — see the table.`
          : `Deal started — ${res.targetsStarted} target${res.targetsStarted === 1 ? "" : "s"} live.`,
      error: (err) => conflictMessage(err, "Couldn’t start the deal."),
    });
    promise.then(() => setConfirmStart(false)).catch(() => refetch());
  };

  const doEnd = () => {
    const promise = endDeal.mutateAsync(deal.id);
    toast.promise(promise, {
      loading: "Ending the deal & resetting prices…",
      success: (res) =>
        `Deal ended — ${res.variantsReset} variant${res.variantsReset === 1 ? "" : "s"} and ${res.partsReset} part${res.partsReset === 1 ? "" : "s"} back to base price.`,
      error: (err) => conflictMessage(err, "Couldn’t end the deal."),
    });
    promise.then(() => setConfirmEnd(false)).catch(() => refetch());
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* The status badge rides in the actions slot rather than inside the
          title: this admin's PageHeader takes a plain string, and its ruled
          masthead is house identity — not something a feature bends. */}
      <PageHeader
        title={deal.name}
        description={`${deal.dealId} · created ${formatDealTime(deal.createdAt)}`}
      >
        <DealStatusBadge status={deal.status} />
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/pricing/deals">
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            Deals
          </Link>
        </Button>
        {canWrite && canStart && (
          <Button
            onClick={() => setConfirmStart(true)}
            className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
          >
            <AppIcon icon="solar:play-circle-linear" className="mr-2 size-5" />
            Start deal
          </Button>
        )}
        {canWrite && canEnd && (
          <Button
            onClick={() => setConfirmEnd(true)}
            variant="outline"
            className="h-10 rounded-lg font-medium"
          >
            <AppIcon icon="solar:stop-circle-linear" className="mr-2 size-5" />
            End deal
          </Button>
        )}
      </PageHeader>

      <DealSummary deal={deal} />

      {startResult && startResult.targetsFailed > 0 && (
        <PartialStartNotice failed={startResult.targetsFailed} total={startResult.results.length} />
      )}

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/[0.04] px-5 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Targets
          </h2>
          <span className="text-xs font-medium text-muted-foreground">
            {deal.targets.length} in this deal
          </span>
        </div>
        <TargetsTable
          deal={deal}
          results={startResult?.results}
          names={{ categories, brands, partTypes }}
        />
      </Card>

      {/* Said once, where someone would otherwise go hunting for a button. */}
      <p className="text-xs font-medium text-muted-foreground">
        A deal can’t be edited or deleted — the backend has no route for either.
        To change what is on sale, end this one and create a new deal.
      </p>

      <ConfirmModal
        isOpen={confirmStart}
        onClose={() => setConfirmStart(false)}
        onConfirm={doStart}
        title="Start this deal?"
        description={`This applies the discount to all ${deal.targets.length} target${deal.targets.length === 1 ? "" : "s"} and prices change immediately. A target already covered by another rule will be skipped, and the table will say which.`}
        confirmText="Start deal"
        isPending={startDeal.isPending}
      />

      <ConfirmModal
        isOpen={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        onConfirm={doEnd}
        title="End this deal?"
        description="Every price this deal changed goes back to base, and the deal is closed for good — there is no re-starting it. To run the same sale again, create a new deal."
        confirmText="End deal & reset prices"
        variant="destructive"
        isPending={endDeal.isPending}
      />
    </div>
  );
}

/** The facts above the table: timing, coupons, and how many rules are live. */
function DealSummary({ deal }: { deal: Deal }) {
  const expiry = dealExpiry(deal.expiresAt);
  const start = dealStart(deal.startsAt);
  const started = startedTargetCount(deal);

  return (
    <Card className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-3">
      <Fact label="Timing">
        {deal.status === "SCHEDULED" && start.state === "future" ? (
          <>
            Starts {formatDealTime(start.at)}
            <Note>
              The sweep runs every five minutes, so it may go live slightly
              after this.
            </Note>
          </>
        ) : expiry.state === "future" ? (
          <>
            Ends {formatDealTime(expiry.at)}
            <Note>{formatDealDistance(expiry.at)}</Note>
          </>
        ) : expiry.state === "past" ? (
          <>
            Ended {formatDealDistance(expiry.at)}
            {deal.status === "ACTIVE" && (
              <Note>
                Still marked Active — prices reset on the next five-minute
                sweep.
              </Note>
            )}
          </>
        ) : (
          <>
            No end time
            <Note>Runs until someone ends it.</Note>
          </>
        )}
      </Fact>

      <Fact label="Coupons">
        {deal.allowCouponStacking ? (
          <>
            Codes allowed
            <Note>A discount code stacks on top of the sale price.</Note>
          </>
        ) : (
          <>
            Codes blocked
            <Note>
              Blocked on the whole basket, not just the sale item, for any cart
              containing something this deal covers.
            </Note>
          </>
        )}
      </Fact>

      <Fact label="Live rules">
        {started === null ? (
          <>
            Unknown
            <Note>The server did not report rule counts.</Note>
          </>
        ) : (
          <>
            {started} of {deal.targets.length}
            <Note>
              {deal.productRuleCount ?? 0} product ·{" "}
              {deal.partRuleCount ?? 0} part
            </Note>
          </>
        )}
      </Fact>
    </Card>
  );
}

function PartialStartNotice({
  failed,
  total,
}: {
  failed: number;
  total: number;
}) {
  return (
    <div
      role="alert"
      className="space-y-1 rounded-lg border border-warning/50 bg-warning/10 p-4"
    >
      <p className="text-sm font-semibold text-warning-ink">
        {failed} of {total} targets did not start
      </p>
      <p className="text-xs font-medium text-muted-foreground">
        The rest are live. A target usually fails because another rule already
        covers exactly that scope — end or cancel that rule, then create a new
        deal for the targets that missed. This deal cannot be re-started.
      </p>
    </div>
  );
}

function TargetsTable({
  deal,
  results,
  names,
}: {
  deal: Deal;
  results?: DealStartResult[];
  names: Parameters<typeof targetScopeLabel>[1];
}) {
  const failed = failedTargetCount(deal);
  const byIndex = new Map(results?.map((r) => [r.index, r]) ?? []);

  return (
    <div className="divide-y divide-border/50">
      {deal.targets.map((target, index) => (
        <TargetRow
          key={`${target.entityType}-${index}`}
          index={index}
          target={target}
          result={byIndex.get(index)}
          names={names}
          status={deal.status}
        />
      ))}

      {/* After a reload the per-target results are gone, but the shortfall
          between targets and live rules is stored on the deal — so the page can
          still say how many missed, even when it can no longer say which. */}
      {!results && failed !== null && failed > 0 && (
        <p className="bg-warning/5 px-5 py-3 text-xs font-medium text-warning-ink">
          {failed} of {deal.targets.length} targets never became live rules.
          Which ones is only reported at the moment a deal is started, and that
          was not this session.
        </p>
      )}
    </div>
  );
}

function TargetRow({
  index,
  target,
  result,
  names,
  status,
}: {
  index: number;
  target: DealTarget;
  result?: DealStartResult;
  names: Parameters<typeof targetScopeLabel>[1];
  status: Deal["status"];
}) {
  const notStarted = status === "DRAFT" || status === "SCHEDULED";

  return (
    <div className="flex flex-wrap items-start gap-4 px-5 py-4">
      <span className="mt-0.5 font-mono text-xs font-semibold text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {targetScopeLabel(target, names)}
          </span>
          <Badge variant="muted" className="rounded-md py-0.5 text-xs">
            {entityLabel(target)}
          </Badge>
        </div>
        {/* Prose from the server, rendered verbatim: the blocking rule is named
            inside the sentence and there is no structured field carrying it. */}
        {result?.error && (
          <p className="mt-1 text-xs font-medium text-warning-ink">
            {result.error}
          </p>
        )}
      </div>

      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        −{Math.abs(target.markupPercentage)}%
      </span>

      <span className="w-28 shrink-0 text-right">
        {notStarted ? (
          <Badge variant="muted" className="rounded-full py-0.5 text-xs">
            Not started
          </Badge>
        ) : result ? (
          <Badge
            variant={result.success ? "success" : "warning"}
            className="rounded-full py-0.5 text-xs font-semibold"
          >
            {result.success ? "Live" : "Skipped"}
          </Badge>
        ) : (
          <Badge variant="outline" className="rounded-full py-0.5 text-xs">
            {status === "ENDED" ? "Ended" : "Applied"}
          </Badge>
        )}
      </span>
    </div>
  );
}

/**
 * A 409 here is not really a failure: it means the deal moved on without us —
 * someone else started or ended it, or the five-minute sweep did. Say that, and
 * let the caller refetch, rather than offering a retry that will fail the same
 * way.
 */
function conflictMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 409) {
    return `${getErrorMessage(err, fallback)} The page has been refreshed.`;
  }
  return getErrorMessage(err, fallback);
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-0.5 text-xs font-medium text-muted-foreground">{children}</p>
  );
}
