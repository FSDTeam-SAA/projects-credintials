import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Soft brand glows */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[480px] rounded-full bg-brand/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-40 -bottom-40 size-[480px] rounded-full bg-warn/10 blur-3xl" />

      <ThemeToggle className="absolute top-4 right-4 animate-fade-in" />

      {/* Each page sets its own max width (login is narrow, registration is wide). */}
      <div className="relative flex w-full flex-col items-center gap-8">
        <Logo priority className="w-56 animate-pop md:w-[260px]" />
        <div className="flex w-full animate-fade-up justify-center [animation-delay:80ms]">{children}</div>
      </div>
    </main>
  );
}
