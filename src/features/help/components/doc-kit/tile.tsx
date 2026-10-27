import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

/** Icon-chip tints available to a Tile. `primary`/`success` preserve the
 *  original two; `jewel`/`navy` extend the palette for newer guides.
 *  `jewel` is decorative only — never use it to signal state. */
const TILE_TONE = {
  primary: "bg-primary/10 text-primary-ink",
  success: "bg-success/15 text-success-ink",
  jewel: "bg-jewel/15 text-jewel-ink",
  navy: "bg-secondary/10 text-secondary-ink",
} as const;

/**
 * A compact "option" card: tinted icon chip, title, and a line of body. Used in
 * small grids to present a couple of parallel choices (e.g. two ways to do a task).
 */
export function Tile({
  icon,
  title,
  body,
  tone = "primary",
}: {
  icon: string;
  title: string;
  body: string;
  tone?: keyof typeof TILE_TONE;
}) {
  return (
    <Card className="p-5">
      <div
        className={cn(
          "mb-3 flex size-10 items-center justify-center rounded-lg",
          TILE_TONE[tone],
        )}
      >
        <AppIcon icon={icon} className="size-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </Card>
  );
}
