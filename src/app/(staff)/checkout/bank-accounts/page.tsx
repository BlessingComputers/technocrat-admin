import type { Metadata } from "next";
import { BankAccountsView } from "@/features/orders";

export const metadata: Metadata = {
  title: "Bank Accounts",
};

export default function BankAccountsPage() {
  return <BankAccountsView />;
}
