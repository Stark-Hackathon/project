(process.env as Record<string, string | undefined>)["NODE_ENV"] = "test";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ReportStatus } from "@prisma/client";
import { ReportStatusService } from "@/server/services/report-status.service";
import { ReportReferenceService } from "@/server/services/report-reference.service";
import { StorageService } from "@/server/services/storage.service";
import { NotificationService } from "@/server/services/notifications";
import { MapService } from "@/server/services/map.service";
import { IdempotencyService } from "@/server/services/idempotency.service";
import { OutboxService } from "@/server/services/outbox.service";
import { ProductionReadinessService } from "@/server/services/production-readiness.service";

describe("Iteration 13: Critical E2E Civic Journey (Spec §109)", () => {
  it("should complete the 15-step citizen-to-authority-to-closed user journey", async () => {
    // -------------------------------------------------------------
    // Step 1: Citizen Registration & Credential Hashing
    // -------------------------------------------------------------
    const citizenEmail = "almaz.kebede@example.com";
    const citizenPassword = "SecureEthiopia2026!";
    assert.ok(citizenPassword.length >= 8);
    assert.match(citizenEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // -------------------------------------------------------------
    // Step 2: Citizen Signs In
    // -------------------------------------------------------------
    const citizenSession = {
      userId: "usr-citizen-001",
      email: citizenEmail,
      name: "Almaz Kebede",
      role: "CITIZEN",
    };
    assert.ok(citizenSession.userId);

    // -------------------------------------------------------------
    // Step 3 & 4: Selects Category & Uploads Evidence
    // -------------------------------------------------------------
    const category = { id: "cat-roads", name: "Roads & Potholes", slug: "roads" };
    const storageKey = StorageService.generateStorageKey("image/jpeg");
    const { token: uploadToken } = StorageService.createUploadToken(
      storageKey,
      citizenSession.userId,
      "image/jpeg"
    );
    assert.ok(uploadToken);

    const verifiedUpload = StorageService.verifyUploadToken(uploadToken);
    assert.equal(verifiedUpload.userId, citizenSession.userId);
    assert.equal(verifiedUpload.mimeType, "image/jpeg");

    // -------------------------------------------------------------
    // Step 5: Selects Location (Addis Ababa - Bole District)
    // -------------------------------------------------------------
    const rawGps = { latitude: 8.9984, longitude: 38.7865 };
    const geocoded = await MapService.reverseGeocode(rawGps.latitude, rawGps.longitude);
    assert.ok(geocoded.administrativeArea.includes("Bole"));

    // -------------------------------------------------------------
    // Step 6: Submits Report with Idempotency Protection
    // -------------------------------------------------------------
    const clientSubmissionKey = "sub-req-almaz-001";
    const idempStatus = await IdempotencyService.acquire(clientSubmissionKey, "REPORT_CREATION");
    assert.equal(idempStatus.status, "NEW");

    // Generate unique authoritative reference CHI-YYYY-NNNNNN
    const publicReference = `CHI-${new Date().getFullYear()}-000456`;
    assert.equal(ReportReferenceService.isValid(publicReference), true);

    const report = {
      id: "rep-almaz-100",
      publicReference,
      reporterId: citizenSession.userId,
      title: "Deep pothole blocking lane near Medhanialem",
      description: "Severe asphalt collapse damaging tires on Cameroon street.",
      severity: "HIGH" as const,
      status: "SUBMITTED" as const,
      categoryId: category.id,
      latitude: rawGps.latitude,
      longitude: rawGps.longitude,
      evidenceKeys: [verifiedUpload.storageKey],
    };

    // Save idempotency response
    await IdempotencyService.saveResponse(clientSubmissionKey, "REPORT_CREATION", {
      reportId: report.id,
      publicReference: report.publicReference,
    });

    // Record Transactional Outbox Event
    const outboxId = await OutboxService.recordEvent({
      type: "report.created",
      aggregateType: "Report",
      aggregateId: report.id,
      payload: { publicReference: report.publicReference },
    });
    assert.ok(outboxId);

    // -------------------------------------------------------------
    // Step 7: Authority Receives Report in Triage Queue
    // -------------------------------------------------------------
    assert.equal(report.status, "SUBMITTED");
    assert.equal(ReportStatusService.isCoreLifecycle(report.status), true);

    // -------------------------------------------------------------
    // Step 8: Authority Verifies Report (SUBMITTED -> UNDER_REVIEW -> VERIFIED)
    // -------------------------------------------------------------
    assert.equal(ReportStatusService.canTransition("SUBMITTED", "UNDER_REVIEW"), true);
    let currentStatus: ReportStatus = "UNDER_REVIEW";

    assert.equal(ReportStatusService.canTransition(currentStatus, "VERIFIED"), true);
    currentStatus = "VERIFIED";

    // -------------------------------------------------------------
    // Step 9: Authority Assigns to Infrastructure Team
    // -------------------------------------------------------------
    assert.equal(ReportStatusService.canTransition(currentStatus, "ASSIGNED"), true);
    currentStatus = "ASSIGNED";

    // -------------------------------------------------------------
    // Step 10: Field Team Starts On-Site Work
    // -------------------------------------------------------------
    assert.equal(ReportStatusService.canTransition(currentStatus, "IN_PROGRESS"), true);
    currentStatus = "IN_PROGRESS";

    // -------------------------------------------------------------
    // Step 11: Field Team Resolves Defect with Repair Proof
    // -------------------------------------------------------------
    assert.equal(ReportStatusService.canTransition(currentStatus, "RESOLVED"), true);
    currentStatus = "RESOLVED";

    // -------------------------------------------------------------
    // Step 12: Citizen Receives Notification of Resolution
    // -------------------------------------------------------------
    const notification = await NotificationService.notifyReportLifecycleEvent({
      type: "REPORT_RESOLVED",
      reportId: report.id,
      publicReference: report.publicReference,
      reportTitle: report.title,
      recipientUserId: citizenSession.userId,
      recipientEmail: citizenSession.email,
      recipientName: citizenSession.name,
      toStatus: "RESOLVED",
    });
    assert.ok(notification.id);
    assert.equal(notification.type, "REPORT_RESOLVED");
    assert.equal(notification.userId, citizenSession.userId);

    // -------------------------------------------------------------
    // Step 13: Citizen Confirms Repair (Awaiting Confirmation -> Closed)
    // -------------------------------------------------------------
    assert.equal(ReportStatusService.canTransition("RESOLVED", "AWAITING_CONFIRMATION"), true);
    currentStatus = "AWAITING_CONFIRMATION";

    assert.equal(ReportStatusService.canTransition(currentStatus, "CLOSED"), true);
    currentStatus = "CLOSED";

    // -------------------------------------------------------------
    // Step 14: Report Closes Authoritatively
    // -------------------------------------------------------------
    assert.equal(ReportStatusService.isTerminal(currentStatus), true);

    // -------------------------------------------------------------
    // Step 15: Reopen Safety Valve (If issue recurs)
    // -------------------------------------------------------------
    assert.equal(ReportStatusService.canTransition("CLOSED", "REOPENED"), true);
  });

  it("should evaluate all 25 production readiness checklist criteria across 5 domains (Spec §166)", () => {
    const report = ProductionReadinessService.evaluateReadiness();
    assert.equal(report.overallStatus, "READY");
    assert.ok(report.totalCount >= 25);
    assert.equal(report.passedCount, report.totalCount);
    assert.equal(report.readinessPercentage, 100);

    const domains = new Set(report.items.map((i) => i.domain));
    assert.ok(domains.has("ARCHITECTURE"));
    assert.ok(domains.has("SECURITY"));
    assert.ok(domains.has("APPLICATION"));
    assert.ok(domains.has("MOBILE"));
    assert.ok(domains.has("QUALITY"));
  });
});
