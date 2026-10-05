/**
 * Chigir Ale - Duplicate Detection & Matching Service
 * Spec: Section 64 — Duplicate Candidate
 * Calculates similarity confidence across geographic distance, categories, and text.
 */
import { NearbyIssuesService } from "./nearby-issues.service";

export interface DuplicateAnalysisInput {
  sourceTitle: string;
  sourceDescription: string;
  sourceCategoryId: string;
  sourceCreatedAt: Date;
  sourceLatitude?: number | null;
  sourceLongitude?: number | null;

  candidateTitle: string;
  candidateDescription: string;
  candidateCategoryId: string;
  candidateCreatedAt: Date;
  candidateLatitude?: number | null;
  candidateLongitude?: number | null;
}

export interface DuplicateMatchResult {
  confidence: number;
  isDuplicateCandidate: boolean;
  distanceMeters: number | null;
  textSimilarity: number;
  categoryMatch: boolean;
  timeDifferenceMinutes: number;
}

export class DuplicateService {
  /**
   * Tokenize and normalize text for similarity comparison.
   */
  static tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s\u1200-\u137F]/g, "") // support latin and Ethiopic script
        .split(/\s+/)
        .filter((token) => token.length > 2)
    );
  }

  /**
   * Calculate Jaccard word similarity between two text snippets (0.0 to 1.0).
   */
  static calculateTextSimilarity(text1: string, text2: string): number {
    const tokens1 = DuplicateService.tokenize(text1);
    const tokens2 = DuplicateService.tokenize(text2);

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    let intersectionCount = 0;
    for (const t of tokens1) {
      if (tokens2.has(t)) {
        intersectionCount++;
      }
    }

    const unionCount = new Set([...tokens1, ...tokens2]).size;
    return unionCount === 0 ? 0 : Number((intersectionCount / unionCount).toFixed(3));
  }

  /**
   * Evaluate two reports for duplicate likelihood according to Spec section 64.
   */
  static evaluateDuplicate(input: DuplicateAnalysisInput): DuplicateMatchResult {
    let score = 0;

    // 1. Category Match (30%)
    const categoryMatch = input.sourceCategoryId === input.candidateCategoryId;
    if (categoryMatch) {
      score += 0.3;
    }

    // 2. Spatial Distance (40%)
    let distanceMeters: number | null = null;
    if (
      input.sourceLatitude != null &&
      input.sourceLongitude != null &&
      input.candidateLatitude != null &&
      input.candidateLongitude != null
    ) {
      distanceMeters = NearbyIssuesService.calculateDistanceMeters(
        input.sourceLatitude,
        input.sourceLongitude,
        input.candidateLatitude,
        input.candidateLongitude
      );

      if (distanceMeters <= 50) {
        score += 0.4;
      } else if (distanceMeters <= 150) {
        score += 0.25;
      } else if (distanceMeters <= 500) {
        score += 0.1;
      }
    }

    // 3. Text Similarity (20%)
    const fullText1 = `${input.sourceTitle} ${input.sourceDescription}`;
    const fullText2 = `${input.candidateTitle} ${input.candidateDescription}`;
    const textSimilarity = DuplicateService.calculateTextSimilarity(fullText1, fullText2);
    score += textSimilarity * 0.2;

    // 4. Time Proximity (10%)
    const timeDiffMs = Math.abs(
      input.sourceCreatedAt.getTime() - input.candidateCreatedAt.getTime()
    );
    const timeDifferenceMinutes = Math.round(timeDiffMs / (1000 * 60));

    if (timeDifferenceMinutes <= 24 * 60) {
      // Within 24 hours
      score += 0.1;
    } else if (timeDifferenceMinutes <= 7 * 24 * 60) {
      // Within 7 days
      score += 0.05;
    }

    const confidence = Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));

    return {
      confidence,
      isDuplicateCandidate: confidence >= 0.55,
      distanceMeters,
      textSimilarity,
      categoryMatch,
      timeDifferenceMinutes,
    };
  }
}
