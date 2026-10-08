"use server";

/**
 * Chigir Ale - Community & Resolution Feedback Server Actions
 * Spec: Section 23 (Nearby Issues & Confirmations), 24 (Upvotes), 27 (Resolution Feedback)
 */
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { CommunityService } from "@/server/services/community.service";
import { NearbyIssuesService } from "@/server/services/nearby-issues.service";
import { prisma } from "@/lib/db/prisma";
import { ok, err, type Result } from "@/types/domain";

const feedbackSchema = z.object({
  reportId: z.string().uuid(),
  result: z.enum(["CONFIRMED_FIXED", "NOT_FIXED"]),
  comment: z.string().max(1000).optional(),
});

export async function toggleUpvoteAction(reportId: string): Promise<Result<{ upvoted: boolean; count: number }>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return err("UNAUTHORIZED: Please sign in to upvote this report.");
    }
    const res = await CommunityService.toggleUpvote(reportId, user.id);
    return ok(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle upvote.";
    return err(message);
  }
}

export async function confirmReportAction(reportId: string): Promise<Result<{ alreadyConfirmed: boolean; count: number }>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return err("UNAUTHORIZED: Please sign in to confirm this report.");
    }
    const res = await CommunityService.confirmReport(reportId, user.id);
    return ok(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to confirm report.";
    return err(message);
  }
}

export async function submitResolutionFeedbackAction(
  rawData: z.infer<typeof feedbackSchema>
): Promise<Result<{ message: string; newStatus: string }>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return err("UNAUTHORIZED: Please sign in to submit resolution feedback.");
    }

    const parsed = feedbackSchema.safeParse(rawData);
    if (!parsed.success) {
      return err("Invalid feedback parameters.");
    }

    const res = await CommunityService.submitResolutionFeedback(
      parsed.data.reportId,
      user.id,
      parsed.data.result,
      parsed.data.comment
    );
    return ok(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit resolution feedback.";
    return err(message);
  }
}

export async function getNearbyIssuesAction(
  lat: number,
  lng: number,
  radiusKm = 5,
  categoryId?: string
) {
  try {
    const issues = await NearbyIssuesService.findNearbyReports(lat, lng, radiusKm, categoryId);
    return ok(issues);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load nearby issues.";
    return err(message);
  }
}

export async function getCommunityInteractionState(reportId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ok({ hasUpvoted: false, hasConfirmed: false });
  }

  try {
    const [upvote, confirmation] = await Promise.all([
      prisma.reportUpvote.findUnique({
        where: {
          reportId_userId: {
            reportId,
            userId: user.id,
          },
        },
      }),
      prisma.reportConfirmation.findUnique({
        where: {
          reportId_userId: {
            reportId,
            userId: user.id,
          },
        },
      }),
    ]);

    return ok({
      hasUpvoted: !!upvote,
      hasConfirmed: !!confirmation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load community state.";
    return err(message);
  }
}
