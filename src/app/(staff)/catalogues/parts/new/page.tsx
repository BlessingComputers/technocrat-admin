import type { Metadata } from "next";
import { PartFormView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Add Part",
};

/**
 * Create a standalone part (`/catalogues/parts/new`) — one that isn't being
 * added in the context of a product.
 *
 * `PartFormView` already supported this (no `productContext` means no inherited
 * ownerSku/taxonomy, no link-on-save, and a redirect to the new part's detail
 * page); only the route was missing, which is why adding a single part used to
 * be reachable only from a product's Parts tab. To create a part already linked
 * to a product, use `/catalogues/[id]/parts/new` instead.
 */
export default function NewPartPage() {
  return <PartFormView />;
}
