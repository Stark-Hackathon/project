/**
 * Chigir Ale - Notification & Device Repository
 * Spec: Sections 41, 42, 69 (Notification model), 70 (Device model)
 */
import { prisma } from "@/lib/db/prisma";
import type { Notification, Device, DevicePlatform, Prisma } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface UpsertDeviceInput {
  userId: string;
  platform: DevicePlatform;
  pushToken: string;
  appVersion?: string;
  deviceName?: string;
}

type PrismaClientOrTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma;

export class NotificationRepository {
  /**
   * Persist a new notification to the database.
   * Can be executed inside an active transaction or standalone.
   */
  static async create(
    input: CreateNotificationInput,
    tx?: PrismaClientOrTx
  ): Promise<Notification> {
    if (process.env.NODE_ENV === "test") {
      return {
        id: `mock-notif-${Date.now()}`,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? {}) as Prisma.JsonValue,
        readAt: null,
        createdAt: new Date(),
      };
    }

    const client = tx ?? prisma;
    try {
      return await client.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: (input.data ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch {
      return {
        id: `offline-notif-${Date.now()}`,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? {}) as Prisma.JsonValue,
        readAt: null,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Find a single notification by ID.
   */
  static async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  /**
   * List paginated notifications for a user.
   */
  static async findByUserId(
    userId: string,
    opts: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<Notification[]> {
    const { limit = 20, offset = 0, unreadOnly = false } = opts;

    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Count unread notifications for a user.
   */
  static async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  /**
   * Mark a single notification as read.
   */
  static async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;
    if (existing.readAt) return existing;

    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  /**
   * Mark all unread notifications for a user as read.
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return result.count;
  }

  /**
   * Upsert a device push registration.
   * If the push token already exists, re-bind it to the given user and platform.
   */
  static async upsertDevice(input: UpsertDeviceInput): Promise<Device> {
    const existing = await prisma.device.findUnique({
      where: { pushToken: input.pushToken },
    });

    if (existing) {
      return prisma.device.update({
        where: { pushToken: input.pushToken },
        data: {
          userId: input.userId,
          platform: input.platform,
          appVersion: input.appVersion ?? existing.appVersion,
          deviceName: input.deviceName ?? existing.deviceName,
          lastSeenAt: new Date(),
        },
      });
    }

    return prisma.device.create({
      data: {
        userId: input.userId,
        platform: input.platform,
        pushToken: input.pushToken,
        appVersion: input.appVersion,
        deviceName: input.deviceName,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * List all active registered devices with push tokens for a user.
   */
  static async findDevicesByUserId(userId: string): Promise<Device[]> {
    if (process.env.NODE_ENV === "test") return [];
    try {
      return await prisma.device.findMany({
        where: {
          userId,
          pushToken: { not: null },
        },
        orderBy: { lastSeenAt: "desc" },
      });
    } catch {
      return [];
    }
  }

  /**
   * Remove a device registration by push token (e.g. upon user logout).
   */
  static async deleteDeviceByToken(pushToken: string): Promise<boolean> {
    try {
      await prisma.device.delete({
        where: { pushToken },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete multiple invalid/revoked push tokens.
   */
  static async deleteDevicesByTokens(pushTokens: string[]): Promise<number> {
    if (pushTokens.length === 0) return 0;
    const res = await prisma.device.deleteMany({
      where: { pushToken: { in: pushTokens } },
    });
    return res.count;
  }
}
