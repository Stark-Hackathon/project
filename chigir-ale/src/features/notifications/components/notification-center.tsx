"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Check,
  ArrowRight,
  Inbox,
} from "lucide-react";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/features/notifications/actions";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  readAt: string | Date | null;
  createdAt: string | Date;
}

interface NotificationCenterProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export function NotificationCenter({
  initialNotifications,
  initialUnreadCount,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [, startTransition] = useTransition();

  const handleMarkAsRead = async (id: string) => {
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
        setUnreadCount(0);
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "REPORT_VERIFIED":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "REPORT_ASSIGNED":
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      case "REPORT_RESOLVED":
        return <Check className="w-5 h-5 text-teal-500" />;
      case "CONFIRMATION_REQUEST":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "REPORT_REOPENED":
        return <RefreshCw className="w-5 h-5 text-orange-500" />;
      case "AUTHORITY_MESSAGE":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "COMMUNITY_ALERT":
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.readAt;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Notification Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live updates, verification notices, and dispatch assignments.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Mark all {unreadCount} as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            filter === "all"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          All Notifications
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 dark:bg-slate-200 text-slate-200 dark:text-slate-700">
            {notifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            filter === "unread"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {filter === "unread"
                ? "You have acknowledged all system updates. Check 'All' tab for previous history."
                : "When you report infrastructure issues or authorities review them, you will see notifications here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isUnread = !n.readAt;
            const dataObj = n.data as { actionUrl?: string; publicReference?: string } | null;
            const targetUrl = dataObj?.actionUrl || (dataObj?.publicReference ? `/reports/${dataObj.publicReference}` : undefined);

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnread
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm ${isUnread ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-800 dark:text-slate-200"}`}>
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {n.body}
                    </p>

                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {targetUrl && (
                        <Link
                          href={targetUrl}
                          className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                        >
                          View Report <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
