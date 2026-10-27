import Image from "next/image";
import { cn } from "@/lib/utils";

/** Brand logo; swaps to a light-lettered variant in dark mode (logo-dark.png). */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("inline-block w-40 select-none", className)}>
      <Image src="/logo.png" alt="SCALEUP" width={1322} height={532} priority={priority} className="h-auto w-full dark:hidden" />
      <Image src="/logo-dark.png" alt="SCALEUP" width={1322} height={532} priority={priority} className="hidden h-auto w-full dark:block" />
    </span>
  );
}
