// Types specific to the orders feature (Orders + Bank Accounts — the
// `adminCheckout` resource, ADR-0002).
//
// TODO(codegen, ADR-0006): alias the generated response schemas; Zod owns inputs.

/** Loose order address shape — only the fields the UI reads are typed. */
export interface OrderAddress {
  firstName?: string;
  lastName?: string;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  currency: string;
  description: string;
  isPrimary: boolean;
}

export interface AdminBankAccount extends BankAccount {
  id: string;
  accountId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutStats {
  awaitingPayment: number;
  pendingReview: number;
  confirmedToday: number;
  totalRevenuePending: number;
}

export interface AdminOrderListParams {
  page?: number;
  limit?: number;
  orderStatus?: string;
  /**
   * Normalized across both sources by the combined endpoint:
   * PENDING | PAID | FAILED | REFUNDED.
   */
  paymentStatus?: string;
  search?: string;
  sortBy?: "newest" | "oldest" | "amount_desc" | "amount_asc";
  /**
   * Source filter ("all" | "gateway" | "manual"). Forwarded to the combined
   * `/all-orders` endpoint (mapped to ALL | ONLINE | MANUAL in the service).
   */
  source?: OrderSourceFilter;
  // Index signature keeps this assignable to the client's query-param type.
  [key: string]: string | number | undefined;
}

/** Normalized payment state the combined endpoint filters/returns. */
export type NormalizedPaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

/**
 * One line item on a combined-list row. `OrderItem` and `ManualOrderItem` are
 * normalized to this single shape by the backend; `sourcingType` only exists on
 * the online side and is always null on MANUAL rows.
 */
export interface AllOrdersItem {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  taxSource: string | null;
  sourcingType: string | null;
}

/**
 * One row from `GET /all-orders` — the backend's own merged shape (distinct
 * from the UI's {@link AdminOrderRow}, which `allOrdersRowToAdminRow` maps this
 * into). Items are only fetched for the rows on the current page, so carrying
 * them costs nothing extra regardless of how deep the pagination goes.
 */
export interface AllOrdersRow {
  source: "ONLINE" | "MANUAL";
  /** DB UUID — used for the gateway detail route and manual lookups. */
  id: string;
  /** Human reference: orderNumber (online) or manualOrderId (manual). */
  displayId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  orderStatus: string;
  /** Each source's raw payment enum. */
  paymentStatus: string;
  paymentStatusNormalized: NormalizedPaymentStatus;
  deliveryMethod: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  items: AllOrdersItem[];
}

export interface AllOrdersMeta {
  total: number;
  totalOnline: number;
  totalManual: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Raw envelope kept via `{ raw: true }` so `meta` survives the client unwrap. */
export interface AllOrdersEnvelope {
  success?: boolean;
  data: AllOrdersRow[];
  meta: AllOrdersMeta;
}

export interface OrderListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  note?: string;
  createdAt: string;
  changedBy?: {
    id: string;
    staffId: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface ManualOrder {
  id: string;
  manualOrderId: string;
  orderStatus: string;
  orderStatus_label: string;
  paymentStatus: string;
  paymentStatus_label: string;
  deliveryMethod: "DISPATCH" | "SELF_PICKUP";
  currency: string;
  subtotalAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  items: OrderItem[];
  proofOfPaymentUrl?: string;
  proofUploadedAt?: string;
  confirmedAmountPaid?: number;
  riderName?: string;
  riderPhone?: string;
  deliveredAt?: string;
  completedAt?: string;
  statusHistory: OrderStatusHistoryEntry[];
  customer?: {
    id: string;
    customerId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  validatedByStaffId?: string;
  validatedAt?: string;
  validatedBy?: {
    staffId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  rejectionReason?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** Raw (un-unwrapped) list envelope — `getOrders` keeps it for the `meta`. */
export interface OrdersEnvelope {
  success: boolean;
  data: ManualOrder[];
  meta: OrderListMeta;
}

// ── Main order module ("gateway" / online-payment flow, `orders` table) ───────
// A parallel order system to the manual bank-transfer flow above. The admin
// Orders page unifies both. Shape mirrors the backend `formatOrder` output
// (the OpenAPI response body isn't documented, so this is hand-authored).

/** Which backend an order came from — the two flows are separate tables. */
export type OrderSource = "gateway" | "manual";

export interface GatewayOrderItem {
  id: string;
  variantId: string | null;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string | null;
  sourcingType?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
  taxSource?: string | null;
}

export interface GatewayOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentStatus?: string | null;
  deliveryMethod: "DISPATCH" | "SELF_PICKUP" | string;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  riderName?: string | null;
  riderPhone?: string | null;
  notes?: string | null;
  couponId?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: GatewayOrderItem[];
}

/** Nested list payload from `GET /v1/orders` (client unwraps the envelope). */
export interface GatewayOrderListResponse {
  orders: GatewayOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GatewayStatusHistoryEntry {
  id: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  staffId?: string | null;
}

// ── Unified detail view-models ────────────────────────────────────────────────
// Both order flows (manual + gateway) render their detail page through one shared
// set of presentational components. Each view maps its own order shape into these
// normalized props, so the two pages stay visually identical without coupling
// their separate data/mutation flows.

/** One normalized entry for the shared audit timeline (`OrderAuditTrail`). */
export interface OrderTimelineEntry {
  id: string;
  /** The status the order moved into at this step. */
  status: string;
  note?: string | null;
  createdAt: string;
  /** Human name of the staff member who made the change, when known. */
  actorName?: string | null;
  /** Staff identifier (badge suffix), when known. */
  actorId?: string | null;
}

/** Normalized money breakdown for the shared `OrderSummaryCard`. */
export interface OrderMoney {
  subtotal: number;
  discount?: number;
  tax?: number;
  shipping: number;
  total: number;
}

/** Normalized customer identity for the shared `OrderCustomerCard`. */
export interface OrderCustomerInfo {
  name?: string | null;
  customerId?: string | null;
  email?: string | null;
  phone?: string | null;
}

// ── Unified list row ──────────────────────────────────────────────────────────
// Both order flows normalize into this shared shape so one table can render
// them side by side, tagged by `source`. Gateway orders expose only a
// `customerId` (the list `include` omits the customer relation), so
// `customerName`/`customerEmail` are null for them.

export interface AdminOrderRow {
  source: OrderSource;
  /** Stable React key (prefixed by source to avoid cross-source collisions). */
  key: string;
  /** Where clicking the row navigates. */
  detailHref: string;
  /** Displayed identifier — `manualOrderId` or `orderNumber`. */
  reference: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  /** Fallback identity for gateway rows that lack a customer relation. */
  customerId: string | null;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  deliveryMethod: string;
  /** Number of distinct line items (not total units). */
  itemCount: number;
  /** Name of the first line item, or `null` on an order with no items. */
  firstItemName: string | null;
}

/** UI-only source selector for the list filter. */
export type OrderSourceFilter = "all" | OrderSource;
