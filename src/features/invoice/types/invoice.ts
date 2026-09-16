// Types for the invoice feature (the `invoice` resource — see docs/schema.txt).
//
// The backend wraps list responses in `{ success, data, meta }`; the client
// unwraps `data` by default (ADR-0007), so list services use `{ raw: true }`
// to keep the sibling pagination `meta`.

export type InvoiceType = "INHOUSE" | "OUTSOURCED";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PAID"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type InvoiceRefundStatus = "NONE" | "PARTIAL" | "REFUNDED";

export type ProductAvailability = "AVAILABLE" | "UNAVAILABLE";

export type CustomerDecision = "AGREED_TO_WAIT" | "REQUESTS_REFUND";

export type ItemReviewStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REFUND_PENDING"
  | "REFUNDED";

/** Aggregate counts for the invoice dashboard KPI row. */
export interface InvoiceDashboard {
  totalInvoiced: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

/** Per-staff workload row (super-admin balancing view). */
export interface StaffWorkload {
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  claimedCount: number;
  reviewedCount: number;
}

export interface InvoiceAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  [key: string]: unknown;
}

export interface InvoiceCustomer {
  id?: string;
  customerId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: InvoiceAddress;
}

export interface InvoiceRepresentative {
  staffId: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface InvoiceLineItem {
  id: string;
  orderItemId?: string;
  productName: string;
  variantName?: string;
  sku?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reviewStatus?: ItemReviewStatus;
  productAvailability?: ProductAvailability;
}

export interface InvoiceTimelineEntry {
  id?: string;
  label: string;
  status?: string;
  createdAt: string;
  actor?: {
    firstName?: string;
    lastName?: string;
    staffId?: string;
  } | null;
}

export interface RefundRecord {
  id: string;
  orderItemId: string;
  productName?: string;
  quantity: number;
  refundAmount: number;
  processedAt: string | null;
  createdAt: string;
}

/** A row in any invoice list (list / pending-review / rejected). */
export interface InvoiceListItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  currency: string;
  totalAmount: number;
  refundStatus?: InvoiceRefundStatus;
  customer: InvoiceCustomer | null;
  representative?: InvoiceRepresentative | null;
  orderId?: string;
  createdAt: string;
  updatedAt?: string;
}

/** A single invoice in full (detail view). */
export interface Invoice extends InvoiceListItem {
  subtotalAmount: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  notes?: string;
  billingAddress: InvoiceAddress | null;
  lineItems: InvoiceLineItem[];
  timeline: InvoiceTimelineEntry[];
  customerDecision?: CustomerDecision | null;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  invoiceType?: InvoiceType | "";
  status?: InvoiceStatus | "";
  search?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | number | undefined;
}

export interface InvoiceListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Raw (un-unwrapped) list envelope — list services keep it for the `meta`. */
export interface InvoiceListEnvelope {
  success: boolean;
  data: InvoiceListItem[];
  meta: InvoiceListMeta;
}

/** `/rejected` returns the list plus a refund summary. */
export interface RejectedInvoicesEnvelope extends InvoiceListEnvelope {
  summary: RefundSummary;
}

export interface RefundSummary {
  totalAmount: number;
  refundedAmount: number;
  pendingRefundAmount: number;
}

// ── Manual (offline) invoices ─────────────────────────────────────
//
// A SEPARATE resource from the auto-generated order invoices (own endpoints
// under /v1/invoice/manual). Staff create these by hand for offline sales where
// money was already collected. Status is only PAID or CANCELLED.

export type ManualInvoiceStatus = "PAID" | "CANCELLED";

export interface ManualInvoiceCustomer {
  id?: string;
  customerId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: InvoiceAddress | null;
}

export interface ManualInvoiceLineItem {
  id?: string;
  productName: string;
  variantName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface ManualInvoiceStaff {
  staffId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * A row in the manual-invoice list (Manual tab). NOTE: manual invoices use
 * `manualInvoiceId` as their business id (the auto invoices use `invoiceId`),
 * and the customer arrives as a flat `customerName` string on the list.
 */
export interface ManualInvoiceListItem {
  manualInvoiceId: string;
  invoiceNumber: string;
  customerName?: string;
  status: ManualInvoiceStatus | string;
  currency?: string;
  totalAmount: number;
  paymentMethod?: string;
  createdBy?: ManualInvoiceStaff;
  issuedBy?: string;
  createdAt: string;
}

/** A manual invoice in full (detail view). */
export interface ManualInvoice extends ManualInvoiceListItem {
  orderId?: string;
  orderNumber?: string;
  saleChannel?: string;
  /** The customer as captured at issue time — the detail endpoint's source. */
  customerSnapshot?: ManualInvoiceCustomer | null;
  /** Older/fallback shapes: a structured customer object and/or flat fields. */
  customer?: ManualInvoiceCustomer | null;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: InvoiceAddress | string | null;
  subtotalAmount: number;
  discountAmount?: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  lineItems: ManualInvoiceLineItem[];
  paymentReference?: string;
  notes?: string;
  billingAddress?: InvoiceAddress | null;
  updatedAt?: string;
}

export interface ManualInvoiceListParams {
  page?: number;
  limit?: number;
  status?: ManualInvoiceStatus | "";
  search?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | number | undefined;
}

/**
 * Normalized manual list result. The endpoint returns `{ data, pagination }`
 * (pagination is a sibling, not nested `meta`), so the service maps it into this
 * consistent `{ data, meta }` shape for the view.
 */
export interface ManualInvoiceListResult {
  data: ManualInvoiceListItem[];
  meta: InvoiceListMeta;
}

// ── Mutation payloads ─────────────────────────────────────────────
export interface SubmitReviewItem {
  orderItemId: string;
  productAvailability: ProductAvailability;
  customerDecision?: CustomerDecision;
  notes?: string;
}

export interface RefundItemInput {
  orderItemId: string;
  quantity: number;
  refundAmount: number;
}
