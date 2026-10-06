/**
 * Chigir Ale - AI Orchestration Service
 * Spec: Sections 35 (AI Architecture), 37 (AI Result Requirements / Provenance),
 *       136 (Smart Recommendations), 137 (AI Human Override), 138 (AI Safety)
 */
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import type { IAIProvider } from "./ai-provider.interface";
import { MockAIProvider } from "./mock-ai-provider";
import type {
  AIAnalysisType,
  CategoryClassificationResult,
  ReportSummaryResult,
  AIDuplicateSuggestion,
  ImageAnalysisResult,
  SmartRecommendation,
  HumanOverrideInput,
} from "./types";
import { AuditService } from "@/server/services/audit.service";

export class AIService {
  private static provider: IAIProvider = new MockAIProvider();

  /**
   * Set custom AI provider (for production Gemini / OpenAI or testing).
   */
  static setProvider(newProvider: IAIProvider): void {
    AIService.provider = newProvider;
  }

  /**
   * Get currently active AI provider metadata.
   */
  static getProvider(): IAIProvider {
    return AIService.provider;
  }

  /**
   * Save an AI analysis with full provenance and auditability.
   * Spec section 37: Never overwrite historical AI analysis without retaining provenance.
   */
  static async recordAnalysis(
    reportId: string,
    type: AIAnalysisType,
    result: Record<string, unknown>,
    confidence?: number
  ) {
    const provider = AIService.provider;

    return prisma.aIAnalysis.create({
      data: {
        reportId,
        type,
        provider: provider.name,
        model: provider.model,
        modelVersion: provider.version,
        confidence: confidence ?? null,
        result: result as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Classify report category and record analysis.
   */
  static async classifyReport(
    reportId: string
  ): Promise<CategoryClassificationResult> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, title: true, description: true },
    });

    if (!report) throw new Error("Report not found");

    const categories = await prisma.category.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true },
    });

    const classification = await AIService.provider.classifyCategory(
      report.title,
      report.description,
      categories
    );

    // AI Safety (Spec §138): Validate outputs as untrusted data
    if (!classification.suggestedCategoryId || typeof classification.confidence !== "number") {
      throw new Error("Invalid AI classification output");
    }

    await AIService.recordAnalysis(
      reportId,
      "CATEGORY_CLASSIFICATION",
      classification as unknown as Record<string, unknown>,
      classification.confidence
    );

    return classification;
  }

  /**
   * Summarize report and record analysis.
   */
  static async summarizeReport(
    reportId: string
  ): Promise<ReportSummaryResult> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, title: true, description: true },
    });

    if (!report) throw new Error("Report not found");

    const summary = await AIService.provider.summarizeReport(
      report.title,
      report.description
    );

    await AIService.recordAnalysis(
      reportId,
      "REPORT_SUMMARIZATION",
      summary as unknown as Record<string, unknown>,
      0.9
    );

    return summary;
  }

  /**
   * Detect potential duplicates for a report.
   */
  static async detectDuplicatesForReport(
    reportId: string
  ): Promise<AIDuplicateSuggestion[]> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        title: true,
        description: true,
        categoryId: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!report) throw new Error("Report not found");

    // Fetch candidate reports from same category or active within recent window
    const candidates = await prisma.report.findMany({
      where: {
        id: { not: reportId },
        deletedAt: null,
        status: { notIn: ["REJECTED", "CANCELLED"] },
      },
      select: {
        id: true,
        publicReference: true,
        title: true,
        description: true,
        categoryId: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const suggestions = await AIService.provider.detectDuplicates(
      report,
      candidates
    );

    await AIService.recordAnalysis(
      reportId,
      "DUPLICATE_DETECTION",
      { suggestions } as unknown as Record<string, unknown>,
      suggestions[0]?.confidence ?? 0
    );

    return suggestions;
  }

  /**
   * Analyze uploaded report media.
   */
  static async analyzeReportMedia(
    reportId: string,
    mediaId: string
  ): Promise<ImageAnalysisResult> {
    const media = await prisma.reportMedia.findUnique({
      where: { id: mediaId },
      select: { id: true, mimeType: true, sizeBytes: true, storageKey: true },
    });

    if (!media) throw new Error("Media not found");

    const analysis = await AIService.provider.analyzeImage({
      mimeType: media.mimeType || "image/jpeg",
      sizeBytes: media.sizeBytes || undefined,
      fileName: media.storageKey,
    });

    await AIService.recordAnalysis(
      reportId,
      "IMAGE_ANALYSIS",
      { mediaId, ...analysis } as unknown as Record<string, unknown>,
      analysis.confidence
    );

    return analysis;
  }

  /**
   * Generate comprehensive decision support recommendations (Spec §136).
   */
  static async getSmartRecommendations(
    reportId: string
  ): Promise<SmartRecommendation> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        category: true,
      },
    });

    if (!report) throw new Error("Report not found");

    const [categories, departments, duplicateSuggestions] = await Promise.all([
      prisma.category.findMany({
        where: { active: true },
        select: { id: true, name: true, slug: true },
      }),
      prisma.department.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, slug: true },
      }),
      AIService.detectDuplicatesForReport(reportId).catch(() => []),
    ]);

    const recommendation = await AIService.provider.recommendDecisions(
      {
        id: report.id,
        title: report.title,
        description: report.description,
        severity: report.severity,
        categoryId: report.categoryId,
        confirmationCount: report.confirmationCount,
        administrativeArea: report.administrativeArea,
      },
      categories,
      departments,
      duplicateSuggestions.map((d) => ({
        id: d.reportId,
        publicReference: d.publicReference,
        title: d.title,
        confidence: d.confidence,
        similarityReason: d.similarityReason,
      }))
    );

    await AIService.recordAnalysis(
      reportId,
      "SMART_RECOMMENDATION",
      recommendation as unknown as Record<string, unknown>,
      recommendation.confidence
    );

    return recommendation;
  }

  /**
   * Record Human Override of an AI suggestion (Spec §137).
   * Consequential administrative decisions remain human-controlled.
   * Stores the override for auditing and future model evaluation.
   */
  static async recordHumanOverride(
    input: HumanOverrideInput,
    applyChange: boolean = true
  ): Promise<void> {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error("A valid reason of at least 5 characters is required to override an AI recommendation.");
    }

    await prisma.$transaction(async (tx) => {
      // 1. If requested, apply the human-specified change to the Report
      if (applyChange) {
        if (input.overrideType === "CATEGORY") {
          await tx.report.update({
            where: { id: input.reportId },
            data: { categoryId: input.overriddenValue },
          });
        } else if (input.overrideType === "SEVERITY") {
          await tx.report.update({
            where: { id: input.reportId },
            data: { severity: input.overriddenValue as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" },
          });
        }
      }

      // 2. Append to ReportEvent timeline
      await tx.reportEvent.create({
        data: {
          reportId: input.reportId,
          actorUserId: input.actorUserId,
          eventType: "AI_SUGGESTION_OVERRIDDEN",
          visibility: "INTERNAL",
          message: `Authority operator overrode AI suggested ${input.overrideType.toLowerCase()} (${input.originalValue} -> ${input.overriddenValue}). Reason: ${input.reason}`,
          metadata: {
            overrideType: input.overrideType,
            aiSuggested: input.originalValue,
            humanSelected: input.overriddenValue,
            reason: input.reason,
          },
        },
      });

      // 3. Append to immutable AuditLog for compliance & model evaluation datasets
      await AuditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "AI_HUMAN_OVERRIDE",
          entityType: "Report",
          entityId: input.reportId,
          before: { [input.overrideType]: input.originalValue },
          after: { [input.overrideType]: input.overriddenValue, reason: input.reason },
        },
        tx
      );
    });
  }

  /**
   * Retrieve all recorded AI analyses for a report.
   */
  static async getReportAnalyses(reportId: string) {
    return prisma.aIAnalysis.findMany({
      where: { reportId },
      orderBy: { createdAt: "desc" },
    });
  }
}
