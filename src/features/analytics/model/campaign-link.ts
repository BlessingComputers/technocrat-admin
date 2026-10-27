/**
 * The store's UTM convention, as code, for the `/analytics/links` builder.
 *
 * Every tag is lowercase with hyphens, because PostHog groups by the exact
 * string: `Black-Friday` and `black friday` become two campaigns. Source and
 * medium come from a fixed list of placements, so nobody types them.
 * `paid_social`, `social`, `cpc` and `email` are the mediums PostHog's channel
 * types recognise (Paid Social, Organic Social, Paid Search, Email).
 */

export const PLACEMENTS = {
  instagram_ad: { label: "Instagram ad", source: "instagram", medium: "paid_social", meta: true },
  facebook_ad: { label: "Facebook ad", source: "facebook", medium: "paid_social", meta: true },
  instagram_post: { label: "Instagram post, story or bio", source: "instagram", medium: "social", meta: false },
  facebook_post: { label: "Facebook post", source: "facebook", medium: "social", meta: false },
  whatsapp: { label: "WhatsApp status or broadcast", source: "whatsapp", medium: "social", meta: false },
  tiktok_ad: { label: "TikTok ad", source: "tiktok", medium: "paid_social", meta: false },
  google_ad: { label: "Google ad", source: "google", medium: "cpc", meta: false },
  email: { label: "Email", source: "newsletter", medium: "email", meta: false },
} as const;

export type Placement = keyof typeof PLACEMENTS;

/** Ads Manager fills these per ad, so one link serves every campaign and ad. */
const META_CAMPAIGN = "{{campaign.name}}";
const META_AD = "{{ad.name}}";

export interface CampaignLinkInput {
  /** A storefront path ("/product/x") or a full link on the storefront. */
  destination: string;
  placement: Placement;
  campaign: string;
  /** The ad, post or creative, to tell two of them apart in one campaign. */
  content: string;
  /** Meta ads only: let Ads Manager fill the campaign and ad names. */
  metaNames: boolean;
}

export type CampaignLink =
  | { ok: true; url: string; parameters: string; pageUrl: string }
  | { ok: false; error: string };

/** "Black Friday 2026!" → "black-friday-2026". */
export function tagValue(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCampaignLink(input: CampaignLinkInput, storefrontOrigin: string): CampaignLink {
  const destination = input.destination.trim() || "/";
  let page: URL;
  try {
    page = new URL(destination, storefrontOrigin);
  } catch {
    return { ok: false, error: "That isn't a link or a path." };
  }
  const store = new URL(storefrontOrigin);
  if (page.hostname.replace(/^www\./, "") !== store.hostname.replace(/^www\./, "")) {
    return { ok: false, error: `Use a page on ${store.hostname}.` };
  }
  // Old tags on a pasted link would fight the new ones.
  for (const key of [...page.searchParams.keys()]) {
    if (key.startsWith("utm_")) page.searchParams.delete(key);
  }
  page.protocol = store.protocol;
  page.host = store.host;

  const placement = PLACEMENTS[input.placement];
  const metaNames = placement.meta && input.metaNames;
  const campaign = metaNames ? META_CAMPAIGN : tagValue(input.campaign);
  if (!campaign) return { ok: false, error: "Name the campaign." };
  const content = metaNames ? META_AD : tagValue(input.content);

  // Built by hand: URLSearchParams would encode Meta's braces, and Ads Manager
  // only fills `{{campaign.name}}` written literally.
  const tags: [string, string][] = [
    ["utm_source", placement.source],
    ["utm_medium", placement.medium],
    ["utm_campaign", campaign],
  ];
  if (content) tags.push(["utm_content", content]);
  const parameters = tags
    .map(([key, value]) => `${key}=${metaNames && value.startsWith("{{") ? value : encodeURIComponent(value)}`)
    .join("&");

  // Tags after a `#section` would never reach the server, so the hash goes last.
  const hash = page.hash;
  page.hash = "";
  const pageUrl = page.toString() + hash;
  const url = `${page.toString()}${page.search ? "&" : "?"}${parameters}${hash}`;
  return { ok: true, url, parameters, pageUrl };
}
