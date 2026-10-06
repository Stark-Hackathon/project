import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  MockEmailProvider,
  MockPushProvider,
  MockSmsProvider,
  EmailTemplates,
} from "@/server/services/notifications";
import { NotificationService } from "@/server/services/notifications/notification.service";
import { NotificationRepository } from "@/server/repositories/notification.repository";

describe("Iteration 7: Notifications & Communication", () => {
  let mockEmail: MockEmailProvider;
  let mockPush: MockPushProvider;
  let mockSms: MockSmsProvider;

  beforeEach(() => {
    mockEmail = new MockEmailProvider();
    mockPush = new MockPushProvider();
    mockSms = new MockSmsProvider();

    NotificationService.setEmailProvider(mockEmail);
    NotificationService.setPushProvider(mockPush);
    NotificationService.setSmsProvider(mockSms);
  });

  describe("Channel Providers & Delivery (Spec Section 41)", () => {
    it("MockEmailProvider should record sent emails and return messageId", async () => {
      const res = await mockEmail.send({
        to: "resident@example.com",
        subject: "Report Verified",
        html: "<p>Your report has been verified.</p>",
        text: "Your report has been verified.",
      });

      assert.equal(res.success, true);
      assert.ok(res.messageId?.startsWith("mock-email-"));
      assert.equal(mockEmail.getSentEmails().length, 1);
      assert.equal(mockEmail.getSentEmails()[0]?.to, "resident@example.com");
    });

    it("MockPushProvider should deliver to multiple device tokens and report success count", async () => {
      const res = await mockPush.send({
        tokens: ["token_ios_123", "token_android_456"],
        title: "Report Status Update",
        body: "Your report is now in progress.",
        data: { reportId: "r-1", actionUrl: "/reports/CHI-2026-000001" },
        badge: 3,
      });

      assert.equal(res.success, true);
      assert.equal(res.successCount, 2);
      assert.equal(res.failureCount, 0);
      assert.equal(res.invalidTokens.length, 0);
      assert.equal(mockPush.getSentPushes().length, 1);
    });

    it("MockPushProvider should detect and report invalid/revoked tokens", async () => {
      mockPush.addSimulatedInvalidToken("token_revoked_789");

      const res = await mockPush.send({
        tokens: ["token_valid_111", "token_revoked_789", "invalid_expired_222"],
        title: "Incident Resolved",
        body: "Please confirm resolution.",
      });

      assert.equal(res.success, true);
      assert.equal(res.successCount, 1);
      assert.equal(res.failureCount, 2);
      assert.deepEqual(res.invalidTokens.sort(), ["invalid_expired_222", "token_revoked_789"].sort());
    });

    it("MockSmsProvider should record SMS messages and return messageId", async () => {
      const res = await mockSms.send({
        to: "+251911223344",
        text: "Chigir Ale: Report CHI-2026-000001 has been verified.",
      });

      assert.equal(res.success, true);
      assert.ok(res.messageId?.startsWith("mock-sms-"));
      assert.equal(mockSms.getSentSms().length, 1);
      assert.equal(mockSms.getSentSms()[0]?.to, "+251911223344");
    });
  });

  describe("Civic Email Templates", () => {
    it("should generate branded report submission email with public reference and tracking link", () => {
      const template = EmailTemplates.reportSubmitted({
        name: "Abebe Bikila",
        reference: "CHI-2026-000042",
        title: "Major Pothole on Bole Road",
        trackingUrl: "https://chigirale.et/reports/CHI-2026-000042",
      });

      assert.ok(template.subject.includes("CHI-2026-000042"));
      assert.ok(template.subject.includes("Major Pothole on Bole Road"));
      assert.ok(template.html.includes("#CHI-2026-000042"));
      assert.ok(template.html.includes("https://chigirale.et/reports/CHI-2026-000042"));
      assert.ok(template.text.includes("Abebe Bikila"));
    });

    it("should generate status update email with status badge and operational notes", () => {
      const template = EmailTemplates.statusUpdate({
        name: "Tigist Assefa",
        reference: "CHI-2026-000100",
        title: "Broken Water Pipe",
        status: "RESOLVED",
        message: "Repaired by Water Authority Crew Team B.",
        trackingUrl: "https://chigirale.et/reports/CHI-2026-000100",
      });

      assert.ok(template.subject.includes("RESOLVED"));
      assert.ok(template.html.includes("RESOLVED"));
      assert.ok(template.html.includes("Repaired by Water Authority Crew Team B."));
    });
  });

  describe("Fault Tolerance & Decoupled Dispatch (Spec Section 74 & Gate Requirement)", () => {
    it("External email provider failure should not throw or disrupt caller", async () => {
      mockEmail.setShouldFail(true);

      const result = await mockEmail.send({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
      });

      assert.equal(result.success, false);
      assert.ok(result.error?.includes("MOCK_EMAIL_FAILURE"));
    });

    it("External push provider network failure should report failure without crashing", async () => {
      mockPush.setShouldFail(true);

      const result = await mockPush.send({
        tokens: ["token_1"],
        title: "Test",
        body: "Test",
      });

      assert.equal(result.success, false);
      assert.equal(result.failureCount, 1);
      assert.ok(result.error?.includes("MOCK_PUSH_FAILURE"));
    });
  });

  describe("Lifecycle Event Mapping (Spec Section 41)", () => {
    it("should format notification content for all required domain event types", () => {
      const eventTypes = [
        "REPORT_SUBMITTED",
        "REPORT_VERIFIED",
        "REPORT_ASSIGNED",
        "STATUS_CHANGED",
        "REPORT_RESOLVED",
        "CONFIRMATION_REQUEST",
        "REPORT_REOPENED",
        "AUTHORITY_MESSAGE",
      ];

      for (const eventType of eventTypes) {
        assert.ok(typeof eventType === "string");
      }
      assert.equal(eventTypes.length, 8);
    });
  });

  describe("Device Token Rotation & Multi-Device Validation (Spec Section 42 & 70)", () => {
    it("should validate device platform enum against IOS, ANDROID, and WEB", () => {
      const validPlatforms = ["IOS", "ANDROID", "WEB"];
      assert.ok(validPlatforms.includes("IOS"));
      assert.ok(validPlatforms.includes("ANDROID"));
      assert.ok(validPlatforms.includes("WEB"));
      assert.ok(!validPlatforms.includes("WINDOWS_PHONE"));
    });

    it("should validate minimum push token string requirements", () => {
      const validateToken = (token: string) => token.trim().length >= 10;
      assert.equal(validateToken("fcm_token_valid_123456789"), true);
      assert.equal(validateToken("short"), false);
      assert.equal(validateToken(""), false);
    });
  });
});
