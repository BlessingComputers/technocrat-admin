/**
 * A term/definition reference table for "what each field means" sections. Two
 * columns: the field name and its plain-language meaning.
 */
export function FieldTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="max-w-3xl overflow-hidden rounded-xl border border-border">
      <dl className="divide-y divide-border">
        {rows.map(([term, def]) => (
          <div key={term} className="grid grid-cols-3 gap-4 bg-card px-4 py-3">
            <dt className="text-sm font-semibold text-foreground">{term}</dt>
            <dd className="col-span-2 text-sm text-muted-foreground">{def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
