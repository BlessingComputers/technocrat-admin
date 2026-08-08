import type { AdminBankAccount } from "../types/orders";

/**
 * Shape of the bank-account add/edit dialog form. Matches the writable fields
 * accepted by `useCreateBankAccount` / `useUpdateBankAccount`.
 */
export interface BankAccountFormData {
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  currency: string;
  description: string;
  isActive: boolean;
  isPrimary: boolean;
  sortOrder: number;
}

export const EMPTY_BANK_ACCOUNT_FORM: BankAccountFormData = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  bankCode: "",
  currency: "NGN",
  description: "",
  isActive: true,
  isPrimary: false,
  sortOrder: 0,
};

export function bankAccountToFormData(
  account: AdminBankAccount,
): BankAccountFormData {
  return {
    bankName: account.bankName,
    accountName: account.accountName,
    accountNumber: account.accountNumber,
    bankCode: account.bankCode,
    currency: account.currency,
    description: account.description || "",
    isActive: account.isActive,
    isPrimary: account.isPrimary,
    sortOrder: account.sortOrder,
  };
}
