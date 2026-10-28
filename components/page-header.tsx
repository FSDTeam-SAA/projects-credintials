"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  back,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** true = router.back(); string = navigate to that path */
  back?: boolean | string;
  actions?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <div className={cn("flex animate-fade-up flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {back && (
          <button
            type="button"
            onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
            className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border text-subtitle transition-colors hover:bg-muted hover:text-title focus-visible:outline-1 focus-visible:outline-ring"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="size-4" strokeWidth={2.5} />
          </button>
        )}
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-title sm:text-2xl sm:leading-tight">{title}</h1>
          {description && <p className="text-sm leading-relaxed text-subtitle">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
