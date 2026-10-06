/**
 * Chigir Ale - Next.js Middleware for Auth Route Protection
 * Spec: Sections 7.2 (Authorization — server-side enforcement)
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PATTERNS = [
  /^\/citizen/,
  /^\/authority/,
  /^\/admin/,
  /^\/dashboard/,
];

// Routes that authenticated users should not access (e.g. sign-in)
const AUTH_ONLY_PATTERNS = [
  /^\/auth\/sign-in/,
  /^\/auth\/sign-up/,
];

export default auth((req: NextRequest & { auth: { user?: { id?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Generate or preserve correlation request ID (Spec §87)
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  const isProtected = PROTECTED_PATTERNS.some((p) => p.test(pathname));
  const isAuthOnly = AUTH_ONLY_PATTERNS.some((p) => p.test(pathname));

  if (isProtected && !session?.user) {
    const signInUrl = new URL("/auth/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    const redirectRes = NextResponse.redirect(signInUrl);
    redirectRes.headers.set("x-request-id", requestId);
    return redirectRes;
  }

  if (isAuthOnly && session?.user) {
    const redirectRes = NextResponse.redirect(new URL("/", req.url));
    redirectRes.headers.set("x-request-id", requestId);
    return redirectRes;
  }

  // Pass request-id to downstream handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-request-id", requestId);
  return response;
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
