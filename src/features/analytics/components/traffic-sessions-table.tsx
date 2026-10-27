import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TrafficSession } from "../types/traffic";

// Rendered on the server, whose clock is UTC on Vercel; the store runs on Lagos time.
const TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function duration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return m < 60 ? `${m}m ${seconds % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** The latest sessions, each linking to its visitor and, when one was recorded, its replay in PostHog. */
export function TrafficSessionsTable({
  sessions,
  personUrl,
  replayUrl,
}: {
  sessions: TrafficSession[];
  /** PostHog person URL prefix; the distinct id is appended. */
  personUrl: string;
  /** PostHog replay URL prefix; the session id is appended. */
  replayUrl: string;
}) {
  if (sessions.length === 0) {
    return <p className="py-6 text-center text-xs font-medium text-muted-foreground">No sessions in this period</p>;
  }

  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5 sm:pl-6">Visitor</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Landed on</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Device</TableHead>
            <TableHead className="text-right">Pages</TableHead>
            <TableHead className="text-right">Time</TableHead>
            <TableHead className="pr-5 text-right sm:pr-6">
              <span className="sr-only">Links</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow key={s.sessionId}>
              <TableCell className="pl-5 sm:pl-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {s.name ?? (s.identified ? "Customer" : "Anonymous")}
                  </span>
                  {s.orders > 0 && <Badge variant="success">Ordered</Badge>}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                {TIME.format(new Date(s.startedAt))}
              </TableCell>
              <TableCell className="max-w-[16rem] truncate font-mono text-xs" title={s.entryPath}>
                {s.entryPath}
              </TableCell>
              <TableCell className="whitespace-nowrap">{s.channel}</TableCell>
              <TableCell className="whitespace-nowrap">{s.location}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{s.device}</TableCell>
              <TableCell className="text-right tabular-nums">{s.pageviews}</TableCell>
              <TableCell className="text-right tabular-nums">{duration(s.durationSeconds)}</TableCell>
              <TableCell className="pr-5 sm:pr-6">
                <div className="flex justify-end gap-1">
                  {s.hasReplay && (
                    <a
                      href={replayUrl + encodeURIComponent(s.sessionId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Watch replay in PostHog"
                      title="Watch replay in PostHog"
                    >
                      <AppIcon icon="solar:play-circle-linear" className="size-4" />
                    </a>
                  )}
                  <a
                    href={personUrl + encodeURIComponent(s.distinctId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Open visitor in PostHog"
                    title="Open visitor in PostHog"
                  >
                    <AppIcon icon="solar:user-linear" className="size-4" />
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
