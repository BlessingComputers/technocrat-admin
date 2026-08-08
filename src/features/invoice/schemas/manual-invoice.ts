import { z } from "zod";

/**
 * Manual-invoice create input (ADR-0006: Zod owns request/form inputs). Mirrors
 * the backend's `CreateManualInvoiceRequest`. Totals are computed server-side,
 * so the payload only carries the raw line items + tax/shipping rates.
 *
 * NOTE: `issuedBy` is NOT a form field — it is set to the authenticated admin's
 * name (from the staff session) when the payload is built. The detail view's
 * "Issued by" (docs/manual-invoice/MI-7) reflects it.
 */

const addressSchema = z.object({
  addressLine1: z.string().min(1, "Address is required").max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
});

const lineItemSchema = z.object({
  productName: z.string().min(1, "Product name is required").max(255),
  variantName: z.string().max(255).optional(),
  sku: z.string().max(100).optional(),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.number().positive("Unit price must be greater than 0"),
});

export const createManualInvoiceSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1, "Customer first name is required").max(100),
    lastName: z.string().min(1, "Customer last name is required").max(100),
    email: z.string().email("Enter a valid email").max(255).optional(),
    phone: z.string().max(20).optional(),
    address: addressSchema.optional(),
  }),
  customerId: z.string().uuid().optional(),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "Add at least one item")
    .max(100, "Too many items"),
  taxRate: z.number().min(0).max(100).optional(),
  shippingCost: z.number().min(0).optional(),
  currency: z.string().length(3).default("NGN"),
  saleChannel: z.string().max(50).optional(),
  paymentMethod: z.string().min(1, "Payment method is required").max(50),
  paymentReference: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  /** Set from the authenticated admin, not user-entered. */
  issuedBy: z.string().max(200).optional(),
});

export type CreateManualInvoiceInput = z.infer<typeof createManualInvoiceSchema>;

/** A line item as held in the form (already numeric). */
export interface ManualLineItemDraft {
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Flat form state for the create modal — text inputs stay strings (tax/shipping
 * parsed on submit) and the address is a flat block that only becomes a nested
 * `address` object in the payload when it's actually filled in.
 */
export interface ManualInvoiceFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerId: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lineItems: ManualLineItemDraft[];
  taxRate: string;
  shippingCost: string;
  currency: string;
  paymentMethod: string;
  paymentReference: string;
  saleChannel: string;
  notes: string;
}

export const EMPTY_MANUAL_INVOICE_FORM: ManualInvoiceFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  customerId: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  lineItems: [],
  taxRate: "",
  shippingCost: "",
  currency: "NGN",
  paymentMethod: "Cash",
  paymentReference: "",
  saleChannel: "Walk in",
  notes: "",
};

function toNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Assemble the API payload from form state, omitting empty optionals.
 * `issuedBy` is injected from the authenticated admin's name (not the form).
 */
export function buildManualInvoicePayload(
  form: ManualInvoiceFormState,
  issuedBy?: string,
): CreateManualInvoiceInput {
  const hasAddress = form.addressLine1.trim() !== "";

  const payload: CreateManualInvoiceInput = {
    customer: {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(hasAddress
        ? {
            address: {
              addressLine1: form.addressLine1.trim(),
              ...(form.addressLine2.trim()
                ? { addressLine2: form.addressLine2.trim() }
                : {}),
              city: form.city.trim(),
              state: form.state.trim(),
              postalCode: form.postalCode.trim(),
              country: form.country.trim(),
            },
          }
        : {}),
    },
    ...(form.customerId ? { customerId: form.customerId } : {}),
    lineItems: form.lineItems.map((item) => ({
      productName: item.productName.trim(),
      ...(item.variantName.trim() ? { variantName: item.variantName.trim() } : {}),
      ...(item.sku.trim() ? { sku: item.sku.trim() } : {}),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    currency: form.currency || "NGN",
    paymentMethod: form.paymentMethod.trim(),
    ...(toNumber(form.taxRate) !== undefined
      ? { taxRate: toNumber(form.taxRate) }
      : {}),
    ...(toNumber(form.shippingCost) !== undefined
      ? { shippingCost: toNumber(form.shippingCost) }
      : {}),
    ...(form.saleChannel.trim() ? { saleChannel: form.saleChannel.trim() } : {}),
    ...(form.paymentReference.trim()
      ? { paymentReference: form.paymentReference.trim() }
      : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    ...(issuedBy && issuedBy.trim() ? { issuedBy: issuedBy.trim() } : {}),
  };

  return payload;
}

/** Live totals for the Amount Summary card (mirrors the server math). */
export function computeManualInvoiceTotals(form: ManualInvoiceFormState) {
  const subtotal = form.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const shipping = toNumber(form.shippingCost) ?? 0;
  const taxRate = toNumber(form.taxRate) ?? 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, taxRate, tax, total };
}
