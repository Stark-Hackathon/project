/**
 * Chigir Ale - AI Job Runner API
 * Spec: Section 36 (AI Job Architecture)
 * Processes pending AI jobs asynchronously.
 */
import { NextResponse } from "next/server";
import { AIJobService } from "@/server/services/ai/ai-job.service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = typeof body.limit === "number" ? body.limit : 5;

    const processedCount = await AIJobService.processPendingJobs(limit);

    return NextResponse.json({
      success: true,
      processedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to run AI jobs",
      },
      { status: 500 }
    );
  }
}
