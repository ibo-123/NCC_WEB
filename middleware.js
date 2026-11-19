import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "ncc_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/announcements",
  "/notifications",
  "/lectures",
  "/attendance",
  "/progress",
  "/problems",
  "/contests",
  "/results",
  "/teams",
  "/team-contests",
  "/team-results",
  "/team-streak",
  "/rating",
  "/streak",
  "/profile",
  "/admin",
];

/**
 * Edge middleware checks cookie presence only (MASTER_ARCHITECTURE.md §7.2).
 * Full session validation, role, status, and 2FA gating happen in Node runtime.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/restricted" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
