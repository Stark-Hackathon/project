import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ReportReferenceService } from "@/server/services/report-reference.service";
import { ReportStatusService } from "@/server/services/report-status.service";
import type { ReportStatus } from "@prisma/client";

describe("Iteration 2: Core Domain Services", () => {
  describe("ReportReferenceService", () => {
    it("should validate a correct CHI reference format", () => {
      assert.equal(ReportReferenceService.isValid("CHI-2026-000001"), true);
      assert.equal(ReportReferenceService.isValid("CHI-2026-999999"), true);
    });

    it("should reject invalid reference formats", () => {
      assert.equal(ReportReferenceService.isValid(""), false);
      assert.equal(ReportReferenceService.isValid("CHI-2026-1"), false);
      assert.equal(ReportReferenceService.isValid("STK-2026-000001"), false);
      assert.equal(ReportReferenceService.isValid("CHI-26-000001"), false);
      assert.equal(ReportReferenceService.isValid("chi-2026-000001"), false);
    });

    it("should parse a valid reference correctly", () => {
      const parsed = ReportReferenceService.parse("CHI-2026-000182");
      assert.ok(parsed !== null);
      assert.equal(parsed!.prefix, "CHI");
      assert.equal(parsed!.year, 2026);
      assert.equal(parsed!.sequence, 182);
    });

    it("should return null when parsing an invalid reference", () => {
      assert.equal(ReportReferenceService.parse("invalid"), null);
    });
  });

  describe("ReportStatusService", () => {
    it("should allow SUBMITTED -> UNDER_REVIEW", () => {
      assert.equal(ReportStatusService.canTransition("SUBMITTED", "UNDER_REVIEW"), true);
    });

    it("should allow SUBMITTED -> CANCELLED", () => {
      assert.equal(ReportStatusService.canTransition("SUBMITTED", "CANCELLED"), true);
    });

    it("should reject SUBMITTED -> CLOSED (skipping steps)", () => {
      assert.equal(ReportStatusService.canTransition("SUBMITTED", "CLOSED"), false);
    });

    it("should reject SUBMITTED -> ASSIGNED (skipping verification)", () => {
      assert.equal(ReportStatusService.canTransition("SUBMITTED", "ASSIGNED"), false);
    });

    it("should allow the full core lifecycle path", () => {
      const path: ReportStatus[] = [
        "SUBMITTED",
        "UNDER_REVIEW",
        "VERIFIED",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
      ];
      for (let i = 0; i < path.length - 1; i++) {
        assert.equal(
          ReportStatusService.canTransition(path[i]!, path[i + 1]!),
          true,
          `Expected ${path[i]} -> ${path[i + 1]} to be valid`
        );
      }
    });

    it("should allow RESOLVED -> REOPENED via AWAITING_CONFIRMATION", () => {
      assert.equal(ReportStatusService.canTransition("RESOLVED", "AWAITING_CONFIRMATION"), true);
      assert.equal(ReportStatusService.canTransition("AWAITING_CONFIRMATION", "REOPENED"), true);
    });

    it("should identify CLOSED and CANCELLED as terminal statuses", () => {
      assert.equal(ReportStatusService.isTerminal("CLOSED"), true);
      assert.equal(ReportStatusService.isTerminal("CANCELLED"), true);
      assert.equal(ReportStatusService.isTerminal("SUBMITTED"), false);
    });

    it("should identify core lifecycle statuses correctly", () => {
      assert.equal(ReportStatusService.isCoreLifecycle("SUBMITTED"), true);
      assert.equal(ReportStatusService.isCoreLifecycle("VERIFIED"), true);
      assert.equal(ReportStatusService.isCoreLifecycle("NEEDS_INFORMATION"), false);
      assert.equal(ReportStatusService.isCoreLifecycle("DUPLICATE"), false);
    });

    it("should throw on invalid transition via assertCanTransition", () => {
      assert.throws(
        () => ReportStatusService.assertCanTransition("CLOSED", "IN_PROGRESS"),
        /INVALID_TRANSITION/
      );
    });

    it("should list allowed next statuses from UNDER_REVIEW", () => {
      const allowed = ReportStatusService.allowedNext("UNDER_REVIEW");
      assert.ok(allowed.includes("VERIFIED"));
      assert.ok(allowed.includes("REJECTED"));
      assert.ok(allowed.includes("NEEDS_INFORMATION"));
    });
  });
});
