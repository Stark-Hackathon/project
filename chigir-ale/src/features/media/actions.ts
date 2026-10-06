"use server";

/**
 * Chigir Ale - Media Server Actions
 * Spec: Sections 77 (Upload Architecture) & 78 (Storage Architecture)
 */
import { z } from "zod";
import type { Result } from "@/types";
import { requireAuth } from "@/lib/auth/session";
import { StorageService, type SignedUploadUrlResult } from "@/server/services/storage.service";

const requestUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  reportId: z.string().uuid().optional(),
});

const confirmUploadSchema = z.object({
  storageKey: z.string().min(1),
  reportId: z.string().uuid(),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  checksum: z.string().optional(),
});

/**
 * Request a signed direct-to-storage upload URL.
 */
export async function requestMediaUploadUrlAction(
  input: z.infer<typeof requestUploadSchema>
): Promise<Result<SignedUploadUrlResult>> {
  try {
    const user = await requireAuth();
    const parsed = requestUploadSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: new Error(parsed.error.issues[0]?.message ?? "Invalid upload parameters."),
      };
    }

    const result = await StorageService.createUploadUrl({
      ...parsed.data,
      userId: user.id,
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to generate upload URL"),
    };
  }
}

/**
 * Confirm uploaded evidence file and attach to report.
 */
export async function confirmMediaUploadAction(
  input: z.infer<typeof confirmUploadSchema>
): Promise<Result<{ mediaId: string; publicUrl: string | null }>> {
  try {
    const user = await requireAuth();
    const parsed = confirmUploadSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: new Error(parsed.error.issues[0]?.message ?? "Invalid confirmation parameters."),
      };
    }

    const media = await StorageService.confirmUpload({
      ...parsed.data,
      userId: user.id,
    });

    return { success: true, data: { mediaId: media.id, publicUrl: media.publicUrl } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to confirm media upload"),
    };
  }
}
