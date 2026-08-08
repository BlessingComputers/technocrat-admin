import { AppIcon } from "@/components/shared/app-icon";
import { CustomerTableRow } from "./customer-table-row";
import { CustomersTableSkeleton } from "./customers-skeletons";
import type { Customer } from "../types/customers";

interface CustomersTableProps {
  customers: Customer[];
  isLoading: boolean;
}

const TABLE_HEADERS = [
  "Customer",
  "Status",
  "Loyalty",
  "Orders",
  "Lifetime Value",
  "Joined",
  "Actions",
];

export function CustomersTable({ customers, isLoading }: CustomersTableProps) {
  if (isLoading) {
    return <CustomersTableSkeleton />;
  }

  if (customers.length === 0) {
    return (
      <div className="py-20 text-center bg-card rounded-lg border border-border">
        <AppIcon
          icon="solar:users-group-rounded-linear"
          className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
        />
        <h3 className="text-xl font-black text-foreground">
          No customers found
        </h3>
        <p className="text-muted-foreground font-medium">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-card rounded-lg border border-border w-full">
      <table className="w-full text-left min-w-[900px]">
        <thead>
          <tr className="border-b border-border bg-primary/[0.04]">
            {TABLE_HEADERS.map((header) => (
              <th
                key={header}
                className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground${header === "Actions" ? " text-right" : ""}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {customers.map((customer) => (
            <CustomerTableRow key={customer.id} customer={customer} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
