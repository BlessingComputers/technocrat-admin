import { Badge } from "@/components/ui/badge";
import { formatDuration } from "../../utils/monitor-utils";
import type { MonitorStats } from "../../types/monitor";

interface TopSlowRoutesListProps {
  variant: "slow";
  rows: MonitorStats["topSlowRoutes"];
}
interface TopErrorRoutesListProps {
  variant: "error";
  rows: MonitorStats["topErrorRoutes"];
}

interface Row {
  key: string;
  method: string;
  route: string;
  subtitle: string;
  trailing: string;
}

/** Ranked route list shared by the "Top slow routes" and "Top error-prone
 * routes" cards on the stats view — same row shell, different trailing stat.
 * Resolved to a common `Row` shape up front so the union of the two backend
 * shapes (`topSlowRoutes` vs `topErrorRoutes`) doesn't need narrowing per
 * item inside the JSX. */
export function TopRoutesList(
  props: TopSlowRoutesListProps | TopErrorRoutesListProps,
) {
  const rows: Row[] =
    props.variant === "slow"
      ? props.rows.map((r, i) => ({
          key: `${r.method}-${r.route}-${i}`,
          method: r.method,
          route: r.route,
          subtitle: `${r.count} requests · ${r.errorCount} errors`,
          trailing: formatDuration(r.avgDuration),
        }))
      : props.rows.map((r, i) => ({
          key: `${r.method}-${r.route}-${i}`,
          method: r.method,
          route: r.route,
          subtitle: `Last seen ${new Date(r.lastSeen).toLocaleString()}`,
          trailing: `${r.errorCount} errors`,
        }));

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing to show for this window
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="muted" className="font-mono text-xs">
                {row.method}
              </Badge>
              <span className="truncate text-sm font-medium text-foreground">
                {row.route}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{row.subtitle}</p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {row.trailing}
          </span>
        </li>
      ))}
    </ul>
  );
}
