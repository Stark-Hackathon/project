"use server";

/**
 * Chigir Ale - Citizen Reporting Server Actions
 * Spec: Section 13-20 (Reporting Experience), 148 (Forms & Validation), 74 (Transactions)
 */
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { ReportRepository } from "@/server/repositories/report.repository";
import { CategoryRepository } from "@/server/repositories/category.repository";
import { prisma } from "@/lib/db/prisma";
import { NotificationService } from "@/server/services/notifications";
import { AIJobService } from "@/server/services/ai/ai-job.service";
import { ok, err, type Result } from "@/types/domain";

export const createReportSchema = z.object({
  categoryId: z.string().min(1, "Please select an infrastructure category"),
  title: z.string().min(3, "Title must be at least 3 characters").max(150, "Title is too long"),
  description: z
    .string()
    .min(10, "Please describe the problem with at least 10 characters")
    .max(3000, "Description cannot exceed 3000 characters"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationAccuracy: z.number().positive().optional(),
  formattedAddress: z.string().max(250).optional(),
  administrativeArea: z.string().max(100).optional(),
  mediaUrls: z.array(z.string()).max(5).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export type CreateReportFormData = z.infer<typeof createReportSchema>;

import { RateLimitService } from "@/server/services/rate-limit.service";
import { SanitizerService } from "@/server/services/sanitizer.service";
import { IdempotencyService } from "@/server/services/idempotency.service";
import { OutboxService } from "@/server/services/outbox.service";

export async function createReportAction(
  rawData: CreateReportFormData
): Promise<Result<{ reportId: string; publicReference: string }>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new Error("UNAUTHORIZED: Please sign in to submit a report."));
  }

  // Rate Limiting per Spec Section 81
  const rateLimit = RateLimitService.check(user.id, "REPORT_CREATION");
  if (!rateLimit.success) {
    return err(
      new Error(
        `Rate limit exceeded: Please wait ${rateLimit.retryAfterSeconds ?? 60} seconds before submitting another incident.`
      )
    );
  }

  const parsed = createReportSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return err(new Error(errorMsg));
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
    return err(new Error("A report submission with identical parameters is already processing."));
  }

  try {
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
      },
      user.id
    );

    // If media items are provided, record them
    if (data.mediaUrls && data.mediaUrls.length > 0) {
      await prisma.reportMedia.createMany({
        data: data.mediaUrls.map((url, index) => ({
          reportId: report.id,
          type: "IMAGE",
          storageKey: `evidence-${report.id}-${index}`,
          publicUrl: url,
        })),
      });
    }

    const resultData = {
      reportId: report.id,
      publicReference: report.publicReference,
    };

    // Save Idempotency response for future replays (Spec §101)
    await IdempotencyService.saveResponse(idempKey, "REPORT_CREATION", resultData);

    // Record Transactional Outbox Event (Spec §155 & §156)
    await OutboxService.recordEvent({
      type: "report.created",
      aggregateType: "Report",
      aggregateId: report.id,
      payload: {
        publicReference: report.publicReference,
        categoryId: report.categoryId,
        severity: report.severity,
        reporterId: user.id,
      },
    });

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
    return err(new Error(message));
  }
}

export async function getPublicReportAction(publicReference: string) {
  if (!publicReference || typeof publicReference !== "string") {
    return err(new Error("Invalid report reference."));
  }

  try {
    const report = await ReportRepository.findPublicByReference(publicReference.trim().toUpperCase());
    if (!report) {
      return err(new Error("Report not found. Please verify the reference number."));
    }
    return ok(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error retrieving report.";
    return err(new Error(message));
  }
}

export async function getCategoriesAction() {
  try {
    const categories = await CategoryRepository.listWithChildren();
    return ok(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error retrieving categories.";
    return err(new Error(message));
  }
}

export async function getMyReportsAction() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new Error("UNAUTHORIZED: Sign in required."));
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
    return err(new Error(message));
  }
}
