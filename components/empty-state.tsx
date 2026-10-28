import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex animate-fade-up flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand [&_svg]:size-5">{icon}</div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-title">{title}</p>
        {description && <p className="max-w-sm text-sm text-subtitle">{description}</p>}
      </div>
      {action}
    </div>
  );
}
