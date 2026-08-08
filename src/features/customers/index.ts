// Public API of the customers feature (the `customerMgt` resource:
// GET /v1/admin/customers, /:id, /analytics/customers).
export { default as CustomersListView } from "./components/customer-list-view";
export { CustomerDetailView } from "./components/customer-detail-view";
export {
  CustomersTableSkeleton,
  CustomerDetailSkeleton,
} from "./components/customers-skeletons";
