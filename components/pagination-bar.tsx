"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageMeta } from "@/lib/types";

/** Page numbers with ellipses: 1 … 4 5 6 … 20 */
function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const box =
  "grid size-10 place-items-center rounded-[4px] border border-warn text-base font-medium text-title transition-all duration-200";

export function PaginationBar({ meta, onPageChange, className }: { meta?: PageMeta; onPageChange: (p: number) => void; className?: string }) {
  if (!meta) return null;
  const { page, totalPages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4 px-6 py-5", className)}>
      <p className="text-base font-medium text-subtitle">
        Showing {from} to {to} of {total} results
      </p>
      {totalPages > 1 && (
        <nav className="flex items-center gap-2" aria-label="Pagination">
          <button
            type="button"
            className={cn(box, "bg-muted hover:bg-warn-soft disabled:opacity-40")}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-[18px]" />
          </button>
          {pages(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className={cn(box, "cursor-default")}>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  box,
                  p === page
                    ? "scale-105 border-brand bg-brand text-white shadow-sm shadow-brand/30"
                    : "hover:-translate-y-0.5 hover:bg-warn-soft",
                )}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className={cn(box, "hover:bg-warn-soft disabled:opacity-40")}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRightIcon className="size-[18px]" />
          </button>
        </nav>
      )}
    </div>
  );
}
