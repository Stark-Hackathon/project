/**
 * Chigir Ale - Department Routing Engine
 * Spec: Sections 32 (Department Routing) & 68 (Routing Rule)
 * Maps reports to responsible departments based on configurable database rules
 * or standard domain infrastructure defaults.
 */
import { prisma } from "@/lib/db/prisma";
import type { Severity, Department } from "@prisma/client";

// Default category slug to department slug mappings (Spec Section 32)
export const DEFAULT_CATEGORY_DEPARTMENT_MAP: Record<string, { slug: string; name: string }> = {
  roads: { slug: "roads-infrastructure", name: "Roads & Civil Infrastructure" },
  bridges: { slug: "roads-infrastructure", name: "Roads & Civil Infrastructure" },
  drainage: { slug: "water-sewerage", name: "Water & Sewerage Authority" },
  streetlights: { slug: "electricity-power", name: "Electricity & Power Utility" },
  "traffic-infrastructure": { slug: "roads-infrastructure", name: "Roads & Civil Infrastructure" },
  "public-facilities": { slug: "roads-infrastructure", name: "Roads & Civil Infrastructure" },
  water: { slug: "water-sewerage", name: "Water & Sewerage Authority" },
  electricity: { slug: "electricity-power", name: "Electricity & Power Utility" },
  telecommunications: { slug: "telecom-connectivity", name: "Telecom & Utilities" },
  network: { slug: "telecom-connectivity", name: "Telecom & Utilities" },
  "waste-management": { slug: "sanitation-waste", name: "Environmental Sanitation & Waste" },
  sanitation: { slug: "sanitation-waste", name: "Environmental Sanitation & Waste" },
  "other-community": { slug: "sanitation-waste", name: "Environmental Sanitation & Waste" },
};

export interface RoutingSuggestion {
  departmentId?: string;
  departmentName?: string;
  departmentSlug?: string;
  reason: string;
  ruleId?: string;
}

export class RoutingService {
  /**
   * Determine the recommended department for a report.
   * Checks database RoutingRule entries first, then falls back to domain defaults.
   */
  static async suggestDepartment(params: {
    categoryId: string;
    categorySlug?: string;
    severity?: Severity;
    administrativeArea?: string | null;
    organizationId?: string;
  }): Promise<RoutingSuggestion> {
    // 1. Try querying database RoutingRules
    try {
      const activeRules = await prisma.routingRule.findMany({
        where: {
          categoryId: params.categoryId,
          active: true,
          ...(params.organizationId ? { organizationId: params.organizationId } : {}),
        },
        include: {
          department: true,
        },
        orderBy: {
          priority: "desc",
        },
      });

      for (const rule of activeRules) {
        // Check geographic constraint if present
        if (rule.geographicConstraint && params.administrativeArea) {
          const geo = rule.geographicConstraint as { allowedAreas?: string[] };
          if (
            geo.allowedAreas &&
            geo.allowedAreas.length > 0 &&
            !geo.allowedAreas.includes(params.administrativeArea)
          ) {
            continue;
          }
        }

        // Check severity constraint if present
        if (rule.severityConstraint && params.severity) {
          const sev = rule.severityConstraint as { allowedSeverities?: string[] };
          if (
            sev.allowedSeverities &&
            sev.allowedSeverities.length > 0 &&
            !sev.allowedSeverities.includes(params.severity)
          ) {
            continue;
          }
        }

        return {
          departmentId: rule.department.id,
          departmentName: rule.department.name,
          departmentSlug: rule.department.slug,
          reason: `Matched active routing rule #${rule.id.slice(0, 8)} (Priority ${rule.priority})`,
          ruleId: rule.id,
        };
      }
    } catch {
      // In offline / DB-not-ready environments, proceed to default fallback
    }

    // 2. Fall back to standard category mapping
    let categorySlug = params.categorySlug;
    if (!categorySlug && params.categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: params.categoryId },
        select: { slug: true },
      });
      categorySlug = cat?.slug;
    }

    if (categorySlug && DEFAULT_CATEGORY_DEPARTMENT_MAP[categorySlug]) {
      const mapped = DEFAULT_CATEGORY_DEPARTMENT_MAP[categorySlug];
      // Try to find the existing department in DB by slug
      const dept = await prisma.department.findFirst({
        where: { slug: mapped.slug },
      });

      return {
        departmentId: dept?.id,
        departmentName: dept?.name ?? mapped.name,
        departmentSlug: mapped.slug,
        reason: `Standard municipal routing for category '${categorySlug}' -> ${mapped.name}`,
      };
    }

    return {
      reason: "No explicit routing rule found. Manual department assignment required.",
    };
  }

  /**
   * Automatically resolves and assigns a department to a report in a transaction if possible.
   */
  static async resolveDepartmentForReport(
    reportId: string
  ): Promise<Department | null> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { category: true },
    });
    if (!report) return null;

    const suggestion = await RoutingService.suggestDepartment({
      categoryId: report.categoryId,
      categorySlug: report.category.slug,
      severity: report.severity,
      administrativeArea: report.administrativeArea,
      organizationId: report.organizationId ?? undefined,
    });

    if (suggestion.departmentId) {
      return prisma.department.findUnique({
        where: { id: suggestion.departmentId },
      });
    }

    return null;
  }
}
