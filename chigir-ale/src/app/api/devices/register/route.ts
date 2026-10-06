import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { NotificationService } from "@/server/services/notifications";

const registerSchema = z.object({
  platform: z.enum(["IOS", "ANDROID", "WEB"]),
  pushToken: z.string().min(5),
  appVersion: z.string().optional(),
  deviceName: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const device = await NotificationService.registerDevice({
      userId: user.id,
      platform: parsed.data.platform,
      pushToken: parsed.data.pushToken,
      appVersion: parsed.data.appVersion,
      deviceName: parsed.data.deviceName,
    });

    return NextResponse.json({ success: true, deviceId: device.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to register push device";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
