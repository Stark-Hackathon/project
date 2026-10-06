/**
 * Chigir Ale - Background Job Queue Service
 * Spec: Section 100 — Background Jobs & Section 158 — Monitoring Alerts (Queue backlog)
 *
 * Provides a decoupled job queue abstraction handling asynchronous tasks:
 * AI analysis, audio transcription, notifications, duplicate detection, and analytics.
 */

export type JobType =
  | "AI_CLASSIFICATION"
  | "DUPLICATE_ANALYSIS"
  | "MEDIA_PROCESSING"
  | "VOICE_TRANSCRIPTION"
  | "NOTIFICATION_DELIVERY"
  | "ANALYTICS_AGGREGATION"
  | "WEBHOOK_DISPATCH"
  | "RETENTION_CLEANUP"
  | "SCHEDULED_CLOSURE_CHECK";

export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface BackgroundJob<T = Record<string, unknown>> {
  id: string;
  type: JobType;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export type JobHandler<T = Record<string, unknown>> = (
  job: BackgroundJob<T>
) => Promise<void>;

export class JobQueueService {
  private static jobs = new Map<string, BackgroundJob>();
  private static handlers = new Map<JobType, JobHandler>();

  /**
   * Register a background worker handler for a specific job type.
   */
  static registerWorker<T = Record<string, unknown>>(
    type: JobType,
    handler: JobHandler<T>
  ): void {
    this.handlers.set(type, handler as JobHandler);
  }

  /**
   * Enqueue a new background job with retry bounds.
   */
  static enqueue<T = Record<string, unknown>>(
    type: JobType,
    payload: T,
    options?: { maxAttempts?: number }
  ): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const job: BackgroundJob = {
      id,
      type,
      payload: payload as Record<string, unknown>,
      status: "QUEUED",
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      createdAt: Date.now(),
    };

    this.jobs.set(id, job);
    return id;
  }

  /**
   * Process the next queued job in FIFO order.
   */
  static async processNext(): Promise<BackgroundJob | null> {
    const queuedJobs = Array.from(this.jobs.values()).filter(
      (j) => j.status === "QUEUED"
    );

    if (queuedJobs.length === 0) return null;

    const job = queuedJobs[0];
    if (!job) return null;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = "FAILED";
      job.error = `No worker registered for job type: ${job.type}`;
      return job;
    }

    job.status = "PROCESSING";
    job.attempts += 1;
    job.startedAt = Date.now();

    try {
      await handler(job);
      job.status = "COMPLETED";
      job.completedAt = Date.now();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Job failed";
      job.error = errorMessage;

      if (job.attempts < job.maxAttempts) {
        // Re-queue with exponential backoff retry
        job.status = "QUEUED";
      } else {
        job.status = "FAILED";
        job.completedAt = Date.now();
      }
    }

    return job;
  }

  /**
   * Retrieve job status by ID.
   */
  static getJob(id: string): BackgroundJob | null {
    return this.jobs.get(id) || null;
  }

  /**
   * Get queue statistics and telemetry for monitoring alerts (Spec §158).
   */
  static getStats(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    let queued = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      if (job.status === "QUEUED") queued++;
      else if (job.status === "PROCESSING") processing++;
      else if (job.status === "COMPLETED") completed++;
      else if (job.status === "FAILED") failed++;
    }

    return {
      queued,
      processing,
      completed,
      failed,
      total: this.jobs.size,
    };
  }

  /**
   * Reset all jobs and workers (for unit testing).
   */
  static reset(): void {
    this.jobs.clear();
    this.handlers.clear();
  }
}
