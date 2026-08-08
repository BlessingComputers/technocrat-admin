import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

interface ManualFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

/** Labeled text input shared across the manual-invoice form sections. */
export function ManualField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  optional,
  className,
}: ManualFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
        {label}
        {required && <span className="text-destructive"> *</span>}
        {optional && (
          <span className="text-muted-foreground/60"> (optional)</span>
        )}
      </Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-lg bg-muted/50 border-border font-bold focus:bg-card transition-all"
      />
    </div>
  );
}
