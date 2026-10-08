"use server";

/**
 * Chigir Ale - Authority Server Actions
 * Spec: Sections 28–34, 91–93, 118–120
 * Handles dashboard metrics, report listing with filters, state transitions,
 * department routing, assignment, and priority recalculations.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type Result, ok, err } from "@/types";
import { requireAuthorityUser } from "@/lib/auth/session";
import { AuthorityRepository, type AuthorityReportFilters } from "@/server/repositories/authority.repository";
import { AuthorityTransitionService } from "@/server/services/authority-transition.service";
import { AssignmentService, type AssignReportInput } from "@/server/services/assignment.service";
import { PriorityService } from "@/server/services/priority.service";
import { RoutingService } from "@/server/services/routing.service";
import type { ReportStatus, Severity } from "@prisma/client";

const transitionSchema = z.object({
  reportId: z.string().uuid(),
  targetStatus: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "NEEDS_INFORMATION",
    "VERIFIED",
    "REJECTED",
    "DUPLICATE",
    "ASSIGNED",
    "IN_PROGRESS",
    "BLOCKED",
    "RESOLVED",
    "AWAITING_CONFIRMATION",
    "CLOSED",
    "REOPENED",
    "CANCELLED",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  categoryId: z.string().uuid().optional(),
  expectedResolutionAt: z.string().optional(),
});

const assignSchema = z.object({
  reportId: z.string().uuid(),
  organizationId: z.string().uuid(),
  departmentId: z.string().uuid(),
  teamId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  reason: z.string().optional(),
  expectedResolutionAt: z.string().optional().nullable(),
});

/**
 * Fetch high-level operational metrics for the authority dashboard.
 */
export async function getAuthorityDashboardMetricsAction(): Promise<
  Result<Awaited<ReturnType<typeof AuthorityRepository.getDashboardMetrics>>>
> {
  try {
    await requireAuthorityUser();
    const metrics = await AuthorityRepository.getDashboardMetrics();
    return ok(metrics);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to fetch dashboard metrics");
  }
}

/**
 * List reports with filters, search query, sorting, and pagination.
 */
export async function listAuthorityReportsAction(
  filters: AuthorityReportFilters
): Promise<Result<Awaited<ReturnType<typeof AuthorityRepository.listReports>>>> {
  try {
    await requireAuthorityUser();
    const reports = await AuthorityRepository.listReports(filters);
    return ok(reports);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to list reports");
  }
}

/**
 * Fetch complete authority detail view for a specific report reference.
 */
export async function getAuthorityReportDetailAction(
  reference: string
): Promise<Result<Awaited<ReturnType<typeof AuthorityRepository.getReportDetailByReference>>>> {
  try {
    await requireAuthorityUser();
    const report = await AuthorityRepository.getReportDetailByReference(reference);
    if (!report) {
      return err(`Report #${reference} not found`);
    }
    return ok(report);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to fetch report details");
  }
}

/**
 * Execute an authority state machine transition on a report.
 */
export async function transitionReportStatusAction(
  input: z.infer<typeof transitionSchema>
): Promise<Result<{ status: ReportStatus }>> {
  try {
    const user = await requireAuthorityUser();

    const parsed = transitionSchema.safeParse(input);
    if (!parsed.success) {
      return err(`Validation failed: ${parsed.error.issues[0]?.message ?? "Invalid input"}`);
    }

    const { reportId, targetStatus, reason, notes, severity, categoryId, expectedResolutionAt } =
      parsed.data;

    const updated = await AuthorityTransitionService.transition(
      reportId,
      targetStatus as ReportStatus,
      user.id,
      {
        reason,
        notes,
        severity: severity as Severity | undefined,
        categoryId,
        expectedResolutionAt,
      }
    );

    revalidatePath("/authority");
    revalidatePath("/authority/reports");
    revalidatePath(`/authority/reports/${updated.publicReference}`);
    revalidatePath(`/reports/${updated.publicReference}`);

    return ok({ status: updated.status });
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to transition report status");
  }
}

/**
 * Assign or reassign a report to a department, team, or staff member.
 */
export async function assignReportAction(
  input: z.infer<typeof assignSchema>
): Promise<Result<{ assignmentId: string }>> {
  try {
    const user = await requireAuthorityUser();

    const parsed = assignSchema.safeParse(input);
    if (!parsed.success) {
      return err(`Validation failed: ${parsed.error.issues[0]?.message ?? "Invalid input"}`);
    }

    const assignment = await AssignmentService.assign(
      parsed.data as AssignReportInput,
      user.id
    );

    revalidatePath("/authority");
    revalidatePath("/authority/reports");

    return ok({ assignmentId: assignment.id });
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to assign report");
  }
}

/**
 * Recalculate priority score and decision-support factors.
 */
export async function recalculatePriorityAction(
  reportId: string
): Promise<Result<{ score: number }>> {
  try {
    await requireAuthorityUser();
    const result = await PriorityService.recalculateForReport(reportId);
    revalidatePath("/authority/reports");
    return ok({ score: result.score });
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to recalculate priority");
  }
}

/**
 * Fetch available departments and staff members for assignment dropdowns.
 */
export async function getDepartmentsAndStaffAction(organizationId?: string): Promise<
  Result<{
    departments: Awaited<ReturnType<typeof AuthorityRepository.listDepartments>>;
    staff: Awaited<ReturnType<typeof AuthorityRepository.listStaffMembers>>;
  }>
> {
  try {
    await requireAuthorityUser();
    const [departments, staff] = await Promise.all([
      AuthorityRepository.listDepartments(organizationId),
      AuthorityRepository.listStaffMembers(organizationId),
    ]);
    return ok({ departments, staff });
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to load departments and staff");
  }
}

/**
 * Get intelligent department routing suggestion for a report.
 */
export async function getRoutingSuggestionAction(
  reportId: string
): Promise<Result<Awaited<ReturnType<typeof RoutingService.suggestDepartment>>>> {
  try {
    await requireAuthorityUser();
    const report = await AuthorityRepository.getReportDetailByReference(reportId);
    if (!report) {
      return err("Report not found");
    }

    const suggestion = await RoutingService.suggestDepartment({
      categoryId: report.categoryId,
      categorySlug: report.category.slug,
      severity: report.severity,
      administrativeArea: report.administrativeArea,
      organizationId: report.organizationId ?? undefined,
    });

    return ok(suggestion);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to compute routing suggestion");
  }
}
