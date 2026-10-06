/**
 * Chigir Ale - Data Retention & Governance Service
 * Spec: Section 124 — Data Retention
 *
 * Implements configurable retention policies across civic entities,
 * automated cutoff calculations, and archival rules.
 */

export type RetentionCategory =
  | "AUDIT_LOGS"
  | "NOTIFICATIONS"
  | "AI_JOBS"
  | "RESOLVED_MEDIA"
  | "AUTHENTICATION_SESSIONS"
  | "REPORTS";

export interface RetentionPolicy {
  category: RetentionCategory;
  retentionDays: number | null; // null = indefinite
  description: string;
  isLegalRequirement: boolean;
  actionOnExpiry: "DELETE" | "ANONYMIZE" | "ARCHIVE" | "RETAIN_PERMANENTLY";
}

export const RETENTION_POLICIES: Record<RetentionCategory, RetentionPolicy> = {
  AUDIT_LOGS: {
    category: "AUDIT_LOGS",
    retentionDays: 2555, // 7 years statutory requirement
    description: "Append-only administrative and lifecycle action trail",
    isLegalRequirement: true,
    actionOnExpiry: "ARCHIVE",
  },
  NOTIFICATIONS: {
    category: "NOTIFICATIONS",
    retentionDays: 90, // 90 days
    description: "Ephemeral user notifications and push alert history",
    isLegalRequirement: false,
    actionOnExpiry: "DELETE",
  },
  AI_JOBS: {
    category: "AI_JOBS",
    retentionDays: 30, // 30 days
    description: "Intermediate AI classification and transcription processing logs",
    isLegalRequirement: false,
    actionOnExpiry: "DELETE",
  },
  RESOLVED_MEDIA: {
    category: "RESOLVED_MEDIA",
    retentionDays: 365, // 1 year post resolution
    description: "Non-critical evidence photos and audio recordings of resolved incidents",
    isLegalRequirement: false,
    actionOnExpiry: "ARCHIVE",
  },
  AUTHENTICATION_SESSIONS: {
    category: "AUTHENTICATION_SESSIONS",
    retentionDays: 30, // 30 days
    description: "Expired user authentication sessions",
    isLegalRequirement: false,
    actionOnExpiry: "DELETE",
  },
  REPORTS: {
    category: "REPORTS",
    retentionDays: null, // Indefinite
    description: "Public infrastructure incident registry and resolution records",
    isLegalRequirement: true,
    actionOnExpiry: "RETAIN_PERMANENTLY",
  },
};

export class RetentionService {
  /**
   * Get policy definition for an entity category.
   */
  static getPolicy(category: RetentionCategory): RetentionPolicy {
    return RETENTION_POLICIES[category];
  }

  /**
   * Calculate the date prior to which records should be archived/deleted.
   * Returns null if policy specifies indefinite retention.
   */
  static calculateCutoffDate(category: RetentionCategory, fromDate = new Date()): Date | null {
    const policy = this.getPolicy(category);
    if (policy.retentionDays === null) {
      return null;
    }
    const cutoff = new Date(fromDate.getTime());
    cutoff.setDate(cutoff.getDate() - policy.retentionDays);
    return cutoff;
  }

  /**
   * Check whether a record created at `recordDate` is expired under the policy.
   */
  static isExpired(
    category: RetentionCategory,
    recordDate: Date,
    evaluationDate = new Date()
  ): boolean {
    const cutoff = this.calculateCutoffDate(category, evaluationDate);
    if (!cutoff) return false;
    return recordDate.getTime() < cutoff.getTime();
  }

  /**
   * Return entire active retention policy catalog.
   */
  static getAllPolicies(): Record<RetentionCategory, RetentionPolicy> {
    return { ...RETENTION_POLICIES };
  }
}
