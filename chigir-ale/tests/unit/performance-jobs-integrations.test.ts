(process.env as Record<string, string | undefined>)["NODE_ENV"] = "test";

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CacheService } from "@/server/services/cache.service";
import { IdempotencyService } from "@/server/services/idempotency.service";
import { OutboxService } from "@/server/services/outbox.service";
import { JobQueueService } from "@/server/services/job-queue.service";
import { WebhookService } from "@/server/services/webhook.service";
import { MonitoringService } from "@/server/services/monitoring.service";

describe("Iteration 12: Performance, Reliability, Jobs & Integrations", () => {
  describe("Cache Layer & Scoping (Spec §99 & §113)", () => {
    beforeEach(() => {
      CacheService.clear();
    });

    it("should set, get, and delete values within TTL", () => {
      CacheService.set("test:key", { data: "pothole-roads" }, 60);
      const val = CacheService.get<{ data: string }>("test:key");
      assert.deepEqual(val, { data: "pothole-roads" });

      CacheService.delete("test:key");
      assert.equal(CacheService.get("test:key"), null);
    });

    it("should return null when cache item has expired", () => {
      // Set with 0-second TTL (expired immediately)
      CacheService.set("expired:key", "value", -1);
      assert.equal(CacheService.get("expired:key"), null);
    });

    it("should compute once with getOrSet on cache miss and reuse cached value", async () => {
      let fetchCount = 0;
      const fetcher = async () => {
        fetchCount++;
        return ["Roads", "Streetlights", "Water"];
      };

      const res1 = await CacheService.getOrSet("categories:list", fetcher, 60);
      const res2 = await CacheService.getOrSet("categories:list", fetcher, 60);

      assert.deepEqual(res1, ["Roads", "Streetlights", "Water"]);
      assert.deepEqual(res2, ["Roads", "Streetlights", "Water"]);
      assert.equal(fetchCount, 1); // Fetcher called only once!
    });

    it("should enforce tenant and user scoped key conventions (Spec §99)", () => {
      const publicK = CacheService.buildKey("PUBLIC", "global", "categories");
      assert.equal(publicK, "public:global:categories");

      const orgK = CacheService.buildKey("ORG", "org-addis-water", "open_incidents");
      assert.equal(orgK, "org:org-addis-water:open_incidents");

      const userK = CacheService.buildKey("USER", "usr-123", "recent_drafts");
      assert.equal(userK, "user:usr-123:recent_drafts");
    });

    it("should invalidate keys by prefix", () => {
      CacheService.set("category:1", "item 1", 60);
      CacheService.set("category:2", "item 2", 60);
      CacheService.set("reports:list", "reports", 60);

      CacheService.deletePrefix("category:");
      assert.equal(CacheService.get("category:1"), null);
      assert.equal(CacheService.get("category:2"), null);
      assert.equal(CacheService.get("reports:list"), "reports");
    });
  });

  describe("Idempotency Service (Spec §101)", () => {
    beforeEach(() => {
      IdempotencyService.reset();
    });

    it("should return NEW on first request and PENDING on concurrent request", async () => {
      const res1 = await IdempotencyService.acquire("req-abc-123", "REPORT_CREATION");
      assert.equal(res1.status, "NEW");

      const res2 = await IdempotencyService.acquire("req-abc-123", "REPORT_CREATION");
      assert.equal(res2.status, "PENDING");
    });

    it("should return COMPLETED with saved response on replay", async () => {
      await IdempotencyService.acquire("req-xyz-789", "REPORT_CREATION");
      const mockResult = { reportId: "rep-1", publicReference: "CHI-2026-000001" };

      await IdempotencyService.saveResponse("req-xyz-789", "REPORT_CREATION", mockResult, 201);

      const replay = await IdempotencyService.acquire("req-xyz-789", "REPORT_CREATION");
      assert.equal(replay.status, "COMPLETED");
      assert.deepEqual(replay.response, mockResult);
      assert.equal(replay.statusCode, 201);
    });

    it("should allow re-attempt after lock release on failure", async () => {
      await IdempotencyService.acquire("req-fail-001", "REPORT_CREATION");
      await IdempotencyService.release("req-fail-001", "REPORT_CREATION");

      const retry = await IdempotencyService.acquire("req-fail-001", "REPORT_CREATION");
      assert.equal(retry.status, "NEW");
    });
  });

  describe("Transactional Outbox Pattern (Spec §155 & §156)", () => {
    beforeEach(() => {
      OutboxService.reset();
    });

    it("should record and dispatch outbox event to subscribers with at-least-once guarantee", async () => {
      const dispatchedEvents: unknown[] = [];

      OutboxService.subscribe("report.created", async (event) => {
        dispatchedEvents.push(event.payload);
      });

      const eventId = await OutboxService.recordEvent({
        type: "report.created",
        aggregateType: "Report",
        aggregateId: "rep-101",
        payload: { reference: "CHI-2026-000101", severity: "HIGH" },
      });

      assert.ok(eventId);

      const result = await OutboxService.processPendingEvents();
      assert.ok(result.processed >= 1);
      assert.equal(dispatchedEvents.length, 1);
      assert.deepEqual(dispatchedEvents[0], { reference: "CHI-2026-000101", severity: "HIGH" });
    });
  });

  describe("Background Job Queue & Backlog Tracking (Spec §100 & §158)", () => {
    beforeEach(() => {
      JobQueueService.reset();
    });

    it("should enqueue and process background job asynchronously", async () => {
      let executed = false;
      JobQueueService.registerWorker("AI_CLASSIFICATION", async (job) => {
        executed = true;
        assert.equal(job.payload.reportId, "rep-500");
      });

      const jobId = JobQueueService.enqueue("AI_CLASSIFICATION", { reportId: "rep-500" });
      assert.ok(jobId);

      const statsBefore = JobQueueService.getStats();
      assert.equal(statsBefore.queued, 1);

      const processedJob = await JobQueueService.processNext();
      assert.ok(processedJob);
      assert.equal(processedJob?.status, "COMPLETED");
      assert.equal(executed, true);

      const statsAfter = JobQueueService.getStats();
      assert.equal(statsAfter.queued, 0);
      assert.equal(statsAfter.completed, 1);
    });

    it("should retry failed job up to maxAttempts and fail permanently thereafter", async () => {
      let attemptsCount = 0;
      JobQueueService.registerWorker("VOICE_TRANSCRIPTION", async () => {
        attemptsCount++;
        throw new Error("Transcribe audio provider timeout");
      });

      JobQueueService.enqueue("VOICE_TRANSCRIPTION", { audioId: "aud-1" }, { maxAttempts: 2 });

      // First attempt
      const run1 = await JobQueueService.processNext();
      assert.equal(run1?.status, "QUEUED"); // Re-queued
      assert.equal(attemptsCount, 1);

      // Second attempt (final)
      const run2 = await JobQueueService.processNext();
      assert.equal(run2?.status, "FAILED");
      assert.equal(attemptsCount, 2);

      const stats = JobQueueService.getStats();
      assert.equal(stats.failed, 1);
    });
  });

  describe("Webhook Cryptographic Signatures (Spec §102)", () => {
    const secret = "whsec_0123456789abcdef0123456789abcdef";
    const payload = JSON.stringify({
      id: "evt-001",
      type: "report.status_changed",
      data: { publicReference: "CHI-2026-000001", status: "RESOLVED" },
    });

    it("should sign payload with HMAC-SHA256 and verify successfully", () => {
      const now = Date.now();
      const signatureHeader = WebhookService.sign(payload, secret, now);
      assert.ok(signatureHeader.startsWith("t="));
      assert.ok(signatureHeader.includes(",v1="));

      const verification = WebhookService.verify(payload, signatureHeader, secret, 300);
      assert.equal(verification.valid, true);
    });

    it("should reject tampered payload", () => {
      const signatureHeader = WebhookService.sign(payload, secret);
      const tamperedPayload = JSON.stringify({
        id: "evt-001",
        type: "report.status_changed",
        data: { publicReference: "CHI-2026-000001", status: "CANCELLED" },
      });

      const verification = WebhookService.verify(tamperedPayload, signatureHeader, secret);
      assert.equal(verification.valid, false);
      assert.equal(verification.reason, "Signature mismatch.");
    });

    it("should reject expired webhook signature (replay attack protection)", () => {
      const staleTimestamp = Date.now() - 400 * 1000; // 400 seconds ago (>300s window)
      const staleSignature = WebhookService.sign(payload, secret, staleTimestamp);

      const verification = WebhookService.verify(payload, staleSignature, secret, 300);
      assert.equal(verification.valid, false);
      assert.ok(verification.reason?.includes("replay attack"));
    });

    it("should format standard dispatch headers", () => {
      const headers = WebhookService.getHeaders(payload, secret, "evt-999");
      assert.equal(headers["Content-Type"], "application/json");
      assert.equal(headers["X-Chigir-Event-Id"], "evt-999");
      assert.ok(headers["X-Chigir-Signature"]);
      assert.ok(headers["X-Chigir-Timestamp"]);
    });
  });

  describe("Operational Telemetry & Monitoring Alerts (Spec §157 & §158)", () => {
    beforeEach(() => {
      MonitoringService.reset();
      JobQueueService.reset();
    });

    it("should calculate correct p95 latency and error rate", () => {
      // 95 fast requests (50ms)
      for (let i = 0; i < 95; i++) {
        MonitoringService.recordSample("search", 50, true);
      }
      // 5 slow requests (1500ms), 2 failed
      for (let i = 0; i < 3; i++) {
        MonitoringService.recordSample("search", 1500, true);
      }
      for (let i = 0; i < 2; i++) {
        MonitoringService.recordSample("search", 1500, false);
      }

      assert.equal(MonitoringService.getErrorRatePercent(), 2.0); // 2/100 = 2%
      assert.ok(MonitoringService.getP95Latency() > 50);
    });

    it("should trigger ALERT_DB_DOWN when database is marked unhealthy", () => {
      MonitoringService.setDatabaseHealth(false);
      const alerts = MonitoringService.evaluateAlerts();
      const dbAlert = alerts.find((a) => a.id === "ALERT_DB_DOWN");
      assert.ok(dbAlert);
      assert.equal(dbAlert?.severity, "CRITICAL");
    });

    it("should trigger ALERT_ERROR_SPIKE when error rate exceeds 5.0%", () => {
      // 15 successes, 5 failures = 25% error rate (> 5%)
      for (let i = 0; i < 15; i++) MonitoringService.recordSample("api", 50, true);
      for (let i = 0; i < 5; i++) MonitoringService.recordSample("api", 50, false);

      const alerts = MonitoringService.evaluateAlerts();
      const errorAlert = alerts.find((a) => a.id === "ALERT_ERROR_SPIKE");
      assert.ok(errorAlert);
      assert.equal(errorAlert?.severity, "CRITICAL");
    });

    it("should trigger ALERT_AUTH_FAILURE_SPIKE when authentication failures exceed 10", () => {
      for (let i = 0; i < 11; i++) {
        MonitoringService.recordAuthFailure();
      }

      const alerts = MonitoringService.evaluateAlerts();
      const authAlert = alerts.find((a) => a.id === "ALERT_AUTH_FAILURE_SPIKE");
      assert.ok(authAlert);
      assert.equal(authAlert?.severity, "WARNING");
    });
  });
});
