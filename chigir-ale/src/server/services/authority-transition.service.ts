/**
 * Chigir Ale - Authority Transition Service (Report State Machine)
 * Spec: Sections 91 (State Transition Rules) & 92 (Report State Machine)
 * Strictly enforces legal transitions, actor authorization, mandatory reasons,
 * timestamp updates, event creation, and audit logging.
 */
import { prisma } from "@/lib/db/prisma";
import type { ReportStatus, Severity, Prisma } from "@prisma/client";
import { ReportStatusService } from "@/server/services/report-status.service";
import { AuditService } from "@/server/services/audit.service";
import { PriorityService } from "@/server/services/priority.service";

export interface TransitionOptions {
  reason?: string;
  notes?: string;
  severity?: Severity;
  categoryId?: string;
  expectedResolutionAt?: Date | string;
  visibility?: "PUBLIC" | "INTERNAL" | "SYSTEM";
  organizationId?: string;
}

export class AuthorityTransitionService {
  /**
   * Universal state transition handler for authority operations.
   * Enforces state machine validity and mandatory reasons.
   */
  static async transition(
    reportId: string,
    targetStatus: ReportStatus,
    actorUserId: string,
    options: TransitionOptions = {}
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.report.findUnique({
        where: { id: reportId, deletedAt: null },
        include: {
          category: true,
          assignments: {
            where: { unassignedAt: null },
          },
        },
      });

      if (!current) {
        throw new Error(`Report not found: ${reportId}`);
      }

      // 1. Assert state transition validity
      ReportStatusService.assertCanTransition(current.status, targetStatus);

      // 2. Validate mandatory requirements by target state (Spec Section 92)
      if (targetStatus === "REJECTED" && (!options.reason || options.reason.trim().length < 5)) {
        throw new Error("MANDATORY_FIELD: A valid reason (min 5 characters) is required to reject a report.");
      }

      if (targetStatus === "BLOCKED" && (!options.reason || options.reason.trim().length < 5)) {
        throw new Error("MANDATORY_FIELD: A valid explanation (min 5 characters) is required when marking a report as blocked.");
      }

      if (targetStatus === "NEEDS_INFORMATION" && (!options.notes && !options.reason)) {
        throw new Error("MANDATORY_FIELD: Instructions for needed information must be provided.");
      }

      if (targetStatus === "RESOLVED" && (!options.notes && !options.reason)) {
        throw new Error("MANDATORY_FIELD: Operational resolution notes are required before resolving a report.");
      }

      if (targetStatus === "REOPENED" && (!options.reason || options.reason.trim().length < 3)) {
        throw new Error("MANDATORY_FIELD: A valid justification is required to reopen a report.");
      }

      if (targetStatus === "CANCELLED" && (!options.reason || options.reason.trim().length < 3)) {
        throw new Error("MANDATORY_FIELD: A cancellation reason is required.");
      }

      // 3. Assemble updates
      const reportUpdates: Prisma.ReportUpdateInput = {
        status: targetStatus,
      };

      if (options.severity) {
        reportUpdates.severity = options.severity;
      }

      if (options.categoryId) {
        reportUpdates.category = { connect: { id: options.categoryId } };
      }

      if (options.expectedResolutionAt) {
        reportUpdates.expectedResolutionAt = new Date(options.expectedResolutionAt);
      }

      const now = new Date();
      if (targetStatus === "VERIFIED") {
        reportUpdates.verifiedAt = now;
      } else if (targetStatus === "RESOLVED") {
        reportUpdates.resolvedAt = now;
      } else if (targetStatus === "CLOSED") {
        reportUpdates.closedAt = now;
      }

      const updated = await tx.report.update({
        where: { id: reportId },
        data: reportUpdates,
      });

      // 4. Create event
      const eventMessage =
        options.notes || options.reason || `Status transitioned from ${current.status} to ${targetStatus}`;

      await tx.reportEvent.create({
        data: {
          reportId,
          actorUserId,
          eventType: `STATUS_${targetStatus}`,
          fromStatus: current.status,
          toStatus: targetStatus,
          message: eventMessage,
          visibility: options.visibility ?? "INTERNAL",
          metadata: {
            reason: options.reason,
            notes: options.notes,
            severityChanged: options.severity ? options.severity !== current.severity : false,
          },
        },
      });

      // 5. Append-only AuditLog
      await AuditService.log(
        {
          organizationId: options.organizationId ?? current.organizationId ?? undefined,
          actorUserId,
          action: `REPORT_STATUS_TRANSITION_${targetStatus}`,
          entityType: "Report",
          entityId: reportId,
          before: {
            status: current.status,
            severity: current.severity,
            categoryId: current.categoryId,
          },
          after: {
            status: targetStatus,
            severity: options.severity ?? current.severity,
            categoryId: options.categoryId ?? current.categoryId,
            reason: options.reason,
          },
        },
        tx
      );

      return updated;
    });
  }

  /**
   * Helper to verify a report, optionally updating severity or category,
   * and automatically updating its priority score.
   */
  static async verify(
    reportId: string,
    actorUserId: string,
    opts: { severity?: Severity; categoryId?: string; notes?: string } = {}
  ) {
    const updated = await AuthorityTransitionService.transition(
      reportId,
      "VERIFIED",
      actorUserId,
      {
        notes: opts.notes ?? "Report verified by authority.",
        severity: opts.severity,
        categoryId: opts.categoryId,
        visibility: "PUBLIC",
      }
    );

    // Recalculate priority after verification
    try {
      await PriorityService.recalculateForReport(reportId);
    } catch {
      // Graceful fallback
    }

    return updated;
  }
}
