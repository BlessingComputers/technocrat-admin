import { redirect } from "next/navigation";

/**
 * `/pricing` is no longer a screen. Markup, Deals and Tax are real routes with
 * their own sidebar rows, so this path exists only to catch links and bookmarks
 * from the tabbed version and send them to the right one.
 *
 * The old tab query is translated rather than dropped: `?tab=parts` was the
 * deep link the Parts catalogue used, and `?tab=tax` shipped in the help docs.
 */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  if (tab === "tax") redirect("/pricing/tax");
  if (tab === "parts") redirect("/pricing/markup?kind=parts");
  redirect("/pricing/markup");
}
