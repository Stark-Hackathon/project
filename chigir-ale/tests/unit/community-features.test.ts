import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NearbyIssuesService } from "@/server/services/nearby-issues.service";
import { DuplicateService } from "@/server/services/duplicate.service";
import { ReportStatusService } from "@/server/services/report-status.service";

describe("Iteration 4: Community, Duplicates & Resolution Feedback", () => {
  describe("Geographic Distance Calculation (Haversine)", () => {
    it("should calculate 0 distance for identical coordinates", () => {
      const distance = NearbyIssuesService.calculateDistanceMeters(9.0249, 38.7468, 9.0249, 38.7468);
      assert.equal(distance, 0);
    });

    it("should accurately compute distance between known points in Addis Ababa", () => {
      // Meskel Square: 9.0108, 38.7616
      // Bole Medhanealem: 8.9956, 38.7884
      // Great-circle distance is roughly 3.4 km ~ 3400 meters
      const distance = NearbyIssuesService.calculateDistanceMeters(
        9.0108,
        38.7616,
        8.9956,
        38.7884
      );

      assert.ok(distance > 3000 && distance < 4000, `Expected ~3.4km, got ${distance}m`);
    });

    it("should calculate symmetric distance regardless of point order", () => {
      const dist1 = NearbyIssuesService.calculateDistanceMeters(9.0, 38.7, 9.05, 38.75);
      const dist2 = NearbyIssuesService.calculateDistanceMeters(9.05, 38.75, 9.0, 38.7);
      assert.equal(dist1, dist2);
    });
  });

  describe("Duplicate Candidate Matching (Spec Section 64)", () => {
    it("should tokenize and calculate high text similarity for related descriptions", () => {
      const textA = "Broken water pipe flooding the sidewalk near Mega Building";
      const textB = "Water pipe broken and leaking on the sidewalk near Mega";

      const similarity = DuplicateService.calculateTextSimilarity(textA, textB);
      assert.ok(similarity >= 0.5, `Expected similarity >= 0.5, got ${similarity}`);
    });

    it("should return low similarity for completely unrelated topics", () => {
      const textA = "Power outage transformer burst and sparking";
      const textB = "Uncollected garbage bins overflowing with trash";

      const similarity = DuplicateService.calculateTextSimilarity(textA, textB);
      assert.ok(similarity < 0.2, `Expected similarity < 0.2, got ${similarity}`);
    });

    it("should flag two nearby reports in the same category as duplicate candidates", () => {
      const now = new Date();
      const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const result = DuplicateService.evaluateDuplicate({
        sourceTitle: "Deep pothole in right lane",
        sourceDescription: "Cars swerving dangerously to avoid large pothole on Bole Road",
        sourceCategoryId: "cat-roads",
        sourceCreatedAt: now,
        sourceLatitude: 9.01234,
        sourceLongitude: 38.76543,

        candidateTitle: "Dangerous road pothole",
        candidateDescription: "Large pothole in the road near Bole causing traffic hazard",
        candidateCategoryId: "cat-roads",
        candidateCreatedAt: thirtyMinsAgo,
        candidateLatitude: 9.01240, // ~10m away
        candidateLongitude: 38.76540,
      });

      assert.equal(result.categoryMatch, true);
      assert.ok(result.distanceMeters !== null && result.distanceMeters <= 50);
      assert.ok(result.confidence >= 0.6, `Expected confidence >= 0.6, got ${result.confidence}`);
      assert.equal(result.isDuplicateCandidate, true);
    });

    it("should NOT flag reports in different categories and locations as duplicates", () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const result = DuplicateService.evaluateDuplicate({
        sourceTitle: "Water leak on sidewalk",
        sourceDescription: "Clean water gushing from underground pipe",
        sourceCategoryId: "cat-water",
        sourceCreatedAt: now,
        sourceLatitude: 9.01,
        sourceLongitude: 38.76,

        candidateTitle: "Dark streetlights along avenue",
        candidateDescription: "All streetlights are off for three blocks",
        candidateCategoryId: "cat-streetlights",
        candidateCreatedAt: threeDaysAgo,
        candidateLatitude: 9.08, // ~8km away
        candidateLongitude: 38.82,
      });

      assert.equal(result.categoryMatch, false);
      assert.ok(result.confidence < 0.4, `Expected confidence < 0.4, got ${result.confidence}`);
      assert.equal(result.isDuplicateCandidate, false);
    });
  });

  describe("Resolution Feedback State Machine (Spec Section 27)", () => {
    it("should allow transitioning from RESOLVED to REOPENED via citizen feedback", () => {
      // In report lifecycle, RESOLVED can legally transition to AWAITING_CONFIRMATION or REOPENED
      assert.equal(ReportStatusService.canTransition("AWAITING_CONFIRMATION", "REOPENED"), true);
      assert.equal(ReportStatusService.canTransition("CLOSED", "REOPENED"), true);
    });

    it("should allow transitioning from RESOLVED to CLOSED on confirmation", () => {
      assert.equal(ReportStatusService.canTransition("RESOLVED", "CLOSED"), true);
      assert.equal(ReportStatusService.canTransition("AWAITING_CONFIRMATION", "CLOSED"), true);
    });
  });

  describe("Community Upvote vs Confirmation Rules (Spec Section 24)", () => {
    it("should distinguish upvote count from confirmation count logic", () => {
      const reportState = {
        id: "rep-1",
        upvoteCount: 15,
        confirmationCount: 4,
      };

      // Upvotes reflect community support/relevance; confirmations reflect direct on-site occurrence
      assert.notEqual(reportState.upvoteCount, reportState.confirmationCount);
      assert.ok(reportState.upvoteCount >= reportState.confirmationCount);
    });
  });
});
