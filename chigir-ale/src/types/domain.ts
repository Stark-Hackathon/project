/**
 * Chigir Ale - Core Architecture & Domain Baseline Types
 * Specification Section: 1-4, 146, 171
 */

/**
 * Standard Result type pattern for domain services and operations
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * The 8 steps of the Chigir Ale Core Incident Lifecycle
 */
export const CORE_LIFECYCLE_STEPS = [
  "SEE",
  "REPORT",
  "LOCATE",
  "VERIFY",
  "ASSIGN",
  "FIX",
  "CONFIRM",
  "LEARN",
] as const;

export type CoreLifecycleStep = (typeof CORE_LIFECYCLE_STEPS)[number];

/**
 * Core User Roles defined in Chigir Ale Specification (Section 5)
 */
export const USER_ROLES = [
  "CITIZEN",
  "AUTHORITY_STAFF",
  "FIELD_WORKER",
  "SUPERVISOR",
  "ORGANIZATION_ADMIN",
  "SYSTEM_ADMIN",
  "MODERATOR",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
