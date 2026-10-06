import { NextResponse } from "next/server";
import { requireAuthorityUser } from "@/lib/auth/session";
import { AnalyticsService } from "@/server/services/analytics.service";

export async function GET(request: Request) {
  try {
    await requireAuthorityUser();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);

    const data = await AnalyticsService.getOperationalAnalytics({ days });
    return NextResponse.json(data);
  } catch (error) {
    const isAuth = error instanceof Error && error.message.includes("FORBIDDEN");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load operational analytics" },
      { status: isAuth ? 403 : 500 }
    );
  }
}
