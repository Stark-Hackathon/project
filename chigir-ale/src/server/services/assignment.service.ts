/**
 * Chigir Ale - Assignment Service
 * Spec: Section 33 — Assignment Model
 * Supports Organization -> Department -> Team -> Staff member assignments,
 * reassignments, atomic state transitions, and audit trail generation.
 */
import { prisma } from "@/lib/db/prisma";
import type { Assignment } from "@prisma/client";
import { AuditService } from "@/server/services/audit.service";
import { ReportStatusService } from "@/server/services/report-status.service";
import { NotificationService } from "@/server/services/notifications";

export interface AssignReportInput {
  reportId: string;
  organizationId: string;
  departmentId: string;
  teamId?: string | null;
  assigneeId?: string | null;
  reason?: string | null;
  expectedResolutionAt?: Date | string | null;
}

export class AssignmentService {
  /**
   * Assign or reassign a report to an organization, department, team, and/or staff member.
   * Runs atomically in a transaction:
   * 1. Closes previous active assignment if exists (reassignment).
   * 2. Creates new active assignment.
   * 3. Advances report status from VERIFIED to ASSIGNED if applicable.
   * 4. Logs a ReportEvent and an append-only AuditLog.
   */
  static async assign(
    input: AssignReportInput,
    actorUserId: string
  ): Promise<Assignment> {
    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: input.reportId, deletedAt: null },
        select: {
          id: true,
          status: true,
          organizationId: true,
          publicReference: true,
          reporterId: true,
          title: true,
        },
      });

      if (!report) {
        throw new Error(`Report with id ${input.reportId} not found.`);
      }

      // Check if report has an active assignment
      const currentActiveAssignment = await tx.assignment.findFirst({
        where: {
          reportId: input.reportId,
          unassignedAt: null,
        },
        orderBy: { assignedAt: "desc" },
      });

      const isReassignment = Boolean(currentActiveAssignment);

      if (currentActiveAssignment) {
        // Unassign previous assignment
        await tx.assignment.update({
          where: { id: currentActiveAssignment.id },
          data: {
            unassignedAt: new Date(),
          },
        });
      }

      // Create new assignment
      const newAssignment = await tx.assignment.create({
        data: {
          reportId: input.reportId,
          organizationId: input.organizationId,
          departmentId: input.departmentId,
          teamId: input.teamId ?? null,
          assigneeId: input.assigneeId ?? null,
          assignedById: actorUserId,
          reason: input.reason ?? (isReassignment ? "Reassigned by authority" : "Initial assignment"),
        },
      });

      // Update report status if legally allowed (e.g. from VERIFIED to ASSIGNED)
      const updateData: {
        organizationId: string;
        expectedResolutionAt?: Date;
        status?: "ASSIGNED";
      } = {
        organizationId: input.organizationId,
      };

      if (input.expectedResolutionAt) {
        updateData.expectedResolutionAt = new Date(input.expectedResolutionAt);
      }

      const fromStatus = report.status;
      let toStatus = report.status;

      if (report.status === "VERIFIED" && ReportStatusService.canTransition("VERIFIED", "ASSIGNED")) {
        updateData.status = "ASSIGNED";
        toStatus = "ASSIGNED";
      }

      await tx.report.update({
        where: { id: input.reportId },
        data: updateData,
      });

      // Record ReportEvent
      const eventType = isReassignment ? "REPORT_REASSIGNED" : "REPORT_ASSIGNED";
      const message = input.reason
        ? `${eventType}: ${input.reason}`
        : isReassignment
        ? "Report reassigned to new department/staff."
        : "Report assigned to department for operational handling.";

      await tx.reportEvent.create({
        data: {
          reportId: input.reportId,
          actorUserId,
          eventType,
          fromStatus: isReassignment ? fromStatus : undefined,
          toStatus,
          message,
          visibility: "INTERNAL",
          metadata: {
            assignmentId: newAssignment.id,
            departmentId: input.departmentId,
            teamId: input.teamId,
            assigneeId: input.assigneeId,
            isReassignment,
          },
        },
      });

      // Log append-only AuditLog
      await AuditService.log(
        {
          organizationId: input.organizationId,
          actorUserId,
          action: eventType,
          entityType: "Assignment",
          entityId: newAssignment.id,
          before: currentActiveAssignment ? { assignmentId: currentActiveAssignment.id } : {},
          after: {
            assignmentId: newAssignment.id,
            departmentId: input.departmentId,
            teamId: input.teamId,
            assigneeId: input.assigneeId,
            status: toStatus,
          },
        },
        tx
      );

      const dept = await tx.department.findUnique({
        where: { id: input.departmentId },
        select: { name: true },
      });

      const assigneeUser = input.assigneeId
        ? await tx.user.findUnique({
            where: { id: input.assigneeId },
            select: { id: true, name: true, email: true },
          })
        : null;

      return {
        assignment: newAssignment,
        publicReference: report.publicReference,
        reportTitle: report.title,
        reporterId: report.reporterId,
        departmentName: dept?.name,
        assigneeUser,
      };
    });

    // Decoupled notification dispatch (Spec §41 & §74)
    // 1. Notify citizen reporter
    void NotificationService.notifyReportLifecycleEvent({
      type: "REPORT_ASSIGNED",
      reportId: input.reportId,
      publicReference: result.publicReference,
      reportTitle: result.reportTitle,
      recipientUserId: result.reporterId,
      departmentName: result.departmentName,
      assigneeName: result.assigneeUser?.name,
    }).catch(() => {});

    // 2. Notify assignee staff/field worker if designated
    if (result.assigneeUser) {
      void NotificationService.createAndDispatch({
        userId: result.assigneeUser.id,
        type: "REPORT_ASSIGNED",
        title: `Assigned: Report #${result.publicReference}`,
        body: `You have been assigned to handle "${result.reportTitle}".`,
        actionUrl: `/authority/reports/${result.publicReference}`,
        recipientEmail: result.assigneeUser.email,
        recipientName: result.assigneeUser.name,
        data: {
          reportId: input.reportId,
          publicReference: result.publicReference,
        },
      }).catch(() => {});
    }

    return result.assignment;
  }

  /**
   * Fetch active assignment for a report with full department, team, and assignee details.
   */
  static async getActiveAssignment(reportId: string) {
    return prisma.assignment.findFirst({
      where: {
        reportId,
        unassignedAt: null,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        department: { select: { id: true, name: true, slug: true } },
        team: { select: { id: true, name: true, slug: true } },
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { assignedAt: "desc" },
    });
  }

  /**
   * Fetch assignment history for a report.
   */
  static async getAssignmentHistory(reportId: string) {
    return prisma.assignment.findMany({
      where: { reportId },
      include: {
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: "desc" },
    });
  }
}
