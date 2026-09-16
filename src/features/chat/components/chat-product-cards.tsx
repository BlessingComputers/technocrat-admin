import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ChatProductCard } from "../types/chat";

/**
 * Availability tone + label for a card.
 *
 * Deliberately local rather than imported from `features/products`
 * (`STOCK_PILL`/`STOCK_LABEL`): a feature may not depend on another feature,
 * and that map covers only three of the five statuses this payload can carry.
 * An unrecognised status says nothing rather than implying availability.
 */
const AVAILABILITY: Record<string, { dot: string; label: string }> = {
  IN_STOCK: { dot: "bg-success", label: "In stock" },
  LOW_STOCK: { dot: "bg-warning", label: "Low stock" },
  PREORDER: { dot: "bg-warning", label: "Pre-order" },
  OUT_OF_STOCK: { dot: "bg-destructive", label: "Out of stock" },
  DISCONTINUED: { dot: "bg-destructive", label: "Discontinued" },
};

function availability(status: string) {
  return (
    AVAILABILITY[status] ?? {
      dot: "bg-muted-foreground",
      label: "Availability unknown",
    }
  );
}

/**
 * Price line. `ChatProductCard` carries a min/max range and no `basePrice`, so
 * there is nothing to compute a discount strike from — a product with variants
 * shows the range, a single-variant one shows the figure, and a priceless row
 * says so rather than rendering ₦0.
 */
function priceLabel(product: ChatProductCard): string {
  const { lowestPrice: low, highestPrice: high } = product;
  if (low == null && high == null) return "No price set";
  if (low == null) return formatPrice(high!);
  if (high == null || high <= low) return formatPrice(low);
  return `${formatPrice(low)} – ${formatPrice(high)}`;
}

function ProductCardItem({ product }: { product: ChatProductCard }) {
  const stock = availability(product.availabilityStatus);

  return (
    // The absolute storefront URL, opened in a new tab: the admin is a
    // different origin, and an agent reading a live thread must not lose it to
    // a navigation.
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-border bg-background p-2 transition-colors hover:border-jewel/40 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        <AppIcon
          icon="solar:box-linear"
          aria-hidden
          className="size-5 text-muted-foreground/50"
        />
        {product.primaryImage && (
          // Layered over the placeholder glyph so a dead CDN link degrades to
          // it with no client-side error state. Plain <img> (not next/image),
          // matching chat-avatar.tsx — arbitrary provider URLs, fixed size.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImage}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        {product.brand?.name && (
          <span className="block truncate text-xs text-muted-foreground">
            {product.brand.name}
          </span>
        )}
        <span className="block truncate text-sm font-medium text-foreground">
          {product.name}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-foreground">
            {priceLabel(product)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden
              className={cn("size-1.5 shrink-0 rounded-full", stock.dot)}
            />
            {stock.label}
          </span>
        </span>
      </span>

      <AppIcon
        icon="solar:arrow-right-up-linear"
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
      />
    </a>
  );
}

/**
 * The catalogue products an AI reply was grounded in (contract v4).
 *
 * Staff-facing, and the point is different from the customer's: an agent
 * picking up the conversation needs to see *which* products the machine put in
 * front of this customer, so the card is a reference, not a buy surface. The
 * body keeps its own link to the same product — the backend sends the URL in
 * `body` and the card both, deliberately.
 */
export function ChatProductCards({
  products,
}: {
  products?: ChatProductCard[];
}) {
  if (!products?.length) return null;

  return (
    <ul className="flex max-w-[75%] flex-col gap-2">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCardItem product={product} />
        </li>
      ))}
    </ul>
  );
}
