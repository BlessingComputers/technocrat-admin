"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useAdSpend } from "../api/ad-spend.queries";
import {
  PERIOD_DAYS,
  formatRoas,
  spendByCampaign,
  spendKey,
  spendWindow,
  unmatchedSpend,
  type CampaignSpend,
} from "../model/ad-spend";
import { AnalyticsChartCard } from "./analytics-chart-card";
import type { AnalyticsPeriod } from "../types/chart-analytics";
import type { CampaignGroup, CampaignRow, TrafficReport } from "../types/traffic";

const percent = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "–");

/** `spend` is set only on campaign tables: `undefined` hides the columns, `null` means none logged. */
function Cells({ row, spend }: { row: CampaignRow; spend?: number | null }) {
  return (
    <>
      <TableCell className="text-right tabular-nums">{row.visitors.toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">{Math.round(row.bounceRate * 100)}%</TableCell>
      <TableCell className="text-right tabular-nums">{row.productViews.toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">{row.adds.toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">{row.checkouts.toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">{formatPrice(row.orderValue)}</TableCell>
      {spend !== undefined && (
        <>
          <TableCell className="whitespace-nowrap text-right tabular-nums">{spend ? formatPrice(spend) : "–"}</TableCell>
          <TableCell className="text-right tabular-nums">{formatRoas(row.orderValue, spend ?? undefined)}</TableCell>
        </>
      )}
      <TableCell className="pr-5 text-right tabular-nums sm:pr-6">{percent(row.buyers, row.visitors)}</TableCell>
    </>
  );
}

function Head({ first, spend = false }: { first: string; spend?: boolean }) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="pl-5 sm:pl-6">{first}</TableHead>
        <TableHead className="text-right">Visitors</TableHead>
        <TableHead className="text-right">Bounce</TableHead>
        <TableHead className="text-right">Product views</TableHead>
        <TableHead className="text-right">Adds</TableHead>
        <TableHead className="text-right">Checkouts</TableHead>
        <TableHead className="text-right">Orders</TableHead>
        <TableHead className="text-right">Order value</TableHead>
        {spend && (
          <>
            <TableHead className="text-right">Spend</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
          </>
        )}
        <TableHead className="pr-5 text-right sm:pr-6">Conversion</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function CampaignTable({ groups, spend }: { groups: CampaignGroup[]; spend: Map<string, CampaignSpend> }) {
  if (groups.length === 0) {
    return (
      <p className="py-6 text-center text-xs font-medium text-muted-foreground">
        No tagged links used in this period.{" "}
        <Link href="/analytics/links" className="text-foreground underline-offset-2 hover:underline">
          Make one
        </Link>
      </p>
    );
  }

  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <Table>
        <Head first="Campaign" spend />
        <TableBody>
          {groups.map((c) => {
            // One ad repeats the campaign's numbers, so it goes in the
            // campaign's subtitle instead of its own row.
            const single = c.ads.length === 1 ? c.ads[0].label : "";
            return [
              <TableRow key={c.label}>
                <TableCell className="max-w-[18rem] pl-5 sm:pl-6">
                  <p className="truncate font-medium text-foreground" title={c.label}>
                    {c.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.source, single && `ad ${single}`, c.ads.length > 1 && `${c.ads.length} ads`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </TableCell>
                <Cells row={c} spend={spend.get(spendKey(c.label))?.total ?? null} />
              </TableRow>,
              ...(c.ads.length > 1
                ? c.ads.map((ad) => (
                    <TableRow key={`${c.label}/${ad.label}`} className="text-muted-foreground">
                      <TableCell
                        className={cn("max-w-[18rem] truncate pl-9 text-xs sm:pl-10", !ad.label && "italic")}
                        title={ad.label}
                      >
                        {ad.label || "No ad tag"}
                      </TableCell>
                      <Cells row={ad} spend={spend.get(spendKey(c.label))?.byAd.get(spendKey(ad.label)) ?? null} />
                    </TableRow>
                  ))
                : []),
            ];
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Where paid visits start. An ad that lands on the home page makes the
 * visitor search for what the ad showed; this is where that shows up.
 */
export function TrafficLandingTable({ pages }: { pages: TrafficReport["landingPages"] }) {
  return (
    <AnalyticsChartCard
      title="Paid landing pages"
      subtitle="Where visits from ads start, and what those visits did"
      icon="solar:target-linear"
      iconClass="bg-jewel/15 text-jewel-ink"
    >
      {pages.length === 0 ? (
        <p className="py-6 text-center text-xs font-medium text-muted-foreground">No visits from ads in this period</p>
      ) : (
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <Table>
            <Head first="Landing page" />
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.label}>
                  <TableCell className="max-w-[18rem] pl-5 sm:pl-6">
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-mono text-xs text-foreground hover:text-primary-ink hover:underline"
                      title={p.label}
                    >
                      {p.label}
                    </a>
                    <p className="truncate text-xs text-muted-foreground">{p.source}</p>
                  </TableCell>
                  <Cells row={p} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AnalyticsChartCard>
  );
}

/**
 * Per campaign and per ad (`utm_content`), under two attribution models. A
 * client component: the PostHog report comes from the server, cached for all
 * staff, and the spend is read here with the staff member's own session.
 */
export function TrafficCampaignsTable({
  campaigns,
  period,
}: {
  campaigns: TrafficReport["campaigns"];
  period: AnalyticsPeriod;
}) {
  const range = spendWindow(PERIOD_DAYS[period]);
  const { data: entries = [] } = useAdSpend(range);
  const spend = spendByCampaign(entries, range);
  const orphans = unmatchedSpend(spend, campaigns.lastClick.map((c) => c.label));
  // Meta fills `{{campaign.id}}` with a number; the link builder uses names.
  const idsOnly = [...campaigns.lastClick, ...campaigns.firstTouch].some((c) => /^\d{6,}$/.test(c.label));

  return (
    <Tabs defaultValue="last">
      <AnalyticsChartCard
        title="Campaigns"
        subtitle="Visits from tagged links, by campaign and by ad"
        icon="solar:flag-linear"
        iconClass="bg-jewel/15 text-jewel-ink"
        headerRight={
          <TabsList>
            <TabsTrigger value="last">Last click</TabsTrigger>
            <TabsTrigger value="first">First touch</TabsTrigger>
          </TabsList>
        }
      >
        <div className="flex h-full flex-col gap-4">
          <TabsContent value="last">
            <CampaignTable groups={campaigns.lastClick} spend={spend} />
          </TabsContent>
          <TabsContent value="first">
            <CampaignTable groups={campaigns.firstTouch} spend={spend} />
          </TabsContent>
          <p className="text-xs text-muted-foreground">
            Last click credits the campaign that started each visit. First touch credits the campaign that first
            brought the person in the past year, so their later direct visits count for it too. Conversion is the
            share of visitors who ordered.
            {idsOnly &&
              " Numbers in place of names come from Meta ads tagged with {{campaign.id}}; links from Campaign links carry names."}
            {" "}
            Spend comes from{" "}
            <Link href={`/analytics/spend?period=${period}`} className="text-foreground underline-offset-2 hover:underline">
              Ad spend
            </Link>
            , spread evenly over each entry&apos;s days; ROAS is order value divided by spend.
            {orphans.length > 0 &&
              ` ${formatPrice(orphans.reduce((sum, o) => sum + o.total, 0))} was logged against campaigns with no tagged visits in this period: ${orphans.map((o) => o.campaign).join(", ")}.`}
          </p>
        </div>
      </AnalyticsChartCard>
    </Tabs>
  );
}
