import { cn } from "@/lib/utils/cn";

const baseStyles = "space-y-8";

export default function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn(baseStyles, className)}>{children}</section>;
}
