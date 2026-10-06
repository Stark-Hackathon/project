/**
 * Chigir Ale - Search Service
 * Spec: Section 97 (Search Scoping), Section 98 (Dashboard Performance & Server-Side Pagination)
 */
import { prisma } from "@/lib/db/prisma";
import type { ReportStatus, Severity, Prisma } from "@prisma/client";

export interface SearchFilters {
  query?: string;
  reference?: string;
  categoryId?: string;
  status?: ReportStatus;
  severity?: Severity;
  subcity?: string;
  departmentId?: string;
  assigneeId?: string;
  reporterId?: string; // Scope to specific citizen
  onlyPublic?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: "newest" | "oldest" | "severity" | "priority";
}

export interface SearchResultItem {
  id: string;
  publicReference: string;
  title: string;
  description: string;
  status: ReportStatus;
  severity: Severity;
  categoryName: string;
  categorySlug: string;
  formattedAddress: string | null;
  administrativeArea: string | null;
  reportedAt: Date;
  confirmationCount: number;
  upvoteCount: number;
  departmentName?: string | null;
  assigneeName?: string | null;
}

export interface SearchResponse {
  items: SearchResultItem[];
  totalCount: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

export class SearchService {
  /**
   * Search reports with authorization-aware scoping and server-side pagination.
   * Spec Section 97 & 98.
   */
  static async searchReports(filters: SearchFilters): Promise<SearchResponse> {
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = filters.offset ?? 0;

    const where: Prisma.ReportWhereInput = {
      deletedAt: null,
    };

    // Citizen Scoping (Spec Section 97: Citizen can search own reports)
    if (filters.reporterId) {
      where.reporterId = filters.reporterId;
    }

    // Reference matching (case-insensitive exact or prefix match)
    if (filters.reference) {
      where.publicReference = {
        contains: filters.reference.trim(),
        mode: "insensitive",
      };
    }

    // Keyword query (title, description, or publicReference)
    if (filters.query && filters.query.trim().length > 0) {
      const q = filters.query.trim();
      where.OR = [
        { publicReference: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { formattedAddress: { contains: q, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (filters.categoryId && filters.categoryId !== "ALL") {
      where.categoryId = filters.categoryId;
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Severity filter
    if (filters.severity) {
      where.severity = filters.severity;
    }

    // Geographic / Subcity filter
    if (filters.subcity && filters.subcity !== "ALL") {
      where.administrativeArea = {
        contains: filters.subcity,
        mode: "insensitive",
      };
    }

    // Department / Assignee filter (via active assignments)
    if (filters.departmentId || filters.assigneeId) {
      where.assignments = {
        some: {
          unassignedAt: null,
          ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
          ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
        },
      };
    }

    // Order by mapping
    let orderBy: Prisma.ReportOrderByWithRelationInput = { createdAt: "desc" };
    if (filters.sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (filters.sortBy === "priority") {
      orderBy = { priorityScore: "desc" };
    }

    const [totalCount, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          publicReference: true,
          title: true,
          description: true,
          status: true,
          severity: true,
          formattedAddress: true,
          administrativeArea: true,
          reportedAt: true,
          createdAt: true,
          confirmationCount: true,
          upvoteCount: true,
          category: {
            select: { name: true, slug: true },
          },
          assignments: {
            where: { unassignedAt: null },
            take: 1,
            select: {
              department: { select: { name: true } },
              assignee: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const items: SearchResultItem[] = reports.map((r) => {
      const activeAssignment = r.assignments[0];
      return {
        id: r.id,
        publicReference: r.publicReference,
        title: r.title,
        description: r.description,
        status: r.status,
        severity: r.severity,
        categoryName: r.category.name,
        categorySlug: r.category.slug,
        formattedAddress: r.formattedAddress,
        administrativeArea: r.administrativeArea,
        reportedAt: r.reportedAt || r.createdAt,
        confirmationCount: r.confirmationCount ?? 0,
        upvoteCount: r.upvoteCount ?? 0,
        departmentName: activeAssignment?.department.name ?? null,
        assigneeName: activeAssignment?.assignee?.name ?? null,
      };
    });

    return {
      items,
      totalCount,
      hasMore: offset + items.length < totalCount,
      limit,
      offset,
    };
  }
}
