/**
 * Animated "Live Uncached" pill shown in the super-admin dashboard header.
 */
export function DashboardLiveBadge() {
  return (
    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/20 text-success rounded-full text-xs font-semibold tracking-wide uppercase">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      Live Uncached
    </div>
  );
}
