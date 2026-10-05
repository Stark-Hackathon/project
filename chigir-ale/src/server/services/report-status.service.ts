/**
 * Chigir Ale - Report Status Transition Service
 * Spec: Sections 8 (Report Lifecycle) & 9 (Additional Statuses)
 * Enforces valid state machine transitions. No DB access — pure logic.
 */
import type { ReportStatus } from "@prisma/client";

// Legal transitions: from status -> set of allowed next statuses
// Spec section 8 (core path) + section 9 (additional statuses)
const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["NEEDS_INFORMATION", "VERIFIED", "REJECTED", "DUPLICATE", "CANCELLED"],
  NEEDS_INFORMATION: ["UNDER_REVIEW", "CANCELLED"],
  VERIFIED: ["ASSIGNED", "CANCELLED"],
  REJECTED: ["REOPENED"],
  DUPLICATE: ["REOPENED"],
  ASSIGNED: ["IN_PROGRESS", "UNDER_REVIEW", "CANCELLED"],
  IN_PROGRESS: ["BLOCKED", "RESOLVED", "UNDER_REVIEW"],
  BLOCKED: ["IN_PROGRESS", "UNDER_REVIEW"],
  RESOLVED: ["AWAITING_CONFIRMATION", "CLOSED"],
  AWAITING_CONFIRMATION: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["UNDER_REVIEW"],
  CANCELLED: ["REOPENED"],
};

export class ReportStatusService {
  /**
   * Returns true if transitioning from `from` to `to` is a legal move.
   */
  static canTransition(from: ReportStatus, to: ReportStatus): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Returns all statuses that `from` can legally transition to.
   */
  static allowedNext(from: ReportStatus): ReportStatus[] {
    return ALLOWED_TRANSITIONS[from] ?? [];
  }

  /**
   * Throws an error if the transition is not legal.
   * Use this to guard status-change operations in services.
   */
  static assertCanTransition(from: ReportStatus, to: ReportStatus): void {
    if (!ReportStatusService.canTransition(from, to)) {
      throw new Error(
        `INVALID_TRANSITION: Cannot move report from ${from} to ${to}.`
      );
    }
  }

  /**
   * Returns true if the status is a terminal state
   * (no further transitions possible by normal operational flow).
   */
  static isTerminal(status: ReportStatus): boolean {
    return status === "CLOSED" || status === "CANCELLED";
  }

  /**
   * Returns true if the status is part of the core 7-step lifecycle.
   * Spec section 8 distinguishes core from exceptional statuses.
   */
  static isCoreLifecycle(status: ReportStatus): boolean {
    const core: ReportStatus[] = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "VERIFIED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ];
    return core.includes(status);
  }
}
