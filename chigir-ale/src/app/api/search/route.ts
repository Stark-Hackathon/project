import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { SearchService } from "@/server/services/search.service";
import type { ReportStatus, Severity } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const ref = searchParams.get("ref") || undefined;
  const categoryId = searchParams.get("category") || undefined;
  const status = (searchParams.get("status") as ReportStatus) || undefined;
  const severity = (searchParams.get("severity") as Severity) || undefined;
  const subcity = searchParams.get("subcity") || undefined;
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const user = await getAuthenticatedUser();
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

    return NextResponse.json(results);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
