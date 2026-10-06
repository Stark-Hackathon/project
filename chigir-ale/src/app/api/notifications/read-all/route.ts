import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { NotificationService } from "@/server/services/notifications";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const count = await NotificationService.markAllAsRead(user.id);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to mark all notifications read";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
