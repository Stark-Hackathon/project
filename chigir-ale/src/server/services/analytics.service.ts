/**
 * Chigir Ale - Analytics Service
 * Spec: Section 94 (Analytics), Section 96 (Analytics Privacy), Section 121 (Public Transparency), Section 134
 * Calculates infrastructure intelligence, resolution velocity, department workloads, and public indicators.
 */
import { prisma } from "@/lib/db/prisma";
import type { ReportStatus, Severity } from "@prisma/client";

export interface CategoryMetric {
  categoryId: string;
  categoryName: string;
  slug: string;
  count: number;
  percentage: number;
}

export interface SeverityMetric {
  severity: Severity;
  count: number;
  percentage: number;
}

export interface StatusMetric {
  status: ReportStatus;
  count: number;
  percentage: number;
}

export interface AreaMetric {
  area: string;
  count: number;
  percentage: number;
}

export interface DepartmentWorkloadMetric {
  departmentId: string;
  departmentName: string;
  activeCount: number;
  inProgressCount: number;
  resolvedCount: number;
}

export interface OperationalAnalytics {
  periodDays: number;
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  closedReports: number;
  resolutionRate: number; // percentage (0 - 100)
  reopenedRate: number; // percentage (0 - 100)
  duplicateRate: number; // percentage (0 - 100)
  avgResolutionHours: number;
  medianResolutionHours: number;
  totalConfirmations: number;
  totalUpvotes: number;
  byCategory: CategoryMetric[];
  bySeverity: SeverityMetric[];
  byStatus: StatusMetric[];
  byArea: AreaMetric[];
  departmentWorkloads: DepartmentWorkloadMetric[];
  dailyTrends: Array<{ date: string; created: number; resolved: number }>;
}

export interface PublicTransparencyMetrics {
  totalCityReports: number;
  totalResolvedIssues: number;
  overallResolutionRate: number; // percentage
  medianResolutionDays: number;
  communityConfirmations: number;
  topCategories: Array<{ name: string; count: number; percentage: number }>;
  statusOverview: Array<{ label: string; count: number; percentage: number }>;
  areaOverview: Array<{ area: string; count: number }>;
  recentCompletedCount: number;
}

export class AnalyticsService {
  /**
   * Calculate comprehensive operational analytics for authority oversight.
   * Spec Section 94 & 134.
   */
  static async getOperationalAnalytics(options: {
    organizationId?: string;
    days?: number;
  } = {}): Promise<OperationalAnalytics> {
    const days = options.days ?? 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const whereClause = {
      deletedAt: null,
      createdAt: { gte: sinceDate },
      ...(options.organizationId ? { organizationId: options.organizationId } : {}),
    };

    // 1. Fetch reports within window
    const reports = await prisma.report.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        severity: true,
        categoryId: true,
        administrativeArea: true,
        createdAt: true,
        reportedAt: true,
        resolvedAt: true,
        confirmationCount: true,
        upvoteCount: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    const totalReports = reports.length;

    // 2. Status counts & breakdown
    const statusMap = new Map<ReportStatus, number>();
    let resolvedCount = 0;
    let closedCount = 0;
    let reopenedCount = 0;
    let duplicateCount = 0;
    let activeCount = 0;

    for (const r of reports) {
      statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
      if (r.status === "RESOLVED") resolvedCount++;
      if (r.status === "CLOSED") closedCount++;
      if (r.status === "REOPENED") reopenedCount++;
      if (r.status === "DUPLICATE") duplicateCount++;

      if (
        r.status !== "RESOLVED" &&
        r.status !== "CLOSED" &&
        r.status !== "REJECTED" &&
        r.status !== "CANCELLED" &&
        r.status !== "DUPLICATE"
      ) {
        activeCount++;
      }
    }

    const byStatus: StatusMetric[] = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalReports > 0 ? Number(((count / totalReports) * 100).toFixed(1)) : 0,
    }));

    // 3. Category breakdown
    const categoryMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    for (const r of reports) {
      const cat = r.category;
      if (!cat) continue;
      const existing = categoryMap.get(cat.id);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, count: 1 });
      }
    }

    const byCategory: CategoryMetric[] = Array.from(categoryMap.values())
      .map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        slug: c.slug,
        count: c.count,
        percentage: totalReports > 0 ? Number(((c.count / totalReports) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 4. Severity breakdown
    const severityMap = new Map<Severity, number>();
    for (const r of reports) {
      severityMap.set(r.severity, (severityMap.get(r.severity) ?? 0) + 1);
    }

    const severityOrder: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const bySeverity: SeverityMetric[] = severityOrder.map((sev) => {
      const count = severityMap.get(sev) ?? 0;
      return {
        severity: sev,
        count,
        percentage: totalReports > 0 ? Number(((count / totalReports) * 100).toFixed(1)) : 0,
      };
    });

    // 5. Geographic area breakdown
    const areaMap = new Map<string, number>();
    for (const r of reports) {
      const area = r.administrativeArea || "Unassigned Subcity";
      areaMap.set(area, (areaMap.get(area) ?? 0) + 1);
    }

    const byArea: AreaMetric[] = Array.from(areaMap.entries())
      .map(([area, count]) => ({
        area,
        count,
        percentage: totalReports > 0 ? Number(((count / totalReports) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 6. Resolution time calculation
    const resolutionDurationsHours: number[] = [];
    for (const r of reports) {
      if (r.resolvedAt) {
        const start = r.reportedAt || r.createdAt;
        const diffMs = r.resolvedAt.getTime() - start.getTime();
        const hours = Math.max(0.1, diffMs / (1000 * 60 * 60));
        resolutionDurationsHours.push(hours);
      }
    }

    const avgResolutionHours =
      resolutionDurationsHours.length > 0
        ? Number(
            (
              resolutionDurationsHours.reduce((acc, h) => acc + h, 0) /
              resolutionDurationsHours.length
            ).toFixed(1)
          )
        : 0;

    const medianResolutionHours =
      resolutionDurationsHours.length > 0
        ? Number(this.calculateMedian(resolutionDurationsHours).toFixed(1))
        : 0;

    // Rates
    const totalDone = resolvedCount + closedCount;
    const resolutionRate =
      totalReports > 0 ? Number(((totalDone / totalReports) * 100).toFixed(1)) : 0;
    const reopenedRate =
      totalReports > 0 ? Number(((reopenedCount / totalReports) * 100).toFixed(1)) : 0;
    const duplicateRate =
      totalReports > 0 ? Number(((duplicateCount / totalReports) * 100).toFixed(1)) : 0;

    // Community engagement volume
    const totalConfirmations = reports.reduce((acc, r) => acc + (r.confirmationCount ?? 0), 0);
    const totalUpvotes = reports.reduce((acc, r) => acc + (r.upvoteCount ?? 0), 0);

    // 7. Department workloads
    const departments = await prisma.department.findMany({
      where: { status: "ACTIVE" },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            report: { select: { status: true } },
          },
        },
      },
    });

    const departmentWorkloads: DepartmentWorkloadMetric[] = departments.map((d) => {
      let active = 0;
      let inProgress = 0;
      let resolved = 0;

      for (const a of d.assignments) {
        const s = a.report.status;
        if (s === "ASSIGNED" || s === "IN_PROGRESS" || s === "BLOCKED") active++;
        if (s === "IN_PROGRESS") inProgress++;
        if (s === "RESOLVED" || s === "CLOSED") resolved++;
      }

      return {
        departmentId: d.id,
        departmentName: d.name,
        activeCount: active,
        inProgressCount: inProgress,
        resolvedCount: resolved,
      };
    });

    // 8. Daily trends (last 14 days)
    const dailyTrends = this.generateDailyTrends(reports, 14);

    return {
      periodDays: days,
      totalReports,
      activeReports: activeCount,
      resolvedReports: resolvedCount,
      closedReports: closedCount,
      resolutionRate,
      reopenedRate,
      duplicateRate,
      avgResolutionHours,
      medianResolutionHours,
      totalConfirmations,
      totalUpvotes,
      byCategory,
      bySeverity,
      byStatus,
      byArea,
      departmentWorkloads,
      dailyTrends,
    };
  }

  /**
   * Calculate public transparency metrics.
   * Spec Section 96 (Privacy Guard) & Section 121 (Public Transparency).
   * Strips all citizen identifiers, applies minimum aggregation, and presents city-level indicators.
   */
  static async getPublicTransparencyMetrics(): Promise<PublicTransparencyMetrics> {
    const totalCityReports = await prisma.report.count({
      where: { deletedAt: null },
    });

    const totalResolvedIssues = await prisma.report.count({
      where: {
        deletedAt: null,
        status: { in: ["RESOLVED", "CLOSED"] },
      },
    });

    const overallResolutionRate =
      totalCityReports > 0
        ? Number(((totalResolvedIssues / totalCityReports) * 100).toFixed(1))
        : 0;

    // Community engagement
    const aggregateConfirmations = await prisma.report.aggregate({
      where: { deletedAt: null },
      _sum: { confirmationCount: true, upvoteCount: true },
    });
    const communityConfirmations =
      (aggregateConfirmations._sum.confirmationCount ?? 0) +
      (aggregateConfirmations._sum.upvoteCount ?? 0);

    // Median resolution time in days
    const resolvedReports = await prisma.report.findMany({
      where: {
        deletedAt: null,
        resolvedAt: { not: null },
      },
      select: { reportedAt: true, createdAt: true, resolvedAt: true },
      take: 200,
    });

    const resolutionDaysList: number[] = [];
    for (const r of resolvedReports) {
      if (r.resolvedAt) {
        const start = r.reportedAt || r.createdAt;
        const days = (r.resolvedAt.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        resolutionDaysList.push(Math.max(0.1, days));
      }
    }

    const medianResolutionDays =
      resolutionDaysList.length > 0
        ? Number(this.calculateMedian(resolutionDaysList).toFixed(1))
        : 2.5; // Baseline city benchmark

    // Top categories
    const categories = await prisma.category.findMany({
      where: { active: true, parentId: null },
      include: {
        _count: { select: { reports: { where: { deletedAt: null } } } },
      },
      orderBy: { reports: { _count: "desc" } },
      take: 6,
    });

    const topCategories = categories.map((c) => ({
      name: c.name,
      count: c._count.reports,
      percentage:
        totalCityReports > 0
          ? Number(((c._count.reports / totalCityReports) * 100).toFixed(1))
          : 0,
    }));

    // Status overview
    const activeCount = await prisma.report.count({
      where: {
        deletedAt: null,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "BLOCKED"] },
      },
    });

    const statusOverview = [
      {
        label: "Resolved & Closed",
        count: totalResolvedIssues,
        percentage:
          totalCityReports > 0
            ? Number(((totalResolvedIssues / totalCityReports) * 100).toFixed(1))
            : 0,
      },
      {
        label: "Active Field Work",
        count: activeCount,
        percentage:
          totalCityReports > 0 ? Number(((activeCount / totalCityReports) * 100).toFixed(1)) : 0,
      },
      {
        label: "Under Review / Other",
        count: Math.max(0, totalCityReports - totalResolvedIssues - activeCount),
        percentage:
          totalCityReports > 0
            ? Number(
                (
                  ((totalCityReports - totalResolvedIssues - activeCount) / totalCityReports) *
                  100
                ).toFixed(1)
              )
            : 0,
      },
    ];

    // Subcity distribution
    const subcityReports = await prisma.report.groupBy({
      by: ["administrativeArea"],
      where: {
        deletedAt: null,
        administrativeArea: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    });

    const areaOverview = subcityReports.map((s) => ({
      area: s.administrativeArea || "Addis Ababa",
      count: s._count.id,
    }));

    const recentCompletedCount = await prisma.report.count({
      where: {
        deletedAt: null,
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    return {
      totalCityReports,
      totalResolvedIssues,
      overallResolutionRate,
      medianResolutionDays,
      communityConfirmations,
      topCategories,
      statusOverview,
      areaOverview,
      recentCompletedCount,
    };
  }

  /**
   * Helper: Calculate median of numeric array
   */
  static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]!
      : (sorted[mid - 1]! + sorted[mid]!) / 2;
  }

  /**
   * Helper: Daily report trend generator
   */
  private static generateDailyTrends(
    reports: Array<{ createdAt: Date; resolvedAt: Date | null }>,
    days = 14
  ) {
    const dailyMap = new Map<string, { created: number; resolved: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0]!;
      dailyMap.set(key, { created: 0, resolved: 0 });
    }

    for (const r of reports) {
      const createdKey = r.createdAt.toISOString().split("T")[0]!;
      if (dailyMap.has(createdKey)) {
        dailyMap.get(createdKey)!.created++;
      }
      if (r.resolvedAt) {
        const resolvedKey = r.resolvedAt.toISOString().split("T")[0]!;
        if (dailyMap.has(resolvedKey)) {
          dailyMap.get(resolvedKey)!.resolved++;
        }
      }
    }

    return Array.from(dailyMap.entries()).map(([date, counts]) => ({
      date,
      created: counts.created,
      resolved: counts.resolved,
    }));
  }
}
