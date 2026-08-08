import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared loading skeletons for the users / RBAC feature. Server-safe (no
 * "use client") so the tabs, the `RbacTabs` Suspense fallback, and the route
 * `loading.tsx` all render identical markup.
 */

/** Toolbar + grouped permission cards (default RBAC tab). */
export function PermissionsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Skeleton className="h-10 w-full rounded-lg sm:w-80" />
        <Skeleton className="h-10 w-full rounded-lg sm:w-40" />
      </div>
      {[0, 1].map((group) => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Header + grid of role cards (Roles tab). */
export function RolesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Rows shown while the staff query loads (rendered inside the staff table cell). */
export function StaffRowsSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Full RBAC shell: the three-tab strip + the default (Permissions) tab content.
 * Used by the `RbacTabs` Suspense fallback and the `/users` route `loading.tsx`
 * so the two are identical.
 */
export function RbacTabsSkeleton() {
  return (
    <div className="w-full">
      <div className="mb-8 grid w-full max-w-md grid-cols-3 gap-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>
      <PermissionsListSkeleton />
    </div>
  );
}
