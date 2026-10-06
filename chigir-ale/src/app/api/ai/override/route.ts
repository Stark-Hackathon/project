/**
 * Chigir Ale - AI Human Override API
 * Spec: Section 137 (AI Human Override)
 */
import { NextResponse } from "next/server";
import { requireAuthorityUser } from "@/lib/auth/session";
import { AIService } from "@/server/services/ai/ai.service";

export async function POST(request: Request) {
  try {
    const authority = await requireAuthorityUser();
    const body = await request.json();

    const { reportId, overrideType, originalValue, overriddenValue, reason, applyChange } = body;

    if (!reportId || !overrideType || !reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Missing required fields or reason is shorter than 5 characters" },
        { status: 400 }
      );
    }

    await AIService.recordHumanOverride(
      {
        reportId,
        overrideType,
        originalValue: String(originalValue || ""),
        overriddenValue: String(overriddenValue || ""),
        reason: String(reason),
        actorUserId: authority.id,
      },
      applyChange !== false
    );

    return NextResponse.json({
      success: true,
      message: `Successfully recorded human override for ${overrideType}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record human override",
      },
      { status: 500 }
    );
  }
}
