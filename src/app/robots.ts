import type { MetadataRoute } from "next";

/**
 * Block all crawlers on the admin subdomain. This is the only
 * public-facing thing on the admin host (admin.technocratng.com).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
