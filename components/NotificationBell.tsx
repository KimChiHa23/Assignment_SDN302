"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  CheckSquare,
  UserPlus,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NotificationItem, NotificationsResponse } from "@/types/notification";
import { subscribeToRealtimeChannel } from "@/lib/realtime-client";

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lấy danh sách notifications khi mở dropdown
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data: NotificationsResponse = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;
    async function initialLoad() {
      if (!user) return;
      try {
        const res = await fetch("/api/notifications");
        const data: NotificationsResponse = await res.json();
        if (!ignore && res.ok && data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to load notifications initially:", err);
      }
    }
    initialLoad();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Đăng ký nhận thông báo real-time qua user channel
  useEffect(() => {
    if (!user?.id) return;

    const channelName = `user-${user.id}`;
    const unsubscribe = subscribeToRealtimeChannel(
      channelName,
      (event, payload) => {
        if (event === "notification:new") {
          const newNotif = payload as NotificationItem;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Đánh dấu một thông báo là đã đọc
  const handleMarkAsRead = async (
    id: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Click vào thông báo
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 active:scale-95 dark:border-slate-800 dark:bg-[#1a152e] dark:text-slate-300 dark:hover:border-purple-800 dark:hover:bg-purple-950/60 dark:hover:text-purple-300"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-[#181329] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800/80 bg-slate-50/70 dark:bg-purple-950/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 transition hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 mb-2">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  No notifications yet
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When tasks are assigned or team invitations arrive, they will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif, idx) => {
                const isTask = notif.type === "TASK_ASSIGNED";
                return (
                  <div
                    key={`${notif.id || idx}-${idx}`}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-purple-950/40 ${
                      !notif.isRead
                        ? "bg-purple-50/50 dark:bg-purple-950/20"
                        : "bg-white dark:bg-transparent"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${
                        isTask
                          ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
                          : "bg-gradient-to-tr from-emerald-500 to-teal-500"
                      }`}
                    >
                      {isTask ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {timeAgo(notif.createdAt)}
                        </span>
                        {notif.link && (
                          <span className="flex items-center gap-0.5 text-[10px] text-purple-600 dark:text-purple-400">
                            <span>Open</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Mark as Read button */}
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        title="Mark as read"
                        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 opacity-0 group-hover:opacity-100 hover:border-purple-300 hover:text-purple-600 transition dark:border-slate-800 dark:bg-[#141022] dark:hover:text-purple-300"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
