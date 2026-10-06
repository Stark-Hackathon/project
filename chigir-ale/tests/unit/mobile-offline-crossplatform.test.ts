import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  PlatformService,
  WebPlatformAdapter,
  MobilePlatformAdapter,
} from "@/features/mobile/services/platform.service";
import { OfflineStorageService } from "@/features/mobile/services/offline-storage.service";
import { DeepLinkService } from "@/features/mobile/services/deep-link.service";
import type { ReportDraft, CachedReport } from "@/features/mobile/types";

describe("Iteration 10: Mobile, Offline & Cross-Platform", () => {
  beforeEach(async () => {
    // Reset platform to clean Web adapter
    PlatformService.setAdapter(new WebPlatformAdapter());
    await OfflineStorageService.clearDraft();
    const queue = await OfflineStorageService.getPendingQueue();
    for (const item of queue) {
      await OfflineStorageService.removeQueueItem(item.id);
    }
  });

  describe("Platform Abstraction & Cross-Platform Detection (Spec §43)", () => {
    it("should provide WebPlatformAdapter with web platform and non-native flags", () => {
      const web = new WebPlatformAdapter();
      assert.equal(web.platform, "web");
      assert.equal(web.isNative, false);
    });

    it("should provide MobilePlatformAdapter for android and ios with native flags", () => {
      const android = new MobilePlatformAdapter("android");
      assert.equal(android.platform, "android");
      assert.equal(android.isNative, true);

      const ios = new MobilePlatformAdapter("ios");
      assert.equal(ios.platform, "ios");
      assert.equal(ios.isNative, true);
    });

    it("should report network status with connected flag and connection type", async () => {
      const status = await PlatformService.getNetworkStatus();
      assert.equal(typeof status.connected, "boolean");
      assert.ok(["wifi", "cellular", "none", "unknown"].includes(status.connectionType));
    });

    it("should provide fallback Addis Ababa coordinates when geolocation is unavailable", async () => {
      const pos = await PlatformService.getCurrentPosition();
      assert.equal(typeof pos.latitude, "number");
      assert.equal(typeof pos.longitude, "number");
      assert.ok(pos.latitude > 8.0 && pos.latitude < 10.0);
      assert.ok(pos.longitude > 37.0 && pos.longitude < 40.0);
    });

    it("should support in-memory key-value storage in headless/server environments", async () => {
      await PlatformService.setStorageItem("test_token", "abc-123-xyz");
      const value = await PlatformService.getStorageItem("test_token");
      assert.equal(value, "abc-123-xyz");

      await PlatformService.removeStorageItem("test_token");
      const empty = await PlatformService.getStorageItem("test_token");
      assert.equal(empty, null);
    });
  });

  describe("Report Draft Preservation (Spec §44)", () => {
    it("should save and restore an unfinished report draft with form data and step index", async () => {
      const draft: ReportDraft = {
        lastUpdated: Date.now(),
        step: 2,
        formData: {
          categoryId: "cat-roads",
          title: "Damaged asphalt on Bole road",
          description: "Multiple craters forming near the junction",
          severity: "HIGH",
        },
      };

      await OfflineStorageService.saveDraft(draft);
      const restored = await OfflineStorageService.getDraft();

      assert.ok(restored !== null);
      assert.equal(restored?.step, 2);
      assert.equal(restored?.formData.title, "Damaged asphalt on Bole road");
      assert.equal(restored?.formData.categoryId, "cat-roads");
    });

    it("should clear the saved draft upon successful submission", async () => {
      await OfflineStorageService.saveDraft({
        lastUpdated: Date.now(),
        step: 1,
        formData: { title: "Draft to clear" },
      });

      await OfflineStorageService.clearDraft();
      const empty = await OfflineStorageService.getDraft();
      assert.equal(empty, null);
    });
  });

  describe("Recently Viewed Reports Cache (Spec §44)", () => {
    it("should cache viewed reports for offline access", async () => {
      const sampleReport: CachedReport = {
        id: "rep-101",
        publicReference: "CHI-2026-000042",
        title: "Burst water main",
        description: "Water leaking heavily across road",
        status: "IN_PROGRESS",
        severity: "HIGH",
        categoryName: "Water",
        cachedAt: Date.now(),
      };

      await OfflineStorageService.cacheReport(sampleReport);
      const cached = await OfflineStorageService.getCachedReports();

      assert.ok(cached.length >= 1);
      assert.equal(cached[0]?.publicReference, "CHI-2026-000042");

      const fetched = await OfflineStorageService.getCachedReport("CHI-2026-000042");
      assert.ok(fetched !== null);
      assert.equal(fetched?.title, "Burst water main");
    });
  });

  describe("Offline Pending Submission Queue & Strict Server Confirmation Rule (Spec §44)", () => {
    it("should enqueue offline report submission with PENDING_UPLOAD status", async () => {
      const item = await OfflineStorageService.enqueueReport({
        categoryId: "cat-drainage",
        title: "Blocked storm drain",
        description: "Water backing up during heavy rainfall",
        severity: "MEDIUM",
      });

      assert.ok(item.id.startsWith("queue-"));
      assert.equal(item.status, "PENDING_UPLOAD");
      assert.equal(item.retryCount, 0);

      const queue = await OfflineStorageService.getPendingQueue();
      assert.ok(queue.some((q) => q.id === item.id));
    });

    it("STRICT RULE (§44 & §3799): Report must NEVER be marked SUBMITTED without server confirmation reference", async () => {
      const item = await OfflineStorageService.enqueueReport({
        categoryId: "cat-electricity",
        title: "Blackout in sector",
        description: "Power lines down",
        severity: "CRITICAL",
      });

      // Verification: A report currently in queue before sync must NOT be SUBMITTED
      assert.notEqual(item.status, "SUBMITTED");
      assert.equal(item.serverPublicReference, undefined);

      // Even after local state transitions, SUBMITTED requires server confirmation
      await OfflineStorageService.updateQueueItem(item.id, {
        status: "UPLOADING_MEDIA",
      });

      const updated = (await OfflineStorageService.getPendingQueue()).find((q) => q.id === item.id);
      assert.equal(updated?.status, "UPLOADING_MEDIA");
      assert.equal(updated?.serverPublicReference, undefined);
    });

    it("should update queue item through full lifecycle upon confirmed server submission", async () => {
      const item = await OfflineStorageService.enqueueReport({
        categoryId: "cat-roads",
        title: "Pothole to confirm",
        description: "Large crater on road",
        severity: "MEDIUM",
      });

      // Simulate server confirmation
      await OfflineStorageService.updateQueueItem(item.id, {
        status: "SUBMITTED",
        serverReportId: "srv-rep-888",
        serverPublicReference: "CHI-2026-000888",
      });

      const confirmed = (await OfflineStorageService.getPendingQueue()).find((q) => q.id === item.id);
      assert.equal(confirmed?.status, "SUBMITTED");
      assert.equal(confirmed?.serverPublicReference, "CHI-2026-000888");
      assert.equal(confirmed?.serverReportId, "srv-rep-888");
    });
  });

  describe("Deep Link Resolution & Push Notification Routing (Spec §128)", () => {
    it("should parse chigir://report/CHI-2026-000001 custom scheme link to /reports route", () => {
      const resolved = DeepLinkService.parse("chigir://report/CHI-2026-000001");
      assert.ok(resolved !== null);
      assert.equal(resolved?.targetRoute, "/reports/CHI-2026-000001");
      assert.equal(resolved?.action, "VIEW_REPORT");
      assert.equal(resolved?.reportReference, "CHI-2026-000001");
    });

    it("should parse chigir://authority/reports/CHI-2026-000001 to authority triage route", () => {
      const resolved = DeepLinkService.parse("chigir://authority/reports/CHI-2026-000001");
      assert.ok(resolved !== null);
      assert.equal(resolved?.targetRoute, "/authority/reports/CHI-2026-000001");
      assert.equal(resolved?.action, "AUTHORITY_VIEW");
      assert.equal(resolved?.reportReference, "CHI-2026-000001");
    });

    it("should parse map deep link with query parameters", () => {
      const resolved = DeepLinkService.parse("chigir://map?lat=9.0105&lng=38.7612");
      assert.ok(resolved !== null);
      assert.equal(resolved?.action, "VIEW_MAP");
      assert.equal(resolved?.targetRoute, "/map?lat=9.0105&lng=38.7612");
      assert.equal(resolved?.params.lat, "9.0105");
      assert.equal(resolved?.params.lng, "38.7612");
    });

    it("should parse universal HTTPS links for chigir.app", () => {
      const resolved = DeepLinkService.parse("https://chigir.app/reports/CHI-2026-000099");
      assert.ok(resolved !== null);
      assert.equal(resolved?.targetRoute, "/reports/CHI-2026-000099");
      assert.equal(resolved?.reportReference, "CHI-2026-000099");
    });

    it("should return null for unrecognized external domains", () => {
      const resolved = DeepLinkService.parse("https://unknown-domain.com/reports/123");
      assert.equal(resolved, null);
    });

    it("should generate canonical deep links for report references", () => {
      const link = DeepLinkService.generateReportDeepLink("CHI-2026-000055");
      assert.equal(link, "chigir://report/CHI-2026-000055");

      const universal = DeepLinkService.generateUniversalLink("CHI-2026-000055");
      assert.equal(universal, "https://chigir.app/reports/CHI-2026-000055");
    });

    it("should resolve notification payload tap to direct report route", () => {
      const routeFromRef = DeepLinkService.resolveNotificationRoute({
        publicReference: "CHI-2026-000100",
      });
      assert.equal(routeFromRef, "/reports/CHI-2026-000100");

      const routeFromDeepLink = DeepLinkService.resolveNotificationRoute({
        deepLink: "chigir://report/CHI-2026-000100",
      });
      assert.equal(routeFromDeepLink, "/reports/CHI-2026-000100");
    });
  });
});
