/**
 * Legal: the checkout policy registry.
 *
 * Named for the job (legal policies) while the API layer keeps the backend's
 * own noun (`/v1/policy/*`, the RBAC `policy` group), so the contract stays
 * greppable from either end.
 */
export { LegalWorkspaceView } from "./components/legal-workspace-view";
export { policyKeys } from "./api/policy.queries";
export type { PolicyVersion } from "./types/policy";
