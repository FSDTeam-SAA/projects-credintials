"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

const noop = () => () => {};
/** false during SSR / hydration, true afterwards (theme is only known on the client). */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** setTheme wrapped in a View Transition, so the whole UI cross-fades instead of snapping. */
export function useThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  function change(next: string) {
    if (next === theme) return;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(next);
      return;
    }
    doc.startViewTransition(() => flushSync(() => setTheme(next)));
  }
  return { theme, resolvedTheme, change };
}

export function ThemeToggle({ className }: { className?: string }) {
  const mounted = useMounted();
  const { theme, resolvedTheme, change } = useThemeSwitch();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative rounded-full", className)} aria-label="Change theme">
          <SunIcon className={cn("size-5! transition-all duration-500", isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0")} />
          <MoonIcon
            className={cn("absolute size-5! transition-all duration-500", isDark ? "scale-100 rotate-0" : "scale-0 rotate-90 opacity-0")}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => change(value)}>
            <Icon /> {label}
            {mounted && theme === value && <CheckIcon className="ml-auto text-brand" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
