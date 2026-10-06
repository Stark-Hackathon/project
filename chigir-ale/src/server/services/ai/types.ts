/**
 * Chigir Ale - AI & Smart Decision Support Types
 * Spec: Sections 35–38 (AI Architecture, Jobs, Provenance, Voice) & 136–140 (Smart Recommendations, Human Override, Safety)
 */

export type AIAnalysisType =
  | "CATEGORY_CLASSIFICATION"
  | "REPORT_SUMMARIZATION"
  | "DUPLICATE_DETECTION"
  | "IMAGE_ANALYSIS"
  | "SMART_RECOMMENDATION"
  | "VOICE_TRANSCRIPTION";

export interface CategoryClassificationResult {
  suggestedCategoryId: string;
  suggestedCategoryName: string;
  confidence: number;
  reasoning: string;
  alternativeCategories: Array<{
    categoryId: string;
    categoryName: string;
    confidence: number;
  }>;
}

export interface ReportSummaryResult {
  summary: string;
  keyPoints: string[];
  detectedUrgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sentiment: "NEUTRAL" | "CONCERNED" | "URGENT";
  affectedInfrastructure: string[];
}

export interface AIDuplicateSuggestion {
  reportId: string;
  publicReference: string;
  title: string;
  confidence: number;
  similarityReason: string;
  distanceMeters?: number | null;
}

export interface ImageAnalysisResult {
  detectedIssues: string[];
  infrastructureDamagePresent: boolean;
  damageSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  safetyHazards: string[];
  suggestedCategorySlug?: string;
}

export interface SmartRecommendation {
  suggestedCategory?: {
    id: string;
    name: string;
    confidence: number;
    reason: string;
  };
  suggestedDepartment?: {
    id: string;
    name: string;
    confidence: number;
    reason: string;
  };
  suggestedSeverity?: {
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidence: number;
    reason: string;
  };
  possibleDuplicates: AIDuplicateSuggestion[];
  summary: string;
  confidence: number;
  reason: string;
  model: string;
  provider: string;
  modelVersion: string;
}

export interface HumanOverrideInput {
  reportId: string;
  overrideType: "CATEGORY" | "SEVERITY" | "DEPARTMENT" | "DUPLICATE";
  originalValue: string;
  overriddenValue: string;
  reason: string;
  actorUserId: string;
  organizationId?: string;
}

export interface HumanOverrideRecord {
  id: string;
  reportId: string;
  overrideType: string;
  originalValue: string;
  overriddenValue: string;
  reason: string;
  actorUserId: string;
  createdAt: Date;
}
