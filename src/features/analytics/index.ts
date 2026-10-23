// Public API of the analytics feature (Dashboard + Analytics — ADR-0002).
// Views consumed by the (staff) route pages:
export { DashboardView } from "./components/dashboard-view";
// Server component: reads PostHog with a secret key (`api/traffic.server.ts`).
export { TrafficPage } from "./components/traffic-page";
export { CampaignLinksPage } from "./components/campaign-links-page";
export { DashboardSkeleton } from "./components/dashboard-skeleton";
export { UploaderManagementView } from "./components/uploader-management-view";
export { UploaderDetailView } from "./components/uploader-detail-view";
