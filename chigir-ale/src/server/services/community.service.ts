/**
 * Chigir Ale - Community Interaction & Resolution Feedback Service
 * Spec: Sections 23 (Confirmations), 24 (Upvoting), 27 (Resolution Feedback)
 */
import { prisma } from "@/lib/db/prisma";
import type { FeedbackResult, ReportStatus } from "@prisma/client";
import { ReportStatusService } from "./report-status.service";
import { AuditService } from "./audit.service";

export class CommunityService {
  /**
   * Toggle a citizen upvote on a report.
   * Spec section 24: "Limited to one active upvote per authenticated user... allow the user to remove their upvote."
   */
  static async toggleUpvote(reportId: string, userId: string): Promise<{ upvoted: boolean; count: number }> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.reportUpvote.findUnique({
        where: {
          reportId_userId: {
            reportId,
            userId,
          },
        },
      });

      if (existing) {
        // Remove upvote
        await tx.reportUpvote.delete({
          where: { id: existing.id },
        });

        const updated = await tx.report.update({
          where: { id: reportId },
          data: {
            upvoteCount: { decrement: 1 },
          },
          select: { upvoteCount: true },
        });

        return { upvoted: false, count: Math.max(0, updated.upvoteCount) };
      } else {
        // Add upvote
        await tx.reportUpvote.create({
          data: {
            reportId,
            userId,
          },
        });

        const updated = await tx.report.update({
          where: { id: reportId },
          data: {
            upvoteCount: { increment: 1 },
          },
          select: { upvoteCount: true },
        });

        return { upvoted: true, count: updated.upvoteCount };
      }
    });
  }

  /**
   * Confirm an incident ("I'm experiencing this too").
   * Spec section 23: "This should increase incident confidence rather than create a new duplicate report."
   */
  static async confirmReport(
    reportId: string,
    userId: string
  ): Promise<{ alreadyConfirmed: boolean; count: number }> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.reportConfirmation.findUnique({
        where: {
          reportId_userId: {
            reportId,
            userId,
          },
        },
      });

      if (existing) {
        const report = await tx.report.findUnique({
          where: { id: reportId },
          select: { confirmationCount: true },
        });
        return { alreadyConfirmed: true, count: report?.confirmationCount ?? 0 };
      }

      await tx.reportConfirmation.create({
        data: {
          reportId,
          userId,
        },
      });

      const updated = await tx.report.update({
        where: { id: reportId },
        data: {
          confirmationCount: { increment: 1 },
        },
        select: { confirmationCount: true },
      });

      await tx.reportEvent.create({
        data: {
          reportId,
          actorUserId: userId,
          eventType: "CITIZEN_CONFIRMED",
          visibility: "PUBLIC",
          message: "A community member confirmed experiencing this problem.",
        },
      });

      await AuditService.log(
        {
          actorUserId: userId,
          action: "REPORT_CONFIRMED",
          entityType: "Report",
          entityId: reportId,
        },
        tx
      );

      return { alreadyConfirmed: false, count: updated.confirmationCount };
    });
  }

  /**
   * Submit citizen resolution feedback when report is marked resolved.
   * Spec section 27:
   * "If No: Reopen the report where authorized... If Yes: Mark citizen confirmation. Continue toward CLOSED."
   */
  static async submitResolutionFeedback(
    reportId: string,
    userId: string,
    result: FeedbackResult,
    comment?: string
  ): Promise<{ newStatus: ReportStatus; message: string }> {
    return prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId, deletedAt: null },
        select: { id: true, status: true, publicReference: true },
      });

      if (!report) {
        throw new Error("NOT_FOUND: Report not found.");
      }

      // Record feedback
      await tx.resolutionFeedback.create({
        data: {
          reportId,
          userId,
          result,
          comment: comment?.trim() || null,
        },
      });

      let nextStatus: ReportStatus = report.status;

      if (result === "NOT_FIXED") {
        // Citizen says problem still exists -> Reopen report
        if (ReportStatusService.canTransition(report.status, "REOPENED")) {
          nextStatus = "REOPENED";

          await tx.report.update({
            where: { id: reportId },
            data: { status: "REOPENED" },
          });

          await tx.reportEvent.create({
            data: {
              reportId,
              actorUserId: userId,
              eventType: "RESOLUTION_DISPUTED",
              fromStatus: report.status,
              toStatus: "REOPENED",
              visibility: "PUBLIC",
              message: comment
                ? `Citizen disputed resolution: "${comment}"`
                : "Citizen verified the issue still exists on site. Report reopened for inspection.",
            },
          });

          await AuditService.log(
            {
              actorUserId: userId,
              action: "REPORT_REOPENED_BY_CITIZEN_FEEDBACK",
              entityType: "Report",
              entityId: reportId,
              after: { status: "REOPENED", comment },
            },
            tx
          );
        }
        return {
          newStatus: nextStatus,
          message: "Thank you for the feedback. The report has been reopened for follow-up inspection.",
        };
      } else {
        // Citizen confirmed problem is fixed -> Progress toward CLOSED
        if (ReportStatusService.canTransition(report.status, "CLOSED")) {
          nextStatus = "CLOSED";

          await tx.report.update({
            where: { id: reportId },
            data: {
              status: "CLOSED",
              closedAt: new Date(),
            },
          });
        }

        await tx.reportEvent.create({
          data: {
            reportId,
            actorUserId: userId,
            eventType: "RESOLUTION_CONFIRMED",
            fromStatus: report.status,
            toStatus: nextStatus,
            visibility: "PUBLIC",
            message: "Citizen confirmed the problem has been successfully resolved.",
          },
        });

        await AuditService.log(
          {
            actorUserId: userId,
            action: "REPORT_CONFIRMED_FIXED",
            entityType: "Report",
            entityId: reportId,
          },
          tx
        );

        return {
          newStatus: nextStatus,
          message: "Thank you! Your confirmation helps maintain civic infrastructure quality.",
        };
      }
    });
  }
}
