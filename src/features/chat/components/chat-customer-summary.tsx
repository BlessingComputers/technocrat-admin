import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import type { ChatCustomerRecord } from "../types/chat";

interface ChatCustomerSummaryProps {
  customerId: string | null;
  record?: ChatCustomerRecord | null;
}

function paidOrdersLine(record?: ChatCustomerRecord | null): string | null {
  const count = record?.totalOrders;
  if (count == null) return null;
  if (count === 0) return "No paid orders yet";
  const last = record?.lastOrderAt
    ? new Date(record.lastOrderAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  return `${count} paid order${count === 1 ? "" : "s"}${last ? ` · last on ${last}` : ""}`;
}

/**
 * Who this customer is to the shop, from inside the conversation: their paid
 * order count and a link to their customer page (orders, invoices, addresses).
 *
 * Before this, the chat showed a name and an email and linked nowhere, so
 * staff left the conversation and searched Customers to answer "have they
 * ordered before?". "Paid" because `totalOrders` only counts an order once its
 * payment is validated. Renders nothing for a conversation without a customer.
 */
export function ChatCustomerSummary({ customerId, record }: ChatCustomerSummaryProps) {
  if (!customerId) return null;
  const orders = paidOrdersLine(record);

  return (
    <Link
      href={`/customers/${customerId}`}
      className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <AppIcon
        icon="solar:user-rounded-linear"
        className="size-5 shrink-0 text-primary-ink"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">
          Open customer page
        </span>
        {orders ? (
          <span className="block truncate text-xs text-muted-foreground">
            {orders}
          </span>
        ) : null}
      </span>
      <AppIcon
        icon="solar:alt-arrow-right-linear"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </Link>
  );
}
