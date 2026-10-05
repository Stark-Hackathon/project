/**
 * Chigir Ale - Report Repository
 * Spec: Sections 56, 74 — Report persistence and transactional status changes
 */
import { prisma } from "@/lib/db/prisma";
import type { Report, ReportStatus, Prisma } from "@prisma/client";
import { ReportReferenceService } from "@/server/services/report-reference.service";
import { ReportStatusService } from "@/server/services/report-status.service";
import { AuditService } from "@/server/services/audit.service";

export interface CreateReportInput {
  reporterId: string;
  categoryId: string;
  title: string;
  description: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  formattedAddress?: string;
  administrativeArea?: string;
  organizationId?: string;
}

export class ReportRepository {
  /**
   * Create a new report with a generated public reference.
   * Wrapped in a transaction: creates report + initial event + audit log atomically.
   */
  static async create(
    input: CreateReportInput,
    actorUserId?: string
  ): Promise<Report> {
    return prisma.$transaction(async (tx) => {
      const publicReference = await ReportReferenceService.generateNext(tx);

      const report = await tx.report.create({
        data: {
          publicReference,
          reporterId: input.reporterId,
          categoryId: input.categoryId,
          organizationId: input.organizationId,
          title: input.title,
          description: input.description,
          severity: input.severity ?? "MEDIUM",
          status: "SUBMITTED",
          latitude: input.latitude,
          longitude: input.longitude,
          locationAccuracy: input.locationAccuracy,
          formattedAddress: input.formattedAddress,
          administrativeArea: input.administrativeArea,
        },
      });

      // Initial event
      await tx.reportEvent.create({
        data: {
          reportId: report.id,
          actorUserId: actorUserId,
          eventType: "REPORT_SUBMITTED",
          toStatus: "SUBMITTED",
          visibility: "SYSTEM",
          message: "Report submitted.",
        },
      });

      // Audit entry
      await AuditService.log(
        {
          actorUserId: actorUserId ?? input.reporterId,
          action: "REPORT_CREATED",
          entityType: "Report",
          entityId: report.id,
          after: { publicReference, status: "SUBMITTED" },
        },
        tx
      );

      return report;
    });
  }

  /** Find a report by its internal UUID */
  static async findById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /** Find a report by public reference (e.g. CHI-2026-000001) */
  static async findByPublicReference(publicReference: string): Promise<Report | null> {
    return prisma.report.findUnique({
      where: { publicReference, deletedAt: null },
    });
  }

  /**
   * Find a public report view by its reference number.
   * Strips all internal authority data, staff identities, and private internal notes.
   * Spec: Section 18 (Location privacy), 31 (Public vs internal separation)
   */
  static async findPublicByReference(publicReference: string) {
    return prisma.report.findUnique({
      where: { publicReference, deletedAt: null },
      select: {
        id: true,
        publicReference: true,
        title: true,
        description: true,
        severity: true,
        status: true,
        formattedAddress: true,
        administrativeArea: true,
        reportedAt: true,
        verifiedAt: true,
        resolvedAt: true,
        closedAt: true,
        confirmationCount: true,
        upvoteCount: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            colorToken: true,
          },
        },
        media: {
          select: {
            id: true,
            type: true,
            publicUrl: true,
            storageKey: true,
          },
        },
        events: {
          where: {
            visibility: "PUBLIC",
          },
          select: {
            id: true,
            eventType: true,
            fromStatus: true,
            toStatus: true,
            message: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  /**
   * Transition the status of a report.
   * Atomically updates status, creates an event, and logs the audit.
   */
  static async updateStatus(
    reportId: string,
    toStatus: ReportStatus,
    opts?: {
      actorUserId?: string;
      message?: string;
      organizationId?: string;
      visibility?: "PUBLIC" | "INTERNAL" | "SYSTEM";
    }
  ): Promise<Report> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.report.findUnique({
        where: { id: reportId, deletedAt: null },
        select: { id: true, status: true, publicReference: true },
      });
      if (!current) throw new Error("NOT_FOUND: Report not found");

      ReportStatusService.assertCanTransition(current.status, toStatus);

      // Timestamp fields according to status
      const timestampUpdates: Partial<Prisma.ReportUpdateInput> = {};
      if (toStatus === "VERIFIED") timestampUpdates.verifiedAt = new Date();
      if (toStatus === "RESOLVED") timestampUpdates.resolvedAt = new Date();
      if (toStatus === "CLOSED") timestampUpdates.closedAt = new Date();

      const updated = await tx.report.update({
        where: { id: reportId },
        data: { status: toStatus, ...timestampUpdates },
      });

      await tx.reportEvent.create({
        data: {
          reportId,
          actorUserId: opts?.actorUserId,
          eventType: "STATUS_CHANGED",
          fromStatus: current.status,
          toStatus,
          message: opts?.message,
          visibility: opts?.visibility ?? "INTERNAL",
        },
      });

      await AuditService.log(
        {
          organizationId: opts?.organizationId,
          actorUserId: opts?.actorUserId,
          action: "REPORT_STATUS_CHANGED",
          entityType: "Report",
          entityId: reportId,
          before: { status: current.status },
          after: { status: toStatus },
        },
        tx
      );

      return updated;
    });
  }

  /** List reports created by a specific user (citizen view) */
  static async findByReporter(
    reporterId: string,
    opts?: { limit?: number; offset?: number }
  ): Promise<Report[]> {
    return prisma.report.findMany({
      where: { reporterId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: opts?.limit ?? 20,
      skip: opts?.offset ?? 0,
    });
  }
}
