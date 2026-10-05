/**
 * Chigir Ale - Audit Service
 * Spec: Section 71 — Audit Log (append-only)
 * Records important domain actions for compliance and traceability.
 * IMPORTANT: Never call update or delete on AuditLog records.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface AuditEntry {
  organizationId?: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class AuditService {
  /**
   * Append a new audit log record.
   * Can be called inside a Prisma transaction by passing `tx`.
   * Audit logs are NEVER updated or deleted by application code.
   * Spec: Section 71
   */
  static async log(
    entry: AuditEntry,
    tx?: PrismaTransactionClient
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        before: (entry.before ?? {}) as Prisma.InputJsonValue,
        after: (entry.after ?? {}) as Prisma.InputJsonValue,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        requestId: entry.requestId,
      },
    });
  }
}
