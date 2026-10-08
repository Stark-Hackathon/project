"use server";

/**
 * Chigir Ale - Search Server Actions
 * Spec: Section 97 (Search Scoping), Section 98 (Server-Side Pagination)
 */
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { SearchService, type SearchFilters } from "@/server/services/search.service";
import { ok, err } from "@/types/domain";

export async function searchReportsAction(
  filters: SearchFilters & { scopeToSelf?: boolean }
) {
  try {
    const user = await getAuthenticatedUser();

    // Check authority privilege
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

    const appliedFilters: SearchFilters = { ...filters };

    // If citizen requests their own reports or is unprivileged citizen searching private scope
    if (filters.scopeToSelf) {
      if (!user) {
        return err("UNAUTHORIZED: Sign in to search your own reports.");
      }
      appliedFilters.reporterId = user.id;
    } else if (!isAuthority) {
      // Public search guard: citizens only see active/public reports unless searching own reference
      // (If searching specific reference number e.g. CHI-..., allow exact lookup)
      if (!filters.reference && !filters.query?.startsWith("CHI-")) {
        appliedFilters.onlyPublic = true;
      }
    }

    const result = await SearchService.searchReports(appliedFilters);
    return ok(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to execute search";
    return err(msg);
  }
}
