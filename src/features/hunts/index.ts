// Public API of the hunts feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

// `/pricing/hunts`: every campaign.
export { HuntsListView } from "./components/hunts-list-view";

// `/pricing/hunts/[id]`: the schedule, the live monitor, and the winners.
export { HuntDetailView } from "./components/hunt-detail-view";

// `/pricing/hunts/new` and `/pricing/hunts/[id]/edit`: the campaign form.
export { HuntFormView } from "./components/hunt-form-view";
