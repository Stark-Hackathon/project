/**
 * Chigir Ale - Authority Repository
 * Spec: Sections 28 (Authority Dashboard), 29 (Dashboard Overview), 30 (Reports Management), 31 (Report Detail Authority View)
 * Data-access operations for authority operations, filtering, metrics, and report details.
 */
import { prisma } from "@/lib/db/prisma";
import type { ReportStatus, Severity, Prisma } from "@prisma/client";
import { SLAService } from "@/server/services/sla.service";

export interface AuthorityReportFilters {
  search?: string;
  status?: ReportStatus | "ALL";
  severity?: Severity | "ALL";
  categoryId?: string | "ALL";
  departmentId?: string | "ALL";
  organizationId?: string;
  sortBy?: "priority_desc" | "created_desc" | "severity_desc" | "confirmations_desc";
  page?: number;
  pageSize?: number;
}

export class AuthorityRepository {
  /**
   * Retrieves high-level dashboard metrics across the authority workspace.
   */
  static async getDashboardMetrics(organizationId?: string) {
    const baseWhere: Prisma.ReportWhereInput = {
      deletedAt: null,
      ...(organizationId ? { organizationId } : {}),
    };

    // Parallel aggregate counts
    const [
      totalCount,
      submittedCount,
      underReviewCount,
      verifiedCount,
      assignedCount,
      inProgressCount,
      blockedCount,
      resolvedCount,
      reopenedCount,
      closedCount,
      criticalCount,
      resolvedReports,
      categoryCounts,
      urgentReports,
    ] = await Promise.all([
      prisma.report.count({ where: baseWhere }),
      prisma.report.count({ where: { ...baseWhere, status: "SUBMITTED" } }),
      prisma.report.count({ where: { ...baseWhere, status: "UNDER_REVIEW" } }),
      prisma.report.count({ where: { ...baseWhere, status: "VERIFIED" } }),
      prisma.report.count({ where: { ...baseWhere, status: "ASSIGNED" } }),
      prisma.report.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
      prisma.report.count({ where: { ...baseWhere, status: "BLOCKED" } }),
      prisma.report.count({ where: { ...baseWhere, status: "RESOLVED" } }),
      prisma.report.count({ where: { ...baseWhere, status: "REOPENED" } }),
      prisma.report.count({ where: { ...baseWhere, status: "CLOSED" } }),
      prisma.report.count({ where: { ...baseWhere, severity: "CRITICAL" } }),
      // For average resolution time
      prisma.report.findMany({
        where: {
          ...baseWhere,
          status: { in: ["RESOLVED", "CLOSED"] },
          resolvedAt: { not: null },
        },
        select: { reportedAt: true, resolvedAt: true },
        take: 100,
      }),
      // Reports by category
      prisma.category.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          _count: {
            select: { reports: { where: baseWhere } },
          },
        },
        orderBy: { reports: { _count: "desc" } },
        take: 6,
      }),
      // Urgent / high priority queue
      prisma.report.findMany({
        where: {
          ...baseWhere,
          status: { in: ["SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REOPENED"] },
        },
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          reporter: { select: { name: true, email: true } },
        },
        orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ]);

    // Compute average resolution hours
    let avgResolutionHours = 0;
    if (resolvedReports.length > 0) {
      const totalHours = resolvedReports.reduce((sum, r) => {
        if (!r.resolvedAt) return sum;
        const diffMs = new Date(r.resolvedAt).getTime() - new Date(r.reportedAt).getTime();
        return sum + Math.max(0, diffMs / (1000 * 60 * 60));
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedReports.length) * 10) / 10;
    }

    const openCount =
      submittedCount +
      underReviewCount +
      verifiedCount +
      assignedCount +
      inProgressCount +
      blockedCount +
      reopenedCount;

    return {
      total: totalCount,
      open: openCount,
      new: submittedCount,
      underReview: underReviewCount,
      verified: verifiedCount,
      assigned: assignedCount,
      inProgress: inProgressCount,
      blocked: blockedCount,
      resolved: resolvedCount,
      reopened: reopenedCount,
      closed: closedCount,
      critical: criticalCount,
      avgResolutionHours,
      categoryStats: categoryCounts.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        count: c._count.reports,
      })),
      urgentQueue: urgentReports.map((r) => ({
        ...r,
        sla: SLAService.evaluate({
          severity: r.severity,
          status: r.status,
          reportedAt: r.reportedAt,
          verifiedAt: r.verifiedAt,
          resolvedAt: r.resolvedAt,
        }),
      })),
    };
  }

  /**
   * List reports with comprehensive filtering, search, sorting, and pagination.
   */
  static async listReports(filters: AuthorityReportFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 15));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReportWhereInput = {
      deletedAt: null,
      ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
    };

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters.severity && filters.severity !== "ALL") {
      where.severity = filters.severity;
    }

    if (filters.categoryId && filters.categoryId !== "ALL") {
      where.categoryId = filters.categoryId;
    }

    if (filters.departmentId && filters.departmentId !== "ALL") {
      where.assignments = {
        some: {
          departmentId: filters.departmentId,
          unassignedAt: null,
        },
      };
    }

    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.trim();
      where.OR = [
        { publicReference: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { formattedAddress: { contains: q, mode: "insensitive" } },
        { administrativeArea: { contains: q, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.ReportOrderByWithRelationInput[] = [{ createdAt: "desc" }];
    if (filters.sortBy === "priority_desc") {
      orderBy = [{ priorityScore: "desc" }, { createdAt: "desc" }];
    } else if (filters.sortBy === "severity_desc") {
      orderBy = [{ severity: "desc" }, { createdAt: "desc" }];
    } else if (filters.sortBy === "confirmations_desc") {
      orderBy = [{ confirmationCount: "desc" }, { createdAt: "desc" }];
    }

    const [total, items] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true, colorToken: true } },
          reporter: { select: { id: true, name: true, email: true } },
          assignments: {
            where: { unassignedAt: null },
            include: {
              department: { select: { id: true, name: true, slug: true } },
              team: { select: { id: true, name: true } },
              assignee: { select: { id: true, name: true, email: true } },
            },
            take: 1,
            orderBy: { assignedAt: "desc" },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    // Enrich items with SLA evaluation
    const enrichedItems = items.map((r) => {
      const activeAssignment = r.assignments[0] ?? null;
      const sla = SLAService.evaluate({
        severity: r.severity,
        status: r.status,
        reportedAt: r.reportedAt,
        verifiedAt: r.verifiedAt,
        resolvedAt: r.resolvedAt,
        closedAt: r.closedAt,
      });

      return {
        ...r,
        activeAssignment,
        sla,
      };
    });

    return {
      items: enrichedItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Retrieves complete report detail for authority staff (Spec Section 31).
   * Includes internal events, audit trail, assignment history, duplicate candidates,
   * priority breakdown, and SLA metrics.
   */
  static async getReportDetailByReference(publicReference: string) {
    const report = await prisma.report.findUnique({
      where: { publicReference, deletedAt: null },
      include: {
        category: true,
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        media: true,
        events: {
          include: {
            actorUser: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        assignments: {
          include: {
            department: { select: { id: true, name: true, slug: true } },
            team: { select: { id: true, name: true, slug: true } },
            assignee: { select: { id: true, name: true, email: true } },
            assignedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { assignedAt: "desc" },
        },
        priorityCalculations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        sourceDuplicates: {
          include: {
            candidateReport: {
              select: {
                id: true,
                publicReference: true,
                title: true,
                status: true,
                severity: true,
                createdAt: true,
              },
            },
          },
        },
        incidentReports: {
          include: {
            incident: true,
          },
        },
      },
    });

    if (!report) return null;

    const activeAssignment = report.assignments.find((a) => a.unassignedAt === null) ?? null;
    const sla = SLAService.evaluate({
      severity: report.severity,
      status: report.status,
      reportedAt: report.reportedAt,
      verifiedAt: report.verifiedAt,
      resolvedAt: report.resolvedAt,
      closedAt: report.closedAt,
    });

    return {
      ...report,
      activeAssignment,
      sla,
    };
  }

  /**
   * List all departments for an organization, including teams.
   */
  static async listDepartments(organizationId?: string) {
    return prisma.department.findMany({
      where: {
        status: "ACTIVE",
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        teams: {
          where: { status: "ACTIVE" },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * List staff members available for assignment.
   */
  static async listStaffMembers(organizationId?: string) {
    const memberships = await prisma.membership.findMany({
      where: {
        status: "ACTIVE",
        role: { in: ["STAFF", "FIELD_WORKER", "DEPARTMENT_MANAGER", "ORG_ADMIN"] },
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      organizationId: m.organizationId,
    }));
  }
}
