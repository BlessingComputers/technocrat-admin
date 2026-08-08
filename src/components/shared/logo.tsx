import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import logo from "../../../public/assets/logo.png";
import icon from "../../app/icon.png";

interface LogoProps {
  /** Classes for the link wrapper. */
  className?: string;
  /**
   * Classes for the image itself — use this to constrain sizing (e.g. a fixed
   * height in the header). Merged over the variant default via `cn`, so
   * `h-8 w-auto` overrides the default `w-full h-auto`.
   */
  imageClassName?: string;
  href?: string;
  variant?: "full" | "icon";
}

export function Logo({
  className,
  imageClassName,
  href,
  variant = "full",
}: LogoProps) {
  const logoSrc = variant === "icon" ? icon : logo;
  const logoClass =
    variant === "icon" ? "w-8 h-8 object-contain" : "w-full h-auto";

  return (
    <Link href={href || "/"} className={cn("flex items-center gap-2", className)}>
      <Image
        src={logoSrc}
        alt="Blessing Online Stores Logo"
        loading="eager"
        className={cn(logoClass, imageClassName)}
      />
    </Link>
  );
}
