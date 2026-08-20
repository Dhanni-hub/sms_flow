import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "smsflow_session";

const protectedPrefixes = [
  "/dashboard",
  "/send",
  "/messages",
  "/contacts",
  "/groups",
  "/sender-ids",
  "/templates",
  "/campaigns",
  "/analytics",
  "/billing",
  "/wallet",
  "/settings",
  "/profile",
  "/search",
  "/developer",
  "/notifications",
];

const authPrefixes = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && authPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/send/:path*",
    "/messages/:path*",
    "/contacts/:path*",
    "/groups/:path*",
    "/sender-ids/:path*",
    "/templates/:path*",
    "/campaigns/:path*",
    "/analytics/:path*",
    "/billing/:path*",
    "/wallet/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/search/:path*",
    "/developer/:path*",
    "/notifications/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
