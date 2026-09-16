interface FormatMoneyInput {
  amount: number;
  currency: string;
}

/** Formats money only when the caller supplies its currency. */
export function formatMoney({ amount, currency }: FormatMoneyInput): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compatibility formatter for prices, which are currently NGN. */
export const formatPrice = (price: number) =>
  formatMoney({ amount: price, currency: "NGN" });
