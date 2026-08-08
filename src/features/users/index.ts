// Public API of the users feature (RBAC: permissions, roles, staff — the
// `users` resource, ADR-0002). Export ONLY what routes/other layers need.
export { UsersView } from "./components/users-view";
export { RbacTabsSkeleton } from "./components/users-skeletons";
