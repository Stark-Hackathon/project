"use server";

/**
 * Chigir Ale - Moderation Server Actions
 * Spec: Section 122 — Moderation Tooling & Auditing
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthorityUser } from "@/lib/auth/session";
import { ModerationService, type ModerationClassification } from "@/server/services/moderation.service";
import { ok, err } from "@/types/domain";

const moderationSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["REJECT", "FLAG_ABUSIVE", "MARK_DUPLICATE", "REQUEST_INFO", "RECLASSIFY"]),
  classification: z.enum([
    "VALID",
    "INVALID",
    "SPAM",
    "ABUSIVE",
    "DUPLICATE",
    "MISCLASSIFIED",
    "MISSING_INFORMATION",
  ]),
  reason: z.string().min(5, "Moderation explanation must be at least 5 characters"),
  notes: z.string().optional(),
  canonicalReportReference: z.string().optional(),
  newCategoryId: z.string().uuid().optional(),
});

export type ModerationFormData = z.infer<typeof moderationSchema>;

export async function moderateReportAction(input: ModerationFormData) {
  try {
    const user = await requireAuthorityUser();

    const parsed = moderationSchema.safeParse(input);
    if (!parsed.success) {
      return err(new Error(parsed.error.issues[0]?.message ?? "Invalid input"));
    }

    const result = await ModerationService.applyModeration({
      reportId: parsed.data.reportId,
      actorUserId: user.id,
      action: parsed.data.action,
      classification: parsed.data.classification as ModerationClassification,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
      canonicalReportReference: parsed.data.canonicalReportReference,
      newCategoryId: parsed.data.newCategoryId,
    });

    revalidatePath("/authority");
    revalidatePath("/authority/reports");
    revalidatePath(`/authority/reports/${result.reportId}`);
    revalidatePath("/reports");

    return ok(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to execute moderation action";
    return err(new Error(msg));
  }
}
