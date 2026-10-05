/**
 * Chigir Ale - Priority Calculation Engine
 * Spec: Section 34 — Priority Engine (Decision-Support Score)
 * Calculates a transparent, explainable priority score (0–100) based on
 * severity, community impact, recurrence, and operational aging.
 */
import { prisma } from "@/lib/db/prisma";
import type { Severity, Prisma } from "@prisma/client";

export interface PriorityCalculationInputs {
  severity: Severity;
  confirmationCount: number;
  upvoteCount: number;
  reportedAt: Date;
  hasDuplicatesOrIncident?: boolean;
  categorySlug?: string;
}

export interface PriorityScoreResult {
  score: number;
  version: number;
  factors: {
    severityScore: number;
    confirmationScore: number;
    upvoteScore: number;
    recurrenceScore: number;
    agingScore: number;
    explanations: string[];
  };
}

export class PriorityService {
  public static readonly CURRENT_VERSION = 1;

  /**
   * Pure calculation function: calculates priority score and explanations
   * without touching the database.
   */
  static calculate(inputs: PriorityCalculationInputs, version = PriorityService.CURRENT_VERSION): PriorityScoreResult {
    const explanations: string[] = [];

    // 1. Severity Base Score (0 to 55 pts)
    let severityScore = 25;
    switch (inputs.severity) {
      case "CRITICAL":
        severityScore = 55;
        explanations.push("Critical severity base rating: +55 pts (Immediate public safety/infrastructure risk)");
        break;
      case "HIGH":
        severityScore = 40;
        explanations.push("High severity base rating: +40 pts (Major disruption or imminent hazard)");
        break;
      case "MEDIUM":
        severityScore = 25;
        explanations.push("Medium severity base rating: +25 pts (Standard operational disruption)");
        break;
      case "LOW":
        severityScore = 10;
        explanations.push("Low severity base rating: +10 pts (Minor cosmetic or non-urgent issue)");
        break;
    }

    // 2. Confirmation Count (0 to 20 pts, 2 pts each)
    const confirmationPoints = Math.min(20, (inputs.confirmationCount || 0) * 2);
    if (confirmationPoints > 0) {
      explanations.push(
        `Community impact: ${inputs.confirmationCount} independent confirmation(s) (+${confirmationPoints} pts)`
      );
    }

    // 3. Upvote Count (0 to 10 pts, 1 pt each)
    const upvotePoints = Math.min(10, (inputs.upvoteCount || 0) * 1);
    if (upvotePoints > 0) {
      explanations.push(
        `Community interest: ${inputs.upvoteCount} citizen upvote(s) (+${upvotePoints} pts)`
      );
    }

    // 4. Recurrence / Related Incident or Duplicates (0 or 10 pts)
    let recurrenceScore = 0;
    if (inputs.hasDuplicatesOrIncident) {
      recurrenceScore = 10;
      explanations.push(
        "Cluster / recurrence detected: Associated with active incident or duplicate reports (+10 pts)"
      );
    }

    // 5. Aging Factor (0 to 10 pts)
    const hoursElapsed = Math.max(
      0,
      Math.floor((Date.now() - new Date(inputs.reportedAt).getTime()) / (1000 * 60 * 60))
    );
    let agingScore = 0;
    if (inputs.severity === "CRITICAL") {
      agingScore = Math.min(10, Math.floor(hoursElapsed / 2) * 2);
    } else if (inputs.severity === "HIGH") {
      agingScore = Math.min(10, Math.floor(hoursElapsed / 12) * 2);
    } else {
      agingScore = Math.min(10, Math.floor(hoursElapsed / 24));
    }

    if (agingScore > 0) {
      explanations.push(
        `Pending duration: Report has been open for ${hoursElapsed} hour(s) (+${agingScore} pts aging priority)`
      );
    }

    const rawScore = severityScore + confirmationPoints + upvotePoints + recurrenceScore + agingScore;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

    return {
      score: finalScore,
      version,
      factors: {
        severityScore,
        confirmationScore: confirmationPoints,
        upvoteScore: upvotePoints,
        recurrenceScore,
        agingScore,
        explanations,
      },
    };
  }

  /**
   * Recalculates and persists priority for a report inside an optional transaction.
   */
  static async recalculateForReport(
    reportId: string,
    tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ): Promise<PriorityScoreResult> {
    const client = tx ?? prisma;

    const report = await client.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        severity: true,
        confirmationCount: true,
        upvoteCount: true,
        reportedAt: true,
        priorityVersion: true,
        category: { select: { slug: true } },
        incidentReports: { select: { id: true } },
        sourceDuplicates: {
          where: { status: "ACCEPTED" },
          select: { id: true },
        },
      },
    });

    if (!report) {
      throw new Error(`Report with id ${reportId} not found`);
    }

    const hasDuplicatesOrIncident =
      report.incidentReports.length > 0 || report.sourceDuplicates.length > 0;

    const nextVersion = (report.priorityVersion || 0) + 1;

    const result = PriorityService.calculate(
      {
        severity: report.severity,
        confirmationCount: report.confirmationCount,
        upvoteCount: report.upvoteCount,
        reportedAt: report.reportedAt,
        hasDuplicatesOrIncident,
        categorySlug: report.category.slug,
      },
      nextVersion
    );

    // Save calculation record
    await client.priorityCalculation.create({
      data: {
        reportId,
        version: result.version,
        score: result.score,
        factors: result.factors as unknown as Prisma.InputJsonValue,
      },
    });

    // Update report
    await client.report.update({
      where: { id: reportId },
      data: {
        priorityScore: result.score,
        priorityVersion: result.version,
      },
    });

    return result;
  }
}
