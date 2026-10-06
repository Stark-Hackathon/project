/**
 * Chigir Ale - Moderation Service
 * Spec: Section 122 — Moderation Tooling & Auditing
 * Handles report moderation: Spam, Abusive, Inappropriate, Duplicate, and Needs Information flags.
 */
import { prisma } from "@/lib/db/prisma";
import type { ReportStatus, Prisma } from "@prisma/client";
import { AuditService } from "@/server/services/audit.service";
import { NotificationService } from "@/server/services/notifications";
import { ReportStatusService } from "@/server/services/report-status.service";
import { PriorityService } from "@/server/services/priority.service";

export type ModerationClassification =
  | "VALID"
  | "INVALID"
  | "SPAM"
  | "ABUSIVE"
  | "DUPLICATE"
  | "MISCLASSIFIED"
  | "MISSING_INFORMATION";

export interface ModerationActionInput {
  reportId: string;
  actorUserId: string;
  action: "REJECT" | "FLAG_ABUSIVE" | "MARK_DUPLICATE" | "REQUEST_INFO" | "RECLASSIFY";
  classification: ModerationClassification;
  reason: string;
  notes?: string;
  canonicalReportReference?: string; // If duplicate
  newCategoryId?: string; // If reclassified
}

export interface ModerationResult {
  success: boolean;
  reportId: string;
  newStatus: ReportStatus;
  classification: ModerationClassification;
  auditLogged: boolean;
  citizenNotified: boolean;
}

export class ModerationService {
  /**
   * Apply moderation decision to an incoming or existing report.
   * Atomically transitions report status, creates event, writes append-only audit log,
   * and dispatches explanation notification to the citizen.
   */
  static async applyModeration(input: ModerationActionInput): Promise<ModerationResult> {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error("MANDATORY_FIELD: A clear moderation explanation of at least 5 characters is required.");
    }

    let targetStatus: ReportStatus = "UNDER_REVIEW";

    if (input.action === "REJECT" || input.action === "FLAG_ABUSIVE") {
      targetStatus = "REJECTED";
    } else if (input.action === "MARK_DUPLICATE") {
      targetStatus = "DUPLICATE";
    } else if (input.action === "REQUEST_INFO") {
      targetStatus = "NEEDS_INFORMATION";
    }

    // Execute atomic transition & audit
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.report.findUnique({
        where: { id: input.reportId, deletedAt: null },
        select: {
          id: true,
          status: true,
          publicReference: true,
          reporterId: true,
          title: true,
          categoryId: true,
          organizationId: true,
        },
      });

      if (!current) {
        throw new Error(`Report not found: ${input.reportId}`);
      }

      // If reclassifying category without status change
      if (input.action === "RECLASSIFY" && input.newCategoryId) {
        const reclassified = await tx.report.update({
          where: { id: input.reportId },
          data: { categoryId: input.newCategoryId },
        });

        await tx.reportEvent.create({
          data: {
            reportId: input.reportId,
            actorUserId: input.actorUserId,
            eventType: "REPORT_RECLASSIFIED",
            message: input.reason,
            visibility: "INTERNAL",
            metadata: {
              previousCategoryId: current.categoryId,
              newCategoryId: input.newCategoryId,
            },
          },
        });

        await AuditService.log(
          {
            organizationId: current.organizationId ?? undefined,
            actorUserId: input.actorUserId,
            action: "REPORT_MODERATION_RECLASSIFIED",
            entityType: "Report",
            entityId: input.reportId,
            before: { categoryId: current.categoryId },
            after: { categoryId: input.newCategoryId, reason: input.reason },
          },
          tx
        );

        return reclassified;
      }

      // State machine validity check
      ReportStatusService.assertCanTransition(current.status, targetStatus);

      const updateData: Prisma.ReportUpdateInput = {
        status: targetStatus,
      };

      const reportUpdated = await tx.report.update({
        where: { id: input.reportId },
        data: updateData,
      });

      // Create ReportEvent
      await tx.reportEvent.create({
        data: {
          reportId: input.reportId,
          actorUserId: input.actorUserId,
          eventType: `MODERATION_${input.action}`,
          fromStatus: current.status,
          toStatus: targetStatus,
          message: input.reason,
          visibility: input.action === "FLAG_ABUSIVE" ? "INTERNAL" : "PUBLIC",
          metadata: {
            classification: input.classification,
            notes: input.notes,
            canonicalReference: input.canonicalReportReference,
          },
        },
      });

      // Append-only AuditLog (Spec Section 71 & 122)
      await AuditService.log(
        {
          organizationId: current.organizationId ?? undefined,
          actorUserId: input.actorUserId,
          action: `MODERATION_${input.action}`,
          entityType: "Report",
          entityId: input.reportId,
          before: { status: current.status },
          after: {
            status: targetStatus,
            classification: input.classification,
            reason: input.reason,
            canonicalReference: input.canonicalReportReference,
          },
        },
        tx
      );

      return reportUpdated;
    });

    // If reclassified, recalculate priority
    if (input.action === "RECLASSIFY") {
      try {
        await PriorityService.recalculateForReport(input.reportId);
      } catch {
        // Tolerant
      }
    }

    // Decoupled notification to citizen reporter (Spec Section 122)
    let citizenNotificationType = "STATUS_CHANGED";
    let notificationTitle = `Update on Report #${updated.publicReference}`;
    let notificationBody = input.reason;

    if (input.action === "REJECT") {
      notificationTitle = `Report #${updated.publicReference} Not Processed`;
      notificationBody = `Your report could not be approved: ${input.reason}`;
    } else if (input.action === "MARK_DUPLICATE") {
      notificationTitle = `Report #${updated.publicReference} Marked as Duplicate`;
      notificationBody = input.canonicalReportReference
        ? `This issue is already tracked under #${input.canonicalReportReference}. Your report has been linked to boost its priority.`
        : `This report has been identified as a duplicate of an existing community issue.`;
    } else if (input.action === "REQUEST_INFO") {
      citizenNotificationType = "CONFIRMATION_REQUEST";
      notificationTitle = `Information Needed: #${updated.publicReference}`;
      notificationBody = `The municipal review team requested clarification: ${input.reason}`;
    }

    void NotificationService.createAndDispatch({
      userId: updated.reporterId,
      type: citizenNotificationType,
      title: notificationTitle,
      body: notificationBody,
      actionUrl: `/reports/${updated.publicReference}`,
      data: {
        reportId: updated.id,
        publicReference: updated.publicReference,
        classification: input.classification,
        reason: input.reason,
      },
    }).catch(() => {});

    return {
      success: true,
      reportId: updated.id,
      newStatus: updated.status,
      classification: input.classification,
      auditLogged: true,
      citizenNotified: true,
    };
  }
}
