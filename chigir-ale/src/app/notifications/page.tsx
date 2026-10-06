import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { NotificationService } from "@/server/services/notifications";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

export const metadata: Metadata = {
  title: "Notifications — Chigir Ale",
  description: "View and manage your infrastructure incident notifications and updates.",
};

export default async function NotificationsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in?callbackUrl=/notifications");
  }

  const notifications = await NotificationService.getUserNotifications(user.id, { limit: 50 });
  const unreadCount = await NotificationService.getUnreadCount(user.id);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6">
      <NotificationCenter
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </main>
  );
}
