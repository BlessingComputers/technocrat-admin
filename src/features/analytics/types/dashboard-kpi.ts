/**
 * Loose shapes for the admin dashboard KPI payloads. The backend response is
 * large and shifts, so we type just the fields the UI reads.
 *
 * TODO(codegen, ADR-0006): alias the generated response schemas once the
 * OpenAPI spec is wired.
 */

export interface KpiSplitRow {
  /** Tailwind colour class for the dot, e.g. "bg-primary". */
  dotColor: string;
  label: string;
  /** Main display value (already formatted). */
  value: string;
  /** Optional muted suffix shown after the value, e.g. "(₦12,000 avg)". */
  suffix?: string;
}

export interface RevenueBucket {
  revenue?: number;
}

export interface OrdersBucket {
  orders?: number;
  avgOrderValue?: number;
}

export interface RefundsBucket {
  amount?: number;
  count?: number;
}

export interface CustomersBucket {
  new?: number;
  total?: number;
}

export interface CatalogBucket {
  totalProducts?: number;
  activeProducts?: number;
  activeCoupons?: number;
}

export interface InventoryBucket {
  lowStock?: number;
  outOfStock?: number;
}

export interface StaffBucket {
  total?: number;
  active?: number;
  online?: number;
}

export interface ConversationsBucket {
  resolvedInRange?: number;
}

/** Shape of the super-admin live KPI payload (`data.revenue` present). */
export interface SuperAdminLiveKpiData {
  revenue?: {
    combined?: RevenueBucket;
    online?: RevenueBucket;
    manual?: RevenueBucket;
  };
  orders?: {
    combined?: OrdersBucket;
    online?: OrdersBucket;
    manual?: OrdersBucket;
  };
  customers?: CustomersBucket;
  refunds?: {
    combined?: RefundsBucket;
    online?: RefundsBucket;
    manual?: RefundsBucket;
  };
  conversations?: ConversationsBucket;
  inventory?: InventoryBucket;
  staff?: StaffBucket;
  catalog?: CatalogBucket;
}
