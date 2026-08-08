import type { MetadataRoute } from "next";

/**
 * Block all crawlers on the admin subdomain. This is the only
 * public-facing thing on admin.blessingcomputers.com.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
