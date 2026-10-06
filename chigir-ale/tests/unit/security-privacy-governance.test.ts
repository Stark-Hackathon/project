import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { RateLimitService } from "@/server/services/rate-limit.service";
import { SanitizerService } from "@/server/services/sanitizer.service";
import { PrivacyService } from "@/server/services/privacy.service";
import { RetentionService } from "@/server/services/retention.service";
import { ObservabilityService } from "@/server/services/observability.service";
import { DisasterRecoveryService, type BackupRecord } from "@/server/services/disaster-recovery.service";
import { SecurityAuditService } from "@/server/services/security-audit.service";

describe("Iteration 11: Security, Privacy, Abuse Prevention & Data Governance", () => {
  describe("Rate Limiting Engine & Abuse Prevention (Spec §81 & §82)", () => {
    beforeEach(() => {
      RateLimitService.reset();
    });

    it("should allow requests within configured limit and decrement remaining", () => {
      const res1 = RateLimitService.check("user-1", "LOGIN", { max: 3, windowMs: 10000 });
      assert.equal(res1.success, true);
      assert.equal(res1.limit, 3);
      assert.equal(res1.remaining, 2);

      const res2 = RateLimitService.check("user-1", "LOGIN", { max: 3, windowMs: 10000 });
      assert.equal(res2.success, true);
      assert.equal(res2.remaining, 1);
    });

    it("should block requests when rate limit is exhausted and return retry-after", () => {
      for (let i = 0; i < 3; i++) {
        RateLimitService.check("user-2", "REPORT_CREATION", { max: 3, windowMs: 5000 });
      }

      const blocked = RateLimitService.check("user-2", "REPORT_CREATION", { max: 3, windowMs: 5000 });
      assert.equal(blocked.success, false);
      assert.equal(blocked.remaining, 0);
      assert.ok(blocked.retryAfterSeconds && blocked.retryAfterSeconds > 0);

      const headers = RateLimitService.getHeaders(blocked);
      assert.equal(headers["X-RateLimit-Remaining"], "0");
      assert.ok(headers["Retry-After"]);
    });

    it("should maintain independent limits across distinct users and actions", () => {
      // User A hits limit
      for (let i = 0; i < 2; i++) {
        RateLimitService.check("user-A", "SEARCH", { max: 2, windowMs: 10000 });
      }
      const blockedA = RateLimitService.check("user-A", "SEARCH", { max: 2, windowMs: 10000 });
      assert.equal(blockedA.success, false);

      // User B should still be allowed
      const allowedB = RateLimitService.check("user-B", "SEARCH", { max: 2, windowMs: 10000 });
      assert.equal(allowedB.success, true);

      // User A on a different action should still be allowed
      const allowedAOther = RateLimitService.check("user-A", "CONFIRMATION", { max: 2, windowMs: 10000 });
      assert.equal(allowedAOther.success, true);
    });
  });

  describe("Input Sanitization & XSS Defense (Spec §80 & §83)", () => {
    it("should strip malicious script tags and event handlers from citizen text", () => {
      const malicious = '<script>alert("pwned")</script>Dangerous pothole <img src=x onerror="steal()"> on Bole Road';
      const clean = SanitizerService.sanitizeText(malicious);
      assert.equal(clean.includes("<script>"), false);
      assert.equal(clean.includes("onerror="), false);
      assert.ok(clean.includes("Dangerous pothole"));
      assert.ok(clean.includes("on Bole Road"));
    });

    it("should strip javascript: pseudo-protocols", () => {
      const input = '<a href="javascript:alert(1)">Click for water update</a>';
      const clean = SanitizerService.sanitizeText(input);
      assert.equal(clean.includes("javascript:"), false);
      assert.ok(clean.includes("Click for water update"));
    });

    it("should sanitize filenames to prevent path traversal and shell injection", () => {
      assert.equal(SanitizerService.sanitizeFilename("../../../etc/passwd"), "etc_passwd");
      assert.equal(SanitizerService.sanitizeFilename("..\\..\\boot.ini"), "boot.ini");
      assert.equal(SanitizerService.sanitizeFilename("pothole$(whoami).jpg"), "pothole_whoami_.jpg");
      assert.equal(SanitizerService.sanitizeFilename("normal-photo_2026.png"), "normal-photo_2026.png");
    });
  });

  describe("SSRF Protections (Spec §79 & §160)", () => {
    it("should block loopback and localhost URLs", () => {
      assert.equal(SanitizerService.validateExternalUrl("http://localhost:3000").isValid, false);
      assert.equal(SanitizerService.validateExternalUrl("http://127.0.0.1:8080").isValid, false);
      assert.equal(SanitizerService.validateExternalUrl("http://[::1]/secret").isValid, false);
    });

    it("should block RFC 1918 private subnets", () => {
      assert.equal(SanitizerService.validateExternalUrl("http://10.0.0.1/admin").isValid, false);
      assert.equal(SanitizerService.validateExternalUrl("http://172.16.0.10/api").isValid, false);
      assert.equal(SanitizerService.validateExternalUrl("http://192.168.1.1").isValid, false);
    });

    it("should block cloud metadata endpoints", () => {
      assert.equal(SanitizerService.validateExternalUrl("http://169.254.169.254/latest/meta-data/").isValid, false);
    });

    it("should allow legitimate public external HTTPS services", () => {
      assert.equal(SanitizerService.validateExternalUrl("https://tile.openstreetmap.org/15/123/456.png").isValid, true);
      assert.equal(SanitizerService.validateExternalUrl("https://api.mapbox.com/geocoding/v5").isValid, true);
    });
  });

  describe("Data Privacy & Public Redaction (Spec §84)", () => {
    it("should redact reporter PII, internal events, and provide approximate coordinates", () => {
      const mockReport = {
        id: "rep-uuid-1",
        publicReference: "CHI-2026-000101",
        title: "Broken streetlight near school",
        description: "Streetlight wire is sparking near Bole High School",
        severity: "HIGH",
        status: "IN_PROGRESS",
        latitude: 9.0105,
        longitude: 38.7612,
        reportedAt: new Date(),
        confirmationCount: 5,
        reporter: {
          name: "Abebe Kebede",
          email: "abebe@example.com",
          phone: "+251911223344",
        },
        category: {
          id: "cat-1",
          name: "Streetlights",
          slug: "streetlights",
        },
        events: [
          {
            eventType: "REPORT_SUBMITTED",
            toStatus: "SUBMITTED",
            message: "Report submitted",
            visibility: "PUBLIC",
            createdAt: new Date(),
          },
          {
            eventType: "INTERNAL_NOTE",
            toStatus: null,
            message: "Internal operational note: Wire dispatched to contractor crew",
            visibility: "INTERNAL",
            createdAt: new Date(),
          },
        ],
      };

      const redacted = PrivacyService.redactReportForPublic(mockReport);

      // Verify no PII
      const redactedAny = redacted as unknown as Record<string, unknown>;
      assert.equal(redactedAny.reporter, undefined);
      assert.equal(redacted.reporterDisplayName, "Abebe"); // First name only
      assert.equal(redactedAny.email, undefined);
      assert.equal(redactedAny.phone, undefined);

      // Verify non-public events filtered out
      assert.equal(redacted.publicEvents.length, 1);
      const firstEvent = redacted.publicEvents[0] as unknown as Record<string, unknown>;
      assert.equal(firstEvent.visibility, undefined);
      assert.equal(redacted.publicEvents[0]?.message, "Report submitted");

      // Verify approximate coordinates generated
      assert.ok(redacted.latitude !== null);
      assert.ok(redacted.longitude !== null);
    });
  });

  describe("Data Retention & Governance (Spec §124)", () => {
    it("should provide 7-year retention policy for audit logs per statutory requirement", () => {
      const policy = RetentionService.getPolicy("AUDIT_LOGS");
      assert.equal(policy.retentionDays, 2555);
      assert.equal(policy.isLegalRequirement, true);
      assert.equal(policy.actionOnExpiry, "ARCHIVE");
    });

    it("should provide indefinite retention for public infrastructure reports", () => {
      const policy = RetentionService.getPolicy("REPORTS");
      assert.equal(policy.retentionDays, null);
      assert.equal(policy.actionOnExpiry, "RETAIN_PERMANENTLY");
    });

    it("should correctly identify expired ephemeral notifications", () => {
      const now = new Date("2026-10-06T12:00:00Z");
      const recent = new Date("2026-09-01T12:00:00Z"); // ~35 days old
      const old = new Date("2026-05-01T12:00:00Z"); // >90 days old

      assert.equal(RetentionService.isExpired("NOTIFICATIONS", recent, now), false);
      assert.equal(RetentionService.isExpired("NOTIFICATIONS", old, now), true);
    });
  });

  describe("Observability & Structured Error Sanitization (Spec §86 & §87)", () => {
    it("should scrub credentials, passwords, and tokens from log context", () => {
      const sensitiveContext = {
        userId: "user-123",
        password: "SuperSecretPassword123!",
        authToken: "jwt-token-xyz",
        apiKey: "sk-proj-secret-key",
        headers: {
          authorization: "Bearer my-secret-jwt-token",
          cookie: "session=abcdef",
        },
        metadata: {
          action: "login",
        },
      };

      const scrubbed = ObservabilityService.scrubSensitiveData(sensitiveContext);

      assert.equal(scrubbed.userId, "user-123");
      assert.equal(scrubbed.password, "[REDACTED]");
      assert.equal(scrubbed.authToken, "[REDACTED]");
      assert.equal(scrubbed.apiKey, "[REDACTED]");
      assert.equal(scrubbed.headers.authorization, "[REDACTED]");
      assert.equal(scrubbed.headers.cookie, "[REDACTED]");
      assert.equal(scrubbed.metadata.action, "login");
    });

    it("should format structured error response without leaking stack traces", () => {
      const error = new Error("NOT_FOUND: Requested report does not exist.");
      const response = ObservabilityService.formatErrorResponse(error, "req-test-999");

      assert.equal(response.error.code, "NOT_FOUND");
      assert.equal(response.error.message, "Requested report does not exist.");
      assert.equal(response.error.requestId, "req-test-999");
      assert.equal((response.error as Record<string, unknown>).stack, undefined);
    });

    it("should sanitize raw Prisma or database driver errors into user-friendly message", () => {
      const rawDbError = new Error("Can't reach database server at localhost:5432");
      const response = ObservabilityService.formatErrorResponse(rawDbError, "req-db-err");

      assert.equal(response.error.code, "DATABASE_UNAVAILABLE");
      assert.equal(response.error.message.includes("localhost"), false);
      assert.equal(response.error.requestId, "req-db-err");
    });
  });

  describe("Disaster Recovery Compliance (Spec §125)", () => {
    it("should define RPO of 1 hour and RTO of 4 hours", () => {
      const strategy = DisasterRecoveryService.getStrategy();
      assert.equal(strategy.targetRpoHours, 1);
      assert.equal(strategy.targetRtoHours, 4);
      assert.equal(strategy.backupMechanisms.length >= 3, true);
    });

    it("should evaluate RPO compliance correctly against backup age", () => {
      const now = Date.now();
      const compliantBackup = now - 30 * 60 * 1000; // 30 minutes old
      const nonCompliantBackup = now - 120 * 60 * 1000; // 2 hours old

      const res1 = DisasterRecoveryService.evaluateRpoCompliance(compliantBackup, now);
      assert.equal(res1.compliant, true);

      const res2 = DisasterRecoveryService.evaluateRpoCompliance(nonCompliantBackup, now);
      assert.equal(res2.compliant, false);
    });

    it("should require restore verification before certifying backup as valid", () => {
      const backup: BackupRecord = {
        id: "bk-2026-10-06-01",
        timestamp: Date.now(),
        type: "FULL_DATABASE",
        checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        sizeBytes: 10485760,
        verified: false,
      };

      const unverified = DisasterRecoveryService.verifyBackup(backup, { testRestoreSucceeded: false });
      assert.equal(unverified.valid, false);

      const verified = DisasterRecoveryService.verifyBackup(backup, { testRestoreSucceeded: true });
      assert.equal(verified.valid, true);
    });
  });

  describe("Security Review Checklist Evaluator (Spec §160)", () => {
    it("should evaluate all 16 security checklist items to PASSED", () => {
      const audit = SecurityAuditService.runPreReleaseAudit();
      assert.equal(audit.totalCount, 16);
      assert.equal(audit.passedCount, 16);
      assert.equal(audit.overallStatus, "PASSED");
    });
  });
});
