// Types for the admin customer-management feature (the `customerMgt` resource:
// GET /v1/admin/customers, /:id, /analytics/customers).
//
// TODO(codegen, ADR-0006): the backend does not yet document these response
// bodies in the OpenAPI spec (`content?: never`), so there is no generated
// schema to alias. Until it does, these are hand-written from the canonical
// customer model (main app's `CustomerProfile`, i.e. GET /auth/customer/me) and
// rendered defensively. Zod still owns any request inputs.

export type CustomerStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

/** Query params for the paginated customer list. */
export interface CustomersListParams {
  search?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  loyaltyTier?: LoyaltyTier;
  status?: CustomerStatus;
}

/** A row in the customer list. `totalSpent` is a string on the wire. */
export interface Customer {
  id: string;
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  status?: CustomerStatus | string;
  loyaltyTier?: string;
  loyaltyPoints?: number;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  totalOrders?: number;
  totalSpent?: string | number;
  lastOrderAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerAddress {
  id: string;
  addressId?: string;
  type?: string;
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  [key: string]: unknown;
}

/**
 * One entry in a customer's order history. Sourced from the admin manual-orders
 * endpoint (searched by the customer's email — see `getCustomerOrders`), so the
 * shape is a subset of the orders feature's `ManualOrder`. Loose — only the
 * fields this feature reads are typed; the rest ride the index signature.
 */
export interface CustomerOrderSummary {
  id: string;
  orderId?: string;
  manualOrderId?: string;
  orderStatus?: string;
  paymentStatus?: string;
  totalAmount?: number;
  currency?: string;
  itemCount?: number;
  items?: Array<{ [key: string]: unknown }>;
  createdAt?: string;
  /** Present on admin-orders rows — used to tighten the fuzzy email search. */
  customer?: {
    id?: string;
    customerId?: string;
    email?: string;
  };
  [key: string]: unknown;
}

/**
 * One entry in a customer's invoice history (GET /v1/invoice/customer/:id).
 * A subset of the invoice feature's `InvoiceListItem` — loose, only read fields
 * typed. Rows link to `/invoices/:invoiceId`.
 */
export interface CustomerInvoiceSummary {
  id: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceType?: string;
  status?: string;
  currency?: string;
  totalAmount?: number;
  refundStatus?: string;
  orderId?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/** Aggregate payment/order stats returned with the customer detail. */
export interface CustomerPaymentStats {
  totalOrders?: number;
  completedOrders?: number;
  cancelledOrders?: number;
  totalSpent?: string | number;
  averageOrderValue?: string | number;
  lastOrderAt?: string | null;
  [key: string]: unknown;
}

/**
 * Customer detail (GET /v1/admin/customers/:id) — "profile with order history
 * and payment stats". Extends the list shape with the nested collections.
 */
export interface CustomerDetail extends Customer {
  dateOfBirth?: string | null;
  gender?: string | null;
  connectedProviders?: string[];
  addresses?: CustomerAddress[];
  orders?: CustomerOrderSummary[];
  recentOrders?: CustomerOrderSummary[];
  stats?: CustomerPaymentStats;
  paymentStats?: CustomerPaymentStats;
}

export interface CustomerListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Normalized list result the service hands to the query layer. */
export interface CustomersResult {
  data: Customer[];
  meta: CustomerListMeta;
}

// ── Analytics (GET /v1/admin/analytics/customers) ──────────────────────
export type CustomerAnalyticsPeriod = "7d" | "30d" | "90d" | "12m";

export interface LoyaltyTierBreakdownEntry {
  tier: string;
  count: number;
}

export interface TopSpender {
  id: string;
  customerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  totalSpent?: string | number;
  totalOrders?: number;
}

/** Loose analytics payload — rendered defensively (contract undocumented). */
export interface CustomerAnalytics {
  totalCustomers?: number;
  activeCustomers?: number;
  suspendedCustomers?: number;
  newSignups?: number;
  newSignupsThisPeriod?: number;
  loyaltyTierBreakdown?: LoyaltyTierBreakdownEntry[];
  topSpenders?: TopSpender[];
  [key: string]: unknown;
}
