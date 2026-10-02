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

  const isProtected = PROTECTED_PATTERNS.some((p) => p.test(pathname));
  const isAuthOnly = AUTH_ONLY_PATTERNS.some((p) => p.test(pathname));

  if (isProtected && !session?.user) {
    const signInUrl = new URL("/auth/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthOnly && session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
