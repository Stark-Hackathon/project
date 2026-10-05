import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PriorityService } from "@/server/services/priority.service";
import { SLAService } from "@/server/services/sla.service";
import { DEFAULT_CATEGORY_DEPARTMENT_MAP } from "@/server/services/routing.service";
import { ReportStatusService } from "@/server/services/report-status.service";

describe("Iteration 5: Authority Operations, Routing, Assignment & Priority", () => {
  describe("Priority Engine (Spec Section 34)", () => {
    it("should calculate correct base scores for each severity level", () => {
      const now = new Date();
      const criticalResult = PriorityService.calculate({
        severity: "CRITICAL",
        confirmationCount: 0,
        upvoteCount: 0,
        reportedAt: now,
      });
      assert.equal(criticalResult.factors.severityScore, 55);
      assert.equal(criticalResult.score, 55);

      const highResult = PriorityService.calculate({
        severity: "HIGH",
        confirmationCount: 0,
        upvoteCount: 0,
        reportedAt: now,
      });
      assert.equal(highResult.factors.severityScore, 40);
      assert.equal(highResult.score, 40);

      const mediumResult = PriorityService.calculate({
        severity: "MEDIUM",
        confirmationCount: 0,
        upvoteCount: 0,
        reportedAt: now,
      });
      assert.equal(mediumResult.factors.severityScore, 25);
      assert.equal(mediumResult.score, 25);

      const lowResult = PriorityService.calculate({
        severity: "LOW",
        confirmationCount: 0,
        upvoteCount: 0,
        reportedAt: now,
      });
      assert.equal(lowResult.factors.severityScore, 10);
      assert.equal(lowResult.score, 10);
    });

    it("should scale confirmation points correctly and cap at 20 points", () => {
      const now = new Date();
      const res5Conf = PriorityService.calculate({
        severity: "MEDIUM",
        confirmationCount: 5,
        upvoteCount: 0,
        reportedAt: now,
      });
      assert.equal(res5Conf.factors.confirmationScore, 10); // 5 * 2 = 10
      assert.equal(res5Conf.score, 35); // 25 base + 10

      const res20Conf = PriorityService.calculate({
        severity: "MEDIUM",
        confirmationCount: 20,
        upvoteCount: 0,
        reportedAt: now,
      });
      assert.equal(res20Conf.factors.confirmationScore, 20); // capped at 20
    });

    it("should scale upvote points and cap at 10 points", () => {
      const now = new Date();
      const res7Up = PriorityService.calculate({
        severity: "LOW",
        confirmationCount: 0,
        upvoteCount: 7,
        reportedAt: now,
      });
      assert.equal(res7Up.factors.upvoteScore, 7);

      const res50Up = PriorityService.calculate({
        severity: "LOW",
        confirmationCount: 0,
        upvoteCount: 50,
        reportedAt: now,
      });
      assert.equal(res50Up.factors.upvoteScore, 10); // capped at 10
    });

    it("should apply recurrence/incident bonus of 10 points", () => {
      const now = new Date();
      const resCluster = PriorityService.calculate({
        severity: "HIGH",
        confirmationCount: 2,
        upvoteCount: 3,
        reportedAt: now,
        hasDuplicatesOrIncident: true,
      });
      assert.equal(resCluster.factors.recurrenceScore, 10);
      // 40 (HIGH) + 4 (2*2) + 3 (3*1) + 10 (recurrence) = 57
      assert.equal(resCluster.score, 57);
    });

    it("should accelerate priority score with aging open time", () => {
      // 48 hours ago
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const resAged = PriorityService.calculate({
        severity: "CRITICAL",
        confirmationCount: 0,
        upvoteCount: 0,
        reportedAt: twoDaysAgo,
      });
      assert.ok(resAged.factors.agingScore > 0, "Aging score should be positive for 48h old report");
      assert.equal(resAged.factors.agingScore, 10); // capped at 10
    });

    it("should provide transparent human-readable explanations", () => {
      const now = new Date();
      const result = PriorityService.calculate({
        severity: "CRITICAL",
        confirmationCount: 8,
        upvoteCount: 5,
        reportedAt: now,
        hasDuplicatesOrIncident: true,
      });

      assert.ok(result.factors.explanations.length >= 4);
      assert.ok(result.factors.explanations.some((e) => e.includes("Critical severity")));
      assert.ok(result.factors.explanations.some((e) => e.includes("8 independent confirmation")));
      assert.ok(result.factors.explanations.some((e) => e.includes("5 citizen upvote")));
      assert.ok(result.factors.explanations.some((e) => e.includes("Cluster / recurrence")));
    });
  });

  describe("SLA & Escalation Engine (Spec Sections 119 & 120)", () => {
    it("should calculate exact deadlines based on severity configuration", () => {
      const reportedAt = new Date("2026-10-05T10:00:00Z");

      // Critical: review in 15 mins, resolution in 24 hours
      const criticalSLA = SLAService.evaluate({
        severity: "CRITICAL",
        status: "SUBMITTED",
        reportedAt,
        now: new Date("2026-10-05T10:05:00Z"), // 5 mins in
      });

      assert.equal(
        criticalSLA.reviewDeadline.toISOString(),
        new Date("2026-10-05T10:15:00Z").toISOString()
      );
      assert.equal(
        criticalSLA.resolutionDeadline.toISOString(),
        new Date("2026-10-06T10:00:00Z").toISOString()
      );
      assert.equal(criticalSLA.reviewStatus, "WITHIN_TARGET");
      assert.equal(criticalSLA.escalationLevel, "NONE");
    });

    it("should trigger SLA WARNING when >= 75% of target is reached", () => {
      const reportedAt = new Date("2026-10-05T10:00:00Z");

      // 12 mins in for a 15 min target (80% of review target)
      const warningSLA = SLAService.evaluate({
        severity: "CRITICAL",
        status: "SUBMITTED",
        reportedAt,
        now: new Date("2026-10-05T10:12:00Z"),
      });

      assert.equal(warningSLA.reviewStatus, "WARNING");
      assert.equal(warningSLA.escalationLevel, "SLA_WARNING");
    });

    it("should detect SLA BREACH and escalate to Department Manager", () => {
      const reportedAt = new Date("2026-10-05T10:00:00Z");

      // 18 mins in for a 15 min review target (120% elapsed)
      const breachedSLA = SLAService.evaluate({
        severity: "CRITICAL",
        status: "SUBMITTED",
        reportedAt,
        now: new Date("2026-10-05T10:18:00Z"),
      });

      assert.equal(breachedSLA.reviewStatus, "BREACHED");
      assert.equal(breachedSLA.isReviewBreached, true);
      assert.equal(breachedSLA.escalationLevel, "DEPARTMENT_MANAGER");
    });

    it("should escalate to Organization Administrator on severe breach (>150%)", () => {
      const reportedAt = new Date("2026-10-05T10:00:00Z");

      // 40 mins in for a 15 min review target (>250% elapsed)
      const severeBreachSLA = SLAService.evaluate({
        severity: "CRITICAL",
        status: "SUBMITTED",
        reportedAt,
        now: new Date("2026-10-05T10:40:00Z"),
      });

      assert.equal(severeBreachSLA.reviewStatus, "BREACHED");
      assert.equal(severeBreachSLA.escalationLevel, "ORG_ADMIN");
    });

    it("should mark SLA as MET once reviewed or resolved within window", () => {
      const reportedAt = new Date("2026-10-05T10:00:00Z");
      const verifiedAt = new Date("2026-10-05T10:08:00Z"); // 8 mins in (<15 mins)

      const metSLA = SLAService.evaluate({
        severity: "CRITICAL",
        status: "VERIFIED",
        reportedAt,
        verifiedAt,
        now: new Date("2026-10-05T11:00:00Z"),
      });

      assert.equal(metSLA.reviewStatus, "MET");
      assert.equal(metSLA.isReviewBreached, false);
    });
  });

  describe("Department Routing Default Mapping (Spec Section 32)", () => {
    it("should map transportation & road categories to Roads & Civil Infrastructure", () => {
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["roads"]?.slug,
        "roads-infrastructure"
      );
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["bridges"]?.slug,
        "roads-infrastructure"
      );
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["traffic-infrastructure"]?.slug,
        "roads-infrastructure"
      );
    });

    it("should map water & drainage to Water & Sewerage Authority", () => {
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["water"]?.slug,
        "water-sewerage"
      );
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["drainage"]?.slug,
        "water-sewerage"
      );
    });

    it("should map electricity & streetlights to Electricity & Power Utility", () => {
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["electricity"]?.slug,
        "electricity-power"
      );
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["streetlights"]?.slug,
        "electricity-power"
      );
    });

    it("should map waste management and sanitation to Environmental Sanitation", () => {
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["waste-management"]?.slug,
        "sanitation-waste"
      );
      assert.equal(
        DEFAULT_CATEGORY_DEPARTMENT_MAP["sanitation"]?.slug,
        "sanitation-waste"
      );
    });
  });

  describe("State Transition & Authority Workflow Rules (Spec Sections 91 & 92)", () => {
    it("should allow complete authority operational lifecycle path", () => {
      const lifecycle = [
        ["SUBMITTED", "UNDER_REVIEW"],
        ["UNDER_REVIEW", "VERIFIED"],
        ["VERIFIED", "ASSIGNED"],
        ["ASSIGNED", "IN_PROGRESS"],
        ["IN_PROGRESS", "RESOLVED"],
        ["RESOLVED", "CLOSED"],
      ] as const;

      for (const [from, to] of lifecycle) {
        assert.equal(
          ReportStatusService.canTransition(from, to),
          true,
          `Expected transition ${from} -> ${to} to be permitted`
        );
      }
    });

    it("should allow blocking and unblocking in progress reports", () => {
      assert.equal(ReportStatusService.canTransition("IN_PROGRESS", "BLOCKED"), true);
      assert.equal(ReportStatusService.canTransition("BLOCKED", "IN_PROGRESS"), true);
    });

    it("should allow reopening resolved or closed reports", () => {
      assert.equal(ReportStatusService.canTransition("RESOLVED", "REOPENED"), true);
      assert.equal(ReportStatusService.canTransition("CLOSED", "REOPENED"), true);
      assert.equal(ReportStatusService.canTransition("REOPENED", "UNDER_REVIEW"), true);
    });

    it("should reject illegal skipping transitions", () => {
      assert.equal(ReportStatusService.canTransition("SUBMITTED", "RESOLVED"), false);
      assert.equal(ReportStatusService.canTransition("SUBMITTED", "IN_PROGRESS"), false);
      assert.equal(ReportStatusService.canTransition("UNDER_REVIEW", "CLOSED"), false);
    });
  });
});
