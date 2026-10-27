import { Logo } from "@/components/brand/logo";

/** Full-screen brand splash shown while the session is being checked (Figma: "splash screen"). */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <Logo priority className="w-56 animate-pop md:w-72" />
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-[splash-bar_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand to-warn" />
        </div>
      </div>
    </div>
  );
}
