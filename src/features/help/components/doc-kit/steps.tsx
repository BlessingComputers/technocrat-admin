/**
 * A numbered, top-to-bottom sequence of steps with a connecting spine. Numbers
 * sit in a filled circle; the last step drops the connector.
 */
export function Steps({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <ol className="max-w-3xl space-y-0">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <span className="my-1 w-px flex-1 bg-border" />
            )}
          </div>
          <div className="pb-6">
            <p className="text-sm font-bold text-foreground">{step.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
