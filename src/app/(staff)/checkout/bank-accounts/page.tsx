import { redirect } from "next/navigation";

/**
 * Bank Accounts moved to `/payments/bank-accounts` when the sidebar regrouped —
 * it is a payments surface, and it now sits under the Payments parent next to
 * Transactions. This stub keeps old links and bookmarks working; `/checkout` has
 * no other route.
 */
export default function BankAccountsRedirect() {
  redirect("/payments/bank-accounts");
}
