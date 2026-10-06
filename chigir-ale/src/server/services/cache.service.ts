/**
 * Chigir Ale - Caching Service
 * Spec: Section 99 (Caching) & Section 113 (Performance Targets)
 *
 * Implements high-throughput in-memory cache with TTL expiration,
 * tenant/user scoping guards, and prefix invalidation.
 */

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private static store = new Map<string, CacheItem<unknown>>();

  /**
   * Safe key constructor to enforce multi-tenant and user privacy scoping.
   * Spec Section 99: Never cache private responses without correct user/org scoping.
   */
  static buildKey(
    scope: "PUBLIC" | "ORG" | "USER",
    scopeId: string,
    resource: string
  ): string {
    return `${scope.toLowerCase()}:${scopeId}:${resource}`;
  }

  /**
   * Retrieve cached item if present and unexpired.
   */
  static get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Set value in cache with TTL (defaults to 300 seconds / 5 mins).
   */
  static set<T>(key: string, value: T, ttlSeconds = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Cache-aside helper: returns existing item, or computes, caches, and returns it.
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Invalidate a specific key.
   */
  static delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a given prefix.
   */
  static deletePrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cached entries.
   */
  static clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries to conserve memory.
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.store.entries())) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
