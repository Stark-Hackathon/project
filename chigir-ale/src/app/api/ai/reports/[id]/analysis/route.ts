/**
 * Chigir Ale - Report AI Analysis API
 * Spec: Sections 35–37 (AI Architecture, Jobs & Provenance)
 */
import { NextResponse } from "next/server";
import { AIService } from "@/server/services/ai/ai.service";
import { AIJobService } from "@/server/services/ai/ai-job.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [analyses, jobs, recommendations] = await Promise.all([
      AIService.getReportAnalyses(id),
      AIJobService.getReportJobs(id),
      AIService.getSmartRecommendations(id).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      reportId: id,
      recommendations,
      analyses,
      jobs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch AI analysis",
      },
      { status: 500 }
    );
  }
}
