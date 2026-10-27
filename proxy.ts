import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = process.env.SESSION_COOKIE ?? "pm_session";
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password"];

/**
 * Optimistic redirects only: checks whether a session cookie exists.
 * The API validates the session on every request, and the app shell handles 401s.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (!hasSession && !isAuthPage) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (hasSession && (isAuthPage || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:png|jpg|svg|ico|webp)$).*)"],
};
