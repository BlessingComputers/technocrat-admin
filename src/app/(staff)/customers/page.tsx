import type { Metadata } from "next";
import { CustomersListView } from "@/features/customers";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  return <CustomersListView />;
}
