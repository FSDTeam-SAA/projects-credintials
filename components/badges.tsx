import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/format";
import type { Environment, Role } from "@/lib/types";

type Tone = "green" | "yellow" | "blue" | "violet" | "red" | "gray";

const toneClass: Record<Tone, string> = {
  green: "bg-brand/10 text-brand",
  yellow: "bg-warn/10 text-warn-text",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  red: "bg-destructive/10 text-destructive",
  gray: "bg-muted text-muted-foreground",
};

export function Pill({ tone = "gray", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs leading-none whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const serviceTone: Record<string, Tone> = {
  App: "green",
  FSD: "yellow",
  Both: "blue",
};

export function ServiceLineBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Pill tone={serviceTone[value] ?? "gray"} className={className}>
      {value}
    </Pill>
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const tone: Record<Role, Tone> = { admin: "violet", operation: "green", sales: "yellow" };
  return (
    <Pill tone={tone[role]} className={className}>
      {roleLabel[role]}
    </Pill>
  );
}

const envTone: Record<Environment, Tone> = { production: "green", staging: "yellow", development: "blue" };

export function EnvBadge({ env, className }: { env: Environment; className?: string }) {
  return (
    <Pill tone={envTone[env]} className={cn("px-2 py-0.5 text-xs capitalize", className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {env}
    </Pill>
  );
}
