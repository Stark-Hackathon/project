/**
 * Chigir Ale - Mock / Rule-Augmented AI Provider
 * Spec: Section 35 (AI Architecture), Section 37 (Provenance), Section 136 (Smart Recommendations)
 * Provides deterministic, offline-resilient AI capabilities for civic infrastructure triage.
 */
import type { IAIProvider } from "./ai-provider.interface";
import type {
  CategoryClassificationResult,
  ReportSummaryResult,
  AIDuplicateSuggestion,
  ImageAnalysisResult,
  SmartRecommendation,
} from "./types";
import { DuplicateService } from "@/server/services/duplicate.service";

interface CategoryKeywordRule {
  slugs: string[];
  keywords: string[];
  amharicKeywords: string[];
  reason: string;
}

const CATEGORY_RULES: CategoryKeywordRule[] = [
  {
    slugs: ["water", "utilities"],
    keywords: ["water", "pipe", "burst", "leak", "tap", "flooding water", "hydrant", "clean water"],
    amharicKeywords: ["ውሃ", "ቧንቧ", "የውሃ", "ፈሰሰ"],
    reason: "Contains keywords indicative of municipal water distribution or pipe failure",
  },
  {
    slugs: ["electricity", "utilities"],
    keywords: ["electricity", "power", "wire", "blackout", "spark", "transformer", "cable", "pole"],
    amharicKeywords: ["መብራት", "ኃይል", "ሽቦ", "ትራንስፎርመር", "ኤሌክትሪክ"],
    reason: "Mentions electrical utility, power grid components, or electrical hazards",
  },
  {
    slugs: ["roads", "infrastructure"],
    keywords: ["road", "pothole", "asphalt", "street", "cobblestone", "crater", "pavement"],
    amharicKeywords: ["መንገድ", "አስፋልት", "ጉድጓድ", "ኮብልስቶን"],
    reason: "Identifies road surface deterioration, potholes, or street damage",
  },
  {
    slugs: ["drainage", "infrastructure"],
    keywords: ["drain", "drainage", "sewage", "gutter", "culvert", "sewer", "flood", "overflow"],
    amharicKeywords: ["ፍሳሽ", "የፍሳሽ", "ቦይ", "ጎርፍ"],
    reason: "References stormwater drainage blockage, sewage backup, or runoff overflow",
  },
  {
    slugs: ["waste-management", "public-services"],
    keywords: ["waste", "trash", "garbage", "rubbish", "dump", "litter", "refuse"],
    amharicKeywords: ["ቆሻሻ", "ጥራጊ", "የቆሻሻ"],
    reason: "Describes solid waste accumulation or missing garbage disposal services",
  },
  {
    slugs: ["streetlights", "infrastructure"],
    keywords: ["streetlight", "lamp", "pole", "light", "dark street", "lighting"],
    amharicKeywords: ["የመንገድ መብራት", "መብራት ፖል", "ፋኖስ"],
    reason: "Relates to public roadway illumination and streetlight outages",
  },
  {
    slugs: ["traffic-infrastructure", "infrastructure"],
    keywords: ["traffic", "signal", "traffic light", "crosswalk", "sign", "pedestrian"],
    amharicKeywords: ["የትራፊክ መብራት", "ምልክት", "ትራፊክ"],
    reason: "Pertains to traffic control signals, road signage, or pedestrian safety fixtures",
  },
];

export class MockAIProvider implements IAIProvider {
  public readonly name = "Chigir Ale SmartDecision Engine";
  public readonly model = "gemini-2.0-flash-civic-v1";
  public readonly version = "2026.10";

  /**
   * Classify category using semantic keywords in both English and Amharic.
   */
  async classifyCategory(
    title: string,
    description: string,
    availableCategories: Array<{ id: string; name: string; slug: string }>
  ): Promise<CategoryClassificationResult> {
    const combined = `${title} ${description}`.toLowerCase();

    let matchedRule: CategoryKeywordRule | null = null;
    let matchScore = 0;

    for (const rule of CATEGORY_RULES) {
      let currentScore = 0;
      for (const kw of rule.keywords) {
        if (combined.includes(kw.toLowerCase())) currentScore += 2;
      }
      for (const amKw of rule.amharicKeywords) {
        if (combined.includes(amKw)) currentScore += 3;
      }

      if (currentScore > matchScore) {
        matchScore = currentScore;
        matchedRule = rule;
      }
    }

    // Default fallback if no keyword matches
    const defaultCategory =
      availableCategories.find((c) => c.slug === "infrastructure" || c.slug === "roads") ||
      availableCategories[0] || { id: "cat-default", name: "General Infrastructure", slug: "infrastructure" };

    if (!matchedRule || matchScore === 0) {
      return {
        suggestedCategoryId: defaultCategory.id,
        suggestedCategoryName: defaultCategory.name,
        confidence: 0.55,
        reasoning: "General civic infrastructure issue requiring human triage review.",
        alternativeCategories: availableCategories.slice(0, 2).map((c) => ({
          categoryId: c.id,
          categoryName: c.name,
          confidence: 0.45,
        })),
      };
    }

    // Find category matching the rule's slugs
    let foundCategory = availableCategories.find((c) => matchedRule!.slugs.includes(c.slug));
    if (!foundCategory) {
      foundCategory = defaultCategory;
    }

    const confidence = Math.min(0.96, Math.max(0.72, 0.65 + matchScore * 0.05));

    const alternatives = availableCategories
      .filter((c) => c.id !== foundCategory!.id)
      .slice(0, 2)
      .map((c, i) => ({
        categoryId: c.id,
        categoryName: c.name,
        confidence: Math.max(0.2, +(1 - confidence - (i + 1) * 0.1).toFixed(2)),
      }));

    return {
      suggestedCategoryId: foundCategory.id,
      suggestedCategoryName: foundCategory.name,
      confidence: +confidence.toFixed(2),
      reasoning: `${matchedRule.reason} (matched keywords).`,
      alternativeCategories: alternatives,
    };
  }

  /**
   * Produce structured summary and urgency estimation.
   */
  async summarizeReport(
    title: string,
    description: string
  ): Promise<ReportSummaryResult> {
    const text = `${title}. ${description}`;
    const sentences = text
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // Extract key points
    const keyPoints = sentences.slice(0, 3);
    if (keyPoints.length === 0) {
      keyPoints.push(title);
    }

    // Urgency detection
    const lower = text.toLowerCase();
    const isCritical =
      lower.includes("emergency") ||
      lower.includes("spark") ||
      lower.includes("collapse") ||
      lower.includes("explosion") ||
      lower.includes("casualty") ||
      lower.includes("አደጋ");
    const isHigh =
      lower.includes("burst") ||
      lower.includes("flood") ||
      lower.includes("blocking") ||
      lower.includes("deep") ||
      lower.includes("major");

    const detectedUrgency = isCritical
      ? "CRITICAL"
      : isHigh
      ? "HIGH"
      : lower.includes("slow") || lower.includes("minor")
      ? "LOW"
      : "MEDIUM";

    const sentiment = isCritical ? "URGENT" : isHigh ? "CONCERNED" : "NEUTRAL";

    // Summary synthesis
    const summary = sentences.length > 1
      ? `${sentences[0]}. ${sentences[1]}`
      : `${title} - ${description.slice(0, 120)}...`;

    // Extract affected infrastructure
    const affectedInfrastructure: string[] = [];
    if (lower.includes("water") || lower.includes("pipe") || lower.includes("ውሃ")) affectedInfrastructure.push("Water Supply Network");
    if (lower.includes("road") || lower.includes("asphalt") || lower.includes("መንገድ")) affectedInfrastructure.push("Municipal Roadway");
    if (lower.includes("power") || lower.includes("wire") || lower.includes("መብራት")) affectedInfrastructure.push("Electrical Grid");
    if (lower.includes("drain") || lower.includes("sewer") || lower.includes("ፍሳሽ")) affectedInfrastructure.push("Stormwater Drainage");
    if (affectedInfrastructure.length === 0) affectedInfrastructure.push("Public Infrastructure");

    return {
      summary,
      keyPoints,
      detectedUrgency,
      sentiment,
      affectedInfrastructure,
    };
  }

  /**
   * Identify duplicates with semantic and spatial reasons.
   */
  async detectDuplicates(
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
  ): Promise<AIDuplicateSuggestion[]> {
    const suggestions: AIDuplicateSuggestion[] = [];

    for (const candidate of candidates) {
      const match = DuplicateService.evaluateDuplicate({
        sourceTitle: target.title,
        sourceDescription: target.description,
        sourceCategoryId: target.categoryId,
        sourceCreatedAt: new Date(),
        sourceLatitude: target.latitude,
        sourceLongitude: target.longitude,

        candidateTitle: candidate.title,
        candidateDescription: candidate.description,
        candidateCategoryId: candidate.categoryId,
        candidateCreatedAt: candidate.createdAt,
        candidateLatitude: candidate.latitude,
        candidateLongitude: candidate.longitude,
      });

      if (match.confidence >= 0.45 || match.isDuplicateCandidate) {
        let reason = "";
        if (match.distanceMeters !== null && match.distanceMeters < 150 && match.categoryMatch) {
          reason = `High spatial proximity (${match.distanceMeters}m) and matching category with ${(match.textSimilarity * 100).toFixed(0)}% description overlap.`;
        } else if (match.textSimilarity > 0.6) {
          reason = `Strong textual similarity (${(match.textSimilarity * 100).toFixed(0)}%) in issue description.`;
        } else {
          reason = `Reported in same category and timeframe with moderate overlap.`;
        }

        suggestions.push({
          reportId: candidate.id,
          publicReference: candidate.publicReference,
          title: candidate.title,
          confidence: match.confidence,
          similarityReason: reason,
          distanceMeters: match.distanceMeters,
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Analyze image evidence metadata.
   */
  async analyzeImage(imageMetadata: {
    mimeType: string;
    sizeBytes?: number;
    fileName?: string;
  }): Promise<ImageAnalysisResult> {
    const name = (imageMetadata.fileName || "").toLowerCase();
    const detectedIssues: string[] = [];
    const safetyHazards: string[] = [];
    let damageSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";
    const infrastructureDamagePresent = true;
    let suggestedSlug: string | undefined = undefined;

    if (name.includes("pipe") || name.includes("burst") || name.includes("water")) {
      detectedIssues.push("High pressure water pipe rupture");
      detectedIssues.push("Street surface erosion");
      safetyHazards.push("Hydrostatic ground undermining");
      damageSeverity = "HIGH";
      suggestedSlug = "water";
    } else if (name.includes("wire") || name.includes("spark") || name.includes("pole")) {
      detectedIssues.push("Exposed electrical cabling");
      safetyHazards.push("Severe electrocution hazard");
      safetyHazards.push("Potential fire hazard");
      damageSeverity = "CRITICAL";
      suggestedSlug = "electricity";
    } else if (name.includes("pothole") || name.includes("road") || name.includes("asphalt")) {
      detectedIssues.push("Asphalt pavement crater / pothole");
      safetyHazards.push("Vehicle tire and suspension damage hazard");
      damageSeverity = "MEDIUM";
      suggestedSlug = "roads";
    } else if (name.includes("drain") || name.includes("flood") || name.includes("sewage")) {
      detectedIssues.push("Blocked stormwater drainage conduit");
      safetyHazards.push("Urban flash flood risk");
      damageSeverity = "HIGH";
      suggestedSlug = "drainage";
    } else {
      detectedIssues.push("Visual evidence of physical infrastructure anomaly");
      damageSeverity = "MEDIUM";
    }

    return {
      detectedIssues,
      infrastructureDamagePresent,
      damageSeverity,
      confidence: 0.88,
      safetyHazards,
      suggestedCategorySlug: suggestedSlug,
    };
  }

  /**
   * Produce comprehensive recommendations per Spec §136.
   */
  async recommendDecisions(
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
  ): Promise<SmartRecommendation> {
    const classification = await this.classifyCategory(
      report.title,
      report.description,
      categories
    );

    const summaryRes = await this.summarizeReport(report.title, report.description);

    // Map suggested category to responsible municipal department
    const targetCat = categories.find((c) => c.id === classification.suggestedCategoryId);
    const catSlug = targetCat?.slug || "";

    let suggestedDept = departments[0];
    if (catSlug.includes("road") || catSlug.includes("bridge") || catSlug.includes("traffic")) {
      suggestedDept = departments.find((d) => d.slug.includes("road") || d.name.toLowerCase().includes("road")) || departments[0];
    } else if (catSlug.includes("water") || catSlug.includes("drainage") || catSlug.includes("sewer")) {
      suggestedDept = departments.find((d) => d.slug.includes("water") || d.name.toLowerCase().includes("water")) || departments[0];
    } else if (catSlug.includes("electr") || catSlug.includes("light")) {
      suggestedDept = departments.find((d) => d.slug.includes("power") || d.name.toLowerCase().includes("electric")) || departments[0];
    }

    // Determine recommended severity
    let recSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";
    let severityReason = "Standard priority based on intake triage.";

    if (summaryRes.detectedUrgency === "CRITICAL" || report.severity === "CRITICAL") {
      recSeverity = "CRITICAL";
      severityReason = "Immediate safety threat detected in report keywords and urgency indicators.";
    } else if (report.confirmationCount >= 5 || summaryRes.detectedUrgency === "HIGH") {
      recSeverity = "HIGH";
      severityReason = `Multiple citizen confirmations (${report.confirmationCount}) and elevated community impact.`;
    } else if (report.severity === "LOW" && report.confirmationCount < 2) {
      recSeverity = "LOW";
      severityReason = "Isolated minor defect with low reported disruption.";
    }

    const duplicates: AIDuplicateSuggestion[] = duplicateCandidates.map((d) => ({
      reportId: d.id,
      publicReference: d.publicReference,
      title: d.title,
      confidence: d.confidence,
      similarityReason: d.similarityReason,
    }));

    // Synthesize human-readable algorithmic explanation (Spec §136)
    const reasonParts = [
      `Category confidence: ${(classification.confidence * 100).toFixed(0)}% (${classification.reasoning})`,
      `Priority recommendation: ${recSeverity} (${severityReason})`,
    ];
    if (duplicates.length > 0) {
      reasonParts.push(`Identified ${duplicates.length} potential duplicate report(s) in vicinity.`);
    }

    return {
      suggestedCategory: targetCat
        ? {
            id: targetCat.id,
            name: targetCat.name,
            confidence: classification.confidence,
            reason: classification.reasoning,
          }
        : undefined,
      suggestedDepartment: suggestedDept
        ? {
            id: suggestedDept.id,
            name: suggestedDept.name,
            confidence: 0.9,
            reason: `Direct operational mandate for ${targetCat?.name || "infrastructure"} issues.`,
          }
        : undefined,
      suggestedSeverity: {
        severity: recSeverity,
        confidence: 0.85,
        reason: severityReason,
      },
      possibleDuplicates: duplicates,
      summary: summaryRes.summary,
      confidence: classification.confidence,
      reason: reasonParts.join(" | "),
      model: this.model,
      provider: this.name,
      modelVersion: this.version,
    };
  }
}
