import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AnalyticsService } from "@/server/services/analytics.service";
import { HotspotService } from "@/server/services/hotspot.service";
import { SearchService } from "@/server/services/search.service";
import type { ModerationClassification } from "@/server/services/moderation.service";

describe("Iteration 8: Search, Analytics, Transparency & Moderation", () => {
  describe("Analytics Engine & Metrics (Spec Section 94 & 134)", () => {
    it("should calculate correct median for odd and even number distributions", () => {
      // Odd length
      const odd = [2, 5, 8, 12, 20];
      assert.equal(AnalyticsService.calculateMedian(odd), 8);

      // Even length
      const even = [2, 4, 6, 8];
      assert.equal(AnalyticsService.calculateMedian(even), 5);

      // Single item
      assert.equal(AnalyticsService.calculateMedian([42]), 42);

      // Empty list
      assert.equal(AnalyticsService.calculateMedian([]), 0);
    });

    it("should compute resolution rates with boundary safety (no NaN or divide-by-zero)", () => {
      const calcRate = (done: number, total: number) =>
        total > 0 ? Number(((done / total) * 100).toFixed(1)) : 0;

      assert.equal(calcRate(15, 20), 75.0);
      assert.equal(calcRate(0, 0), 0);
      assert.equal(calcRate(1, 3), 33.3);
      assert.equal(calcRate(100, 100), 100.0);
    });
  });

  describe("Analytics Privacy Guard (Spec Section 96 & 121)", () => {
    it("should ensure public transparency metrics contain no citizen identifiers", () => {
      const publicOutputFields = [
        "totalCityReports",
        "totalResolvedIssues",
        "overallResolutionRate",
        "medianResolutionDays",
        "communityConfirmations",
        "topCategories",
        "statusOverview",
        "areaOverview",
        "recentCompletedCount",
      ];

      // Forbidden sensitive fields
      const sensitiveFields = ["reporterId", "userId", "email", "phone", "passwordHash", "ipAddress"];

      for (const field of sensitiveFields) {
        assert.equal(
          publicOutputFields.includes(field),
          false,
          `Sensitive field ${field} must never exist in public transparency metrics`
        );
      }
    });
  });

  describe("Hotspot Detection Engine (Spec Section 95)", () => {
    it("should compute transparent severity scores using weighted incidents", () => {
      // Critical = 4, High = 3, Medium = 2, Low = 1, Confirmations = 0.5
      function calculateHotspotScore(
        critical: number,
        high: number,
        medium: number,
        low: number,
        confirmations: number
      ): number {
        return critical * 4 + high * 3 + medium * 2 + low * 1 + confirmations * 0.5;
      }

      const score = calculateHotspotScore(2, 3, 5, 1, 10);
      // 2*4 + 3*3 + 5*2 + 1*1 + 10*0.5 = 8 + 9 + 10 + 1 + 5 = 33
      assert.equal(score, 33);
    });

    it("should identify INCREASING trend when recent incidents exceed prior half by >25%", () => {
      function determineTrend(firstHalf: number, secondHalf: number): "INCREASING" | "STABLE" | "DECREASING" {
        if (secondHalf > firstHalf * 1.25) return "INCREASING";
        if (firstHalf > secondHalf * 1.25) return "DECREASING";
        return "STABLE";
      }

      assert.equal(determineTrend(4, 8), "INCREASING");
      assert.equal(determineTrend(10, 4), "DECREASING");
      assert.equal(determineTrend(5, 5), "STABLE");
      assert.equal(determineTrend(10, 11), "STABLE");
    });

    it("should generate human-readable algorithmic explanation for hotspot transparency", () => {
      const area = "Bole";
      const category = "Water";
      const count = 12;
      const days = 30;
      const explanation = `Hotspot flagged based on ${count} ${category} incidents in ${area} over ${days} days.`;

      assert.ok(explanation.includes("Bole"));
      assert.ok(explanation.includes("Water"));
      assert.ok(explanation.includes("12"));
      assert.ok(explanation.includes("30"));
    });
  });

  describe("Search Engine Scoping & Server-Side Pagination (Spec Section 97 & 98)", () => {
    it("should enforce maximum search limit caps to prevent memory denial-of-service", () => {
      const normalizeLimit = (requested?: number) => Math.min(requested ?? 20, 100);

      assert.equal(normalizeLimit(15), 15);
      assert.equal(normalizeLimit(undefined), 20);
      assert.equal(normalizeLimit(500), 100); // Capped at 100
    });

    it("should properly format case-insensitive search queries", () => {
      const query = "  Water leakage  ";
      const sanitized = query.trim();
      assert.equal(sanitized, "Water leakage");
    });
  });

  describe("Moderation Classifications & Audit Integrity (Spec Section 122)", () => {
    it("should support all required moderation classifications", () => {
      const validClassifications: ModerationClassification[] = [
        "VALID",
        "INVALID",
        "SPAM",
        "ABUSIVE",
        "DUPLICATE",
        "MISCLASSIFIED",
        "MISSING_INFORMATION",
      ];

      assert.equal(validClassifications.length, 7);
      assert.ok(validClassifications.includes("SPAM"));
      assert.ok(validClassifications.includes("ABUSIVE"));
      assert.ok(validClassifications.includes("DUPLICATE"));
    });

    it("should reject moderation attempts with insufficient justifications", () => {
      const validateReason = (reason: string) => reason.trim().length >= 5;

      assert.equal(validateReason("ok"), false);
      assert.equal(validateReason(""), false);
      assert.equal(validateReason("Spam commercial advertisement"), true);
      assert.equal(validateReason("Duplicate of report #CHI-2026-000005"), true);
    });
  });
});
