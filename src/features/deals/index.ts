// Public API of the deals feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

// `/pricing/deals` (and `?deal=<id>`): grouped list and the selected deal.
export { DealsWorkspace } from "./components/deals-workspace";

// `/pricing/deals/new`: create a draft.
export { DealFormView } from "./components/deal-form-view";
