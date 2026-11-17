import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { RailAxis, TimeRail } from "@/components/shared/time-rail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { sharedDiscountMagnitude, type Deal } from "../types/deals";
import { dealWindow, overlapPairs, overviewRange, timingLine } from "../utils/deal-groups";
import { formatDealTime } from "../utils/deal-timing";

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" });

/** The right card with nothing selected: "The next two weeks" (spec, Deals). */
export function DealOverview({
  running,
  comingUp,
  now,
  canWrite,
}: {
  running: Deal[];
  comingUp: Deal[];
  now: number;
  canWrite: boolean;
}) {
  const shown = [...running, ...comingUp];

  if (shown.length === 0) {
    return (
      <Card className="items-center gap-3 px-6 py-16 text-center">
        <AppIcon icon="solar:sale-linear" className="size-8 opacity-30" />
        <p className="text-sm font-semibold">Nothing running or coming up</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          A deal is a named sale over any mix of products and parts. Drafts sit in the list until you start them.
        </p>
        {canWrite && (
          <Button asChild className="mt-1 h-10 rounded-lg font-semibold">
            <Link href="/pricing/deals/new">New deal</Link>
          </Button>
        )}
      </Card>
    );
  }

  const range = overviewRange(now, shown);
  const pairs = overlapPairs(shown);

  return (
    <Card className="gap-0 p-5 sm:p-6">
      <h2 className="text-base font-semibold">The next two weeks</h2>
      <p className="mt-0.5 mb-5 text-xs text-muted-foreground">
        Running and coming-up deals. Select one on the left for its targets and actions.
      </p>
      <div className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)] items-center gap-x-3 gap-y-3.5">
        <span />
        <RailAxis range={range} count={6} format={(t) => DAY_LABEL.format(t)} />
        {shown.map((deal) => {
          const window = dealWindow(deal);
          const discount = sharedDiscountMagnitude(deal.targets);
          return (
            <div key={deal.id} className="contents">
              <Link
                href={`/pricing/deals?deal=${encodeURIComponent(deal.id)}`}
                scroll={false}
                className="min-w-0 rounded text-xs font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="block truncate">{deal.name}</span>
                <span className="block font-medium text-muted-foreground">
                  {discount === null ? "Mixed" : `−${discount}%`} · {timingLine(deal, now)}
                </span>
              </Link>
              {window ? (
                <TimeRail
                  range={range}
                  start={window.start}
                  end={window.end}
                  now={now}
                  upcoming={deal.status === "SCHEDULED"}
                  label={`${deal.name}: ${timingLine(deal, now)}.`}
                />
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </div>
      {pairs.length > 0 && (
        <ul className="mt-5 space-y-1 text-xs text-muted-foreground">
          {pairs.map((p) => (
            <li key={`${p.a.id}-${p.b.id}`}>
              {p.a.name} runs at the same time as {p.b.name} from {formatDealTime(new Date(p.from).toISOString())}.
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
