"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import {
  useCustomer,
  useCustomerOrders,
  useCustomerInvoices,
} from "../api/customer.queries";
import { CustomerStatusBadge } from "./customer-status-badge";
import { CustomerStatsCards } from "./detail/customer-stats-cards";
import { CustomerOrdersList } from "./detail/customer-orders-list";
import { CustomerInvoicesList } from "./detail/customer-invoices-list";
import { CustomerProfileCard } from "./detail/customer-profile-card";
import { CustomerAddresses } from "./detail/customer-addresses";
import { CustomerDetailSkeleton } from "./customers-skeletons";
import { fullName } from "../utils/customer-utils";

interface CustomerDetailViewProps {
  customerId: string;
}

/** Customer detail view (route `/customers/[id]`). */
export function CustomerDetailView({ customerId }: CustomerDetailViewProps) {
  const { data: customer, isLoading } = useCustomer(customerId);
  const { data: fetchedOrders, isLoading: ordersLoading } =
    useCustomerOrders(customer);
  const { data: invoices, isLoading: invoicesLoading } = useCustomerInvoices(
    customer?.id,
  );

  if (isLoading) return <CustomerDetailSkeleton />;
  if (!customer) return <CustomerNotFound />;

  // Prefer orders recovered from the admin orders endpoint; fall back to any the
  // detail payload happened to embed.
  const orders =
    fetchedOrders ?? customer.orders ?? customer.recentOrders ?? [];

  return (
    <div className="space-y-8 pb-20">
      <PageHeader title={fullName(customer)} description={customer.email}>
        <Link
          href="/customers"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors pr-6 border-r border-border"
        >
          <AppIcon icon="solar:arrow-left-linear" className="w-3 h-3" />
          Back to Customers
        </Link>
        <CustomerStatusBadge status={customer.status} className="px-4 py-2" />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <CustomerStatsCards customer={customer} orders={orders} />
          <CustomerOrdersList orders={orders} isLoading={ordersLoading} />
          <CustomerInvoicesList
            invoices={invoices ?? []}
            isLoading={invoicesLoading}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <CustomerProfileCard customer={customer} />
          <CustomerAddresses addresses={customer.addresses} />
        </div>
      </div>
    </div>
  );
}

function CustomerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <AppIcon
        icon="solar:danger-circle-linear"
        className="w-16 h-16 text-destructive"
      />
      <h2 className="text-2xl font-black text-foreground">Customer Not Found</h2>
      <p className="text-muted-foreground font-medium">
        The customer you are looking for does not exist or has been deleted.
      </p>
      <Link href="/customers">
        <Button variant="outline" className="rounded-xl px-8 font-bold">
          Return to Customers
        </Button>
      </Link>
    </div>
  );
}
