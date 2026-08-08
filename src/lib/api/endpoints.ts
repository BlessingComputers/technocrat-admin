/**
 * API endpoints — ADMIN APP VERSION
 *
 * Customer-only endpoints (auth.google/login/signup, user.*, cart.*,
 * addresses.*, customer-side checkout.*, customer orders.*) live in the
 * main app, not here.
 */

import { publicEnv, serverEnv } from "@/config/env";

// Server reads the full backend URL (validated, server-only); the browser uses
// the same-origin `/api` proxy (ADR-0003). Both sourced from `config/env`.
export const BASE_URL =
  typeof window === "undefined" ? serverEnv().apiBaseUrl : publicEnv.apiBaseUrl;

function endpoint(path: string): string {
  return `${BASE_URL}${path}`;
}

export const API_ENDPOINTS = {
  staffAuth: {
    login: endpoint("/auth/staff/login"),
    refresh: endpoint("/auth/staff/refresh"),
    list: endpoint("/auth/super-admin/staff"),
    onboard: endpoint("/auth/staff/onboard"),
    resetPassword: endpoint("/auth/staff/reset-password"),
    forgotPassword: endpoint("/auth/staff/forgot-password"),
    profile: endpoint("/auth/staff/profile"),
    logout: endpoint("/auth/staff/logout"),
  },
  rbac: {
    permissions: endpoint("/v1/admin/rbac/permissions"),
    roles: endpoint("/v1/admin/rbac/roles"),
    staff: endpoint("/v1/admin/rbac/staff"),
  },
  products: {
    base: endpoint("/v1/products"),
    addVariant: (productId: string) =>
      endpoint(`/v1/products/${productId}/variants`),
    variant: (productId: string, variantId: string) =>
      endpoint(`/v1/products/${productId}/variants/${variantId}`),
    list: endpoint("/v1/products/all"),
    bulk: endpoint("/v1/products/bulk"),
    bulkImages: endpoint("/v1/products/images/bulk-upload"),
    // Multi-select edit / soft-delete across existing products (synchronous
    // updateMany). Bodies take DB `id` UUIDs (`productIds`), not human productId.
    bulkEdit: endpoint("/v1/products/bulk-edit"),
    bulkDelete: endpoint("/v1/products/bulk-delete"),
    featured: endpoint("/v1/products/featured"),
    bySlug: endpoint("/v1/products/slug"),
    categories: endpoint("/v1/products/categories"),
    brands: endpoint("/v1/products/brands"),
    // Parts — standalone parts catalog (own CRUD + images + part types).
    parts: {
      base: endpoint("/v1/products/parts"),
      list: endpoint("/v1/products/parts"),
      detail: (partId: string) => endpoint(`/v1/products/parts/${partId}`),
      permanent: (partId: string) =>
        endpoint(`/v1/products/parts/${partId}/permanent`),
      images: (partId: string) =>
        endpoint(`/v1/products/parts/${partId}/images`),
      image: (partId: string, imageId: string) =>
        endpoint(`/v1/products/parts/${partId}/images/${imageId}`),
      imagePrimary: (partId: string, imageId: string) =>
        endpoint(`/v1/products/parts/${partId}/images/${imageId}/primary`),
      types: endpoint("/v1/products/parts/part-types"),
      bulk: endpoint("/v1/products/parts/bulk"),
      bulkImages: endpoint("/v1/products/parts/images/bulk-upload"),
      // Multi-select edit / soft-delete across existing parts (synchronous
      // updateMany). Bodies take DB `id` UUIDs (`partIds`), not human partId.
      bulkEdit: endpoint("/v1/products/parts/bulk-edit"),
      bulkDelete: endpoint("/v1/products/parts/bulk-delete"),
      // Markup-rules engine (scope by category/brand/partType).
      markup: {
        rules: endpoint("/v1/products/parts/markup-rules"),
        rule: (id: string) => endpoint(`/v1/products/parts/markup-rules/${id}`),
        preview: endpoint("/v1/products/parts/markup-rules/preview"),
        apply: endpoint("/v1/products/parts/markup-rules/apply"),
        reset: (id: string) =>
          endpoint(`/v1/products/parts/markup-rules/${id}/reset`),
        cancel: (id: string) =>
          endpoint(`/v1/products/parts/markup-rules/${id}/cancel`),
      },
    },
    // Product↔part links (keyed by productId — the "compatible parts" relation).
    productParts: {
      list: (productId: string) => endpoint(`/v1/products/${productId}/parts`),
      bulk: (productId: string) =>
        endpoint(`/v1/products/${productId}/parts/bulk`),
      reorder: (productId: string) =>
        endpoint(`/v1/products/${productId}/parts/reorder`),
      link: (productId: string, partId: string) =>
        endpoint(`/v1/products/${productId}/parts/${partId}`),
    },
    // Search/cache maintenance (require search:admin).
    adminReindex: (id: string) => endpoint(`/v1/products/admin/reindex/${id}`),
    adminSync: endpoint("/v1/products/admin/sync"),
    adminCacheClear: endpoint("/v1/products/admin/cache/clear"),
    pricing: {
      markupRules: endpoint("/v1/products/pricing/markup-rules"),
      markupRule: (id: string) =>
        endpoint(`/v1/products/pricing/markup-rules/${id}`),
      markupPreview: endpoint("/v1/products/pricing/markup-rules/preview"),
      markupApply: endpoint("/v1/products/pricing/markup-rules/apply"),
      // Deactivates the rule AND resets every price in its scope to base.
      cancelMarkupRule: (ruleId: string) =>
        endpoint(`/v1/products/pricing/markup-rules/${ruleId}/cancel`),
      // Resets prices to base but leaves the rule active (it will re-apply).
      resetMarkupRule: (ruleId: string) =>
        endpoint(`/v1/products/pricing/markup-rules/${ruleId}/reset`),
      // Resets a category (optionally one brand) to base — no rule required.
      resetCategory: endpoint("/v1/products/pricing/reset-category"),
    },
  },
  chat: {
    // Staff live-chat inbox + internal staff room (Socket.IO for the live path;
    // these REST endpoints seed initial history).
    conversations: endpoint("/v1/chat/conversations"),
    conversation: (id: string) => endpoint(`/v1/chat/conversations/${id}`),
    conversationNotes: (id: string) =>
      endpoint(`/v1/chat/conversations/${id}/notes`),
    // Super-admin reassign — hand a chat to another agent (PATCH, body {staffId}).
    conversationAssign: (id: string) =>
      endpoint(`/v1/chat/conversations/${id}/assign`),
    // AI stop/resume (PATCH, body {aiState: 'OFF' | 'HANDLING'}). Any staff
    // member, does not claim (ticket A5).
    conversationAi: (id: string) => endpoint(`/v1/chat/conversations/${id}/ai`),
    staffRoomHistory: endpoint("/v1/chat/staffroom/history"),
  },
  // Staff-notification feed (ticket A6) — the generic REST surface behind the
  // topbar bell. `staffAuth`/`chat`/`whatsapp` above are per-feature; this one
  // spans every notification type the backend emits (`StaffNotification`).
  staffNotifications: {
    list: endpoint("/v1/staff/notifications"),
    unreadCount: endpoint("/v1/staff/notifications/unread-count"),
    readAll: endpoint("/v1/staff/notifications/read-all"),
    read: (id: string) => endpoint(`/v1/staff/notifications/${id}/read`),
    detail: (id: string) => endpoint(`/v1/staff/notifications/${id}`),
  },
  admin: {
    dashboard: endpoint("/v1/admin/dashboard"),
    dashboardKpis: endpoint("/v1/admin/dashboard/kpis"),
    staffDashboard: (staffId: string) =>
      endpoint(`/v1/staff/${staffId}/dashboard`),
    // SUPER_ADMIN time-series analytics that back the dashboard charts.
    analytics: {
      revenue: endpoint("/v1/admin/analytics/revenue"),
      orders: endpoint("/v1/admin/analytics/orders"),
      products: endpoint("/v1/admin/analytics/products"),
      customers: endpoint("/v1/admin/analytics/customers"),
    },
  },
  adminCheckout: {
    bankAccounts: {
      base: endpoint("/v1/checkout/admin/bank-accounts"),
      fallback: endpoint("/v1/admin/checkout/bank-accounts"),
      id: (id: string) => endpoint(`/v1/checkout/admin/bank-accounts/${id}`),
      fallbackId: (id: string) =>
        endpoint(`/v1/admin/checkout/bank-accounts/${id}`),
    },
    stats: {
      base: endpoint("/v1/checkout/admin/stats"),
      fallback: endpoint("/v1/admin/checkout/stats"),
    },
    orders: {
      base: endpoint("/v1/checkout/admin/orders"),
      fallback: endpoint("/v1/admin/checkout/orders"),
      id: (id: string) => endpoint(`/v1/checkout/admin/orders/${id}`),
      fallbackId: (id: string) => endpoint(`/v1/admin/checkout/orders/${id}`),
      validate: (id: string) =>
        endpoint(`/v1/checkout/admin/orders/${id}/validate-payment`),
      fallbackValidate: (id: string) =>
        endpoint(`/v1/admin/checkout/orders/${id}/validate-payment`),
      reject: (id: string) =>
        endpoint(`/v1/checkout/admin/orders/${id}/reject-payment`),
      fallbackReject: (id: string) =>
        endpoint(`/v1/admin/checkout/orders/${id}/reject-payment`),
      status: (id: string) =>
        endpoint(`/v1/checkout/admin/orders/${id}/status`),
      fallbackStatus: (id: string) =>
        endpoint(`/v1/admin/checkout/orders/${id}/status`),
      cancel: (id: string) => endpoint(`/v1/orders/${id}/cancel`),
    },
  },
  // Main order module (`order` — the gateway/online-payment flow, `orders`
  // table). Separate from `adminCheckout` above, which is the legacy manual
  // bank-transfer flow (`manual_orders`). The admin Orders list unifies both.
  // These resolve by the order's DB `id` (formatOrder.id), not `orderNumber`.
  gatewayOrders: {
    list: endpoint("/v1/orders"),
    detail: (id: string) => endpoint(`/v1/orders/${id}`),
    history: (id: string) => endpoint(`/v1/orders/${id}/history`),
    status: (id: string) => endpoint(`/v1/orders/${id}/status`),
    cancel: (id: string) => endpoint(`/v1/orders/${id}/cancel`),
  },
  // Combined orders list — merges gateway (`orders`) and manual (`manual_orders`)
  // into one backend-paginated, filterable list (requires orders:read). Replaces
  // the old client-side merge; normalizes customer + payment status across both.
  allOrders: endpoint("/v1/all-orders"),
  invoice: {
    dashboard: endpoint("/v1/invoice/dashboard"),
    staffWorkload: endpoint("/v1/invoice/staff-workload"),
    list: endpoint("/v1/invoice"),
    pendingReview: endpoint("/v1/invoice/pending-review"),
    rejected: endpoint("/v1/invoice/rejected"),
    generate: (orderId: string) => endpoint(`/v1/invoice/generate/${orderId}`),
    byOrder: (orderId: string) => endpoint(`/v1/invoice/order/${orderId}`),
    byCustomer: (customerId: string) =>
      endpoint(`/v1/invoice/customer/${customerId}`),
    detail: (invoiceId: string) => endpoint(`/v1/invoice/${invoiceId}`),
    refundItems: (invoiceId: string) =>
      endpoint(`/v1/invoice/${invoiceId}/refund-items`),
    claim: (invoiceId: string) => endpoint(`/v1/invoice/${invoiceId}/claim`),
    unclaim: (invoiceId: string) =>
      endpoint(`/v1/invoice/${invoiceId}/unclaim`),
    reassign: (invoiceId: string) =>
      endpoint(`/v1/invoice/${invoiceId}/reassign`),
    submitReview: (invoiceId: string) =>
      endpoint(`/v1/invoice/${invoiceId}/submit-review`),
    refund: (invoiceId: string) => endpoint(`/v1/invoice/${invoiceId}/refund`),
    confirmRefund: (invoiceId: string) =>
      endpoint(`/v1/invoice/${invoiceId}/confirm-refund`),
    manual: {
      base: endpoint("/v1/invoice/manual"),
      detail: (manualInvoiceId: string) =>
        endpoint(`/v1/invoice/manual/${manualInvoiceId}`),
      cancel: (manualInvoiceId: string) =>
        endpoint(`/v1/invoice/manual/${manualInvoiceId}/cancel`),
    },
  },
  customerMgt: {
    base: endpoint("/v1/admin/customers"),
    detail: (id: string) => endpoint(`/v1/admin/customers/${id}`),
    analytics: endpoint("/v1/admin/analytics/customers"),
  },
  // Upload analytics + per-staff daily upload targets.
  analytics: {
    uploaders: endpoint("/v1/analytics/uploaders"),
    targets: endpoint("/v1/analytics/targets"),
    target: (staffId: string) => endpoint(`/v1/analytics/targets/${staffId}`),
  },
  // Store tax: the global setting (master switch + fallback rate) plus scoped
  // product/part tax rules. Rule endpoints resolve by the rule's DB `id` (UUID),
  // not the human `TAX-XXXXXXXX`. All writes require `tax:manage`.
  tax: {
    setting: endpoint("/v1/tax"),
    rules: endpoint("/v1/tax/rules"),
    rule: (id: string) => endpoint(`/v1/tax/rules/${id}`),
    partRules: endpoint("/v1/tax/part-rules"),
    partRule: (id: string) => endpoint(`/v1/tax/part-rules/${id}`),
  },
  // Promotions — content-creator-managed homepage banner carousel (Socials
  // nav route). `promotions:write` covers create/update/slides, `:publish`
  // covers publish/archive, `:delete` covers the delete endpoint.
  promotions: {
    base: endpoint("/v1/promotions"),
    detail: (id: string) => endpoint(`/v1/promotions/${id}`),
    publish: (id: string) => endpoint(`/v1/promotions/${id}/publish`),
    archive: (id: string) => endpoint(`/v1/promotions/${id}/archive`),
    slides: (id: string) => endpoint(`/v1/promotions/${id}/slides`),
    slide: (id: string, slideId: string) =>
      endpoint(`/v1/promotions/${id}/slides/${slideId}`),
  },
  // Monitor — request/error/anomaly log viewer over the backend's own Mongo
  // logging DB. Every route requires SUPER_ADMIN (backend-enforced, not an
  // RBAC permission group — same reasoning as `payments`), and 503s if that
  // Mongo connection is down, independent of the primary DB's health.
  monitor: {
    requests: endpoint("/v1/monitor/requests"),
    request: (requestId: string) =>
      endpoint(`/v1/monitor/requests/${requestId}`),
    stats: endpoint("/v1/monitor/stats"),
    errors: endpoint("/v1/monitor/errors"),
    slow: endpoint("/v1/monitor/slow"),
    anomalies: endpoint("/v1/monitor/anomalies"),
  },
  // WhatsApp inbox — a module parallel to live chat, never shared with it: its
  // own presence pool, queue, and socket events. Path `:id` is the
  // conversation's DB UUID, not the human `conversationId`.
  whatsapp: {
    conversations: endpoint("/v1/whatsapp/conversations"),
    // Declared before `conversation(id)` on the backend so "queue" isn't
    // captured as an id — keep the same mental order here.
    queue: endpoint("/v1/whatsapp/conversations/queue"),
    conversation: (id: string) => endpoint(`/v1/whatsapp/conversations/${id}`),
    messages: (id: string) =>
      endpoint(`/v1/whatsapp/conversations/${id}/messages`),
    assignSelf: (id: string) =>
      endpoint(`/v1/whatsapp/conversations/${id}/assign-self`),
    // SUPER_ADMIN reassign (PATCH, body {staffId}) — the only way an
    // already-owned conversation changes hands.
    assign: (id: string) => endpoint(`/v1/whatsapp/conversations/${id}/assign`),
    resolve: (id: string) =>
      endpoint(`/v1/whatsapp/conversations/${id}/resolve`),
    // AI stop/resume (PATCH, body {aiState: 'OFF' | 'HANDLING'}). Any staff
    // member, does not claim (ticket A5).
    conversationAi: (id: string) =>
      endpoint(`/v1/whatsapp/conversations/${id}/ai`),
    presenceOnline: endpoint("/v1/whatsapp/presence/online"),
    presenceOffline: endpoint("/v1/whatsapp/presence/offline"),
    presenceHeartbeat: endpoint("/v1/whatsapp/presence/heartbeat"),
    presenceMe: endpoint("/v1/whatsapp/presence/me"),
  },
  // Payment reliability + admin transactions surface (PAYMENTS-BACKEND-CONTRACT.md,
  // all 7 asks landed 2026-07-31 per BACKEND-CONTRACT-DELTA). `/admin/transactions*`
  // requires SUPER_ADMIN; the `/payments/*` reads are staff-level and the
  // mutations (replay, webhook register/resend, refund) are SUPER_ADMIN — see
  // `lib/auth/permissions.ts`'s `superAdminOnly` nav gate, which covers the whole
  // section rather than splitting it (contract delta §5.2).
  adminTransactions: {
    list: endpoint("/v1/admin/transactions"),
    detail: (paymentId: string) =>
      endpoint(`/v1/admin/transactions/${paymentId}`),
  },
  payments: {
    // Double-submit CSRF token for state-changing `/payments/*` calls (the
    // domainGuard/CSRF stack wraps the whole payments router, not just the
    // public checkout endpoints — see the customer app's payments.service.ts
    // for the pattern this mirrors). Requires the app to run over HTTPS
    // (`npm run dev:https` locally) since the paired cookie is `Secure`.
    csrfToken: endpoint("/v1/payments/csrf-token"),
    dlq: endpoint("/v1/payments/dlq"),
    dlqReplay: (id: string) => endpoint(`/v1/payments/dlq/${id}/replay`),
    refund: endpoint("/v1/payments/refund"),
    circuitHealth: endpoint("/v1/payments/health/circuit"),
    midenWebhooks: endpoint("/v1/payments/miden/webhooks"),
    midenWebhooksResend: endpoint("/v1/payments/miden/webhooks/resend"),
    midenLookup: (reference: string) =>
      endpoint(`/v1/payments/miden/lookup/${reference}`),
  },
} as const;
