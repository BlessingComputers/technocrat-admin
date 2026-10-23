import { describe, expect, it } from "vitest";
import { buildCampaignLink, tagValue } from "./campaign-link";

const STORE = "https://www.example-store.com";
const base = { destination: "/product/x", campaign: "", content: "", metaNames: false } as const;

describe("tagValue", () => {
  it("lowercases and hyphenates", () => {
    expect(tagValue("  Black Friday 2026! ")).toBe("black-friday-2026");
  });
});

describe("buildCampaignLink", () => {
  it("tags a path with the placement's source and medium", () => {
    expect(
      buildCampaignLink({ ...base, placement: "instagram_post", campaign: "October Deals", content: "Reel 1" }, STORE),
    ).toEqual({
      ok: true,
      pageUrl: `${STORE}/product/x`,
      parameters: "utm_source=instagram&utm_medium=social&utm_campaign=october-deals&utm_content=reel-1",
      url: `${STORE}/product/x?utm_source=instagram&utm_medium=social&utm_campaign=october-deals&utm_content=reel-1`,
    });
  });

  it("leaves Meta's name placeholders unencoded", () => {
    const link = buildCampaignLink({ ...base, placement: "facebook_ad", metaNames: true }, STORE);
    expect(link.ok && link.parameters).toBe(
      "utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}",
    );
  });

  it("keeps the page's own query, replaces old tags, and accepts the bare domain", () => {
    const link = buildCampaignLink(
      { ...base, destination: "https://example-store.com/shop?brand=hp&utm_source=old", placement: "google_ad", campaign: "laptops" },
      STORE,
    );
    expect(link.ok && link.url).toBe(
      `${STORE}/shop?brand=hp&utm_source=google&utm_medium=cpc&utm_campaign=laptops`,
    );
  });

  it("puts the tags before a #section", () => {
    const link = buildCampaignLink({ ...base, destination: "/about#visit", placement: "whatsapp", campaign: "visit" }, STORE);
    expect(link.ok && link.url).toBe(`${STORE}/about?utm_source=whatsapp&utm_medium=social&utm_campaign=visit#visit`);
  });

  it("refuses another site and a missing campaign", () => {
    expect(buildCampaignLink({ ...base, destination: "https://elsewhere.com/x", placement: "email", campaign: "a" }, STORE))
      .toEqual({ ok: false, error: "Use a page on www.example-store.com." });
    expect(buildCampaignLink({ ...base, placement: "tiktok_ad" }, STORE)).toEqual({
      ok: false,
      error: "Name the campaign.",
    });
  });
});
