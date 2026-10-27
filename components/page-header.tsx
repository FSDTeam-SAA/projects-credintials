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
      <div className="flex items-start gap-4">
        {back && (
          <button
            type="button"
            onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
            className="mt-1 grid size-9 shrink-0 place-items-center rounded-full border-2 border-title text-title transition-all hover:-translate-x-0.5 hover:bg-title hover:text-background"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="size-4" strokeWidth={2.5} />
          </button>
        )}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-medium text-title md:text-[32px] md:leading-tight">{title}</h1>
          {description && <p className="text-sm text-title/80 md:text-base">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
