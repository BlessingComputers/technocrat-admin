/**
 * Dollar pricing link state (ask 45). An item with `fxLinked` follows the
 * USD→NGN rate; an unlinked item keeps its Naira price.
 *
 * TRAP: the `fxLinked` query param works only on the Prisma-backed
 * `GET /products/all` and `GET /products/parts`. `/products`,
 * `/products/search` and `/products/search/parts` list it in the spec but
 * ignore it and return everything, and OpenSearch hits do not carry the field
 * (backend #299). Never count or filter linked items through search.
 *
 * Lives in `lib`, not a feature, because the products list, the parts list,
 * the price-age card and the FX screen all read it.
 */

/** The list filter, as it sits in the URL (`?fx=linked`). */
export type FxFilter = "linked" | "unlinked";

export const FX_FILTER_LABELS: Record<FxFilter, string> = {
  linked: "Follows the dollar",
  unlinked: "Naira price only",
};

/** Narrow an untrusted value (a URL param) to a filter choice. */
export function toFxFilter(value: string | null | undefined): FxFilter | undefined {
  return value === "linked" || value === "unlinked" ? value : undefined;
}

/** The `fxLinked` query param for a filter choice. */
export function fxLinkedParam(filter: FxFilter | undefined): "true" | "false" | undefined {
  if (filter === "linked") return "true";
  if (filter === "unlinked") return "false";
  return undefined;
}
