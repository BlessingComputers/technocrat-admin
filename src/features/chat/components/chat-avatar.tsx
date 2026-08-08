import { cn } from "@/lib/utils/cn";
import { avatarColorClass, getInitials } from "../utils/chat-format";

interface ChatAvatarProps {
  /** Display name; may be missing at runtime (hand-typed chat payloads). */
  name?: string | null;
  /** Stable seed for the colour — defaults to the name. */
  seed?: string | null;
  /** Optional profile image; rendered over the initials, which show through if it fails. */
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ChatAvatarProps["size"]>, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
  xl: "size-24 text-3xl",
};

/** Initials avatar with a deterministic tint (design uses coloured circles). */
export function ChatAvatar({
  name,
  seed,
  avatarUrl,
  size = "md",
  className,
}: ChatAvatarProps) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        avatarColorClass(seed ?? name),
        SIZE_CLASSES[size],
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
      {avatarUrl && (
        // Overlaid on the initials so a broken/slow image degrades to initials
        // without any client-side error state. Plain <img> (not next/image) —
        // arbitrary provider URLs, and it's a tiny fixed-size avatar.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="absolute inset-0 size-full rounded-full object-cover"
        />
      )}
    </span>
  );
}
