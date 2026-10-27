import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { SplashScreen } from "@/components/app/splash-screen";

// Everything below is gated on the client-side session check (splash until /auth/me resolves),
// so there's no static shell to validate for instant navigation.
export const instant = false;

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<SplashScreen />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
