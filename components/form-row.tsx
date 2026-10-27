import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Label + control + animated error message, matching the Figma field layout. */
export function FormRow({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  labelClassName,
  children,
  action,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} data-invalid={!!error || undefined}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className={cn("text-base font-medium text-foreground", labelClassName)}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        {action}
      </div>
      {children}
      {error ? (
        <p role="alert" className="animate-fade-in text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-subtitle">{hint}</p>
      )}
    </div>
  );
}

/** Input with a leading icon (login/forgot-password screens). */
export function IconInput({ icon, className, ...props }: React.ComponentProps<typeof Input> & { icon: React.ReactNode }) {
  return (
    <div className="group relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-muted-foreground transition-colors group-focus-within:text-brand [&_svg]:size-5">
        {icon}
      </span>
      <Input className={cn("pl-11", className)} {...props} />
    </div>
  );
}
