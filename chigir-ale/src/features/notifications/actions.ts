"use server";

/**
 * Chigir Ale - Notification Server Actions
 * Spec: Section 41 (Notifications), Section 42 (Mobile Push Architecture)
 */
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { NotificationService } from "@/server/services/notifications";
import { ok, err, type Result } from "@/types/domain";

const registerDeviceSchema = z.object({
  platform: z.enum(["IOS", "ANDROID", "WEB"]),
  pushToken: z.string().min(10, "Valid push token is required"),
  appVersion: z.string().optional(),
  deviceName: z.string().optional(),
});

export async function getNotificationsAction(opts?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new Error("UNAUTHORIZED: Sign in to view notifications."));
  }

  try {
    const notifications = await NotificationService.getUserNotifications(user.id, opts);
    const unreadCount = await NotificationService.getUnreadCount(user.id);

    return ok({
      notifications,
      unreadCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load notifications.";
    return err(new Error(msg));
  }
}

export async function getUnreadCountAction(): Promise<Result<{ unreadCount: number }>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return ok({ unreadCount: 0 });
  }

  try {
    const unreadCount = await NotificationService.getUnreadCount(user.id);
    return ok({ unreadCount });
  } catch {
    return ok({ unreadCount: 0 });
  }
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<Result<{ success: boolean }>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new Error("UNAUTHORIZED: Sign in required."));
  }

  if (!notificationId || typeof notificationId !== "string") {
    return err(new Error("Invalid notification ID."));
  }

  try {
    const updated = await NotificationService.markAsRead(notificationId, user.id);
    if (!updated) {
      return err(new Error("Notification not found."));
    }
    return ok({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update notification.";
    return err(new Error(msg));
  }
}

export async function markAllNotificationsReadAction(): Promise<Result<{ count: number }>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new Error("UNAUTHORIZED: Sign in required."));
  }

  try {
    const count = await NotificationService.markAllAsRead(user.id);
    return ok({ count });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to mark all as read.";
    return err(new Error(msg));
  }
}

export async function registerDeviceTokenAction(
  rawInput: z.infer<typeof registerDeviceSchema>
): Promise<Result<{ deviceId: string }>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new Error("UNAUTHORIZED: Sign in to register device for push notifications."));
  }

  const parsed = registerDeviceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return err(new Error("Invalid device registration payload."));
  }

  try {
    const device = await NotificationService.registerDevice({
      userId: user.id,
      platform: parsed.data.platform,
      pushToken: parsed.data.pushToken,
      appVersion: parsed.data.appVersion,
      deviceName: parsed.data.deviceName,
    });

    return ok({ deviceId: device.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to register push device.";
    return err(new Error(msg));
  }
}

export async function unregisterDeviceTokenAction(
  pushToken: string
): Promise<Result<{ success: boolean }>> {
  if (!pushToken || typeof pushToken !== "string") {
    return err(new Error("Push token is required."));
  }

  try {
    const success = await NotificationService.unregisterDevice(pushToken);
    return ok({ success });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to unregister push device.";
    return err(new Error(msg));
  }
}
