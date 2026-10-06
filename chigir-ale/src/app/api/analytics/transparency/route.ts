import { NextResponse } from "next/server";
import { AnalyticsService } from "@/server/services/analytics.service";

export async function GET() {
  try {
    const data = await AnalyticsService.getPublicTransparencyMetrics();
    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load transparency metrics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
