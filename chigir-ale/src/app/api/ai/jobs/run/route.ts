/**
 * Chigir Ale - AI Job Runner API
 * Spec: Section 36 (AI Job Architecture)
 * Processes pending AI jobs asynchronously.
 */
import { NextResponse } from "next/server";
import { AIJobService } from "@/server/services/ai/ai-job.service";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecretHeader = request.headers.get("x-cron-secret");
    const configuredSecret = process.env.CRON_SECRET;

    const isSecretAuthorized =
      Boolean(configuredSecret) &&
      (authHeader === `Bearer ${configuredSecret}` || cronSecretHeader === configuredSecret);

    if (!isSecretAuthorized) {
      const user = await getAuthenticatedUser();
      if (!user) {
        return NextResponse.json(
          { success: false, error: "UNAUTHORIZED: Missing cron secret token or authenticated session." },
          { status: 401 }
        );
      }

      const membership = await prisma.membership.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
          role: { in: ["STAFF", "DEPARTMENT_MANAGER", "ORG_ADMIN", "PLATFORM_ADMIN"] },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: "FORBIDDEN: Requires authority staff privileges." },
          { status: 403 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const rawLimit = typeof body.limit === "number" ? body.limit : 5;
    const limit = Math.min(Math.max(1, rawLimit), 50);

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
