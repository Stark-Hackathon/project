/**
 * Chigir Ale - Rate Limiting & Abuse Prevention Service
 * Spec: Section 81 (Rate Limiting) & Section 82 (Abuse Prevention)
 *
 * Implements in-memory sliding window rate limiting for critical operations.
 * Designed with pluggable backend semantics (in-memory default, Redis-ready).
 */

export type RateLimitAction =
  | "LOGIN"
  | "PASSWORD_RESET"
  | "REPORT_CREATION"
  | "MEDIA_UPLOAD"
  | "SEARCH"
  | "PUBLIC_MAP"
  | "AI_REQUEST"
  | "VOICE_PROCESSING"
  | "CONFIRMATION"
  | "NOTIFICATION_DISPATCH";

export interface RateLimitPolicy {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

// Stricter limits for critical operations per Spec Section 81
export const DEFAULT_RATE_LIMIT_POLICIES: Record<RateLimitAction, RateLimitPolicy> = {
  LOGIN: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 mins
  PASSWORD_RESET: { max: 3, windowMs: 30 * 60 * 1000 }, // 3 attempts per 30 mins
  REPORT_CREATION: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 reports per hour
  MEDIA_UPLOAD: { max: 20, windowMs: 60 * 60 * 1000 }, // 20 uploads per hour
  SEARCH: { max: 60, windowMs: 60 * 1000 }, // 60 searches per minute
  PUBLIC_MAP: { max: 120, windowMs: 60 * 1000 }, // 120 queries per minute
  AI_REQUEST: { max: 20, windowMs: 60 * 60 * 1000 }, // 20 AI queries per hour
  VOICE_PROCESSING: { max: 20, windowMs: 60 * 60 * 1000 }, // 20 audio transcriptions per hour
  CONFIRMATION: { max: 30, windowMs: 60 * 60 * 1000 }, // 30 confirmations per hour
  NOTIFICATION_DISPATCH: { max: 60, windowMs: 60 * 1000 }, // 60 notifications per minute
};

interface WindowEntry {
  timestamps: number[];
}

export class RateLimitService {
  private static store = new Map<string, WindowEntry>();

  /**
   * Check rate limit for a given key and action.
   * If limit is not exceeded, increments the hit counter.
   */
  static check(
    identifier: string,
    action: RateLimitAction,
    customPolicy?: Partial<RateLimitPolicy>
  ): RateLimitResult {
    const policy = {
      ...DEFAULT_RATE_LIMIT_POLICIES[action],
      ...customPolicy,
    };

    const now = Date.now();
    const storageKey = `${action}:${identifier.trim().toLowerCase()}`;
    const windowStart = now - policy.windowMs;

    let entry = this.store.get(storageKey);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(storageKey, entry);
    }

    // Filter out timestamps outside the active sliding window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    if (entry.timestamps.length >= policy.max) {
      const oldest = entry.timestamps[0] ?? now;
      const resetAt = oldest + policy.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

      return {
        success: false,
        limit: policy.max,
        remaining: 0,
        resetAt,
        retryAfterSeconds,
      };
    }

    // Record this hit
    entry.timestamps.push(now);
    const remaining = policy.max - entry.timestamps.length;
    const resetAt = now + policy.windowMs;

    return {
      success: true,
      limit: policy.max,
      remaining,
      resetAt,
    };
  }

  /**
   * Get HTTP headers for rate limit response.
   */
  static getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    };

    if (!result.success && result.retryAfterSeconds) {
      headers["Retry-After"] = String(result.retryAfterSeconds);
    }

    return headers;
  }

  /**
   * Reset rate limit bucket for testing or manual administrative unblock.
   */
  static reset(identifier?: string, action?: RateLimitAction): void {
    if (!identifier && !action) {
      this.store.clear();
      return;
    }
    if (identifier && action) {
      this.store.delete(`${action}:${identifier.trim().toLowerCase()}`);
      return;
    }
    // Purge matching prefix
    for (const key of Array.from(this.store.keys())) {
      if (
        (action && key.startsWith(`${action}:`)) ||
        (identifier && key.endsWith(`:${identifier.trim().toLowerCase()}`))
      ) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Periodic sweep of stale entries to prevent memory leaks.
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.store.entries())) {
      // If newest timestamp is older than 1 hour, purge entry
      const newest = entry.timestamps[entry.timestamps.length - 1] ?? 0;
      if (now - newest > 3600 * 1000) {
        this.store.delete(key);
      }
    }
  }
}
