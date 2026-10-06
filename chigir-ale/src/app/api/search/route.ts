import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { SearchService } from "@/server/services/search.service";
import { RateLimitService } from "@/server/services/rate-limit.service";
import { SanitizerService } from "@/server/services/sanitizer.service";
import { ObservabilityService } from "@/server/services/observability.service";
import type { ReportStatus, Severity } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get("q") || undefined;
  const q = rawQ ? SanitizerService.sanitizeText(rawQ) : undefined;
  const ref = searchParams.get("ref") || undefined;
  const categoryId = searchParams.get("category") || undefined;
  const status = (searchParams.get("status") as ReportStatus) || undefined;
  const severity = (searchParams.get("severity") as Severity) || undefined;
  const subcity = searchParams.get("subcity") || undefined;
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const user = await getAuthenticatedUser();
  const clientId = user?.id || request.headers.get("x-forwarded-for") || "anonymous_client";

  // Rate Limiting per Spec Section 81
  const rateLimit = RateLimitService.check(clientId, "SEARCH");
  if (!rateLimit.success) {
    return NextResponse.json(
      ObservabilityService.formatErrorResponse(
        new Error("RATE_LIMIT_EXCEEDED: Search rate limit exceeded. Please try again shortly."),
        request.headers.get("x-request-id") || undefined
      ),
      { status: 429, headers: RateLimitService.getHeaders(rateLimit) }
    );
  }

  let isAuthority = false;
  if (user) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        role: { in: ["STAFF", "FIELD_WORKER", "DEPARTMENT_MANAGER", "ORG_ADMIN", "PLATFORM_ADMIN"] },
      },
    });
    isAuthority = Boolean(membership);
  }

  try {
    const results = await SearchService.searchReports({
      query: q,
      reference: ref,
      categoryId,
      status,
      severity,
      subcity,
      limit,
      offset,
      onlyPublic: !isAuthority && !ref && !q?.startsWith("CHI-"),
    });

    return NextResponse.json(results, { headers: RateLimitService.getHeaders(rateLimit) });
  } catch (error) {
    const errorResponse = ObservabilityService.formatErrorResponse(
      error,
      request.headers.get("x-request-id") || undefined
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
