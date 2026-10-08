"use server";

/**
 * Chigir Ale - Citizen Reporting Server Actions
 * Spec: Section 13-20 (Reporting Experience), 148 (Forms & Validation), 74 (Transactions)
 */
import { getAuthenticatedUser } from "@/lib/auth/session";
import { ReportRepository } from "@/server/repositories/report.repository";
import { CategoryRepository } from "@/server/repositories/category.repository";
import { prisma } from "@/lib/db/prisma";
import { NotificationService } from "@/server/services/notifications";
import { AIJobService } from "@/server/services/ai/ai-job.service";
import { ok, err, type Result } from "@/types/domain";

import { createReportSchema, type CreateReportFormData } from "./schemas";

import { RateLimitService } from "@/server/services/rate-limit.service";
import { SanitizerService } from "@/server/services/sanitizer.service";
import { IdempotencyService } from "@/server/services/idempotency.service";

export async function createReportAction(
  rawData: CreateReportFormData
): Promise<Result<{ reportId: string; publicReference: string }>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err("UNAUTHORIZED: Please sign in to submit a report.");
  }

  // Rate Limiting per Spec Section 81
  const rateLimit = RateLimitService.check(user.id, "REPORT_CREATION");
  if (!rateLimit.success) {
    return err(
      `Rate limit exceeded: Please wait ${rateLimit.retryAfterSeconds ?? 60} seconds before submitting another incident.`
    );
  }

  const parsed = createReportSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return err(errorMsg);
  }

  const data = parsed.data;

  // XSS input sanitization per Spec Section 80 & 83
  const cleanTitle = SanitizerService.sanitizeText(data.title);
  const cleanDescription = SanitizerService.sanitizeText(data.description);

  // Idempotency check per Spec Section 101
  const idempKey = data.idempotencyKey || `${user.id}_${cleanTitle.slice(0, 30)}_${data.categoryId}`;
  const idempCheck = await IdempotencyService.acquire(idempKey, "REPORT_CREATION", user.id);
  if (idempCheck.status === "COMPLETED" && idempCheck.response) {
    return ok(idempCheck.response as { reportId: string; publicReference: string });
  }
  if (idempCheck.status === "PENDING") {
    return err("A report submission with identical parameters is already processing.");
  }

  try {
    // Atomic creation: Report + Event + Media + Outbox + Audit committed in single transaction
    const report = await ReportRepository.create(
      {
        reporterId: user.id,
        categoryId: data.categoryId,
        title: cleanTitle,
        description: cleanDescription,
        severity: data.severity,
        latitude: data.latitude,
        longitude: data.longitude,
        locationAccuracy: data.locationAccuracy,
        formattedAddress: data.formattedAddress,
        administrativeArea: data.administrativeArea,
        mediaUrls: data.mediaUrls,
      },
      user.id
    );

    const resultData = {
      reportId: report.id,
      publicReference: report.publicReference,
    };

    // Save Idempotency response for future replays (Spec §101)
    await IdempotencyService.saveResponse(idempKey, "REPORT_CREATION", resultData);

    // Notify citizen reporter of report creation (Iteration 7)
    void NotificationService.notifyReportLifecycleEvent({
      type: "REPORT_SUBMITTED",
      reportId: report.id,
      publicReference: report.publicReference,
      reportTitle: report.title,
      recipientUserId: user.id,
      recipientEmail: user.email,
      recipientName: user.name,
    }).catch(() => {});

    // Dispatch background AI triage jobs decoupled from main flow (Iteration 9, Spec §36, §139)
    void AIJobService.dispatchReportAIJobs(report.id).catch(() => {});

    return ok(resultData);
  } catch (error) {
    await IdempotencyService.release(idempKey, "REPORT_CREATION");
    const message = error instanceof Error ? error.message : "Failed to submit report.";
    return err(message);
  }
}

export async function getPublicReportAction(publicReference: string) {
  if (!publicReference || typeof publicReference !== "string") {
    return err("Invalid report reference.");
  }

  try {
    const report = await ReportRepository.findPublicByReference(publicReference.trim().toUpperCase());
    if (!report) {
      return err("Report not found. Please verify the reference number.");
    }
    return ok(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error retrieving report.";
    return err(message);
  }
}

export async function getCategoriesAction() {
  try {
    const categories = await CategoryRepository.listWithChildren();
    return ok(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error retrieving categories.";
    return err(message);
  }
}

export async function getMyReportsAction() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err("UNAUTHORIZED: Sign in required.");
  }

  try {
    const reports = await prisma.report.findMany({
      where: { reporterId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { name: true, icon: true, colorToken: true },
        },
      },
      take: 50,
    });
    return ok(reports);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error retrieving reports.";
    return err(message);
  }
}
