import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

/** Icon-chip tints available to a Tile. `primary`/`success` preserve the
 *  original two; `gold`/`navy` extend the palette for newer guides. */
const TILE_TONE = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  gold: "bg-gold/15 text-gold-foreground",
  navy: "bg-secondary/10 text-secondary",
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
    <Card className="rounded-xl border border-border p-5">
      <div
        className={cn(
          "mb-3 flex size-10 items-center justify-center rounded-lg",
          TILE_TONE[tone],
        )}
      >
        <AppIcon icon={icon} className="size-5" />
      </div>
      <h3 className="text-sm font-black text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </Card>
  );
}
