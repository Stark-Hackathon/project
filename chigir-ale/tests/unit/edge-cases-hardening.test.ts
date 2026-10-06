(process.env as Record<string, string | undefined>)["NODE_ENV"] = "test";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IdempotencyService } from "@/server/services/idempotency.service";
import { OfflineStorageService } from "@/features/mobile/services/offline-storage.service";
import { PlatformService } from "@/features/mobile/services/platform.service";
import { DuplicateService } from "@/server/services/duplicate.service";
import { ReportStatusService } from "@/server/services/report-status.service";
import { SanitizerService } from "@/server/services/sanitizer.service";
import { MapService } from "@/server/services/map.service";
import { MockEmailProvider } from "@/server/services/notifications";
import { createReportSchema } from "@/features/reports/actions";

describe("Iteration 13: Edge Cases & Production Hardening (Spec §111)", () => {
  describe("Edge Case 1: User Double-Clicks Submit", () => {
    it("should prevent duplicate creation via idempotency lock", async () => {
      IdempotencyService.reset();
      const doubleClickKey = "btn-submit-click-12345";

      // First click
      const lock1 = await IdempotencyService.acquire(doubleClickKey, "REPORT_CREATION");
      assert.equal(lock1.status, "NEW");

      // Second rapid click
      const lock2 = await IdempotencyService.acquire(doubleClickKey, "REPORT_CREATION");
      assert.equal(lock2.status, "PENDING"); // Concurrent submission rejected!
    });
  });

  describe("Edge Cases 2 & 3: Network Disconnect During Upload & Draft Preservation", () => {
    it("should preserve unfinished draft locally during upload failure or unexpected termination", async () => {
      await OfflineStorageService.clearDraft();

      await OfflineStorageService.saveDraft({
        lastUpdated: Date.now(),
        step: 2,
        formData: {
          title: "Flooded underpass on Ring Road",
          description: "Drainage is completely clogged after rainstorm.",
          categoryId: "cat-drainage",
        },
      });

      const restored = await OfflineStorageService.getDraft();
      assert.ok(restored);
      assert.equal(restored.step, 2);
      assert.equal(restored.formData.title, "Flooded underpass on Ring Road");
    });
  });

  describe("Edge Cases 4 & 5: GPS Permission Denied or Unavailable", () => {
    it("should provide graceful Addis Ababa fallback coordinates when GPS fails", async () => {
      const position = await PlatformService.getCurrentPosition();
      assert.ok(position.latitude > 8.0 && position.latitude < 10.0);
      assert.ok(position.longitude > 38.0 && position.longitude < 39.5);
    });
  });

  describe("Edge Case 8: Duplicate Report Created Simultaneously", () => {
    it("should flag duplicate candidate when title, category, and location overlap", () => {
      const baseReport = {
        id: "rep-1",
        title: "Large water pipe burst near Kazanchis",
        description: "Drinking water flooding the road",
        categoryId: "cat-water",
        latitude: 9.018,
        longitude: 38.775,
        reportedAt: new Date(),
      };

      const candidateReport = {
        id: "rep-2",
        title: "Major water pipeline broken Kazanchis",
        description: "Clean water leaking onto street",
        categoryId: "cat-water",
        latitude: 9.0185, // ~55 meters away
        longitude: 38.7752,
        reportedAt: new Date(),
      };

      const match = DuplicateService.evaluateDuplicate({
        sourceTitle: baseReport.title,
        sourceDescription: baseReport.description,
        sourceCategoryId: baseReport.categoryId,
        sourceCreatedAt: baseReport.reportedAt,
        sourceLatitude: baseReport.latitude,
        sourceLongitude: baseReport.longitude,

        candidateTitle: candidateReport.title,
        candidateDescription: candidateReport.description,
        candidateCategoryId: candidateReport.categoryId,
        candidateCreatedAt: candidateReport.reportedAt,
        candidateLatitude: candidateReport.latitude,
        candidateLongitude: candidateReport.longitude,
      });

      assert.equal(match.isDuplicateCandidate, true);
      assert.ok(match.confidence >= 0.65);
    });
  });

  describe("Edge Case 10 & 12: External AI & Notification Providers Unavailable", () => {
    it("should not crash application when external email or push provider fails", async () => {
      const failingEmail = new MockEmailProvider();
      failingEmail.setShouldFail(true);

      const res = await failingEmail.send({
        to: "citizen@example.com",
        subject: "Report update",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(res.success, false);
      assert.ok(res.error); // Captured gracefully, did not throw uncaught error!
    });
  });

  describe("Edge Case 11: Map Geocoding Provider Unavailable", () => {
    it("should fall back to local district dictionary for known landmarks", async () => {
      const results = await MapService.geocode("Bole Medhanialem");
      assert.ok(results.length > 0);
      assert.ok(results[0]?.administrativeArea.includes("Bole"));
    });
  });

  describe("Edge Case 18: Report Resolved While Citizen is Offline", () => {
    it("should cache report snapshot for offline inspection", async () => {
      await OfflineStorageService.cacheReport({
        id: "rep-offline-01",
        publicReference: "CHI-2026-000999",
        title: "Repaired streetlight",
        description: "Bulb replaced",
        status: "RESOLVED",
        severity: "LOW",
        categoryName: "Streetlights",
        cachedAt: Date.now(),
      });

      const cached = await OfflineStorageService.getCachedReport("CHI-2026-000999");
      assert.ok(cached);
      assert.equal(cached.status, "RESOLVED");
    });
  });

  describe("Edge Case 22: Report Reopened After Closure", () => {
    it("should permit CLOSED -> REOPENED transition and REOPENED -> UNDER_REVIEW", () => {
      assert.equal(ReportStatusService.canTransition("CLOSED", "REOPENED"), true);
      assert.equal(ReportStatusService.canTransition("REOPENED", "UNDER_REVIEW"), true);
    });
  });

  describe("Edge Case 25: Malicious File Path Traversal", () => {
    it("should sanitize traversal sequences and dangerous characters", () => {
      const sanitized = SanitizerService.sanitizeFilename("../../../etc/shadow");
      assert.equal(sanitized, "etc_shadow");
      assert.equal(sanitized.includes("../"), false);
    });
  });

  describe("Edge Cases 26 & 28: Schema Validation for Coordinates & Empty Description", () => {
    it("should reject invalid latitude outside [-90, 90]", () => {
      const invalid = createReportSchema.safeParse({
        categoryId: "cat-1",
        title: "Valid title here",
        description: "Valid description explaining the situation in detail",
        latitude: 145.0, // Invalid!
        longitude: 38.0,
      });
      assert.equal(invalid.success, false);
    });

    it("should reject description shorter than 10 characters", () => {
      const invalid = createReportSchema.safeParse({
        categoryId: "cat-1",
        title: "Valid title here",
        description: "Too short", // < 10 chars
      });
      assert.equal(invalid.success, false);
    });
  });
});
