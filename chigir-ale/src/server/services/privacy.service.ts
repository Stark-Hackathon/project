/**
 * Chigir Ale - Data Privacy, Redaction & Account Deletion Service
 * Spec: Section 84 (Privacy) & Section 123 (Account Deletion)
 *
 * Implements strict citizen privacy protection, public view redaction,
 * and account anonymization while preserving infrastructure incident and audit integrity.
 */
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "./audit.service";
import { MapService } from "./map.service";

export interface PublicRedactedReport {
  id: string;
  publicReference: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  };
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string | null;
  reportedAt: Date;
  resolvedAt: Date | null;
  confirmationCount: number;
  reporterDisplayName: string;
  publicEvents: Array<{
    eventType: string;
    toStatus: string | null;
    message: string | null;
    createdAt: Date;
  }>;
}

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export class PrivacyService {
  /**
   * Redact a report for public consumption per Spec Section 84.
   * Strips all reporter PII (email, phone, user IDs), internal notes,
   * non-public events, and provides approximate public coordinates.
   */
  static redactReportForPublic(report: {
    id: string;
    publicReference: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    formattedAddress?: string | null;
    reportedAt: Date;
    resolvedAt?: Date | null;
    confirmationCount?: number;
    reporter?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
    category: {
      id: string;
      name: string;
      slug: string;
      icon?: string | null;
    };
    events?: Array<{
      eventType: string;
      toStatus: string | null;
      message: string | null;
      visibility: string;
      createdAt: Date;
    }>;
  }): PublicRedactedReport {
    // Generate blurred/approximate coordinates for public privacy (Spec §18 & §84)
    let approxLat = report.latitude;
    let approxLng = report.longitude;
    if (report.latitude !== null && report.longitude !== null) {
      const approx = MapService.toPublicCoordinate(
        report.latitude,
        report.longitude,
        report.id
      );
      approxLat = approx.latitude;
      approxLng = approx.longitude;
    }

    // Filter to only PUBLIC events (never internal or system operational notes)
    const publicEvents = (report.events ?? [])
      .filter((e) => e.visibility === "PUBLIC")
      .map((e) => ({
        eventType: e.eventType,
        toStatus: e.toStatus,
        message: e.message,
        createdAt: e.createdAt,
      }));

    // Reporter display name: first name only or "Community Member"
    let reporterDisplayName = "Community Member";
    if (report.reporter?.name) {
      const parts = report.reporter.name.trim().split(" ");
      reporterDisplayName = parts[0] || "Community Member";
    }

    return {
      id: report.id,
      publicReference: report.publicReference,
      title: report.title,
      description: report.description,
      severity: report.severity,
      status: report.status,
      category: report.category,
      latitude: approxLat,
      longitude: approxLng,
      formattedAddress: report.formattedAddress ?? null,
      reportedAt: report.reportedAt,
      resolvedAt: report.resolvedAt ?? null,
      confirmationCount: report.confirmationCount ?? 0,
      reporterDisplayName,
      publicEvents,
    };
  }

  /**
   * Account Deletion & Anonymization (Spec Section 123).
   *
   * Invariant:
   * Reporter → anonymized / deactivated
   * Report → retained (civic incident history preserved)
   * Audit → retained
   * Private contact data → scrubbed
   */
  static async anonymizeUserAccount(
    userId: string,
    txClient?: PrismaTx
  ): Promise<{ success: boolean; anonymizedId: string }> {
    const execute = async (tx: PrismaTx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND: User account does not exist.");
      }

      // Generate irreversible pseudonymous placeholder
      const anonymizedEmail = `anonymized-${userId.slice(0, 8)}@deleted.chigir.internal`;

      // 1. Scrub User PII and mark deactivated
      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Former Citizen",
          email: anonymizedEmail,
          phone: null,
          avatarUrl: null,
          passwordHash: null,
          status: "DEACTIVATED",
          deletedAt: new Date(),
        },
      });

      // 2. Revoke all active sessions and OAuth accounts
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      // 3. Clear push device registration tokens to stop future notifications
      await tx.device.deleteMany({ where: { userId } });

      // 4. Log audit record of account anonymization (immutable audit trail)
      await AuditService.log(
        {
          actorUserId: userId,
          action: "ACCOUNT_ANONYMIZED_AND_DEACTIVATED",
          entityType: "User",
          entityId: userId,
          before: { status: user.status },
          after: { status: "DEACTIVATED", email: anonymizedEmail },
        },
        tx
      );

      return { success: true, anonymizedId: userId };
    };

    if (txClient) {
      return execute(txClient);
    }
    return prisma.$transaction(execute);
  }
}
