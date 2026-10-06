/**
 * Chigir Ale - Asynchronous AI Job Service
 * Spec: Section 36 (AI Job Architecture), Section 65 (AIJob Model), Section 139 (AI Provider Failure Resilience)
 * Manages asynchronous job creation, state transitions, retries, and worker execution.
 */
import { prisma } from "@/lib/db/prisma";
import type { AIJobStatus } from "@prisma/client";
import { AIService } from "./ai.service";

export const MAX_AI_JOB_ATTEMPTS = 3;

export class AIJobService {
  /**
   * Enqueue a new AI job for background processing.
   */
  static async enqueueJob(
    reportId: string,
    type: string,
    inputReference?: string
  ) {
    const provider = AIService.getProvider();

    return prisma.aIJob.create({
      data: {
        reportId,
        type,
        status: "PENDING",
        provider: provider.name,
        model: provider.model,
        inputReference: inputReference ?? reportId,
        attempts: 0,
      },
    });
  }

  /**
   * Dispatch all standard AI jobs for a newly submitted report.
   * Spec section 139: Called asynchronously/decoupled so AI never blocks core report submission.
   */
  static async dispatchReportAIJobs(reportId: string): Promise<void> {
    try {
      const jobTypes = [
        "CATEGORY_CLASSIFICATION",
        "REPORT_SUMMARIZATION",
        "DUPLICATE_DETECTION",
        "SMART_RECOMMENDATION",
      ];

      for (const type of jobTypes) {
        await AIJobService.enqueueJob(reportId, type);
      }
    } catch (err) {
      // Spec §139: Failure in AI dispatching must NEVER disrupt the report flow
      console.warn("Non-fatal: Failed to dispatch AI background jobs:", err);
    }
  }

  /**
   * Process a specific AI job by ID with automatic retries and failure handling.
   */
  static async processJob(jobId: string): Promise<boolean> {
    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status === "COMPLETED" || job.status === "CANCELLED") {
      return false;
    }

    if (!job.reportId) {
      await prisma.aIJob.update({
        where: { id: jobId },
        data: { status: "FAILED", error: "Job has no associated report ID" },
      });
      return false;
    }

    // Mark job as PROCESSING
    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    try {
      // Execute the appropriate AI task based on type
      switch (job.type) {
        case "CATEGORY_CLASSIFICATION":
          await AIService.classifyReport(job.reportId);
          break;
        case "REPORT_SUMMARIZATION":
          await AIService.summarizeReport(job.reportId);
          break;
        case "DUPLICATE_DETECTION":
          await AIService.detectDuplicatesForReport(job.reportId);
          break;
        case "SMART_RECOMMENDATION":
          await AIService.getSmartRecommendations(job.reportId);
          break;
        default:
          throw new Error(`Unknown AI job type: ${job.type}`);
      }

      // Mark job as COMPLETED
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          error: null,
        },
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown AI execution error";
      const nextAttempts = job.attempts + 1;

      // Check max retries (Spec §36)
      const isFinalFailure = nextAttempts >= MAX_AI_JOB_ATTEMPTS;
      const nextStatus: AIJobStatus = isFinalFailure ? "FAILED" : "PENDING";

      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: nextStatus,
          error: errorMessage,
        },
      });

      return false;
    }
  }

  /**
   * Process next batch of pending AI jobs.
   */
  static async processPendingJobs(limit: number = 5): Promise<number> {
    const pendingJobs = await prisma.aIJob.findMany({
      where: {
        status: "PENDING",
        attempts: { lt: MAX_AI_JOB_ATTEMPTS },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true },
    });

    let successCount = 0;
    for (const job of pendingJobs) {
      const ok = await AIJobService.processJob(job.id);
      if (ok) successCount++;
    }

    return successCount;
  }

  /**
   * Retry a failed job manually or programmatically.
   */
  static async retryJob(jobId: string): Promise<boolean> {
    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new Error("Job not found");

    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        error: null,
      },
    });

    return AIJobService.processJob(jobId);
  }

  /**
   * Retrieve all jobs for a report.
   */
  static async getReportJobs(reportId: string) {
    return prisma.aIJob.findMany({
      where: { reportId },
      orderBy: { createdAt: "desc" },
    });
  }
}
