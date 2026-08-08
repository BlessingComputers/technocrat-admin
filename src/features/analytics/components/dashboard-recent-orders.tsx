"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import { RecentOrderRow } from "./recent-order-row";
import type { DashboardOrder } from "../types/analytics";

interface DashboardRecentOrdersProps {
  recentOrders: DashboardOrder[];
}

export function DashboardRecentOrders({
  recentOrders,
}: DashboardRecentOrdersProps) {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-muted/5 px-4 sm:px-6 py-4 gap-4 sm:gap-0">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <AppIcon icon="solar:cart-large-2-bold" className="size-4" />
          Recent Orders
        </CardTitle>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none h-8 rounded-md gap-2 font-medium text-xs uppercase tracking-wide"
          >
            <AppIcon icon="solar:filter-bold" className="size-3.5" />
            Filter
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex-1 sm:flex-none h-8 rounded-md text-primary font-medium text-xs uppercase tracking-wide"
          >
            <Link href="/orders">View All Queue</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-200">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border/40">
              <TableHead className="w-30 px-6 font-semibold text-xs uppercase tracking-wide">
                Order ID
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Customer
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Products
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Value
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Date
              </TableHead>
              <TableHead className="text-right px-6 font-semibold text-xs uppercase tracking-wide">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => {
                // Handle both ManualOrder (nested customer) and
                // StaffDashboardOrder (flat customer) shapes.
                const customerName =
                  order.customerName ||
                  (order.customer
                    ? `${order.customer.firstName} ${order.customer.lastName}`
                    : "Guest Customer");
                const customerEmail =
                  order.customerEmail ||
                  order.customer?.email ||
                  "No email provided";
                const orderIdentifier =
                  order.manualOrderId || order.orderNumber;

                const firstItemName =
                  order.items?.[0]?.productName || order.product || "";
                const itemsCount = order.items?.length || 1;
                const productText = firstItemName
                  ? `${firstItemName.substring(0, 45)}${firstItemName.length > 45 ? "..." : ""}${itemsCount > 1 ? ` (+${itemsCount - 1} more)` : ""}`
                  : "Multiple Items";

                return (
                  <RecentOrderRow
                    key={order.id}
                    id={order.id}
                    orderNumber={orderIdentifier}
                    customer={customerName}
                    email={customerEmail}
                    product={productText}
                    value={formatPrice(order.totalAmount || 0)}
                    date={new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    status={order.orderStatus}
                  />
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <AppIcon icon="solar:inbox-linear" className="size-8 opacity-30" />
                    <p className="text-xs font-medium uppercase tracking-wide">
                      No recent orders found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
