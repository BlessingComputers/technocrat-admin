import { cn } from "@/lib/utils/cn";

interface TypingIndicatorProps {
  className?: string;
  /** When set, the row reads "<name> is typing…" above the dots. */
  name?: string | null;
}

/** Animated three-dot "typing…" bubble, optionally labelled with the typer. */
export function TypingIndicator({ className, name }: TypingIndicatorProps) {
  return (
    <div
      className="flex w-fit flex-col gap-1"
      aria-label={name ? `${name} is typing` : "Typing"}
    >
      {name ? (
        <span className="px-1 text-xs text-muted-foreground">
          {name} is typing…
        </span>
      ) : null}
      <div
        className={cn(
          "flex w-fit items-center gap-1 rounded-2xl bg-muted px-4 py-3",
          className,
        )}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
