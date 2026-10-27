import "server-only";
import { unstable_cache } from "next/cache";
import { serverEnv } from "@/config/env";
import type { AnalyticsPeriod } from "../types/chart-analytics";
import type { CampaignGroup, CampaignRow, RankedRow, TrafficReport, TrafficSession } from "../types/traffic";

/**
 * Storefront traffic from PostHog's query API (HogQL), for `/analytics`.
 *
 * Server-only: the personal API key can read every event the store collects,
 * so it never reaches the browser (`serverEnv()` throws there). The report is
 * cached for five minutes per period across all staff: the query endpoint
 * allows 2,400 requests an hour per key, and one report is 17 queries.
 *
 * Every query filters on `$host`, so localhost, staging and test traffic never
 * count. `ANALYTICS_HOSTS` sets the list; see `config/env.ts`.
 *
 * The SQL is assembled from constants and the env host list only. Nothing a
 * visitor or staff member types reaches it.
 */

const WINDOWS: Record<AnalyticsPeriod, { days: number; bucket: TrafficReport["trendBucket"] }> = {
  "7d": { days: 7, bucket: "day" },
  "30d": { days: 30, bucket: "day" },
  "90d": { days: 90, bucket: "week" },
  "12m": { days: 365, bucket: "month" },
};

const BUCKET_SQL = {
  day: "toDate(timestamp)",
  week: "toStartOfWeek(timestamp, 1)",
  month: "toStartOfMonth(timestamp)",
} as const;

export class PostHogNotConfiguredError extends Error {}

type Row = Record<string, unknown>;

async function hogql(name: string, query: string): Promise<Row[]> {
  const { posthog } = serverEnv();
  if (!posthog.apiKey) throw new PostHogNotConfiguredError("POSTHOG_PERSONAL_API_KEY is not set");
  const res = await fetch(`${posthog.appHost}/api/projects/${posthog.projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${posthog.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: `admin traffic: ${name}`, query: { kind: "HogQLQuery", query } }),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PostHog query "${name}" failed: ${res.status} ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { columns: string[]; results: unknown[][] };
  return json.results.map((r) => Object.fromEntries(json.columns.map((c, i) => [c, r[i]])));
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

function sqlList(values: string[]): string {
  return `(${values.map((v) => `'${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`).join(", ")})`;
}

/** The live storefront, for links out of the report and the campaign link builder. */
export function storefrontOrigin(): string {
  return (serverEnv().storefrontUrl || "https://technocratng.com").replace(/\/+$/, "");
}

async function buildReport(period: AnalyticsPeriod): Promise<TrafficReport> {
  const { posthog } = serverEnv();
  const site = storefrontOrigin();
  const { days, bucket } = WINDOWS[period];
  const hosts = sqlList(posthog.hosts);
  const since = `now() - toIntervalDay(${days})`;
  const pageviews = `event = '$pageview' AND properties.$host IN ${hosts} AND timestamp >= ${since}`;
  const sessionsWhere = `$entry_hostname IN ${hosts} AND $start_timestamp >= ${since}`;

  // Campaign rows come out twice per campaign: `by_ad = 0` is its total and
  // `by_ad = 1` splits it by ad (`utm_content`). The flag is its own column so
  // a link without `utm_content` doesn't share the total's group and count
  // twice. (HogQL drops WITH ROLLUP.)
  const funnelEvents = "('$pageview', 'product_viewed', 'add_to_cart', 'checkout_started', 'order_placed')";
  const funnelMetrics = `
    any(source) AS source,
    uniqIf(person_id, event = '$pageview') AS visitors,
    uniqIf(session_id, event = '$pageview') AS sessions,
    uniqIf(session_id, event = '$pageview' AND bounce) AS bounced,
    countIf(event = 'product_viewed') AS product_views,
    countIf(event = 'add_to_cart') AS adds,
    countIf(event = 'checkout_started') AS checkouts,
    countIf(event = 'order_placed') AS orders,
    uniqIf(person_id, event = 'order_placed') AS buyers,
    sumIf(toFloat(order_value), event = 'order_placed') AS order_value`;

  const queries = {
    kpis: `
      SELECT
        uniqIf(person_id, event = '$pageview' AND timestamp >= ${since}) AS visitors,
        uniqIf(person_id, event = '$pageview' AND timestamp < ${since}) AS visitors_prev,
        uniqIf($session_id, event = '$pageview' AND timestamp >= ${since}) AS sessions,
        uniqIf($session_id, event = '$pageview' AND timestamp < ${since}) AS sessions_prev,
        countIf(event = '$pageview' AND timestamp >= ${since}) AS pageviews,
        countIf(event = '$pageview' AND timestamp < ${since}) AS pageviews_prev,
        countIf(event = 'order_placed' AND timestamp >= ${since}) AS orders,
        countIf(event = 'order_placed' AND timestamp < ${since}) AS orders_prev,
        sumIf(toFloat(properties.order_value), event = 'order_placed' AND timestamp >= ${since}) AS order_value
      FROM events
      WHERE event IN ('$pageview', 'order_placed') AND properties.$host IN ${hosts}
        AND timestamp >= now() - toIntervalDay(${days * 2})`,
    quality: `
      SELECT countIf($is_bounce) / count() AS bounce_rate, avg($session_duration) AS avg_duration,
        avg($pageview_count) AS pages_per_session
      FROM sessions WHERE ${sessionsWhere}`,
    trend: `
      SELECT ${BUCKET_SQL[bucket]} AS bucket, uniq(person_id) AS visitors, count() AS pageviews
      FROM events
      WHERE event = '$pageview' AND properties.$host IN ${hosts}
        AND timestamp >= toStartOfDay(now()) - toIntervalDay(${days - 1})
      GROUP BY bucket ORDER BY bucket`,
    funnel: `
      SELECT
        uniqIf(person_id, event = 'product_viewed') AS viewed,
        uniqIf(person_id, event = 'add_to_cart') AS added,
        uniqIf(person_id, event = 'checkout_started') AS checkout,
        uniqIf(person_id, event = 'order_placed') AS ordered
      FROM events
      WHERE event IN ('product_viewed', 'add_to_cart', 'checkout_started', 'order_placed')
        AND properties.$host IN ${hosts} AND timestamp >= ${since}`,
    countries: `
      SELECT properties.$geoip_country_name AS label, uniq(person_id) AS value
      FROM events WHERE ${pageviews}
      GROUP BY label ORDER BY value DESC LIMIT 8`,
    cities: `
      SELECT properties.$geoip_city_name AS label, any(properties.$geoip_subdivision_1_name) AS region,
        any(properties.$geoip_country_code) AS country, uniq(person_id) AS value
      FROM events WHERE ${pageviews} AND properties.$geoip_city_name IS NOT NULL
      GROUP BY label ORDER BY value DESC LIMIT 8`,
    channels: `
      SELECT $channel_type AS label, count() AS value
      FROM sessions WHERE ${sessionsWhere}
      GROUP BY label ORDER BY value DESC LIMIT 8`,
    referrers: `
      SELECT $entry_referring_domain AS label, count() AS value
      FROM sessions WHERE ${sessionsWhere} AND $entry_referring_domain NOT IN ('$direct', '')
      GROUP BY label ORDER BY value DESC LIMIT 8`,
    // Last click: each event goes to the campaign that started its session.
    // `!=` is null-safe in HogQL (NULL != '' is true), hence length().
    campaignsLast: `
      SELECT campaign, by_ad, ad, ${funnelMetrics}
      FROM (
        SELECT event, person_id, $session_id AS session_id, properties.order_value AS order_value,
          session.$is_bounce AS bounce, session.$entry_utm_campaign AS campaign,
          session.$entry_utm_source AS source, arrayJoin([0, 1]) AS by_ad,
          if(by_ad = 1, coalesce(session.$entry_utm_content, ''), '') AS ad
        FROM events
        WHERE event IN ${funnelEvents} AND properties.$host IN ${hosts} AND timestamp >= ${since}
          AND length(coalesce(session.$entry_utm_campaign, '')) > 0)
      GROUP BY campaign, by_ad, ad ORDER BY visitors DESC LIMIT 200`,
    // Where paid visits start (PostHog's Paid channels, from utm_medium and
    // click ids), and what those sessions went on to do.
    landingPages: `
      SELECT landing, ${funnelMetrics}
      FROM (
        SELECT event, person_id, $session_id AS session_id, properties.order_value AS order_value,
          session.$is_bounce AS bounce, session.$entry_pathname AS landing, session.$channel_type AS source
        FROM events
        WHERE event IN ${funnelEvents} AND properties.$host IN ${hosts} AND timestamp >= ${since}
          AND (startsWith(coalesce(session.$channel_type, ''), 'Paid') OR session.$channel_type = 'Cross Network'))
      GROUP BY landing ORDER BY sessions DESC LIMIT 15`,
    // First touch: the campaign behind the person's earliest session in the
    // past year. Not `$initial_utm_*`: the storefront creates person profiles
    // only on sign-in, so anonymous ad visitors have no person properties.
    campaignsFirst: `
      SELECT campaign, by_ad, ad, ${funnelMetrics}
      FROM (
        SELECT e.event AS event, e.person_id AS person_id, e.$session_id AS session_id,
          e.properties.order_value AS order_value, e.session.$is_bounce AS bounce,
          ft.first[1] AS campaign, ft.first[3] AS source, arrayJoin([0, 1]) AS by_ad,
          if(by_ad = 1, ft.first[2], '') AS ad
        FROM events AS e
        JOIN (
          SELECT person_id, argMin([coalesce(session.$entry_utm_campaign, ''),
            coalesce(session.$entry_utm_content, ''), coalesce(session.$entry_utm_source, '')], timestamp) AS first
          FROM events
          WHERE event = '$pageview' AND properties.$host IN ${hosts} AND timestamp >= now() - toIntervalDay(365)
          GROUP BY person_id HAVING first[1] != '') AS ft ON e.person_id = ft.person_id
        WHERE e.event IN ${funnelEvents} AND e.properties.$host IN ${hosts} AND e.timestamp >= ${since})
      GROUP BY campaign, by_ad, ad ORDER BY visitors DESC LIMIT 200`,
    devices: `
      SELECT properties.$device_type AS label, uniq(person_id) AS value
      FROM events WHERE ${pageviews}
      GROUP BY label ORDER BY value DESC LIMIT 5`,
    products: `
      SELECT properties.product_id AS id, any(properties.product_name) AS label,
        any(properties.item_type) AS item_type, any(properties.$pathname) AS path,
        count() AS value, uniq(person_id) AS viewers
      FROM events
      WHERE event = 'product_viewed' AND properties.$host IN ${hosts} AND timestamp >= ${since}
      GROUP BY id ORDER BY value DESC LIMIT 10`,
    pages: `
      SELECT properties.$pathname AS label, count() AS value, uniq(person_id) AS visitors
      FROM events WHERE ${pageviews}
      GROUP BY label ORDER BY value DESC LIMIT 10`,
    liveTotal: `
      SELECT uniq(person_id) AS visitors FROM events
      WHERE event = '$pageview' AND properties.$host IN ${hosts} AND timestamp >= now() - INTERVAL 30 MINUTE`,
    livePages: `
      SELECT properties.$pathname AS label, uniq(person_id) AS value FROM events
      WHERE event = '$pageview' AND properties.$host IN ${hosts} AND timestamp >= now() - INTERVAL 30 MINUTE
      GROUP BY label ORDER BY value DESC LIMIT 5`,
    sessions: `
      SELECT $session_id AS session_id, any(distinct_id) AS distinct_id,
        any(person.properties.name) AS name,
        min(timestamp) AS started, dateDiff('second', min(timestamp), max(timestamp)) AS duration,
        countIf(event = '$pageview') AS pageviews, argMin(properties.$pathname, timestamp) AS entry_path,
        any(session.$channel_type) AS channel, any(properties.$geoip_city_name) AS city,
        any(properties.$geoip_country_name) AS country, any(properties.$device_type) AS device,
        any(properties.$browser) AS browser, countIf(event = 'order_placed') AS orders,
        $session_id IN (SELECT session_id FROM raw_session_replay_events
          WHERE min_first_timestamp >= now() - toIntervalDay(${days + 1})) AS has_replay
      FROM events
      WHERE properties.$host IN ${hosts} AND timestamp >= ${since} AND $session_id != ''
      GROUP BY $session_id ORDER BY started DESC LIMIT 20`,
  };

  // PostHog caps concurrent queries per project, so three at a time.
  const entries = Object.entries(queries) as [keyof typeof queries, string][];
  const results = {} as Record<keyof typeof queries, Row[]>;
  for (let i = 0; i < entries.length; i += 3) {
    await Promise.all(
      entries.slice(i, i + 3).map(async ([name, sql]) => {
        results[name] = await hogql(name, sql);
      }),
    );
  }

  const k = results.kpis[0] ?? {};
  const q = results.quality[0] ?? {};
  const f = results.funnel[0] ?? {};
  const ranked = (rows: Row[], fallback = "Unknown"): RankedRow[] =>
    rows.map((r) => ({ label: str(r.label) || fallback, value: num(r.value) }));

  const sessions: TrafficSession[] = results.sessions.map((r) => ({
    sessionId: str(r.session_id),
    distinctId: str(r.distinct_id),
    name: str(r.name) || null,
    // Only `identify` sets a name (storefront `IdentifyCustomer`), so a name
    // means a signed-in customer.
    identified: Boolean(str(r.name)),
    startedAt: str(r.started),
    durationSeconds: num(r.duration),
    pageviews: num(r.pageviews),
    entryPath: str(r.entry_path) || "/",
    channel: str(r.channel) || "Unknown",
    location: [str(r.city), str(r.country)].filter(Boolean).join(", ") || "Unknown",
    device: [str(r.device), str(r.browser)].filter(Boolean).join(" · ") || "Unknown",
    orders: num(r.orders),
    hasReplay: Boolean(r.has_replay),
  }));

  return {
    period,
    generatedAt: new Date().toISOString(),
    kpis: {
      visitors: { value: num(k.visitors), previous: num(k.visitors_prev) },
      sessions: { value: num(k.sessions), previous: num(k.sessions_prev) },
      pageviews: { value: num(k.pageviews), previous: num(k.pageviews_prev) },
      orders: { value: num(k.orders), previous: num(k.orders_prev) },
      orderValue: num(k.order_value),
      bounceRate: num(q.bounce_rate),
      avgSessionSeconds: num(q.avg_duration),
      pagesPerSession: num(q.pages_per_session),
    },
    trend: fillTrend(results.trend, days, bucket),
    trendBucket: bucket,
    funnel: [
      { step: "Viewed a product", people: num(f.viewed) },
      { step: "Added to cart", people: num(f.added) },
      { step: "Started checkout", people: num(f.checkout) },
      { step: "Placed an order", people: num(f.ordered) },
    ],
    countries: ranked(results.countries),
    cities: results.cities.map((r) => ({
      label: str(r.label),
      value: num(r.value),
      detail: [str(r.region), str(r.country)].filter(Boolean).join(", ") || undefined,
    })),
    channels: ranked(results.channels),
    referrers: ranked(results.referrers),
    campaigns: {
      lastClick: campaignGroups(results.campaignsLast),
      firstTouch: campaignGroups(results.campaignsFirst),
    },
    landingPages: results.landingPages.map((r) => ({
      ...funnelRow(r, str(r.landing) || "/"),
      href: site + (str(r.landing) || "/"),
    })),
    devices: ranked(results.devices),
    products: results.products.map((r) => ({
      label: str(r.label) || "Unnamed product",
      value: num(r.value),
      viewers: num(r.viewers),
      itemType: str(r.item_type) || "product",
      detail: str(r.path) || undefined,
      href: str(r.path) ? site + str(r.path) : undefined,
    })),
    pages: results.pages.map((r) => ({
      label: str(r.label) || "/",
      value: num(r.value),
      visitors: num(r.visitors),
      href: site + (str(r.label) || "/"),
    })),
    live: { visitors: num(results.liveTotal[0]?.visitors), pages: ranked(results.livePages, "/") },
    sessions,
  };
}

/** One row of `funnelMetrics` columns. */
function funnelRow(r: Row, label: string): CampaignRow {
  return {
    label,
    source: str(r.source),
    visitors: num(r.visitors),
    sessions: num(r.sessions),
    bounceRate: num(r.sessions) > 0 ? num(r.bounced) / num(r.sessions) : 0,
    productViews: num(r.product_views),
    adds: num(r.adds),
    checkouts: num(r.checkouts),
    orders: num(r.orders),
    buyers: num(r.buyers),
    orderValue: num(r.order_value),
  };
}

/** Campaign totals, most visitors first, each holding its ad rows. */
function campaignGroups(rows: Row[]): CampaignGroup[] {
  const groups = new Map<string, CampaignGroup>();
  for (const r of rows) {
    if (num(r.by_ad) === 0) groups.set(str(r.campaign), { ...funnelRow(r, str(r.campaign)), ads: [] });
  }
  for (const r of rows) {
    if (num(r.by_ad) === 1) groups.get(str(r.campaign))?.ads.push(funnelRow(r, str(r.ad)));
  }
  return [...groups.values()];
}

/** Daily windows get a point for every day, zero or not, so the line doesn't skip quiet days. */
function fillTrend(rows: Row[], days: number, bucket: TrafficReport["trendBucket"]): TrafficReport["trend"] {
  const points = rows.map((r) => ({
    date: str(r.bucket).slice(0, 10),
    visitors: num(r.visitors),
    pageviews: num(r.pageviews),
  }));
  if (bucket !== "day") return points;
  const byDate = new Map(points.map((p) => [p.date, p]));
  // The project's timezone is Africa/Lagos (UTC+1), which HogQL's toDate uses.
  const today = new Date(Date.now() + 3_600_000);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const date = d.toISOString().slice(0, 10);
    return byDate.get(date) ?? { date, visitors: 0, pageviews: 0 };
  });
}

/** Cached per period for five minutes, shared by every staff member. */
export const getTrafficReport = unstable_cache(buildReport, ["posthog-traffic"], {
  revalidate: 300,
  tags: ["posthog-traffic"],
});

/** Deep links into PostHog for the "open in PostHog" affordances. */
export function postHogLinks() {
  const { posthog } = serverEnv();
  const base = `${posthog.appHost}/project/${posthog.projectId}`;
  return {
    web: `${base}/web`,
    events: `${base}/activity/explore`,
    replays: `${base}/replay/home`,
    person: `${base}/person/`,
    replay: `${base}/replay/`,
  };
}
