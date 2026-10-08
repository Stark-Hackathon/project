"use server";

/**
 * Chigir Ale - AI & Voice Server Actions
 * Spec: Sections 35–38 (AI Jobs, Provenance, Voice) & 136–140 (Recommendations, Overrides, Safety)
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthorityUser, getAuthenticatedUser } from "@/lib/auth/session";
import { AIService } from "@/server/services/ai/ai.service";
import { AIJobService } from "@/server/services/ai/ai-job.service";
import { VoiceService } from "@/server/services/voice/voice.service";
import { ok, err } from "@/types/domain";

const overrideSchema = z.object({
  reportId: z.string().uuid(),
  overrideType: z.enum(["CATEGORY", "SEVERITY", "DEPARTMENT", "DUPLICATE"]),
  originalValue: z.string().min(1),
  overriddenValue: z.string().min(1),
  reason: z.string().min(5, "A reason of at least 5 characters is required to override AI recommendations"),
  applyChange: z.boolean().default(true),
});

/**
 * Retrieve all AI analyses, jobs, and recommendations for a report.
 */
export async function getReportAIAnalysisAction(reportId: string) {
  try {
    const [analyses, jobs] = await Promise.all([
      AIService.getReportAnalyses(reportId),
      AIJobService.getReportJobs(reportId),
    ]);

    // Find the latest recommendation analysis if it exists
    const latestRec = analyses.find((a: { type: string }) => a.type === "SMART_RECOMMENDATION");

    return ok({
      analyses,
      jobs,
      recommendation: latestRec ? (latestRec.result as unknown) : null,
    });
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to load AI analyses");
  }
}

/**
 * Run or refresh AI decision support analysis for an incident report.
 */
export async function runReportAIAnalysisAction(reportId: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return err("Unauthorized: Sign in required to run AI analysis");
    }

    const recommendation = await AIService.getSmartRecommendations(reportId);
    revalidatePath(`/authority/reports`);

    return ok(recommendation);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to run AI recommendations");
  }
}

/**
 * Authority human override of an AI suggestion (Spec §137).
 * Consequential operational actions remain strictly human controlled.
 */
export async function overrideAISuggestionAction(data: z.infer<typeof overrideSchema>) {
  try {
    const authority = await requireAuthorityUser();
    const parsed = overrideSchema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message || "Invalid override data");
    }

    const { reportId, overrideType, originalValue, overriddenValue, reason, applyChange } = parsed.data;

    await AIService.recordHumanOverride(
      {
        reportId,
        overrideType,
        originalValue,
        overriddenValue,
        reason,
        actorUserId: authority.id,
      },
      applyChange
    );

    revalidatePath(`/authority/reports`);
    return ok({ success: true, message: `Successfully overrode AI ${overrideType.toLowerCase()}` });
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to record human override");
  }
}

/**
 * Retry a failed background AI job.
 */
export async function retryAIJobAction(jobId: string) {
  try {
    await requireAuthorityUser();
    const success = await AIJobService.retryJob(jobId);
    revalidatePath(`/authority/reports`);

    return ok({ success });
  } catch (error) {
    return err(error instanceof Error ? error.message : "Failed to retry AI job");
  }
}

/**
 * Transcribe voice audio recording with English & Amharic language support (Spec §38).
 */
export async function transcribeVoiceAction(input: {
  base64Audio?: string;
  mimeType?: string;
  simulatedText?: string;
  speechTranscript?: string;
  languageHint?: "en" | "am" | "om";
}) {
  try {
    const result = await VoiceService.transcribe(input);
    return ok(result);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Voice transcription failed");
  }
}

/**
 * Translate and normalize text across Amharic and English.
 */
export async function translateTextAction(text: string, fromLang: string, toLang: string) {
  try {
    const result = await VoiceService.translate(text, fromLang, toLang);
    return ok(result);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Translation failed");
  }
}
