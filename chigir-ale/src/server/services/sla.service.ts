/**
 * Chigir Ale - SLA & Escalation Engine
 * Spec: Sections 119 (SLA and Resolution Targets) & 120 (Escalation)
 * Tracks review times, resolution deadlines, SLA warning thresholds,
 * breaches, and escalation levels.
 */
import type { Severity, ReportStatus } from "@prisma/client";

export interface SLATargetConfig {
  reviewTargetMinutes: number;
  resolutionTargetMinutes: number;
}

export const DEFAULT_SLA_CONFIG: Record<Severity, SLATargetConfig> = {
  CRITICAL: {
    reviewTargetMinutes: 15, // 15 mins (Spec Section 119)
    resolutionTargetMinutes: 24 * 60, // 24 hours
  },
  HIGH: {
    reviewTargetMinutes: 2 * 60, // 2 hours
    resolutionTargetMinutes: 48 * 60, // 48 hours
  },
  MEDIUM: {
    reviewTargetMinutes: 24 * 60, // 24 hours
    resolutionTargetMinutes: 120 * 60, // 5 days
  },
  LOW: {
    reviewTargetMinutes: 72 * 60, // 72 hours
    resolutionTargetMinutes: 240 * 60, // 10 days
  },
};

export type SLAStatus = "MET" | "WITHIN_TARGET" | "WARNING" | "BREACHED";
export type EscalationLevel = "NONE" | "SLA_WARNING" | "DEPARTMENT_MANAGER" | "ORG_ADMIN";

export interface SLAMetrics {
  reviewDeadline: Date;
  resolutionDeadline: Date;
  reviewStatus: SLAStatus;
  resolutionStatus: SLAStatus;
  escalationLevel: EscalationLevel;
  reviewElapsedMinutes: number;
  resolutionElapsedMinutes: number;
  isReviewBreached: boolean;
  isResolutionBreached: boolean;
  overallStatus: SLAStatus;
}

export class SLAService {
  /**
   * Computes comprehensive SLA metrics and escalation status for a report.
   */
  static evaluate(params: {
    severity: Severity;
    status: ReportStatus;
    reportedAt: Date | string;
    verifiedAt?: Date | string | null;
    resolvedAt?: Date | string | null;
    closedAt?: Date | string | null;
    config?: SLATargetConfig;
    now?: Date;
  }): SLAMetrics {
    const now = params.now ?? new Date();
    const reportedDate = new Date(params.reportedAt);
    const config = params.config ?? DEFAULT_SLA_CONFIG[params.severity];

    const reviewDeadline = new Date(reportedDate.getTime() + config.reviewTargetMinutes * 60 * 1000);
    const resolutionDeadline = new Date(
      reportedDate.getTime() + config.resolutionTargetMinutes * 60 * 1000
    );

    // 1. Review SLA evaluation
    const isReviewed =
      params.verifiedAt ||
      [
        "VERIFIED",
        "ASSIGNED",
        "IN_PROGRESS",
        "BLOCKED",
        "RESOLVED",
        "AWAITING_CONFIRMATION",
        "CLOSED",
        "REJECTED",
        "DUPLICATE",
      ].includes(params.status);

    let reviewElapsedMinutes = 0;
    let reviewStatus: SLAStatus = "WITHIN_TARGET";

    if (isReviewed) {
      const reviewDate = params.verifiedAt ? new Date(params.verifiedAt) : now;
      reviewElapsedMinutes = Math.max(
        0,
        Math.floor((reviewDate.getTime() - reportedDate.getTime()) / (60 * 1000))
      );
      reviewStatus = reviewElapsedMinutes <= config.reviewTargetMinutes ? "MET" : "BREACHED";
    } else {
      reviewElapsedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - reportedDate.getTime()) / (60 * 1000))
      );
      const ratio = reviewElapsedMinutes / config.reviewTargetMinutes;
      if (ratio > 1.0) {
        reviewStatus = "BREACHED";
      } else if (ratio >= 0.75) {
        reviewStatus = "WARNING";
      } else {
        reviewStatus = "WITHIN_TARGET";
      }
    }

    // 2. Resolution SLA evaluation
    const isResolved =
      params.resolvedAt ||
      params.closedAt ||
      ["RESOLVED", "AWAITING_CONFIRMATION", "CLOSED"].includes(params.status);

    let resolutionElapsedMinutes = 0;
    let resolutionStatus: SLAStatus = "WITHIN_TARGET";

    if (isResolved) {
      const finishDate = params.resolvedAt
        ? new Date(params.resolvedAt)
        : params.closedAt
        ? new Date(params.closedAt)
        : now;
      resolutionElapsedMinutes = Math.max(
        0,
        Math.floor((finishDate.getTime() - reportedDate.getTime()) / (60 * 1000))
      );
      resolutionStatus =
        resolutionElapsedMinutes <= config.resolutionTargetMinutes ? "MET" : "BREACHED";
    } else {
      resolutionElapsedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - reportedDate.getTime()) / (60 * 1000))
      );
      const resRatio = resolutionElapsedMinutes / config.resolutionTargetMinutes;
      if (resRatio > 1.0) {
        resolutionStatus = "BREACHED";
      } else if (resRatio >= 0.75) {
        resolutionStatus = "WARNING";
      } else {
        resolutionStatus = "WITHIN_TARGET";
      }
    }

    const isReviewBreached = reviewStatus === "BREACHED";
    const isResolutionBreached = resolutionStatus === "BREACHED";

    // 3. Overall Status & Escalation Level (Spec Section 120)
    let overallStatus: SLAStatus = "WITHIN_TARGET";
    if (isReviewBreached || isResolutionBreached) {
      overallStatus = "BREACHED";
    } else if (reviewStatus === "WARNING" || resolutionStatus === "WARNING") {
      overallStatus = "WARNING";
    } else if (isResolved) {
      overallStatus = "MET";
    }

    let escalationLevel: EscalationLevel = "NONE";
    if (overallStatus === "BREACHED") {
      const worstRatio = Math.max(
        !isReviewed ? reviewElapsedMinutes / config.reviewTargetMinutes : 0,
        !isResolved ? resolutionElapsedMinutes / config.resolutionTargetMinutes : 0
      );
      // If elapsed time is more than 1.5x the target, escalate to Organization Administrator
      if (worstRatio > 1.5) {
        escalationLevel = "ORG_ADMIN";
      } else {
        escalationLevel = "DEPARTMENT_MANAGER";
      }
    } else if (overallStatus === "WARNING") {
      escalationLevel = "SLA_WARNING";
    }

    return {
      reviewDeadline,
      resolutionDeadline,
      reviewStatus,
      resolutionStatus,
      escalationLevel,
      reviewElapsedMinutes,
      resolutionElapsedMinutes,
      isReviewBreached,
      isResolutionBreached,
      overallStatus,
    };
  }
}
