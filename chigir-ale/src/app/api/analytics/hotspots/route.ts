import { NextResponse } from "next/server";
import { HotspotService } from "@/server/services/hotspot.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);
    const categoryId = searchParams.get("categoryId") || undefined;
    const subcity = searchParams.get("subcity") || undefined;

    const hotspots = await HotspotService.detectHotspots({ days, categoryId, subcity });
    return NextResponse.json({ hotspots });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to detect hotspots";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
