"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ExternalLink,
} from "lucide-react";
import {
  getNotificationsAction,
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

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll or initial load
  const loadNotifications = React.useCallback(() => {
    startTransition(async () => {
      const res = await getNotificationsAction({ limit: 5 });
      if (res.success) {
        setNotifications(res.data.notifications as NotificationItem[]);
        setUnreadCount(res.data.unreadCount);
      }
    });
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleToggle = () => {
    if (!isOpen) {
      setIsLoading(true);
      getNotificationsAction({ limit: 5 }).then((res) => {
        if (res.success) {
          setNotifications(res.data.notifications as NotificationItem[]);
          setUnreadCount(res.data.unreadCount);
        }
        setIsLoading(false);
      });
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleItemClick = (n: NotificationItem) => {
    if (!n.readAt) {
      handleMarkAsRead(n.id);
    }
    setIsOpen(false);
    const dataObj = n.data as { actionUrl?: string; publicReference?: string } | null;
    if (dataObj?.actionUrl) {
      router.push(dataObj.actionUrl);
    } else if (dataObj?.publicReference) {
      router.push(`/reports/${dataObj.publicReference}`);
    } else {
      router.push("/notifications");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "REPORT_VERIFIED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "REPORT_ASSIGNED":
        return <UserCheck className="w-4 h-4 text-purple-500" />;
      case "REPORT_RESOLVED":
        return <Check className="w-4 h-4 text-teal-500" />;
      case "CONFIRMATION_REQUEST":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "REPORT_REOPENED":
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      case "AUTHORITY_MESSAGE":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "COMMUNITY_ALERT":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-in fade-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No notifications yet
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Updates on reports you create or track will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex gap-3 cursor-pointer transition-colors ${
                      isUnread
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${isUnread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {n.body}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                        <span>{new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="hover:text-emerald-600 font-medium"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 font-semibold inline-flex items-center gap-1.5 py-1"
            >
              View all notifications <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
