// Public API of the hunts feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

// `/pricing/hunts` (and `?campaign=<id>`): grouped list and the selected campaign.
export { HuntsWorkspace } from "./components/hunts-workspace";

// `/pricing/hunts/new` and `/pricing/hunts/[id]/edit`: the campaign form.
export { HuntFormView } from "./components/hunt-form-view";

// `/pricing/hunts/[id]/release/[huntDealId]`: take a drop back from its holder.
export { HuntReleaseView } from "./components/hunt-release-view";
