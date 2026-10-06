/**
 * Chigir Ale - Idempotency Service
 * Spec: Section 101 — Idempotency
 *
 * Prevents duplicate side effects from repeated client requests,
 * network retries, double-clicks, and webhook delivery storms.
 */
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export type IdempotencyStatus = "NEW" | "PENDING" | "COMPLETED";

export interface IdempotencyCheckResult {
  status: IdempotencyStatus;
  response?: unknown;
  statusCode?: number;
}

export class IdempotencyService {
  private static memoryFallback = new Map<
    string,
    { status: IdempotencyStatus; response?: unknown; statusCode?: number; expiresAt: number }
  >();

  /**
   * Acquire an idempotency lock for a given key and operational scope.
   */
  static async acquire(
    key: string,
    scope: string,
    userId?: string,
    ttlSeconds = 300
  ): Promise<IdempotencyCheckResult> {
    const compoundKey = `${scope}:${key.trim()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    if (process.env.NODE_ENV === "test") {
      const mem = this.memoryFallback.get(compoundKey);
      if (mem) {
        if (Date.now() > mem.expiresAt) {
          this.memoryFallback.delete(compoundKey);
        } else if (mem.status === "COMPLETED") {
          return {
            status: "COMPLETED",
            response: mem.response,
            statusCode: mem.statusCode,
          };
        } else {
          return { status: "PENDING" };
        }
      }

      this.memoryFallback.set(compoundKey, {
        status: "PENDING",
        expiresAt: expiresAt.getTime(),
      });

      return { status: "NEW" };
    }

    try {
      // 1. Try DB lookup
      const existing = await prisma.idempotencyKey.findUnique({
        where: { key: compoundKey },
      });

      if (existing) {
        // If expired, delete and allow fresh execution
        if (existing.expiresAt.getTime() < now.getTime()) {
          await prisma.idempotencyKey.delete({ where: { key: compoundKey } });
        } else if (existing.response !== null && existing.response !== undefined) {
          return {
            status: "COMPLETED",
            response: existing.response,
            statusCode: existing.statusCode ?? 200,
          };
        } else {
          return { status: "PENDING" };
        }
      }

      // 2. Insert new lock
      await prisma.idempotencyKey.create({
        data: {
          key: compoundKey,
          scope,
          userId,
          lockedAt: now,
          expiresAt,
        },
      });

      return { status: "NEW" };
    } catch {
      // Memory fallback for headless/test environments when DB is unreachable
      const mem = this.memoryFallback.get(compoundKey);
      if (mem) {
        if (Date.now() > mem.expiresAt) {
          this.memoryFallback.delete(compoundKey);
        } else if (mem.status === "COMPLETED") {
          return {
            status: "COMPLETED",
            response: mem.response,
            statusCode: mem.statusCode,
          };
        } else {
          return { status: "PENDING" };
        }
      }

      this.memoryFallback.set(compoundKey, {
        status: "PENDING",
        expiresAt: expiresAt.getTime(),
      });

      return { status: "NEW" };
    }
  }

  /**
   * Complete the idempotent operation and save response for future replays.
   */
  static async saveResponse(
    key: string,
    scope: string,
    response: unknown,
    statusCode = 200
  ): Promise<void> {
    const compoundKey = `${scope}:${key.trim()}`;

    if (process.env.NODE_ENV === "test") {
      const mem = this.memoryFallback.get(compoundKey);
      if (mem) {
        mem.status = "COMPLETED";
        mem.response = response;
        mem.statusCode = statusCode;
      }
      return;
    }

    try {
      await prisma.idempotencyKey.update({
        where: { key: compoundKey },
        data: {
          response: response as Prisma.InputJsonValue,
          statusCode,
        },
      });
    } catch {
      const mem = this.memoryFallback.get(compoundKey);
      if (mem) {
        mem.status = "COMPLETED";
        mem.response = response;
        mem.statusCode = statusCode;
      }
    }
  }

  /**
   * Release lock on failure so the client can safely retry.
   */
  static async release(key: string, scope: string): Promise<void> {
    const compoundKey = `${scope}:${key.trim()}`;

    if (process.env.NODE_ENV === "test") {
      this.memoryFallback.delete(compoundKey);
      return;
    }

    try {
      await prisma.idempotencyKey.deleteMany({
        where: { key: compoundKey },
      });
    } catch {
      this.memoryFallback.delete(compoundKey);
    }
  }

  /**
   * Reset in-memory fallback cache (used for unit tests).
   */
  static reset(): void {
    this.memoryFallback.clear();
  }
}
