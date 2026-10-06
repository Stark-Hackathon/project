/**
 * Chigir Ale - AI Provider Interface
 * Spec: Sections 35 (AI Architecture) & 37 (AI Result Requirements / Provenance)
 */
import type {
  CategoryClassificationResult,
  ReportSummaryResult,
  AIDuplicateSuggestion,
  ImageAnalysisResult,
  SmartRecommendation,
} from "./types";

export interface IAIProvider {
  readonly name: string;
  readonly model: string;
  readonly version: string;

  /**
   * Classify report category from title, description, and optional keywords.
   */
  classifyCategory(
    title: string,
    description: string,
    availableCategories: Array<{ id: string; name: string; slug: string }>
  ): Promise<CategoryClassificationResult>;

  /**
   * Produce a structured executive summary and key takeaways.
   */
  summarizeReport(
    title: string,
    description: string
  ): Promise<ReportSummaryResult>;

  /**
   * Compare a report against potential candidates to identify duplicates with semantic explanations.
   */
  detectDuplicates(
    target: {
      title: string;
      description: string;
      categoryId: string;
      latitude?: number | null;
      longitude?: number | null;
    },
    candidates: Array<{
      id: string;
      publicReference: string;
      title: string;
      description: string;
      categoryId: string;
      latitude?: number | null;
      longitude?: number | null;
      createdAt: Date;
    }>
  ): Promise<AIDuplicateSuggestion[]>;

  /**
   * Analyze evidence image metadata or buffer for damage detection and hazards.
   */
  analyzeImage(imageMetadata: {
    mimeType: string;
    sizeBytes?: number;
    fileName?: string;
  }): Promise<ImageAnalysisResult>;

  /**
   * Produce comprehensive decision recommendations (category, routing, priority, duplicates).
   */
  recommendDecisions(
    report: {
      id: string;
      title: string;
      description: string;
      severity: string;
      categoryId: string;
      confirmationCount: number;
      administrativeArea?: string | null;
    },
    categories: Array<{ id: string; name: string; slug: string }>,
    departments: Array<{ id: string; name: string; slug: string }>,
    duplicateCandidates: Array<{
      id: string;
      publicReference: string;
      title: string;
      confidence: number;
      similarityReason: string;
    }>
  ): Promise<SmartRecommendation>;
}
