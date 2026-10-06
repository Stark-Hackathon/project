/**
 * Chigir Ale - Notification Service
 * Spec: Sections 41 (Notifications), 42 (Mobile Push Architecture), 69, 70, 74 (Decoupled Transactions)
 * Handles in-app notifications, mobile/web push notifications, and transactional emails.
 */
import { prisma } from "@/lib/db/prisma";
import type { Notification } from "@prisma/client";
import {
  NotificationRepository,
  type CreateNotificationInput,
  type UpsertDeviceInput,
} from "@/server/repositories/notification.repository";
import {
  type EmailProvider,
  MockEmailProvider,
  SmtpEmailProvider,
  EmailTemplates,
} from "./providers/email.provider";
import {
  type PushProvider,
  MockPushProvider,
  FcmPushProvider,
} from "./providers/push.provider";
import {
  type SmsProvider,
  MockSmsProvider,
} from "./providers/sms.provider";

export type NotificationType =
  | "REPORT_SUBMITTED"
  | "REPORT_VERIFIED"
  | "REPORT_ASSIGNED"
  | "STATUS_CHANGED"
  | "REPORT_RESOLVED"
  | "CONFIRMATION_REQUEST"
  | "REPORT_REOPENED"
  | "AUTHORITY_MESSAGE"
  | "COMMUNITY_ALERT";

export interface SendNotificationOptions {
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels?: {
    inApp?: boolean;
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  actionUrl?: string;
}

export interface LifecycleEventPayload {
  type: NotificationType;
  reportId: string;
  publicReference: string;
  reportTitle: string;
  recipientUserId: string;
  recipientEmail?: string;
  recipientName?: string;
  fromStatus?: string;
  toStatus?: string;
  severity?: string;
  departmentName?: string;
  assigneeName?: string;
  message?: string;
  actionUrl?: string;
}

export class NotificationService {
  private static emailProvider: EmailProvider =
    process.env.NODE_ENV === "test" ? new MockEmailProvider() : new SmtpEmailProvider();

  private static pushProvider: PushProvider =
    process.env.NODE_ENV === "test" ? new MockPushProvider() : new FcmPushProvider();

  private static smsProvider: SmsProvider = new MockSmsProvider();

  /** Inject custom provider (useful for unit tests) */
  static setEmailProvider(provider: EmailProvider): void {
    this.emailProvider = provider;
  }

  /** Inject custom push provider (useful for unit tests) */
  static setPushProvider(provider: PushProvider): void {
    this.pushProvider = provider;
  }

  /** Inject custom SMS provider (useful for unit tests) */
  static setSmsProvider(provider: SmsProvider): void {
    this.smsProvider = provider;
  }

  /**
   * Primary entry point to create an in-app notification and dispatch
   * external channels (push, email, SMS) asynchronously.
   *
   * Spec Section 74: External provider network calls are completely decoupled
   * from the database transaction. If push or email delivery fails, the in-app
   * notification record is safely preserved and no error is thrown to caller.
   */
  static async createAndDispatch(
    opts: SendNotificationOptions,
    tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ): Promise<Notification> {
    const inAppEnabled = opts.channels?.inApp ?? true;

    // 1. Persist in-app notification to DB
    const input: CreateNotificationInput = {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: {
        ...opts.data,
        actionUrl: opts.actionUrl,
      },
    };

    const notification: Notification = inAppEnabled
      ? await NotificationRepository.create(input, tx)
      : ({
          id: `ephemeral-${Date.now()}`,
          userId: opts.userId,
          type: opts.type,
          title: opts.title,
          body: opts.body,
          data: opts.data ?? {},
          readAt: null,
          createdAt: new Date(),
        } as unknown as Notification);

    // 2. Asynchronous decoupled external channel dispatch
    // We execute without blocking or failing the transaction
    this.dispatchExternalChannels(opts, notification.id).catch((err) => {
      console.error("[NotificationService] Background channel dispatch error:", err);
    });

    return notification;
  }

  /**
   * Internal asynchronous delivery runner for external channels.
   * Isolates failures with Promise.allSettled and cleans up invalid push tokens.
   */
  private static async dispatchExternalChannels(
    opts: SendNotificationOptions,
    notificationId: string
  ): Promise<void> {
    const channels = {
      push: opts.channels?.push ?? true,
      email: opts.channels?.email ?? true,
      sms: opts.channels?.sms ?? false,
    };

    const tasks: Promise<unknown>[] = [];

    // Push channel dispatch
    if (channels.push) {
      tasks.push(
        this.dispatchPush(opts.userId, opts.title, opts.body, {
          notificationId,
          type: opts.type,
          actionUrl: opts.actionUrl ?? "",
          ...(opts.data ? Object.fromEntries(Object.entries(opts.data).map(([k, v]) => [k, String(v)])) : {}),
        })
      );
    }

    // Email channel dispatch
    if (channels.email) {
      tasks.push(this.dispatchEmail(opts));
    }

    // SMS channel dispatch
    if (channels.sms && opts.recipientPhone) {
      tasks.push(
        this.smsProvider.send({
          to: opts.recipientPhone,
          text: `${opts.title}: ${opts.body}`,
        })
      );
    }

    await Promise.allSettled(tasks);
  }

  /**
   * Dispatches push notification to all active devices registered for a user.
   * If any tokens are rejected by FCM/APNS as invalid, automatically revokes them.
   */
  private static async dispatchPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      const devices = await NotificationRepository.findDevicesByUserId(userId);
      const pushTokens = devices
        .map((d) => d.pushToken)
        .filter((t): t is string => Boolean(t && t.length > 0));

      if (pushTokens.length === 0) return;

      const unreadCount = await NotificationRepository.countUnread(userId);

      const result = await this.pushProvider.send({
        tokens: pushTokens,
        title,
        body,
        data,
        badge: unreadCount,
      });

      // Cleanup revoked or invalid tokens (Spec Section 42)
      if (result.invalidTokens && result.invalidTokens.length > 0) {
        await NotificationRepository.deleteDevicesByTokens(result.invalidTokens);
      }
    } catch (err) {
      console.error("[NotificationService] Push delivery error:", err);
    }
  }

  /**
   * Dispatches email if recipient email is available.
   */
  private static async dispatchEmail(opts: SendNotificationOptions): Promise<void> {
    try {
      let recipientEmail = opts.recipientEmail;
      let recipientName = opts.recipientName;

      // If email was not passed explicitly, attempt to lookup user record
      if (!recipientEmail) {
        const user = await prisma.user.findUnique({
          where: { id: opts.userId },
          select: { email: true, name: true },
        });
        if (user) {
          recipientEmail = user.email;
          recipientName = recipientName ?? user.name;
        }
      }

      if (!recipientEmail) return;

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const trackingUrl = opts.actionUrl
        ? (opts.actionUrl.startsWith("http") ? opts.actionUrl : `${appUrl}${opts.actionUrl}`)
        : `${appUrl}/notifications`;

      // Check for predefined civic templates
      const reference = (opts.data?.publicReference as string) || "REPORT";
      let subject = opts.title;
      let html = `<p>${opts.body}</p><p><a href="${trackingUrl}">View Details</a></p>`;
      let text = `${opts.body}\n\nView details: ${trackingUrl}`;

      if (opts.type === "REPORT_SUBMITTED") {
        const tpl = EmailTemplates.reportSubmitted({
          name: recipientName ?? "Citizen",
          reference,
          title: (opts.data?.reportTitle as string) || opts.title,
          trackingUrl,
        });
        subject = tpl.subject;
        html = tpl.html;
        text = tpl.text;
      } else if (opts.type === "STATUS_CHANGED" || opts.type === "REPORT_VERIFIED" || opts.type === "REPORT_RESOLVED") {
        const tpl = EmailTemplates.statusUpdate({
          name: recipientName ?? "Citizen",
          reference,
          title: (opts.data?.reportTitle as string) || opts.title,
          status: (opts.data?.toStatus as string) || opts.type,
          message: opts.body,
          trackingUrl,
        });
        subject = tpl.subject;
        html = tpl.html;
        text = tpl.text;
      }

      await this.emailProvider.send({
        to: recipientEmail,
        toName: recipientName,
        subject,
        html,
        text,
      });
    } catch (err) {
      console.error("[NotificationService] Email delivery error:", err);
    }
  }

  /**
   * Helper that formats and dispatches lifecycle events according to Spec Section 41.
   * Events:
   * - REPORT_SUBMITTED
   * - REPORT_VERIFIED
   * - REPORT_ASSIGNED
   * - STATUS_CHANGED
   * - REPORT_RESOLVED
   * - CONFIRMATION_REQUEST
   * - REPORT_REOPENED
   * - AUTHORITY_MESSAGE
   */
  static async notifyReportLifecycleEvent(payload: LifecycleEventPayload): Promise<Notification> {
    const actionUrl = payload.actionUrl ?? `/reports/${payload.publicReference}`;

    let title = "";
    let body = "";

    switch (payload.type) {
      case "REPORT_SUBMITTED":
        title = `Report #${payload.publicReference} Submitted`;
        body = `Your report "${payload.reportTitle}" has been received and queued for review.`;
        break;

      case "REPORT_VERIFIED":
        title = `Report #${payload.publicReference} Verified`;
        body = `Authorities have verified your report "${payload.reportTitle}". It is being scheduled for field assignment.`;
        break;

      case "REPORT_ASSIGNED":
        title = `Report #${payload.publicReference} Assigned`;
        body = payload.assigneeName
          ? `Assigned to ${payload.assigneeName} (${payload.departmentName ?? "Responsible Department"}).`
          : `Assigned to ${payload.departmentName ?? "Responsible Department"}.`;
        break;

      case "STATUS_CHANGED":
        title = `Report #${payload.publicReference} Update: ${payload.toStatus ?? "Updated"}`;
        body = payload.message ?? `Status has progressed to ${payload.toStatus}.`;
        break;

      case "REPORT_RESOLVED":
        title = `Report #${payload.publicReference} Resolved`;
        body = `The reported issue "${payload.reportTitle}" has been marked as resolved by the field crew. Please confirm if it is fixed.`;
        break;

      case "CONFIRMATION_REQUEST":
        title = `Please Confirm Resolution: #${payload.publicReference}`;
        body = `Work has concluded on "${payload.reportTitle}". Please verify whether the problem has been solved.`;
        break;

      case "REPORT_REOPENED":
        title = `Report #${payload.publicReference} Reopened`;
        body = payload.message ?? `Resident feedback indicates this issue was not fully resolved.`;
        break;

      case "AUTHORITY_MESSAGE":
        title = `Message on Report #${payload.publicReference}`;
        body = payload.message ?? `The municipal department provided an update.`;
        break;

      default:
        title = `Update on Report #${payload.publicReference}`;
        body = payload.message ?? `There is an update on your report.`;
        break;
    }

    return this.createAndDispatch({
      userId: payload.recipientUserId,
      type: payload.type,
      title,
      body,
      actionUrl,
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      data: {
        reportId: payload.reportId,
        publicReference: payload.publicReference,
        reportTitle: payload.reportTitle,
        fromStatus: payload.fromStatus,
        toStatus: payload.toStatus,
        severity: payload.severity,
        departmentName: payload.departmentName,
      },
      channels: {
        inApp: true,
        push: true,
        email: true,
      },
    });
  }

  // ============================================================
  // DEVICE MANAGEMENT (Spec Section 42 & 70)
  // ============================================================

  /**
   * Register or rotate a device push token for a user.
   */
  static async registerDevice(input: UpsertDeviceInput) {
    return NotificationRepository.upsertDevice(input);
  }

  /**
   * Revoke a device token (e.g. upon user logout or app uninstall).
   */
  static async unregisterDevice(pushToken: string): Promise<boolean> {
    return NotificationRepository.deleteDeviceByToken(pushToken);
  }

  /**
   * Get all registered push devices for a user.
   */
  static async getUserDevices(userId: string) {
    return NotificationRepository.findDevicesByUserId(userId);
  }

  // ============================================================
  // USER INBOX MANAGEMENT (Spec Section 41)
  // ============================================================

  static async getUserNotifications(
    userId: string,
    opts: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ) {
    return NotificationRepository.findByUserId(userId, opts);
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return NotificationRepository.countUnread(userId);
  }

  static async markAsRead(notificationId: string, userId: string) {
    return NotificationRepository.markAsRead(notificationId, userId);
  }

  static async markAllAsRead(userId: string): Promise<number> {
    return NotificationRepository.markAllAsRead(userId);
  }
}
