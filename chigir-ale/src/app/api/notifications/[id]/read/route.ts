import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { NotificationService } from "@/server/services/notifications";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const updated = await NotificationService.markAsRead(id, user.id);
    if (!updated) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to mark notification read";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
