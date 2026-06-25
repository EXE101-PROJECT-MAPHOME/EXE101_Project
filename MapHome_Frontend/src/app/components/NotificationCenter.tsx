import React, { useEffect, useState, useRef } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/app/utils/api";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  link?: string;
  createdAt?: string;
}

export default function NotificationCenter({
  pollIntervalMs = 8000,
}: {
  pollIntervalMs?: number;
}) {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const intervalRef = useRef<number | null>(null);
  const prevCountRef = useRef<number>(0);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/api/notifications/unread-count");
      const count = res.data?.count ?? 0;

      // If new notifications arrived, fetch details and show a toast for the latest
      if (count > prevCountRef.current) {
        try {
          const listRes = await api.get("/api/notifications");
          const list: NotificationItem[] = listRes.data || [];
          setNotifications(list);
          const latest = list[0];
          if (latest) {
            toast.success(`${latest.title} — ${latest.message}`);
          }
        } catch (err) {
          // ignore details fetch error
          console.error("Failed to fetch notifications:", err);
        }
      }

      prevCountRef.current = count;
      setUnreadCount(count);
    } catch (err) {
      // silent - likely unauthenticated or network
      // console.error("Failed unread-count:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      const list: NotificationItem[] = res.data || [];
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
      prevCountRef.current = unread;
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    // initial fetch
    fetchUnreadCount();
    // start polling
    intervalRef.current = window.setInterval(
      () => fetchUnreadCount(),
      pollIntervalMs,
    ) as unknown as number;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isAuthenticated, pollIntervalMs]);

  const handleOpen = async () => {
    setIsOpen(true);
    await fetchNotifications();
  };

  const handleClose = () => setIsOpen(false);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      prevCountRef.current = 0;
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch (err) {
      console.error("Failed to mark all read:", err);
      toast.error("Không thể đánh dấu tất cả thông báo");
    }
  };

  const openNotification = async (n: NotificationItem) => {
    if (!n.isRead) await markAsRead(n._id);
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-white shadow-md border border-slate-100 ${
          isOpen ? "text-amber-500 bg-amber-50" : "text-slate-500"
        }`}
        aria-label="Thông báo"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 text-[10px] bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center font-black">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile to click outside and close */}
            <div
              className="fixed inset-0 bg-black/10 md:hidden z-40"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="fixed md:absolute top-20 md:top-auto md:mt-3 left-4 md:left-auto right-4 md:right-0 w-auto md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
            >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-black">Thông báo</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-[12px] text-slate-500 hover:text-slate-700"
                >
                  Đánh dấu đã đọc
                </button>
                <button
                  onClick={handleClose}
                  className="text-[12px] text-slate-400 hover:text-slate-600"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-5 text-sm text-slate-400">
                  Không có thông báo mới
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => openNotification(n)}
                    className={`px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-start gap-3 border-b last:border-0 ${
                      n.isRead ? "opacity-80" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 font-black shrink-0">
                      {n.type === "success"
                        ? "✅"
                        : n.type === "warning"
                          ? "⚠️"
                          : "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-800">
                        {n.title}
                      </div>
                      <div className="text-[12px] text-slate-500 line-clamp-2">
                        {n.message}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt || Date.now()).toLocaleString()}
                      </div>
                    </div>
                    {!n.isRead && (
                      <div className="ml-2 w-2.5 h-2.5 bg-rose-500 rounded-full mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 text-center text-[12px]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (user?.role === "admin") {
                    navigate("/admin/dashboard?view=notifications");
                  } else if (user?.role === "landlord") {
                    navigate("/landlord/dashboard?tab=notifications");
                  } else {
                    navigate("/user/dashboard");
                  }
                }}
                className="text-slate-600 hover:text-emerald-600 font-bold"
              >
                Xem tất cả
              </button>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
