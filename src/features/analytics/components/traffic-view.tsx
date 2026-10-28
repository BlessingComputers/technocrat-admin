import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { PageHeader } from "@/components/shared/page-header";
import { Stat, StatsBar } from "@/components/shared/stats-bar";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/format";
import { AnalyticsChartCard } from "./analytics-chart-card";
import { TrafficCampaignsTable, TrafficLandingTable } from "./traffic-campaigns-table";
import { TrafficFunnel } from "./traffic-funnel";
import { TrafficPeriodSelect } from "./traffic-period-select";
import { TrafficRefreshButton } from "./traffic-refresh-button";
import { TrafficRankedList } from "./traffic-ranked-list";
import { TrafficSessionsTable } from "./traffic-sessions-table";
import { TrafficTrendChart } from "./traffic-trend-chart";
import type { AnalyticsPeriod } from "../types/chart-analytics";
import type { Compared, TrafficReport } from "../types/traffic";

export interface PostHogLinks {
  web: string;
  events: string;
  replays: string;
  person: string;
  replay: string;
}

const PERIOD_LABEL: Record<AnalyticsPeriod, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
  "12m": "last 12 months",
};

/** "+12%" against the previous window of the same length; nothing when there's no baseline. */
function change({ value, previous }: Compared) {
  if (previous === 0) return {};
  const pct = Math.round(((value - previous) / previous) * 100);
  return { trend: `${pct > 0 ? "+" : ""}${pct}%`, trendDirection: pct < 0 ? ("down" as const) : ("up" as const) };
}

function minutes(seconds: number) {
  const m = Math.floor(seconds / 60);
  return m > 0 ? `${m}m ${Math.round(seconds % 60)}s` : `${Math.round(seconds)}s`;
}

function PostHogLink({ href, label = "Open in PostHog" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-auto inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-primary-ink"
    >
      {label}
      <AppIcon icon="solar:arrow-right-up-linear" className="size-3.5" />
    </a>
  );
}

/**
 * `/analytics`: storefront traffic from PostHog. Rendered on the server with
 * the report already built (`api/traffic.server.ts`); only the trend chart and
 * the period dropdown hydrate.
 */
export function TrafficView({ report, links }: { report: TrafficReport; links: PostHogLinks }) {
  const { kpis } = report;
  const conversion = kpis.visitors.value > 0 ? (kpis.orders.value / kpis.visitors.value) * 100 : 0;
  const updated = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(report.generatedAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`Storefront traffic for the ${PERIOD_LABEL[report.period]}, compared with the period before. Updated ${updated}, refreshed every 5 minutes.`}
        className="mb-0"
      >
        <Button asChild variant="outline" size="sm" className="h-9 gap-2 rounded-lg text-xs font-medium">
          <a href={links.web} target="_blank" rel="noopener noreferrer">
            <AppIcon icon="solar:arrow-right-up-linear" className="size-4" />
            Open in PostHog
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-9 gap-2 rounded-lg text-xs font-medium">
          <Link href="/analytics/links">
            <AppIcon icon="solar:link-linear" className="size-4" />
            Campaign links
          </Link>
        </Button>
        <TrafficRefreshButton />
        <TrafficPeriodSelect value={report.period} />
      </PageHeader>

      <StatsBar>
        <Stat
          icon="solar:users-group-rounded-linear"
          label="Visitors"
          value={kpis.visitors.value.toLocaleString()}
          {...change(kpis.visitors)}
          description={`${kpis.visitors.previous.toLocaleString()} the period before`}
        />
        <Stat
          icon="solar:window-frame-linear"
          tone="info"
          label="Sessions"
          value={kpis.sessions.value.toLocaleString()}
          {...change(kpis.sessions)}
          description={`${kpis.pagesPerSession.toFixed(1)} pages and ${minutes(kpis.avgSessionSeconds)} on average`}
        />
        <Stat
          icon="solar:document-text-linear"
          tone="muted"
          label="Page views"
          value={kpis.pageviews.value.toLocaleString()}
          {...change(kpis.pageviews)}
          description={`${Math.round(kpis.bounceRate * 100)}% of sessions left after one page`}
        />
        <Stat
          icon="solar:bag-check-linear"
          tone="success"
          label="Orders placed"
          value={kpis.orders.value.toLocaleString()}
          {...change(kpis.orders)}
          description={`${conversion.toFixed(1)}% of visitors · ${formatPrice(kpis.orderValue)} in orders`}
        />
      </StatsBar>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AnalyticsChartCard
          className="lg:col-span-2"
          title="Visitors"
          subtitle={`Unique visitors per ${report.trendBucket}`}
          icon="solar:graph-up-linear"
        >
          <div className="flex h-full flex-col gap-4">
            <TrafficTrendChart points={report.trend} bucket={report.trendBucket} />
            <PostHogLink href={links.web} />
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Right now"
          subtitle="Visitors in the last 30 minutes"
          icon="solar:pulse-2-linear"
          iconClass="bg-success/15 text-success-ink"
          headerRight={
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{report.live.visitors.toLocaleString()}</p>
          }
        >
          <div className="flex h-full flex-col gap-4">
            <MetaLabel className="block text-muted-foreground">Pages they&apos;re on</MetaLabel>
            <TrafficRankedList rows={report.live.pages} unit="visitors" empty="Nobody on the store right now" />
            <PostHogLink href={links.events} label="Live events in PostHog" />
          </div>
        </AnalyticsChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AnalyticsChartCard title="Shopping funnel" subtitle="People reaching each step" icon="solar:cart-large-2-linear">
          <div className="flex h-full flex-col gap-4">
            <TrafficFunnel steps={report.funnel} />
            <p className="text-xs text-muted-foreground">
              Orders here are placed orders. Transfer orders count before staff confirm the receipt.
            </p>
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard
          className="lg:col-span-2"
          title="Most viewed products"
          subtitle="Product and part pages, by views"
          icon="solar:box-linear"
        >
          {report.products.length === 0 ? (
            <p className="py-6 text-center text-xs font-medium text-muted-foreground">No product views in this period</p>
          ) : (
            <ol className="divide-y divide-border">
              {report.products.map((p) => (
                <li key={`${p.label}-${p.detail}`} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-medium text-foreground hover:text-primary-ink hover:underline"
                    >
                      {p.label}
                    </a>
                    <span className="text-xs text-muted-foreground">{p.itemType === "part" ? "Part" : "Product"}</span>
                  </div>
                  <div className="flex shrink-0 gap-6 text-right">
                    <div>
                      <p className="font-mono font-medium tabular-nums">{p.value.toLocaleString()}</p>
                      <MetaLabel className="block text-muted-foreground">views</MetaLabel>
                    </div>
                    <div>
                      <p className="font-mono font-medium tabular-nums">{p.viewers.toLocaleString()}</p>
                      <MetaLabel className="block text-muted-foreground">people</MetaLabel>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </AnalyticsChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsChartCard title="Countries" subtitle="Visitors by country" icon="solar:global-linear" iconClass="bg-info/15 text-info-ink">
          <TrafficRankedList rows={report.countries} unit="visitors" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Cities" subtitle="Visitors by city" icon="solar:map-point-linear" iconClass="bg-info/15 text-info-ink">
          <TrafficRankedList rows={report.cities} unit="visitors" empty="No city data yet" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Devices" subtitle="Visitors by device type" icon="solar:smartphone-linear" iconClass="bg-info/15 text-info-ink">
          <TrafficRankedList rows={report.devices} unit="visitors" />
        </AnalyticsChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsChartCard title="Channels" subtitle="How sessions arrived" icon="solar:routing-2-linear" iconClass="bg-jewel/15 text-jewel-ink">
          <TrafficRankedList rows={report.channels} unit="sessions" />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Referring sites" subtitle="Sessions by the site that linked here" icon="solar:link-linear" iconClass="bg-jewel/15 text-jewel-ink">
          <TrafficRankedList rows={report.referrers} unit="sessions" empty="No referring sites in this period" />
        </AnalyticsChartCard>
      </div>

      <TrafficCampaignsTable campaigns={report.campaigns} />
      <TrafficLandingTable pages={report.landingPages} />

      <AnalyticsChartCard title="Top pages" subtitle="Page views by page" icon="solar:document-text-linear">
        <div className="flex h-full flex-col gap-4">
          <TrafficRankedList rows={report.pages} unit="views" />
          <PostHogLink href={links.web} />
        </div>
      </AnalyticsChartCard>

      <AnalyticsChartCard title="Recent sessions" subtitle="The latest 20 visits" icon="solar:history-linear">
        <div className="flex h-full flex-col gap-4">
          <TrafficSessionsTable sessions={report.sessions} personUrl={links.person} replayUrl={links.replay} />
          <PostHogLink href={links.replays} label="All replays in PostHog" />
        </div>
      </AnalyticsChartCard>
    </div>
  );
}

/** Full-page message for the states with no report: no access, not set up, PostHog down. */
export function TrafficNotice({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" className="mb-0" />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AppIcon icon={icon} className="size-7" />
        </div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        <div className="max-w-md text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
