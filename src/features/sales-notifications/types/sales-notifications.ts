// Types specific to the sales-notifications feature.
// Promote a type to src/types/ only when a SECOND feature needs it.
//
// TODO(codegen, ADR-0006): alias the generated response schema; Zod owns inputs.

/**
 * One recipient of the "new sale" notification email. The backend reads the
 * active rows fresh on every completed order (deliberately uncached), so a
 * recipient added a minute ago still gets the next sale.
 *
 * `label` is optional on the backend (`VarChar(100)`, nullable) — it's a
 * human note like "Accounts" or "Warehouse", not a display name.
 */
export interface SalesNotificationEmail {
  id: string;
  email: string;
  label: string | null;
  /**
   * `false` is a *pause*, not a delete: the row stays, the worker skips it.
   * Zero active rows means the whole email job is skipped and logged.
   */
  isActive: boolean;
  createdByStaffId: string;
  /** Included by the backend on every read and write response. */
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /sales-notifications/emails` body. */
export interface SalesNotificationEmailInput {
  email: string;
  label?: string;
  isActive: boolean;
}

/**
 * `PATCH /sales-notifications/emails/:id` body — every field optional, and
 * `label` accepts `null` to clear it (the backend's update schema is
 * `.nullable().optional()` there, unlike create).
 */
export interface SalesNotificationEmailUpdateInput {
  email?: string;
  label?: string | null;
  isActive?: boolean;
}
