// Public API of the coupons feature (the admin `coupons` resource:
// GET/POST /v1/admin/coupons, GET/PATCH /v1/admin/coupons/:id).
export { default as CouponsListView } from "./components/coupons-list-view";
export { CouponCreateView } from "./components/coupon-create-view";
export { CouponEditView } from "./components/coupon-edit-view";
export {
  CouponsStatusChipsSkeleton,
  CouponsTableSkeleton,
} from "./components/coupons-skeletons";
