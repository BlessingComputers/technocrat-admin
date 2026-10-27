import type { TrafficReport } from "../types/traffic";

/**
 * People who reached each shopping step in the period. Counted per step, not
 * as one strict sequence: someone who added to cart last week and ordered
 * today counts at both steps, so read it as reach, not a drop-off trace.
 */
export function TrafficFunnel({ steps }: { steps: TrafficReport["funnel"] }) {
  const top = steps[0]?.people ?? 0;
  if (top === 0) {
    return <p className="py-6 text-center text-xs font-medium text-muted-foreground">No product views in this period</p>;
  }

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const prev = i === 0 ? null : steps[i - 1].people;
        const fromPrev = prev ? Math.round((step.people / prev) * 100) : null;
        return (
          <li key={step.step} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">{step.step}</span>
              <span className="flex items-baseline gap-2">
                {fromPrev !== null && (
                  <span className="text-xs text-muted-foreground tabular-nums">{fromPrev}% of previous</span>
                )}
                <span className="font-mono font-medium tabular-nums text-foreground">{step.people.toLocaleString()}</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${Math.max((step.people / top) * 100, step.people > 0 ? 2 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
