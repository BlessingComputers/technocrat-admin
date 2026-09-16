// Public API of the pre-orders feature (the admin `preorders` resource:
// GET /v1/admin/preorders, /:id, PATCH /:id/status).
export { default as PreorderListView } from "./components/preorder-list-view";
export { PreorderDetailView } from "./components/preorder-detail-view";
export {
  PreordersTableSkeleton,
  PreorderDetailSkeleton,
} from "./components/preorders-skeletons";
