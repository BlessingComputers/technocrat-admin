import { cn } from "@/lib/utils/cn";
import { railPoint, railSpan, railTicks, type RailRange } from "@/lib/utils/time-rail";

export interface RailMarker {
  at: number;
  /** Tone classes for the 12px square, from the caller's state map. */
  className: string;
}

interface TimeRailProps {
  range: RailRange;
  start: number;
  /** null = no end time; the span runs to the right edge with no end tick. */
  end: number | null;
  now: number;
  /** Not started yet: one pale span, no Now dot. */
  upcoming?: boolean;
  markers?: RailMarker[];
  /** The whole rail as one sentence for screen readers. */
  label: string;
  className?: string;
}

/**
 * The thin time rail (spec decision 4): used time solid, time left pale, a Now
 * dot, an end tick. Nothing is written on it; callers put labels beside it.
 */
export function TimeRail({
  range,
  start,
  end,
  now,
  upcoming = false,
  markers,
  label,
  className,
}: TimeRailProps) {
  const span = railSpan(start, end, range);
  const nowAt = railPoint(now, range);

  let used = 0;
  if (span && !upcoming) {
    used =
      nowAt === null
        ? now > range.end
          ? span.width
          : 0
        : Math.min(Math.max(nowAt - span.left, 0), span.width);
  }

  return (
    <div role="img" aria-label={label} className={cn("relative h-[22px]", className)}>
      <div className="absolute inset-x-0 top-[10px] h-0.5 rounded-full bg-muted" />
      {span && (
        <>
          {upcoming ? (
            <div
              className="absolute top-[9px] h-1 rounded-full bg-info/35"
              style={{ left: `${span.left}%`, width: `${span.width}%` }}
            />
          ) : (
            <>
              <div
                className="absolute top-[9px] h-1 rounded-full bg-info/25"
                style={{ left: `${span.left}%`, width: `${span.width}%` }}
              />
              <div
                className="absolute top-[9px] h-1 rounded-full bg-info"
                style={{ left: `${span.left}%`, width: `${used}%` }}
              />
            </>
          )}
          {!span.clippedEnd && (
            <div
              className="absolute top-[7px] h-2 w-0.5 -translate-x-1/2 rounded-full bg-info"
              style={{ left: `${span.left + span.width}%` }}
            />
          )}
        </>
      )}
      {markers?.map((m, i) => {
        const at = railPoint(m.at, range);
        return at === null ? null : (
          <div
            key={`${m.at}-${i}`}
            aria-hidden
            className={cn("absolute top-[5px] size-3 -translate-x-1/2 rounded-[3px]", m.className)}
            style={{ left: `${at}%` }}
          />
        );
      })}
      {!upcoming && nowAt !== null && (
        <div
          aria-hidden
          className="absolute top-[5px] size-3 -translate-x-1/2 rounded-full border-[3px] border-primary bg-card"
          style={{ left: `${nowAt}%` }}
        />
      )}
    </div>
  );
}

/** Tick labels under or over a rail, spread edge to edge. */
export function RailAxis({
  range,
  count,
  format,
  className,
}: {
  range: RailRange;
  count: number;
  format: (t: number) => string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("flex justify-between text-xs text-muted-foreground tabular-nums", className)}
    >
      {railTicks(range, count).map((t) => (
        <span key={t}>{format(t)}</span>
      ))}
    </div>
  );
}
