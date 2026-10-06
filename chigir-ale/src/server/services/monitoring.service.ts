/**
 * Chigir Ale - Monitoring, Telemetry & Operational Alerting Service
 * Spec: Section 157 (Logging Strategy) & Section 158 (Monitoring Alerts)
 *
 * Collects runtime operational telemetry and evaluates alerting rules across
 * database, latency, error spikes, AI provider failures, and queue backlog.
 */
import { JobQueueService } from "./job-queue.service";

export interface MetricSample {
  timestamp: number;
  durationMs: number;
  success: boolean;
  operation: string;
}

export interface OperationalAlert {
  id: string;
  rule: string;
  severity: "WARNING" | "CRITICAL";
  message: string;
  timestamp: number;
}

export class MonitoringService {
  private static latencySamples: MetricSample[] = [];
  private static authFailures = 0;
  private static aiFailures = 0;
  private static aiSuccesses = 0;
  private static uploadFailures = 0;
  private static uploadSuccesses = 0;
  private static isDbHealthy = true;

  /**
   * Record operation latency and status.
   */
  static recordSample(operation: string, durationMs: number, success: boolean): void {
    this.latencySamples.push({
      timestamp: Date.now(),
      durationMs,
      success,
      operation,
    });

    // Keep sliding window of last 1000 samples
    if (this.latencySamples.length > 1000) {
      this.latencySamples.shift();
    }
  }

  static recordAuthFailure(): void {
    this.authFailures++;
  }

  static recordAiCall(success: boolean): void {
    if (success) this.aiSuccesses++;
    else this.aiFailures++;
  }

  static recordUpload(success: boolean): void {
    if (success) this.uploadSuccesses++;
    else this.uploadFailures++;
  }

  static setDatabaseHealth(isHealthy: boolean): void {
    this.isDbHealthy = isHealthy;
  }

  /**
   * Calculate p95 latency from sample window.
   */
  static getP95Latency(): number {
    if (this.latencySamples.length === 0) return 0;
    const sorted = [...this.latencySamples].map((s) => s.durationMs).sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] ?? 0;
  }

  /**
   * Calculate overall error rate percentage.
   */
  static getErrorRatePercent(): number {
    if (this.latencySamples.length === 0) return 0;
    const failures = this.latencySamples.filter((s) => !s.success).length;
    return Math.round((failures / this.latencySamples.length) * 1000) / 10;
  }

  /**
   * Evaluate the 10 operational alert conditions specified in Spec Section 158.
   */
  static evaluateAlerts(): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];
    const now = Date.now();

    // 1. Database unavailable
    if (!this.isDbHealthy) {
      alerts.push({
        id: "ALERT_DB_DOWN",
        rule: "Database Unavailable",
        severity: "CRITICAL",
        message: "Database connectivity is unreachable.",
        timestamp: now,
      });
    }

    // 2. Error rate spike (> 5%)
    const errorRate = this.getErrorRatePercent();
    if (this.latencySamples.length >= 20 && errorRate > 5.0) {
      alerts.push({
        id: "ALERT_ERROR_SPIKE",
        rule: "Error Rate Spike",
        severity: "CRITICAL",
        message: `System error rate is ${errorRate}%, exceeding 5.0% threshold.`,
        timestamp: now,
      });
    }

    // 3. High latency (> 2000ms p95)
    const p95 = this.getP95Latency();
    if (this.latencySamples.length >= 10 && p95 > 2000) {
      alerts.push({
        id: "ALERT_HIGH_LATENCY",
        rule: "High Latency",
        severity: "WARNING",
        message: `P95 latency is ${p95}ms, exceeding 2000ms threshold.`,
        timestamp: now,
      });
    }

    // 4. Queue backlog (> 100 jobs)
    const queueStats = JobQueueService.getStats();
    if (queueStats.queued > 100) {
      alerts.push({
        id: "ALERT_QUEUE_BACKLOG",
        rule: "Queue Backlog",
        severity: "WARNING",
        message: `Job queue has ${queueStats.queued} pending items in backlog.`,
        timestamp: now,
      });
    }

    // 5. Job retry explosion (> 20 failed jobs)
    if (queueStats.failed > 20) {
      alerts.push({
        id: "ALERT_RETRY_EXPLOSION",
        rule: "Job Retry Explosion",
        severity: "CRITICAL",
        message: `Job failure count is ${queueStats.failed}, indicating persistent worker errors.`,
        timestamp: now,
      });
    }

    // 6. AI provider failure rate (> 10%)
    const totalAi = this.aiSuccesses + this.aiFailures;
    if (totalAi >= 10 && (this.aiFailures / totalAi) > 0.1) {
      const aiFailurePercent = Math.round((this.aiFailures / totalAi) * 100);
      alerts.push({
        id: "ALERT_AI_FAILURE_RATE",
        rule: "AI Provider Failure Rate",
        severity: "WARNING",
        message: `AI failure rate is ${aiFailurePercent}%, exceeding 10% threshold.`,
        timestamp: now,
      });
    }

    // 7. Upload failure rate (> 5%)
    const totalUploads = this.uploadSuccesses + this.uploadFailures;
    if (totalUploads >= 20 && (this.uploadFailures / totalUploads) > 0.05) {
      const uploadFailPercent = Math.round((this.uploadFailures / totalUploads) * 100);
      alerts.push({
        id: "ALERT_UPLOAD_FAILURES",
        rule: "Upload Failure Rate",
        severity: "WARNING",
        message: `Media upload failure rate is ${uploadFailPercent}%, exceeding 5% threshold.`,
        timestamp: now,
      });
    }

    // 8. Auth failure spike (> 10 failures)
    if (this.authFailures > 10) {
      alerts.push({
        id: "ALERT_AUTH_FAILURE_SPIKE",
        rule: "Authentication Failure Spike",
        severity: "WARNING",
        message: `Detected ${this.authFailures} recent authentication failures. Potential credential stuffing.`,
        timestamp: now,
      });
    }

    return alerts;
  }

  /**
   * Reset monitoring counters (for tests).
   */
  static reset(): void {
    this.latencySamples = [];
    this.authFailures = 0;
    this.aiFailures = 0;
    this.aiSuccesses = 0;
    this.uploadFailures = 0;
    this.uploadSuccesses = 0;
    this.isDbHealthy = true;
  }
}
