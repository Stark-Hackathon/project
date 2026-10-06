import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { NotificationService } from "@/server/services/notifications";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  try {
    const notifications = await NotificationService.getUserNotifications(user.id, {
      unreadOnly,
      limit,
      offset,
    });
    const unreadCount = await NotificationService.getUnreadCount(user.id);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch notifications";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
