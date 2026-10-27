"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { ManualField } from "./manual-field";
import {
  ExistingCustomerSelect,
  type ExistingCustomerOption,
} from "./existing-customer-select";
import type { ManualInvoiceFormState } from "../../schemas/manual-invoice";

interface ManualCustomerFieldsProps {
  form: ManualInvoiceFormState;
  onChange: (patch: Partial<ManualInvoiceFormState>) => void;
}

export function ManualCustomerFields({
  form,
  onChange,
}: ManualCustomerFieldsProps) {
  const [addressOpen, setAddressOpen] = useState(false);

  const selectedLabel = form.customerId
    ? `${form.firstName} ${form.lastName}`.trim()
    : "";

  const handlePickCustomer = (customer: ExistingCustomerOption) => {
    onChange({
      customerId: customer.id,
      firstName: customer.firstName ?? form.firstName,
      lastName: customer.lastName ?? form.lastName,
      email: customer.email ?? form.email,
      phone: customer.phone ?? form.phone,
    });
  };

  return (
    <section className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground">
        Customer&apos;s Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ManualField
          label="Customer's first name"
          required
          placeholder="Enter customer's first name"
          value={form.firstName}
          onChange={(v) => onChange({ firstName: v })}
        />
        <ManualField
          label="Customer's last name"
          required
          placeholder="Enter customer's last name"
          value={form.lastName}
          onChange={(v) => onChange({ lastName: v })}
        />
      </div>

      <ManualField
        label="Email address"
        type="email"
        placeholder="Enter email address"
        value={form.email}
        onChange={(v) => onChange({ email: v })}
      />

      <ManualField
        label="Phone number"
        placeholder="Enter phone number"
        value={form.phone}
        onChange={(v) => onChange({ phone: v })}
      />

      <ExistingCustomerSelect
        selectedLabel={selectedLabel}
        selectedEmail={form.email}
        onSelect={handlePickCustomer}
        onClear={() => onChange({ customerId: "" })}
      />

      <div className="rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setAddressOpen((o) => !o)}
          className="flex w-full items-center justify-between bg-primary/5 px-4 py-3 text-left"
        >
          <span className="text-xs font-medium text-primary-ink">
            Add Address{" "}
            <span className="text-primary-ink/60">(optional)</span>
          </span>
          <AppIcon
            icon="solar:alt-arrow-down-linear"
            className={cn(
              "h-4 w-4 text-primary-ink transition-transform",
              addressOpen && "rotate-180",
            )}
          />
        </button>

        {addressOpen && (
          <div className="space-y-4 p-4">
            <ManualField
              label="Address 1"
              placeholder="Enter address"
              value={form.addressLine1}
              onChange={(v) => onChange({ addressLine1: v })}
            />
            <ManualField
              label="Address 2"
              optional
              placeholder="Enter address"
              value={form.addressLine2}
              onChange={(v) => onChange({ addressLine2: v })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ManualField
                label="City"
                placeholder="Enter city"
                value={form.city}
                onChange={(v) => onChange({ city: v })}
              />
              <ManualField
                label="State"
                placeholder="Enter state"
                value={form.state}
                onChange={(v) => onChange({ state: v })}
              />
              <ManualField
                label="Postal code"
                placeholder="Enter postal code"
                value={form.postalCode}
                onChange={(v) => onChange({ postalCode: v })}
              />
              <ManualField
                label="Country"
                placeholder="Enter country"
                value={form.country}
                onChange={(v) => onChange({ country: v })}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
