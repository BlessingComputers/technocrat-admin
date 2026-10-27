// Public API of the deals feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

// `/pricing/deals` — the list.
export { DealsListView } from "./components/deals-list-view";

// `/pricing/deals/new` — create a draft.
export { DealFormView } from "./components/deal-form-view";

// `/pricing/deals/[id]` — one deal, plus start and end.
export { DealDetailView } from "./components/deal-detail-view";
