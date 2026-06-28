import { useState, useEffect, forwardRef, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import api from "@/app/utils/api";
import { getAvatarUrl, getInitials } from "@/app/utils/avatarUtils";
import { formatDateVietnamese, getDaysLeftText } from "@/app/utils/dateUtils";
import { useVerification } from "@/app/contexts/VerificationContext";
import { useProperties } from "@/app/contexts/useProperties";
import { Button } from "@/app/components/ui/button";
import { InspectionDialog } from "@/app/components/InspectionDialog";
import { VerificationRequest } from "@/app/components/types";
import { UserDetailDialog } from "@/app/components/UserDetailDialog";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import PromptDialog from "@/app/components/PromptDialog";
import { RoleBadge } from "@/app/components/RoleBadge";

import {
  LayoutDashboard,
  FileText,
  Users,
  CheckCircle,
  Settings,
  LogOut,
  Home,
  Calendar,
  Bell,
  Eye,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  User,
  Download,
  ShieldCheck,
  Clock,
  Award,
  XCircle,
  Phone,
  MapPinned,
  Trash2,
  LockOpen,
  Lock,
  Star,
  Send,
  Link as LinkIcon,
  RefreshCw,
  CreditCard,
  BarChart3,
  Ticket,
  Newspaper,
  Plus,
  Edit,
  DollarSign,
  Zap,
  Save,
  Menu,
  X as XIcon,
} from "lucide-react";
import { RevenueView } from "./RevenueView";
import { SettingsView } from "./SettingsView";
import { InspectionsView } from "@/app/components/InspectionsView";
import { toast } from "sonner";
import { BlogEditorDialog } from "@/app/components/BlogEditorDialog";
import { AdminVoucherView } from "./AdminVoucherView";

type AdminView =
  | "dashboard"
  | "posts"
  | "expired"
  | "users"
  | "verification"
  | "bookings"
  | "reviews"
  | "revenue"
  | "inspections"
  | "reports"
  | "notifications"
  | "transactions"
  | "analytics"
  | "subscriptions"
  | "global_pricing"
  | "blog"
  | "vouchers"
  | "settings";

// Note: Mock data constants removed. Data is now fetched from the backend.

export function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeView = (searchParams.get("view") as AdminView) || "dashboard";
  const setActiveView = (view: AdminView) => {
    setSearchParams({ view });
  };
  const [stats, setStats] = useState<any>(null);
  const [weeklySearchData, setWeeklySearchData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [topRooms, setTopRooms] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    onConfirm?: () => Promise<void> | void;
  }>({ open: false });

  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      setLoading(!showRefresh);

      // Parallel fetch for dashboard data
      const [
        statsRes,
        searchRes,
        topRoomsRes,
        postsRes,
        usersRes,
        verificationsRes,
        bookingsRes,
        reviewsRes,
        reportsRes,
        notifRes,
        transRes,
        plansRes,
        blogsRes,
      ] = await Promise.all([
        api.get(`/api/admin/stats?month=${selectedMonth}&year=${selectedYear}`),
        api.get("/api/admin/stats/chart"),
        api.get("/api/admin/stats/top-rooms"),
        api.get("/api/admin/properties"),
        api.get("/api/admin/users"),
        api.get("/api/admin/verification-requests"),
        api.get("/api/admin/bookings"),
        api.get("/api/admin/reviews"),
        api.get("/api/reports"),
        api.get("/api/admin/notifications"),
        api.get("/api/admin/transactions"),
        api.get("/api/subscriptions/plans"),
        api.get("/api/blogs/admin/all"),
      ]);

      const stats = statsRes.data;
      const searchData = searchRes.data || [];
      const topRoomsData = topRoomsRes.data || [];
      const postsData = postsRes.data || [];
      const usersData = usersRes.data || [];
      const verificationsData = verificationsRes.data || [];
      const bookingsData = bookingsRes.data || [];
      const reviewsData = reviewsRes.data || [];
      const reportsData = reportsRes.data || [];
      const notifsData = notifRes.data || [];
      const transData = transRes.data?.transactions || [];
      const plansData = plansRes.data || [];
      const blogsData = blogsRes.data || [];

      if (stats) setStats(stats);
      setAdminNotifications(notifsData);
      setWeeklySearchData(searchData);
      setTopRooms(
        topRoomsData.map((room: any, idx: number) => ({
          rank: idx + 1,
          name: room.name,
          location: room.address,
          views: room.views || 0,
        })),
      );
      setPosts(postsData);
      setUsers(usersData);
      setVerifications(verificationsData);
      setBookings(bookingsData);
      setReviews(reviewsData);
      setReports(reportsData);
      setTransactions(transData);
      setSubscriptionPlans(plansData);
      setBlogs(blogsData);

      const activities = [
        ...verificationsData.slice(0, 2).map((v: any) => ({
          id: `v-${v._id}`,
          text: `Yêu cầu Tích Xanh cho '${v.propertyId?.name || v.propertyName}' đang ${v.status}`,
          time: new Date(v.requestedAt || v.createdAt).toLocaleString("vi-VN"),
          color: v.status === "pending" ? "blue" : "green",
        })),
        ...postsData.slice(0, 1).map((p: any) => ({
          id: `p-${p._id}`,
          text: `Tin đăng mới: '${p.name}'`,
          time: new Date(p.createdAt).toLocaleString("vi-VN"),
          color: "green",
        })),
      ];
      setRecentActivities(activities);

      if (showRefresh) {
        setTimeout(() => setIsRefreshing(false), 800);
        toast.success("Dữ liệu đã được làm mới! ✨");
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      setIsRefreshing(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchData();
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/login");
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUpdatePropertyStatus = async (id: string, status: string) => {
    try {
      const res = await api.put(`/api/admin/properties/${id}/status`, {
        status,
      });
      if (res.status === 200) {
        setPosts(posts.map((p) => (p._id === id ? { ...p, status } : p)));
        toast.success("Cập nhật trạng thái tin đăng thành công! ✅");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    try {
      const res = await api.put(`/api/admin/users/${id}/status`);
      if (res.status === 200) {
        setUsers(
          users.map((u) =>
            u._id === id
              ? { ...u, status: u.status === "blocked" ? "active" : "blocked" }
              : u,
          ),
        );
        toast.success("Cập nhật trạng thái người dùng thành công! ✅");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveVerification = async (id: string, date: string) => {
    try {
      const res = await api.put(`/api/admin/verification/${id}/approve`, {
        scheduledDate: date,
      });
      if (res.status === 200) {
        setVerifications(
          verifications.map((v) =>
            v._id === id
              ? { ...v, status: "approved", scheduledDate: date }
              : v,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCompleteVerification = async (
    id: string,
    badgeLevel: string,
    notes?: string,
  ) => {
    try {
      const res = await api.put(`/api/admin/verification/${id}/complete`, {
        badgeAwarded: badgeLevel,
        inspectorNotes: notes,
      });
      if (res.status === 200) {
        setVerifications(
          verifications.map((v) =>
            v._id === id
              ? {
                ...v,
                status: badgeLevel === "none" ? "rejected" : "completed",
                inspectorNotes: notes,
              }
              : v,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectVerification = async (id: string, reason: string) => {
    try {
      const res = await api.put(`/api/admin/verification/${id}/reject`, {
        reason,
      });
      if (res.status === 200) {
        setVerifications(
          verifications.map((v) =>
            v._id === id
              ? {
                ...v,
                status: "rejected",
                rejectionReason: reason,
              }
              : v,
          ),
        );
        toast.success("Đã từ chối yêu cầu kiểm tra! ❌");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi phát thông báo!");
    }
  };

  const handleSaveBlog = async (blogData: any) => {
    try {
      if (editingBlog?._id) {
        await api.put(`/api/blogs/${editingBlog._id}`, blogData);
        toast.success("Cập nhật bài viết thành công! ✨");
      } else {
        await api.post("/api/blogs", blogData);
        toast.success("Tạo bài viết mới thành công! 🖋️");
      }
      setIsBlogDialogOpen(false);
      setEditingBlog(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu bài viết. Vui lòng kiểm tra lại! ❌");
    }
  };

  const handleDeleteBlog = (id: string) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận xóa bài viết",
      description:
        "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài viết này không?",
      onConfirm: async () => {
        try {
          await api.delete(`/api/blogs/${id}`);
          toast.success("Đã xóa bài viết thành công!");
          fetchData();
        } catch (error) {
          console.error(error);
          toast.error("Lỗi khi xóa bài viết!");
        }
      },
    });
  };

  const handleOpenBlogEditor = (blog: any = null) => {
    setEditingBlog(blog);
    setIsBlogDialogOpen(true);
  };

  const handleDeleteVerification = async (id: string) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận xóa yêu cầu kiểm tra",
      description:
        "Bạn có chắc muốn xóa yêu cầu kiểm tra này? Thao tác này không thể hoàn tác.",
      onConfirm: async () => {
        try {
          const res = await api.delete(
            `/api/admin/verification-requests/${id}`,
          );
          if (res.status === 200) {
            setVerifications((prev) => prev.filter((v) => v._id !== id));
            toast.success("Đã xóa yêu cầu kiểm tra thành công! ✅");
          }
        } catch (error) {
          console.error(error);
          toast.error("Lỗi khi xóa yêu cầu kiểm tra!");
        }
      },
    });
  };

  const handleDeleteBooking = async (id: string) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận xóa lịch hẹn",
      description: "Bạn có chắc muốn xóa lịch hẹn này?",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/api/admin/bookings/${id}`);
          if (res.status === 200) {
            setBookings((prev) => prev.filter((b) => b._id !== id));
            toast.success("Đã xóa lịch hẹn thành công! ✅");
          }
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  const handleDeleteReview = async (id: string) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận xóa đánh giá",
      description: "Bạn có chắc muốn xóa đánh giá này?",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/api/admin/reviews/${id}`);
          if (res.status === 200) {
            setReviews((prev) => prev.filter((r) => r._id !== id));
            toast.success("Đã xóa đánh giá thành công! ✅");
          }
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  const handleUpdateReportStatus = async (
    id: string,
    status: string,
    notes?: string,
  ) => {
    try {
      const res = await api.put(`/api/reports/${id}`, {
        status,
        adminNotes: notes,
      });
      if (res.status === 200) {
        setReports(
          reports.map((r) =>
            r._id === id ? { ...r, status, adminNotes: notes } : r,
          ),
        );
        toast.success(`Đã cập nhật trạng thái báo cáo thành công! ✅`);
        fetchData(false); // Refresh stats/properties if they changed
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBroadcastNotification = async (data: any) => {
    try {
      const res = await api.post("/api/admin/notifications/broadcast", data);
      if (res.status === 200) {
        toast.success(`Đã gửi thông báo thành công! 🔔`);
        fetchData(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi gửi thông báo.");
    }
  };

  const handleDeleteUser = (id: string) => {
    setConfirmDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const res = await api.delete(`/api/admin/users/${confirmDeleteId}`);
      if (res.status === 200) {
        setUsers(users.filter((u) => u._id !== confirmDeleteId));
        toast.success("Đã xóa người dùng thành công! ✅");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsConfirmOpen(false);
      setConfirmDeleteId(null);
    }
  };

  const handleOpenUserDetail = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserDetailOpen(true);
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="h-[100dvh] w-full bg-white relative overflow-hidden flex font-sans">
      {/* Background Aura Effects */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#f0f9f5] via-white to-[#f0f2f9] pointer-events-none" />

      {/* Mobile Header - Only visible on small screens */}
      {/* ── Mobile Top Bar ── */}
      <div className="fixed top-0 left-0 right-0 h-16 md:hidden bg-white/80 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-4 z-40 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <Menu className="size-5 text-indigo-600" />
          </button>
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="bg-gradient-to-br from-emerald-500 via-blue-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
              <Home className="size-4 text-white" />
            </div>
            <h1 className="font-black text-[15px] bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">MapHome</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Add a user avatar shortcut on mobile top bar */}
          <div className="w-[32px] h-[32px] rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            {user?.avatar ? (
              <img src={getAvatarUrl(user.avatar) || ""} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.fullName, user?.username)
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar Navigation ── */}
      <aside className={`fixed md:static top-0 left-0 h-[100dvh] w-[260px] flex-shrink-0 flex flex-col z-50 overflow-hidden shadow-xl md:shadow-none transition-transform duration-300 ease-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`} style={{ background: "linear-gradient(175deg, #f0fdf8 0%, #f8faff 45%, #f3f0ff 100%)", borderRight: "1px solid #e2e8f5" }}>
        {/* Subtle decorative gradient overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
          <div className="absolute bottom-32 -left-10 w-40 h-40 rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-50"
        >
          <XIcon className="size-4" />
        </button>

        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 pb-3 shrink-0" style={{ borderBottom: "1px solid #eef1f8" }}
        >
          <div onClick={() => navigate("/")} className="flex items-center gap-3 cursor-pointer group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/60 shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #3b82f6 60%, #6366f1 100%)" }}
            >
              <Home className="size-[18px] text-white" />
            </motion.div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-[17px] tracking-tight leading-none"
                style={{ background: "linear-gradient(90deg, #0f172a 0%, #3b82f6 60%, #6366f1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                MapHome
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.22em] mt-0.5 px-2 py-0.5 rounded-full w-fit text-white"
                style={{ background: "linear-gradient(90deg, #10b981, #3b82f6)" }}>
                Admin Panel
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto custom-scrollbar">
          {[
            {
              title: "Tổng quan",
              color: "emerald",
              items: [
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              ],
            },
            {
              title: "Quản lý",
              color: "blue",
              items: [
                { id: "posts", label: "Tin đăng", icon: FileText, count: posts.length },
                { id: "expired", label: "Tin hết hạn", icon: Clock, count: posts.filter((p) => p.status === "expired").length },
                { id: "users", label: "Người dùng", icon: Users },
                { id: "verification", label: "Tích Xanh", icon: CheckCircle, count: verifications.filter((v) => v.status === "pending").length },
                { id: "bookings", label: "Lịch hẹn", icon: Calendar },
                { id: "reports", label: "Báo cáo", icon: AlertTriangle, count: reports.filter((r) => r.status === "pending").length },
                { id: "notifications", label: "Thông báo", icon: Bell },
                { id: "reviews", label: "Đánh giá", icon: Award },
                { id: "inspections", label: "Lịch kiểm tra", icon: ShieldCheck },
                { id: "revenue", label: "Doanh thu", icon: TrendingUp },
                { id: "transactions", label: "Giao dịch", icon: CreditCard },
                { id: "blog", label: "Quản lý Blog", icon: Newspaper },
                { id: "analytics", label: "Phân tích hệ thống", icon: BarChart3 },
              ],
            },
            {
              title: "Hệ thống",
              color: "violet",
              items: [
                { id: "subscriptions", label: "Gói dịch vụ", icon: Ticket },
                { id: "vouchers", label: "Mã giảm giá", icon: Ticket },
                { id: "global_pricing", label: "Dịch vụ & Giá", icon: DollarSign },
                { id: "settings", label: "Cài đặt", icon: Settings },
              ],
            },
          ].map((section, sIdx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.08, duration: 0.35, ease: "easeOut" }}
              className="mb-4"
            >
              {/* Section label with accent line */}
              <div className="flex items-center gap-2 px-2 mb-2">
                <div className="h-px flex-1" style={{
                  background: sIdx === 0 ? "linear-gradient(90deg, #10b98133, transparent)"
                    : sIdx === 1 ? "linear-gradient(90deg, #3b82f633, transparent)"
                    : "linear-gradient(90deg, #8b5cf633, transparent)"
                }} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{
                  color: sIdx === 0 ? "#10b981" : sIdx === 1 ? "#3b82f6" : "#8b5cf6"
                }}>
                  {section.title}
                </span>
              </div>

              <div className="space-y-0.5">
                {section.items.map((item, iIdx) => {
                  const isActive = activeView === item.id;
                  const Icon = item.icon;
                  // Color theme per section
                  const sectionColor = sIdx === 0
                    ? { bg: "#10b981", light: "#ecfdf5", text: "#059669" }
                    : sIdx === 1
                    ? { bg: "#3b82f6", light: "#eff6ff", text: "#2563eb" }
                    : { bg: "#8b5cf6", light: "#f5f3ff", text: "#7c3aed" };

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: sIdx * 0.08 + iIdx * 0.018, duration: 0.28, ease: "easeOut" }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setActiveView(item.id as any);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-[9px] rounded-xl text-[13px] font-semibold transition-colors duration-150 relative group overflow-hidden"
                      style={
                        isActive
                          ? {
                              background: `linear-gradient(135deg, ${sectionColor.bg}18 0%, ${sectionColor.bg}10 100%)`,
                              color: sectionColor.text,
                              border: `1.5px solid ${sectionColor.bg}30`,
                            }
                          : { color: "#64748b", border: "1.5px solid transparent" }
                      }
                      onMouseEnter={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = sectionColor.light;
                          (e.currentTarget as HTMLElement).style.color = sectionColor.text;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = "";
                          (e.currentTarget as HTMLElement).style.color = "#64748b";
                        }
                      }}
                    >
                      {/* Active animated left bar */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveBar"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                          style={{
                            height: "60%",
                            background: `linear-gradient(to bottom, ${sectionColor.bg}, ${sectionColor.bg}88)`,
                            boxShadow: `0 0 8px ${sectionColor.bg}66`,
                          }}
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}

                      {/* Icon with colored background when active */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150"
                        style={
                          isActive
                            ? { background: sectionColor.bg, boxShadow: `0 4px 12px ${sectionColor.bg}40` }
                            : { background: "#f1f5f9" }
                        }
                      >
                        <Icon className="size-[14px] transition-colors duration-150" style={{
                          color: isActive ? "#fff" : "#94a3b8"
                        }} />
                      </div>

                      {/* Label */}
                      <span className="truncate flex-1 text-left font-semibold">{item.label}</span>

                      {/* Badge */}
                      {item.count !== undefined && item.count > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-1.5 py-0.5 rounded-full font-black text-[10px] shrink-0 text-white"
                          style={{ background: isActive ? sectionColor.bg : "#94a3b8", minWidth: "18px", textAlign: "center" }}
                        >
                          {item.count > 99 ? "99+" : item.count}
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </nav>

        {/* ── User Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="p-3 shrink-0"
          style={{ borderTop: "1px solid #eef1f8", background: "linear-gradient(180deg, transparent, #f8faff)" }}
        >
          {/* User info row */}
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-white text-[11px] font-black shadow-md"
                style={{ background: "linear-gradient(135deg, #10b981, #3b82f6, #6366f1)" }}>
                {user?.avatar ? (
                  <img src={getAvatarUrl(user.avatar) || ""} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.fullName, user?.username)
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-slate-800 truncate leading-tight">
                {user?.fullName || user?.username || "Admin"}
              </p>
              <p className="text-[10px] font-semibold truncate mt-0.5 text-emerald-600">
                ● System Administrator
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { navigate("/"); setSidebarOpen(false); }}
              className="flex-1 flex justify-center items-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition-all group"
              style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#eff6ff"; (e.currentTarget as HTMLElement).style.color = "#2563eb"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLElement).style.color = "#475569"; }}
            >
              <Home className="size-3.5 shrink-0" />
              <span className="truncate">Trang chủ</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex justify-center items-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition-all"
              style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#ffe4e6"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff1f2"; }}
            >
              <LogOut className="size-3.5 shrink-0" />
              <span className="truncate">Đăng xuất</span>
            </button>
          </div>
        </motion.div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar relative z-10 flex flex-col h-full pt-16 md:pt-0">
        <div className="flex-1 w-full flex flex-col">
          {/* Luminous 3.0: Premium Sticky Header */}
          <header className="px-3 sm:px-6 md:px-10 py-3 sm:py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative md:sticky top-0 md:z-40 bg-white/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-white mb-4 sm:mb-6">
            <div className="flex flex-col">
              <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">
                Hệ thống quản trị
              </h2>
              <div className="text-xl sm:text-2xl md:text-4xl font-black bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent tracking-tighter leading-tight line-clamp-2">
                {activeView === "dashboard" && "Dashboard Tổng Quan"}
                {activeView === "posts" && "Quản lý Tin đăng"}
                {activeView === "users" && "Quản lý Người dùng"}
                {activeView === "verification" && "Xác thực Tích Xanh"}
                {activeView === "bookings" && "Quản lý Lịch hẹn"}
                {activeView === "reviews" && "Quản lý Đánh giá"}
                {activeView === "reports" && "Quản lý Báo cáo"}
                {activeView === "notifications" && "Trung tâm Thông báo"}
                {activeView === "transactions" && "Lịch sử Giao dịch"}
                {activeView === "analytics" && "Phân tích & Thống kê"}
                {activeView === "subscriptions" && "Gói dịch vụ hệ thống"}
                {activeView === "global_pricing" && "Cấu hình Dịch vụ & Giá"}
                {activeView === "blog" && "Kiểm duyệt Blog"}
                {activeView === "revenue" && "Báo cáo Doanh Thu"}
                {activeView === "inspections" && "Kiểm tra thực địa"}
                {activeView === "vouchers" && "Quản lý Mã giảm giá"}
                {activeView === "settings" && "Cấu hình hệ thống"}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 bg-white/60 backdrop-blur-xl border border-white/40 p-2 rounded-[28px] shadow-2xl shadow-slate-200/50 w-full md:w-auto overflow-x-auto no-scrollbar">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchData(true)}
                className="w-12 h-12 bg-white rounded-[20px] shadow-sm flex items-center justify-center text-emerald-500 hover:text-emerald-600 transition-colors border border-slate-50"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : {}}
                  transition={{
                    repeat: isRefreshing ? Infinity : 0,
                    duration: 1,
                    ease: "linear",
                  }}
                >
                  <TrendingUp className="size-5" />
                </motion.div>
              </motion.button>

              <div className="h-8 w-px bg-slate-200/50" />

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsDatePickerOpen(!isDatePickerOpen);
                    setIsNotificationOpen(false);
                  }}
                  className={`px-6 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${isDatePickerOpen
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <Calendar className="size-4" />
                  {`Tháng ${selectedMonth}, ${selectedYear}`}
                </motion.button>

                <AnimatePresence>
                  {isDatePickerOpen && (
                    <MonthYearPicker
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      onSelect={(m, y) => {
                        setSelectedMonth(m);
                        setSelectedYear(y);
                        setIsDatePickerOpen(false);
                      }}
                      onClose={() => setIsDatePickerOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsDatePickerOpen(false);
                  }}
                  className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-all relative ${isNotificationOpen
                      ? "bg-amber-500 text-white shadow-xl shadow-amber-100"
                      : "bg-white text-slate-400 hover:text-amber-500"
                    }`}
                >
                  <Bell className="size-5" />
                  {!isNotificationOpen && adminNotifications.length > 0 && (
                    <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </motion.button>

                <AnimatePresence>
                  {isNotificationOpen && (
                    <NotificationTray
                      notifications={adminNotifications}
                      onClose={() => setIsNotificationOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <div className="p-3 sm:p-6 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center min-h-[500px]">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center scale-75">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {activeView === "dashboard" && (
                    <DashboardView
                      stats={stats}
                      weeklySearchData={weeklySearchData}
                      recentActivities={recentActivities}
                      topRooms={topRooms}
                      posts={posts}
                      users={users}
                      reports={reports}
                      verifications={verifications}
                      transactions={transactions}
                      onNavigate={(view) => setActiveView(view as any)}
                    />
                  )}
                  {activeView === "posts" && (
                    <PostsView
                      posts={posts}
                      onUpdateStatus={handleUpdatePropertyStatus}
                    />
                  )}
                  {activeView === "expired" && (
                    <ExpiredPostsView
                      posts={posts}
                      onUpdateStatus={handleUpdatePropertyStatus}
                    />
                  )}
                  {activeView === "users" && (
                    <UsersView
                      users={users}
                      onToggleStatus={handleToggleUserStatus}
                      onDeleteUser={handleDeleteUser}
                      onViewDetail={handleOpenUserDetail}
                    />
                  )}
                  {activeView === "verification" && (
                    <VerificationView
                      verifications={verifications}
                      onApprove={handleApproveVerification}
                      onReject={handleRejectVerification}
                      onDelete={handleDeleteVerification}
                      onComplete={handleCompleteVerification}
                      onOpenInspect={(v) => {
                        setSelectedVerification(v);
                        setIsInspectionDialogOpen(true);
                      }}
                    />
                  )}
                  {activeView === "bookings" && (
                    <BookingsView
                      bookings={bookings}
                      onDeleteBooking={handleDeleteBooking}
                    />
                  )}
                  {activeView === "reviews" && (
                    <ReviewsView
                      reviews={reviews}
                      onDeleteReview={handleDeleteReview}
                    />
                  )}
                  {activeView === "reports" && (
                    <ReportsView
                      reports={reports}
                      onUpdateStatus={handleUpdateReportStatus}
                    />
                  )}
                  {activeView === "notifications" && (
                    <NotificationsManagementView
                      notifications={adminNotifications}
                      onSendBroadcast={handleBroadcastNotification}
                    />
                  )}
                  {activeView === "transactions" && (
                    <TransactionsView transactions={transactions} />
                  )}
                  {activeView === "analytics" && (
                    <AdvancedAnalyticsView stats={stats} />
                  )}
                  {activeView === "subscriptions" && (
                    <SubscriptionsAdminView
                      plans={subscriptionPlans}
                      onRefresh={fetchData}
                    />
                  )}
                  {activeView === "global_pricing" && (
                    <GlobalPricingView onRefresh={fetchData} />
                  )}
                  {activeView === "blog" && (
                    <BlogAdminView
                      blogs={blogs}
                      onAdd={() => handleOpenBlogEditor()}
                      onEdit={(blog: any) => handleOpenBlogEditor(blog)}
                      onDelete={(id: string) => handleDeleteBlog(id)}
                    />
                  )}
                  {activeView === "revenue" && <RevenueView />}
                  {activeView === "inspections" && <InspectionsView />}
                  {activeView === "vouchers" && <AdminVoucherView />}
                  {activeView === "settings" && <SettingsView />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* Inspection Dialog */}
      {selectedVerification && (
        <InspectionDialog
          isOpen={isInspectionDialogOpen}
          onClose={() => {
            setIsInspectionDialogOpen(false);
            setSelectedVerification(null);
            fetchData(true); // Refresh data after dialog closes
          }}
          request={selectedVerification}
        />
      )}

      {/* User Detail Dialog */}
      <UserDetailDialog
        isOpen={isUserDetailOpen}
        onClose={() => {
          setIsUserDetailOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        title="Xác nhận xoá người dùng"
        description="Bạn có chắc muốn XÓA VĨNH VIỄN người dùng này? Thao tác này không thể hoàn tác."
        confirmText="Xoá vĩnh viễn"
        cancelText="Huỷ"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setConfirmDeleteId(null);
        }}
      />
      <ConfirmDialog
        open={confirmModal.open}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText="Xác nhận"
        cancelText="Huỷ"
        onConfirm={async () => {
          if (confirmModal.onConfirm) await confirmModal.onConfirm();
          setConfirmModal({ open: false });
        }}
        onCancel={() => setConfirmModal({ open: false })}
      />

      {/* Blog Editor Dialog */}
      <BlogEditorDialog
        isOpen={isBlogDialogOpen}
        onClose={() => {
          setIsBlogDialogOpen(false);
          setEditingBlog(null);
        }}
        onSave={handleSaveBlog}
        initialData={editingBlog}
      />
    </div>
  );
}

// Dashboard View Component
const DashboardView = forwardRef(function DashboardView(
  {
    stats,
    weeklySearchData: initialWeeklySearchData,
    recentActivities,
    topRooms,
    posts,
    users = [],
    reports = [],
    verifications = [],
    transactions = [],
    onNavigate,
  }: {
    stats: any;
    weeklySearchData: any[];
    recentActivities: any[];
    topRooms: any[];
    posts: any[];
    users?: any[];
    reports?: any[];
    verifications?: any[];
    transactions?: any[];
    onNavigate?: (view: string) => void;
  },
  ref: any,
) {
  const [chartRange, setChartRange] = useState("week");
  const [chartMetric, setChartMetric] = useState("revenue");
  const [chartData, setChartData] = useState<any[]>(initialWeeklySearchData);
  const [isChartLoading, setIsChartLoading] = useState(false);

  useEffect(() => {
    setIsChartLoading(true);
    api
      .get(`/api/admin/stats/chart?range=${chartRange}`)
      .then((res) => setChartData(res.data || []))
      .catch(console.error)
      .finally(() => setIsChartLoading(false));
  }, [chartRange]);

  // --- Data Processors ---

  // 1. Posts Data
  const isPostExpired = (p: any) => {
    if (p.status === "expired") return true;
    if (p.status === "approved" && p.expiryDate) {
      return new Date(p.expiryDate) < new Date();
    }
    return false;
  };
  const safePosts = Array.isArray(posts) ? posts : [];
  const expiredPostsCount = safePosts.filter(isPostExpired).length;
  const approvedPostsCount = safePosts.filter((p) => p.status === "approved" && !isPostExpired(p)).length;
  const pendingPostsCount = safePosts.filter((p) => p.status === "pending").length;
  const reportedPostsCount = safePosts.filter((p) => p.status === "reported").length;

  const postStatusData = [
    { name: "Đang hiển thị", value: approvedPostsCount, color: "#10b981" },
    { name: "Chờ duyệt", value: pendingPostsCount, color: "#f59e0b" },
    { name: "Hết hạn", value: expiredPostsCount, color: "#64748b" },
    { name: "Bị báo cáo", value: reportedPostsCount, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // 2. Users Data
  const landlordsCount = users.filter((u) => u.role === "landlord").length;
  const tenantsCount = users.filter((u) => u.role === "user").length;
  const brokersCount = users.filter((u) => u.role === "broker").length;

  const userRoleData = [
    { name: "Chủ trọ", count: landlordsCount, fill: "#3b82f6" },
    { name: "Người thuê", count: tenantsCount, fill: "#8b5cf6" },
    { name: "Môi giới", count: brokersCount, fill: "#06b6d4" },
  ];

  // 3. Operations Data
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;

  const pendingVerifs = verifications.filter((v) => v.status === "pending").length;
  const approvedVerifs = verifications.filter((v) => v.status === "approved").length;

  const operationsData = [
    { name: "Báo cáo", Pending: pendingReports, Resolved: resolvedReports },
    { name: "Tích xanh", Pending: pendingVerifs, Resolved: approvedVerifs },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 flex flex-col gap-1">
          <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-xs font-semibold text-slate-700">{entry.name}:</span>
              </div>
              <span className="text-xs font-black text-slate-900">
                {entry.name === "Doanh thu" || chartMetric === "revenue"
                  ? `${Number(entry.value).toLocaleString("vi-VN")}đ`
                  : Number(entry.value).toLocaleString("vi-VN")}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
      }}
      className="space-y-8 pb-10"
    >
      {/* 1. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          icon="💰"
          iconBg="#f0fdf4"
          label="Tổng doanh thu"
          value={stats?.totalRevenue ? `${stats.totalRevenue}đ` : "0đ"}
          change="Tăng trưởng"
          changePositive
          topGradient="linear-gradient(90deg, #10b981, #34d399)"
          onClick={() => onNavigate && onNavigate("revenue")}
        />
        <KPICard
          icon="👥"
          iconBg="#eff6ff"
          label="Tổng User"
          value={stats?.totalUsers || 0}
          change="+12.5%"
          changePositive
          topGradient="linear-gradient(90deg, #3b82f6, #60a5fa)"
          onClick={() => onNavigate && onNavigate("users")}
        />
        <KPICard
          icon="🔄"
          iconBg="#fffbeb"
          label="Giao dịch"
          value={stats?.totalTransactions || 0}
          change="Tuần này"
          changePositive
          topGradient="linear-gradient(90deg, #f59e0b, #fbbf24)"
          onClick={() => onNavigate && onNavigate("transactions")}
        />
        <KPICard
          icon="⭐"
          iconBg="#fef3f2"
          label="Đánh giá"
          value={`${stats?.averageRating || 4.9} / 5.0`}
          change={`${stats?.totalReviews || 0} lượt`}
          topGradient="linear-gradient(90deg, #ec4899, #f472b6)"
          onClick={() => onNavigate && onNavigate("reviews")}
        />
      </div>

      {/* 2. Main Revenue Chart */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        className="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-sm font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-wider">
              Biểu đồ Doanh thu & Tăng trưởng
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">Dữ liệu linh hoạt theo thời gian</p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <select
              value={chartMetric}
              onChange={(e) => setChartMetric(e.target.value)}
              className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-emerald-400 transition-colors cursor-pointer"
            >
              <option value="revenue">Doanh thu</option>
              <option value="users">Người dùng mới</option>
              <option value="transactions">Giao dịch</option>
            </select>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value)}
              className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-emerald-400 transition-colors cursor-pointer"
            >
              <option value="day">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>
        </div>

        <div className="h-[320px] w-full">
          {isChartLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm font-bold text-slate-400">Đang tải dữ liệu...</span>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartMetric === "revenue" ? "#10b981" : chartMetric === "users" ? "#3b82f6" : "#f59e0b"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartMetric === "revenue" ? "#10b981" : chartMetric === "users" ? "#3b82f6" : "#f59e0b"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                  dx={-10}
                  domain={[0, (max: number) => !max || isNaN(max) || max === 0 ? 1000 : max]}
                  tickFormatter={(val) => {
                    if (chartMetric !== "revenue") return val;
                    if (val === 0) return "0";
                    if (val < 1000) return `${val}đ`;
                    return `${val / 1000}k`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  name={chartMetric === "revenue" ? "Doanh thu" : chartMetric === "users" ? "Người dùng" : "Giao dịch"}
                  stroke={chartMetric === "revenue" ? "#10b981" : chartMetric === "users" ? "#3b82f6" : "#f59e0b"}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: chartMetric === "revenue" ? "#10b981" : chartMetric === "users" ? "#3b82f6" : "#f59e0b" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm font-bold text-slate-400">Không có dữ liệu</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* 3. Secondary Charts Grid */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Posts Status */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm relative overflow-hidden group cursor-pointer"
          onClick={() => onNavigate && onNavigate("posts")}
        >
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-black bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent uppercase tracking-wider">
              Tình trạng Tin Đăng
            </h3>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
              <ChevronRight className="size-4 text-slate-400" />
            </div>
          </div>

          <div className="h-[220px] w-full relative z-10">
            {postStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={postStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {postStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Total Posts in Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-4 pointer-events-none">
                  <span className="text-2xl font-black text-slate-800">{safePosts.length}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Tổng cộng</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-slate-400">Chưa có dữ liệu</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Users Breakdown */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm cursor-pointer group"
          onClick={() => onNavigate && onNavigate("users")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wider">
              Cơ cấu Người Dùng
            </h3>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Users className="size-4 text-blue-500" />
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRoleData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} content={<CustomTooltip />} />
                <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {userRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Operations (Reports & Verifications) */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">
              Vận hành & Yêu cầu
            </h3>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={operationsData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}
                />
                <Bar dataKey="Pending" name="Chờ xử lý" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Resolved" name="Đã xử lý" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* 4. Bottom Row: Top Rooms & Recent Activity (Placeholder) */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Top Performing Rooms */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-wider">
              Top phòng được xem
            </h3>
            <Eye className="size-5 text-emerald-500" />
          </div>

          <div className="space-y-5">
            {topRooms.slice(0, 5).map((room, idx) => (
              <div key={room.rank} className="group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                    0{room.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-black text-slate-800 truncate group-hover:text-emerald-500 transition-colors">
                      {room.name}
                    </p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      {/* Progress bar based on highest view count */}
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full"
                        style={{ width: `${topRooms[0]?.views ? (room.views / topRooms[0].views) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <p className="text-sm font-black text-emerald-600">
                      {room.views.toLocaleString()}
                    </p>
                    <p className="text-[9px] uppercase font-bold text-slate-300">
                      Lượt xem
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Summary (Placeholder/Additional info) */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 rounded-[32px] p-8 shadow-lg text-white flex flex-col justify-between relative overflow-hidden"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 rounded-full opacity-10 blur-3xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10">
            <h3 className="text-lg font-black mb-2 flex items-center gap-2">
              <Zap className="size-5 text-emerald-400 fill-emerald-400" />
              Tổng quan Hệ thống
            </h3>
            <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-sm">
              Hệ thống đang hoạt động ổn định. Đã xử lý {transactions.length} giao dịch và hỗ trợ {users.length} người dùng trên nền tảng.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-3xl font-black text-emerald-400 mb-1">{posts.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Tin Đăng Lưu Trữ</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-3xl font-black text-blue-400 mb-1">{reports.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Báo cáo hệ thống</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

// small animated number renderer
function AnimatedNumber({
  value,
  duration = 900,
}: {
  value: string | number;
  duration?: number;
}) {
  const [display, setDisplay] = useState<number>(0);
  const [decimalPlaces, setDecimalPlaces] = useState<number>(0);

  useEffect(() => {
    const str = String(value ?? "0");
    const match = str.match(/-?[\d,.]+/);
    const raw = match ? match[0].replace(/,/g, "") : "0";
    const target = Number(raw) || 0;
    
    const decPlaces = raw.includes(".") ? raw.split(".")[1].length : 0;
    setDecimalPlaces(decPlaces);

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const current = target * progress;
      setDisplay(current);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const suffix = String(value ?? "").replace(/-?[\d,.]+/, "");
  return (
    <>
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}
      {suffix}
    </>
  );
}

// Enhanced KPI Card Component
function KPICard({
  icon,
  iconBg,
  label,
  value,
  change,
  changePositive,
  changeNegative,
  topGradient,
  onClick,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change: string;
  changePositive?: boolean;
  changeNegative?: boolean;
  topGradient: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 10 },
      }}
      className={`relative overflow-hidden rounded-[28px] p-6 transition-all group shadow-2xl shadow-slate-200/30 bg-white/70 backdrop-blur-2xl border border-white/40 ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* decorative blurred blobs */}
      <div
        aria-hidden
        className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-30 blur-3xl"
        style={{ background: topGradient }}
      />
      <div
        aria-hidden
        className="absolute -left-10 -bottom-6 w-44 h-44 rounded-full opacity-20 blur-2xl"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
        }}
      />

      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-105 transition-transform duration-300 border border-white/60"
            style={{ background: topGradient, color: "white" }}
          >
            {icon}
          </motion.div>

          {change && (
            <motion.div
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-white/80 text-slate-600 border border-slate-100 shadow-sm"
            >
              {changePositive ? "＋ " : changeNegative ? "↓ " : ""}{change}
            </motion.div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
            {label}
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500">
            <AnimatedNumber value={value} />
          </div>
        </div>
      </div>

      {/* Subtle angled accent at bottom */}
      <svg
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        style={{ height: 22 }}
      >
        <path
          d="M0 10 C 20 0 80 0 100 10 L100 10 L0 10 Z"
          fillOpacity={0.14}
          fill="url(#g)"
        />
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// Expired Posts View Component
function ExpiredPostsView({
  posts,
  onUpdateStatus,
}: {
  posts: any[];
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const isPostExpired = (p: any) => {
    if (p.status === "expired") return true;
    if (p.status === "approved" && p.expiryDate) {
      return new Date(p.expiryDate) < new Date();
    }
    return false;
  };

  const expiredPosts = (posts || []).filter(isPostExpired);

  const filteredPosts = expiredPosts.filter((post) => {
    const matchesSearch =
      post.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } },
      }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Quản lý Tin hết hạn
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Tái đăng hoặc xóa các tin đăng đã hết hạn ({expiredPosts.length}{" "}
            tin)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm tên phòng, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-2xl text-sm focus:border-amber-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                Tin hết hạn
              </p>
              <p className="text-3xl font-black text-amber-700">
                {expiredPosts.length}
              </p>
            </div>
            <Clock className="size-12 text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                Có thể tái đăng
              </p>
              <p className="text-3xl font-black text-blue-700">
                {expiredPosts.length}
              </p>
            </div>
            <RefreshCw className="size-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                Xóa hết
              </p>
              <p className="text-sm font-bold text-red-600 mt-2">
                <button className="px-3 py-1 bg-red-500 text-white rounded-lg text-[10px] font-black hover:bg-red-600 transition-all">
                  Xóa tất cả
                </button>
              </p>
            </div>
            <Trash2 className="size-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post) => (
            <motion.div
              layout
              key={post._id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", bounce: 0.2 },
                },
                exit: { opacity: 0, scale: 0.95 },
              }}
              whileHover={{
                scale: 1.01,
                y: -8,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              className="bg-white/70 backdrop-blur-xl border border-rose-200/50 rounded-[40px] p-8 hover:shadow-2xl hover:shadow-rose-200/50 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
                {/* Image / Thumbnail */}
                <div className="w-24 h-24 rounded-2xl bg-slate-50 flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform opacity-50">
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🏠
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <StatusPill status="expired" />
                  </div>
                </div>

                {/* Info Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-[15px] font-black text-slate-800 tracking-tight opacity-75">
                        {post.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="size-3 text-slate-300" />
                        <span className="text-xs text-slate-400 font-medium truncate">
                          {post.address}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-orange-600 tracking-tighter">
                        {post.price?.toLocaleString()}
                        <span className="text-[10px] text-slate-400 tracking-normal ml-0.5 font-bold uppercase">
                          /tháng
                        </span>
                      </div>
                      <div className="flex flex-col items-end justify-end gap-1 mt-1">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">
                          Đăng: {formatDateVietnamese(post.createdAt)}
                        </span>
                        {post.expiryDate && (
                          <span className="text-[10px] font-bold text-red-500 uppercase">
                            Hết hạn: {formatDateVietnamese(post.expiryDate)} <span className="lowercase">{getDaysLeftText(post.expiryDate)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-50 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center shadow-sm">
                          {post.landlordId?.name
                            ?.substring(0, 2)
                            .toUpperCase() || "LL"}
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          {post.landlordId?.name || "Chưa có tên"}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <User className="size-3" />
                        {post.landlordId?.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onUpdateStatus(post._id, "approved")}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className="size-3" />
                        Tái đăng
                      </motion.button>
                      <button
                        onClick={() => onUpdateStatus(post._id, "rejected")}
                        className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-300 transition-all"
                      >
                        Xóa
                      </button>

                      <button className="p-2 hover:bg-slate-50 text-slate-400 hover:text-blue-500 transition-all rounded-xl flex items-center gap-1">
                        <Eye className="size-5" />
                        <span className="text-xs font-bold">{post.views || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gradient-to-br from-emerald-50 to-green-50 rounded-[32px] border-2 border-dashed border-emerald-200"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <CheckCircle className="size-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-black text-emerald-600 uppercase tracking-widest">
              Tuyệt vời!
            </h3>
            <p className="text-sm text-slate-500 mt-2 max-w-[300px] font-semibold">
              Không có tin đăng nào hết hạn. Tất cả các danh sách đều đang hoạt
              động!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Posts View Component
function PostsView({
  posts,
  onUpdateStatus,
}: {
  posts: any[];
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "reported" | "approved" | "expired"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isPostExpired = (p: any) => {
    if (p.status === "expired") return true;
    if (p.status === "approved" && p.expiryDate) {
      return new Date(p.expiryDate) < new Date();
    }
    return false;
  };

  const filteredPosts = (posts || []).filter((post) => {
    const expired = isPostExpired(post);
    let matchesTab = false;

    if (activeTab === "all") matchesTab = true;
    else if (activeTab === "expired") matchesTab = expired;
    else matchesTab = post.status === activeTab && !expired;

    const matchesSearch =
      post.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } },
      }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Quản lý Tin đăng
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Duyệt, ẩn và xử lý vi phạm tin đăng toàn hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm tên phòng, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-2xl text-sm focus:border-emerald-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="size-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Tab Bar with layoutId */}
      <div className="flex items-center p-1 bg-slate-100/50 rounded-2xl w-fit flex-wrap">
        {[
          { id: "all", label: "Tất cả", icon: null },
          { id: "pending", label: "Chờ duyệt", icon: "⏳", color: "amber" },
          { id: "reported", label: "Bị báo cáo", icon: "⚠️", color: "rose" },
          { id: "approved", label: "Hiển thị", icon: "✅", color: "emerald" },
          { id: "expired", label: "Hết hạn", icon: "⏰", color: "slate" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative px-6 py-2 text-xs font-bold transition-all rounded-xl ${activeTab === tab.id
                ? "text-emerald-700"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <span className="text-sm">{tab.icon}</span>}
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab.id
                    ? tab.id === "expired"
                      ? "bg-slate-300 text-slate-700"
                      : "bg-emerald-100 text-emerald-600"
                    : "bg-slate-200 text-slate-500"
                  }`}
              >
                {
                  (posts || []).filter((p) => {
                    const expired = p.status === "expired" || (p.status === "approved" && p.expiryDate && new Date(p.expiryDate) < new Date());
                    if (tab.id === "all") return true;
                    if (tab.id === "expired") return expired;
                    return p.status === tab.id && !expired;
                  }).length
                }
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post) => (
            <motion.div
              layout
              key={post._id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", bounce: 0.2 },
                },
                exit: { opacity: 0, scale: 0.95 },
              }}
              whileHover={{
                scale: 1.01,
                y: -8,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[40px] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
                {/* Image / Thumbnail */}
                <div className="w-24 h-24 rounded-2xl bg-slate-50 flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🏠
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <StatusPill status={isPostExpired(post) ? "expired" : post.status} />
                  </div>
                </div>

                {/* Info Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-[15px] font-black text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors">
                        {post.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="size-3 text-slate-300" />
                        <span className="text-xs text-slate-400 font-medium truncate">
                          {post.address}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-600 tracking-tighter">
                        {post.price?.toLocaleString()}
                        <span className="text-[10px] text-slate-400 tracking-normal ml-0.5 font-bold uppercase">
                          /tháng
                        </span>
                      </div>
                      <div className="flex flex-col items-end justify-end gap-1 mt-1">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">
                          Đăng: {formatDateVietnamese(post.createdAt)}
                        </span>
                        {post.expiryDate && (
                          <span
                            className={`text-[10px] font-bold uppercase ${isPostExpired(post)
                                ? "text-red-500"
                                : "text-slate-400"
                              }`}
                          >
                            Hết hạn: {formatDateVietnamese(post.expiryDate)} <span className="lowercase">{getDaysLeftText(post.expiryDate)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-50 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center shadow-sm">
                          {post.landlordId?.name
                            ?.substring(0, 2)
                            .toUpperCase() || "LL"}
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          {post.landlordId?.name || "Chưa có tên"}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <User className="size-3" />
                        {post.landlordId?.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.status === "pending" && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onUpdateStatus(post._id, "approved")}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all"
                          >
                            Duyệt tin
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onUpdateStatus(post._id, "rejected")}
                            className="px-4 py-2 bg-white border border-rose-100 text-rose-500 rounded-xl text-xs font-black hover:bg-rose-50 transition-all"
                          >
                            Từ chối
                          </motion.button>
                        </>
                      )}

                      {post.status === "reported" && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(post._id, "approved")}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all"
                          >
                            Giữ lại tin
                          </button>
                          <button
                            onClick={() => onUpdateStatus(post._id, "rejected")}
                            className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                          >
                            Gỡ vĩnh viễn
                          </button>
                        </>
                      )}

                      {post.status === "expired" && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onUpdateStatus(post._id, "approved")}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all"
                          >
                            Tái đăng
                          </motion.button>
                          <button
                            onClick={() => onUpdateStatus(post._id, "rejected")}
                            className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-300 transition-all"
                          >
                            Xóa
                          </button>
                        </>
                      )}

                      <button className="p-2 hover:bg-slate-50 text-slate-400 hover:text-emerald-500 transition-all rounded-xl flex items-center gap-1">
                        <Eye className="size-5" />
                        <span className="text-xs font-bold">{post.views || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <span className="text-4xl text-slate-200">🔍</span>
            </div>
            <h3 className="text-lg font-black bg-gradient-to-r from-slate-400 to-slate-300 bg-clip-text text-transparent uppercase tracking-widest">
              Không tìm thấy tin đăng
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-[280px] font-semibold">
              Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn xem sao nhé.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Users View Component
function UsersView({
  users,
  onToggleStatus,
  onDeleteUser,
  onViewDetail,
}: {
  users: any[];
  onToggleStatus: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onViewDetail: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<
    "all" | "landlord" | "user" | "admin" | "broker"
  >("all");

  const totalLandlords = users.filter((u) => u.role === "landlord").length;
  const totalUsers = users.filter((u) => u.role === "user").length;
  const totalBrokers = users.filter((u) => u.role === "broker").length;
  const totalBlocked = users.filter((u) => u.status === "blocked").length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.fullName || user.username || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-8"
    >
      {/* Stat Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
        <KPICard
          icon="👥"
          iconBg="#eff6ff"
          label="Tổng người dùng"
          value={users.length.toLocaleString()}
          change="Hệ thống"
          changePositive
          topGradient="linear-gradient(90deg, #3b82f6, #60a5fa)"
        />
        <KPICard
          icon="🏠"
          iconBg="#fffbeb"
          label="Chủ trọ"
          value={totalLandlords.toLocaleString()}
          change="Đối tác"
          changePositive
          topGradient="linear-gradient(90deg, #f59e0b, #fbbf24)"
        />
        <KPICard
          icon="🤝"
          iconBg="#f5f3ff"
          label="Môi giới"
          value={totalBrokers.toLocaleString()}
          change="Đối tác"
          changePositive
          topGradient="linear-gradient(90deg, #8b5cf6, #a78bfa)"
        />
        <KPICard
          icon="👤"
          iconBg="#f0fdf4"
          label="Người thuê"
          value={totalUsers.toLocaleString()}
          change="Khách hàng"
          changePositive
          topGradient="linear-gradient(90deg, #10b981, #34d399)"
        />
        <KPICard
          icon="🚫"
          iconBg="#fff1f2"
          label="Bị khoá"
          value={totalBlocked.toLocaleString()}
          change="Vi phạm"
          changeNegative
          topGradient="linear-gradient(90deg, #ef4444, #f87171)"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-100/50 rounded-2xl w-fit flex-wrap">
          {[
            { id: "all", label: "Tất cả" },
            { id: "landlord", label: "Chủ trọ" },
            { id: "broker", label: "Môi giới" },
            { id: "user", label: "Người thuê" },
            { id: "admin", label: "Admin" },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => setFilterRole(role.id as any)}
              className={`relative px-6 py-2 text-xs font-bold transition-all rounded-xl ${filterRole === role.id
                  ? "text-blue-700"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {filterRole === role.id && (
                <motion.div
                  layoutId="rolePill"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{role.label}</span>
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-2xl text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Modern User Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user) => (
            <motion.div
              layout
              key={user._id || user.id}
              variants={{
                hidden: { opacity: 0, scale: 0.9, y: 20 },
                show: {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { type: "spring", bounce: 0.3 },
                },
                exit: { opacity: 0, scale: 0.9 },
              }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {getAvatarUrl(user.avatar) ? (
                    <img
                      src={getAvatarUrl(user.avatar) || ""}
                      alt={user.fullName || user.username || "avatar"}
                      className="w-14 h-14 rounded-[18px] object-cover shadow-lg border-2 border-white"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-[18px] flex items-center justify-center text-xl font-black text-white shadow-lg ${user.role === "admin"
                          ? "bg-indigo-500"
                          : user.role === "landlord"
                            ? "bg-amber-500"
                            : user.role === "broker"
                              ? "bg-purple-500"
                              : "bg-blue-500"
                        }`}
                    >
                      {getInitials(user.fullName, user.username)}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${user.status === "blocked"
                        ? "bg-rose-500"
                        : user.status === "pending"
                          ? "bg-yellow-400"
                          : "bg-emerald-500"
                      }`}
                    title={
                      user.status === "blocked"
                        ? "Đã khoá"
                        : user.status === "pending"
                          ? "Chờ xác minh"
                          : "Đang hoạt động"
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-black text-slate-800">
                      {user.fullName || user.username}
                    </h3>
                    <RoleBadge
                      role={user.role as any}
                      showIcon={false}
                      className="scale-90 origin-left"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <Calendar className="size-3.5" />
                      {user.createdAt
                        ? formatDateVietnamese(user.createdAt)
                        : "N/A"}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <Phone className="size-3.5" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2 items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewDetail(user._id);
                  }}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all rounded-xl"
                  title="Chi tiết"
                >
                  <Eye className="size-5" />
                </button>
                <button
                  onClick={() => onToggleStatus(user._id)}
                  className={`p-2.5 rounded-xl transition-all ${user.status === "blocked"
                      ? "bg-emerald-50 text-emerald-500 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-500 hover:bg-rose-100"
                    }`}
                  title={user.status === "blocked" ? "Mở khoá" : "Khoá"}
                >
                  {user.status === "blocked" ? (
                    <LockOpen className="size-5" />
                  ) : (
                    <Lock className="size-5" />
                  )}
                </button>
                <button
                  onClick={() => onDeleteUser(user._id)}
                  className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:text-white hover:bg-red-500 transition-all"
                  title="Xoá người dùng"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Reusable Modern Empty State
const ModernEmptyState = forwardRef(function ModernEmptyState(
  {
    icon,
    title,
    description,
    color = "emerald",
  }: { icon: string; title: string; description: string; color?: string },
  ref: any,
) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm"
    >
      <div
        className={`w-24 h-24 bg-${color}-50 rounded-[32px] flex items-center justify-center text-4xl mb-6 shadow-inner rotate-3`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-sm font-medium leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
});

// Verification View Component
function VerificationView({
  verifications,
  onApprove,
  onReject,
  onDelete,
  onComplete,
  onOpenInspect,
}: {
  verifications: any[];
  onApprove: (id: string, date: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, level: string, notes?: string) => void;
  onOpenInspect: (v: any) => void;
}) {
  const [promptTarget, setPromptTarget] = useState<{
    id: string | null;
    open: boolean;
    type: "date" | "reject";
  }>({ id: null, open: false, type: "date" });
  const [promptDefault, setPromptDefault] = useState<string>("");
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-10"
    >
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
        <KPICard
          icon="⏳"
          iconBg="#fffbeb"
          label="Yêu cầu mới"
          value={verifications
            .filter((v) => v.status === "pending")
            .length.toLocaleString()}
          change="Chờ duyệt"
          changePositive
          topGradient="linear-gradient(90deg, #f59e0b, #fbbf24)"
        />
        <KPICard
          icon="⚙️"
          iconBg="#eff6ff"
          label="Đang xử lý"
          value={verifications
            .filter((v) =>
              ["approved", "awaiting_photos", "photos_submitted"].includes(
                v.status,
              ),
            )
            .length.toLocaleString()}
          change="Tiến độ"
          changePositive
          topGradient="linear-gradient(90deg, #3b82f6, #60a5fa)"
        />
        <KPICard
          icon="❌"
          iconBg="#fff1f2"
          label="Đã từ chối"
          value={verifications
            .filter((v) => v.status === "rejected")
            .length.toLocaleString()}
          change="Vi phạm"
          changeNegative
          topGradient="linear-gradient(90deg, #ef4444, #f87171)"
        />
        <KPICard
          icon="✅"
          iconBg="#f0fdf4"
          label="Đã cấp"
          value={verifications
            .filter((v) => v.status === "completed")
            .length.toLocaleString()}
          change="Thành công"
          changePositive
          topGradient="linear-gradient(90deg, #10b981, #34d399)"
        />
      </div>

      {/* Modern Verification List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent tracking-tight uppercase">
            Danh sách yêu cầu kiểm tra
          </h3>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-50/80 rounded-lg border border-emerald-100 shadow-sm shadow-emerald-50">
            Tổng số yêu cầu: {verifications.length}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {verifications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
              {verifications.map((item) => (
                <motion.div
                  layout
                  key={item.id || item._id}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0 },
                  }}
                  whileHover={{ scale: 1.005, y: -4 }}
                  className={`bg-white border rounded-[32px] p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 ${item.status === "rejected"
                      ? "border-rose-100"
                      : item.status === "pending"
                        ? "border-amber-100"
                        : "border-slate-100"
                    }`}
                >
                  {/* Property Icon/Preview */}
                  <div
                    className={`w-20 h-20 rounded-[24px] flex items-center justify-center text-3xl flex-shrink-0 shadow-inner group-hover:rotate-3 transition-transform ${item.status === "rejected"
                        ? "bg-rose-50"
                        : item.status === "pending"
                          ? "bg-amber-50"
                          : "bg-emerald-50"
                      }`}
                  >
                    🏠
                  </div>

                  {/* Property Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="text-[15px] font-black text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors truncate">
                        {item.propertyId?.name || "Căn trọ chưa xác thực"}
                      </h4>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${item.packageType === "premium"
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}
                      >
                        {item.packageType || "Basic"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] font-medium text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="size-3.5 text-slate-300" />
                        {item.propertyId?.address || "Hồ Chí Minh"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="size-3.5 text-slate-300" />
                        Chủ:{" "}
                        <span className="text-slate-600 font-bold">
                          {item.landlordId?.name}
                        </span>
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Trạng thái:
                      </span>
                      <StatusPill
                        status={
                          item.status === "completed"
                            ? "completed"
                            : item.status === "rejected"
                              ? "rejected"
                              : item.status === "approved"
                                ? "approved"
                                : "pending"
                        }
                      />
                    </div>
                  </div>

                  {/* Detailed Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {item.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setPromptDefault("");
                            setPromptTarget({
                              id: item._id,
                              open: true,
                              type: "date",
                            });
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-blue-100 hover:opacity-90 transition-all flex items-center gap-2"
                        >
                          <Calendar className="size-3.5" /> Phân công
                        </motion.button>
                        {/*
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setPromptDefault("");
                            setPromptTarget({
                              id: item._id,
                              open: true,
                              type: "reject",
                            });
                          }}
                          className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[11px] font-black hover:bg-rose-100 transition-all flex items-center gap-2"
                        >
                          <XCircle className="size-3.5" /> Từ chối
                        </motion.button>
                        */}
                      </div>
                    )}

                    {item.status === "approved" && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onOpenInspect(item)}
                          className="px-5 py-2.5 bg-emerald-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2"
                        >
                          ✓ Hoàn thành
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDelete(item._id)}
                          className="px-4 py-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl"
                        >
                          <Trash2 className="size-4" />
                        </motion.button>
                      </div>
                    )}

                    {item.status === "completed" && (
                      <div className="flex items-center gap-2">
                        <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[11px] font-black flex items-center gap-2">
                          <ShieldCheck className="size-3.5" /> Đã xác thực
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDelete(item._id)}
                          className="px-4 py-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl"
                        >
                          <Trash2 className="size-4" />
                        </motion.button>
                      </div>
                    )}

                    {item.status === "rejected" && (
                      <div className="flex items-center gap-2">
                        <div className="px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[11px] font-black flex items-center gap-2">
                          <XCircle className="size-3.5" /> Đã từ chối
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDelete(item._id)}
                          className="px-4 py-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl"
                        >
                          <Trash2 className="size-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <ModernEmptyState
              icon="🛡️"
              title="Chưa có yêu cầu xác thực"
              description="Khi chủ trọ đăng ký kiểm định căn hộ, yêu cầu sẽ hiện lên tại đây để bạn xử lý thực địa."
              color="blue"
            />
          )}
        </AnimatePresence>
      </div>
      <PromptDialog
        open={promptTarget.open && promptTarget.type === "date"}
        title="Nhập ngày kiểm tra (YYYY-MM-DD):"
        placeholder="YYYY-MM-DD"
        defaultValue={promptDefault}
        submitText="Gửi"
        cancelText="Huỷ"
        onSubmit={(val) => {
          if (promptTarget.id) onApprove(promptTarget.id, val);
          setPromptTarget({ id: null, open: false, type: "date" });
        }}
        onCancel={() =>
          setPromptTarget({ id: null, open: false, type: "date" })
        }
      />
      <PromptDialog
        open={promptTarget.open && promptTarget.type === "reject"}
        title="Nhập lý do từ chối:"
        placeholder="Ví dụ: Hình ảnh không rõ, giấy tờ không đầy đủ..."
        defaultValue={promptDefault}
        submitText="Từ chối"
        cancelText="Huỷ"
        onSubmit={(val) => {
          if (promptTarget.id && val) onReject(promptTarget.id, val);
          setPromptTarget({ id: null, open: false, type: "date" });
        }}
        onCancel={() =>
          setPromptTarget({ id: null, open: false, type: "date" })
        }
      />
    </motion.div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  children,
  count,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: string;
  variant?: "amber" | "red";
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-2xl text-[12.5px] font-black border transition-all relative ${active
          ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm"
          : "bg-white border-slate-100 text-slate-400 hover:border-emerald-100 hover:text-slate-600"
        }`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {count && (
          <span
            className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black ${variant === "amber"
                ? "bg-amber-100 text-amber-600"
                : variant === "red"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-slate-100 text-slate-500"
              }`}
          >
            {count}
          </span>
        )}
      </span>
    </button>
  );
}

// Status Pill Component
function StatusPill({ status }: { status: string }) {
  const styles: any = {
    pending: {
      label: "Chờ duyệt",
      bg: "bg-amber-50",
      text: "text-amber-600",
      dot: "bg-amber-500",
    },
    approved: {
      label: "Đang hiển thị",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      dot: "bg-emerald-500",
    },
    reported: {
      label: "Bị báo cáo",
      bg: "bg-rose-50",
      text: "text-rose-600",
      dot: "bg-rose-500",
    },
    completed: {
      label: "Hoàn tất",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      dot: "bg-indigo-500",
    },
    rejected: {
      label: "Từ chối",
      bg: "bg-slate-50",
      text: "text-slate-600",
      dot: "bg-slate-400",
    },
  };

  const s = styles[status] || styles.pending;

  return (
    <div
      className={`px-2.5 py-1 rounded-full ${s.bg} ${s.text} text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </div>
  );
}

// Bookings View Component
function BookingsView({
  bookings,
  onDeleteBooking,
}: {
  bookings: any[];
  onDeleteBooking: (id: string) => void;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h3 className="text-lg font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight uppercase">
            Lịch hẹn xem phòng
          </h3>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Toàn bộ các lượt đặt lịch từ người dùng
          </p>
        </div>
        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-3 py-1 bg-blue-50/80 rounded-lg border border-blue-100 shadow-sm shadow-blue-50">
          {bookings.length} GIAO DỊCH
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {bookings.map((b) => (
              <motion.div
                layout
                key={b._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
              >
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <Home className="size-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent text-[16px] truncate max-w-[180px]">
                        {b.propertyId?.name || "Căn hộ"}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="size-3 text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-400 truncate max-w-[150px]">
                          {b.propertyId?.address || "Hồ Chí Minh"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const statusConfig: Record<string, string> = {
                      pending: "bg-amber-50 text-amber-600 border-amber-200 shadow-amber-100",
                      confirmed: "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-100",
                      completed: "bg-blue-50 text-blue-600 border-blue-200 shadow-blue-100",
                      cancelled: "bg-rose-50 text-rose-600 border-rose-200 shadow-rose-100",
                    };
                    const s = (b.status || "pending").toLowerCase();
                    const colorClass = statusConfig[s] || "bg-slate-50 text-slate-600 border-slate-200 shadow-slate-100";
                    return (
                      <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${colorClass}`}>
                        {b.status}
                      </div>
                    );
                  })()}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6 mb-8 p-5 bg-slate-50/50 rounded-[24px] border border-slate-50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Khách thuê
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                        {(b.userId?.fullName || b.userId?.username || "A")
                          .substring(0, 1)
                          .toUpperCase()}
                      </div>
                      <span className="text-xs font-black text-slate-700 truncate">
                        {b.userId?.fullName || b.userId?.username || "Ẩn danh"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Ngày hẹn
                    </span>
                    <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                      <Calendar className="size-3.5 text-blue-500" />
                      {formatDateVietnamese(b.bookingDate)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-50 gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Clock className="size-3.5" />
                    {b.bookingTime}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDeleteBooking(b._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-rose-500 hover:bg-gradient-to-r hover:from-rose-500 hover:to-red-500 hover:text-white rounded-xl text-[11px] font-black transition-all border border-rose-100 shadow-sm shadow-rose-50"
                  >
                    <Trash2 className="size-3.5" /> Huỷ lịch
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <ModernEmptyState
            icon="📅"
            title="Chưa có lịch hẹn"
            description="Hiện tại hệ thống chưa ghi nhận lượt đặt lịch xem phòng nào từ khách hàng."
            color="amber"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Reviews View Component
const ReviewsView = forwardRef(function ReviewsView(
  {
    reviews,
    onDeleteReview,
  }: { reviews: any[]; onDeleteReview: (id: string) => void },
  ref: any,
) {
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h3 className="text-lg font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight uppercase">
            Cộng đồng đánh giá
          </h3>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Quản lý các phản hồi và xếp hạng từ người dùng
          </p>
        </div>
        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-3 py-1 bg-indigo-50/80 rounded-lg border border-indigo-100 shadow-sm shadow-indigo-50">
          {reviews.length} NHẬN XÉT
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {reviews.map((r) => (
              <motion.div
                layout
                key={r._id}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  show: { opacity: 1, scale: 1 },
                }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col group relative"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl shadow-inner border border-white">
                      💬
                    </div>
                    <div>
                      <h4 className="font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent text-[15px] truncate max-w-[150px]">
                        {r.propertyId?.name || "Tin đăng"}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-bold text-slate-400">
                          bởi
                        </span>
                        <span className="text-[11px] font-black text-indigo-600">
                          {r.userId?.username || "Ẩn danh"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-100">
                    <Star className="size-3 text-amber-500 fill-amber-500" />
                    <span className="text-[11px] font-black text-amber-600">
                      {r.rating}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="p-5 bg-slate-50/50 rounded-[24px] border border-slate-50 italic text-[13px] text-slate-600 font-medium leading-relaxed relative">
                    <div className="absolute -top-3 left-6 text-slate-200 text-4xl font-serif">
                      "
                    </div>
                    {r.comment || "Không có nội dung bình luận."}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    ID: #{r._id.substring(r._id.length - 6).toUpperCase()}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDeleteReview(r._id)}
                    className="px-4 py-2 bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl text-[11px] font-black transition-all flex items-center gap-2"
                  >
                    <Trash2 className="size-3.5" /> Gỡ bỏ
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <ModernEmptyState
            icon="⭐"
            title="Chưa có đánh giá nào"
            description="Hãy chờ đợi những phản hồi đầu tiên từ người dùng sau khi họ trải nghiệm dịch vụ."
            color="indigo"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// --- NEW HELPER COMPONENTS ---

const MonthYearPicker = forwardRef(function MonthYearPicker(
  {
    selectedMonth,
    selectedYear,
    onSelect,
    onClose,
  }: {
    selectedMonth: number;
    selectedYear: number;
    onSelect: (m: number, y: number) => void;
    onClose: () => void;
  },
  ref: any,
) {
  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  const years = [2024, 2025, 2026];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        ref={ref}
        className="absolute top-12 right-0 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-5 z-50 backdrop-blur-xl"
      >
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">
              Chọn năm
            </div>
            <div className="flex gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => onSelect(selectedMonth, y)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear === y
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">
              Chọn tháng
            </div>
            <div className="grid grid-cols-3 gap-2">
              {months.map((m, idx) => (
                <button
                  key={m}
                  onClick={() => onSelect(idx + 1, selectedYear)}
                  className={`py-2 rounded-xl text-[11px] font-bold transition-all ${selectedMonth === idx + 1
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : "bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
});

const NotificationTray = forwardRef(function NotificationTray(
  { notifications, onClose }: { notifications: any[]; onClose: () => void },
  ref: any,
) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        ref={ref}
        className="absolute top-12 right-0 w-96 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 backdrop-blur-xl flex flex-col max-h-[500px]"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 sticky top-0 backdrop-blur-md">
          <h3 className="text-sm font-black text-slate-800">
            Thông báo hệ thống
          </h3>
          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full">
            {notifications.length} mới
          </span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className="px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer"
              >
                <div className="flex gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform ${n.type === "user"
                        ? "bg-blue-50"
                        : n.type === "property"
                          ? "bg-emerald-50"
                          : n.type === "verification"
                            ? "bg-amber-50"
                            : "bg-indigo-50"
                      }`}
                  >
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-800 mb-0.5">
                      {n.title}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2 font-medium">
                      {new Date(n.time).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 italic text-sm">
              <Bell className="size-10 mb-3 opacity-20" />
              Không có thông báo mới
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50/50 border-t border-slate-100">
          <button className="w-full py-2 text-[11px] font-bold text-slate-500 hover:text-emerald-600 transition-colors">
            Xem tất cả thông báo
          </button>
        </div>
      </motion.div>
    </>
  );
});

// Reports View Component
function ReportsView({
  reports,
  onUpdateStatus,
}: {
  reports: any[];
  onUpdateStatus: (id: string, status: string, notes?: string) => void;
}) {
  const [promptTarget, setPromptTarget] = useState<{
    id: string | null;
    status: string;
    open: boolean;
  }>({ id: null, status: "", open: false });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h3 className="text-lg font-black bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent tracking-tight uppercase">
            Báo cáo vi phạm
          </h3>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Xử lý các khiếu nại từ người dùng về tin đăng
          </p>
        </div>
        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-3 py-1 bg-rose-50/80 rounded-lg border border-rose-100 shadow-sm shadow-rose-50">
          {reports.length} BÁO CÁO
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {reports.map((report) => (
              <motion.div
                layout
                key={report._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                className={`bg-white border rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden ${report.status === "pending"
                    ? "border-rose-100"
                    : "border-slate-100"
                  }`}
              >
                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                  <StatusPill status={report.status} />
                </div>

                {/* Property Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <AlertTriangle className="size-6 text-rose-600" />
                  </div>
                  <div className="min-w-0 pr-12">
                    <h4 className="font-black text-slate-800 text-[16px] truncate">
                      {report.propertyId?.name || "Tin đăng đã bị xóa"}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="size-3 text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-400 truncate">
                        {report.propertyId?.address || "Không xác định"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                <div className="space-y-4 mb-8">
                  <div className="p-5 bg-rose-50/50 rounded-[24px] border border-rose-50">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-2">
                      Lý do:{" "}
                      {report.reason === "incorrect_info"
                        ? "Thông tin sai"
                        : report.reason === "fraud"
                          ? "Lừa đảo"
                          : report.reason === "sold_rented"
                            ? "Đã cho thuê"
                            : report.reason === "duplicate"
                              ? "Tin trùng"
                              : "Khác"}
                    </span>
                    <p className="text-[13px] text-slate-700 font-medium leading-relaxed">
                      {report.description || "Không có mô tả chi tiết."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-slate-300" />
                      <span className="text-slate-400">Người báo cáo: </span>
                      <span className="text-slate-600 font-bold">
                        {report.reporterId?.username || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="size-3.5" />
                      {formatDateVietnamese(report.createdAt)}
                    </div>
                  </div>

                  {report.adminNotes && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        Ghi chú Admin:
                      </span>
                      <p className="text-[11px] text-slate-500 italic">
                        {report.adminNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {report.status === "pending" && (
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setPromptTarget({
                          id: report._id,
                          status: "resolved",
                          open: true,
                        })
                      }
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[11px] font-black shadow-lg shadow-emerald-50 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="size-3.5" /> Giải quyết
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setPromptTarget({
                          id: report._id,
                          status: "dismissed",
                          open: true,
                        })
                      }
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="size-3.5" /> Bỏ qua
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <ModernEmptyState
            icon="🛡️"
            title="Không có báo cáo mới"
            description="Tuyệt vời! Hiện tại không có tin đăng nào bị người dùng báo cáo vi phạm."
            color="rose"
          />
        )}
      </AnimatePresence>

      <PromptDialog
        open={promptTarget.open}
        title={
          promptTarget.status === "resolved"
            ? "Giải quyết báo cáo"
            : "Bỏ qua báo cáo"
        }
        placeholder="Nhập ghi chú xử lý..."
        submitText="Xác nhận"
        cancelText="Huỷ"
        onSubmit={(notes) => {
          onUpdateStatus(promptTarget.id!, promptTarget.status, notes);
          setPromptTarget({ id: null, status: "", open: false });
        }}
        onCancel={() => setPromptTarget({ id: null, status: "", open: false })}
      />
    </motion.div>
  );
}

// Notifications Management View Component
function NotificationsManagementView({
  notifications,
  onSendBroadcast,
}: {
  notifications: any[];
  onSendBroadcast: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    targetRole: "all",
    link: "",
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }
    setIsSending(true);
    await onSendBroadcast(formData);
    setIsSending(false);
    // Reset form after sending
    setFormData({
      title: "",
      message: "",
      type: "info",
      targetRole: "all",
      link: "",
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-[20px] font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent tracking-tight uppercase">
            Trung tâm Thông báo Hệ thống
          </h3>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Gửi và quản lý thông báo quan trọng của hệ thống
          </p>
        </div>
      </div>

      {/* Admin System Notifications List */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 },
        }}
        className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm"
      >
        <h4 className="text-lg font-black text-slate-800 mb-6">
          Thông báo chuyên trang Admin
        </h4>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-slate-400 font-medium">
              Không có thông báo hệ thống nào.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="flex gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${n.type === "user"
                      ? "bg-blue-100/50"
                      : n.type === "property"
                        ? "bg-emerald-100/50"
                        : n.type === "verification"
                          ? "bg-amber-100/50"
                          : "bg-indigo-100/50"
                    }`}
                >
                  {n.icon}
                </div>
                <div>
                  <div className="font-black text-sm text-slate-800">
                    {n.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{n.message}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-2">
                    {new Date(n.time).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Composition Form */}
        <motion.div
          variants={{
            hidden: { opacity: 0, x: -20 },
            show: { opacity: 1, x: 0 },
          }}
          className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-inner">
              <Send className="size-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-black text-slate-800">
              Soạn thông báo
            </h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Tiêu đề
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nhập tiêu đề thông báo..."
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Loại
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer"
                >
                  <option value="info">Thông tin (Info)</option>
                  <option value="success">Thành công (Success)</option>
                  <option value="warning">Cảnh báo (Warning)</option>
                  <option value="error">Khẩn cấp (Error)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Đối tượng
                </label>
                <select
                  value={formData.targetRole}
                  onChange={(e) =>
                    setFormData({ ...formData, targetRole: e.target.value })
                  }
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer"
                >
                  <option value="all">Tất cả người dùng</option>
                  <option value="landlord">Chỉ Chủ trọ</option>
                  <option value="user">Chỉ Khách thuê</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Nội dung
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Nhập nội dung thông báo chi tiết..."
                rows={4}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/50 transition-all outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Liên kết (Tùy chọn)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSending}
              type="submit"
              className={`w-full py-5 rounded-[24px] text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-3 ${isSending
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-200 hover:shadow-blue-300"
                }`}
            >
              {isSending ? (
                <>Đang gửi...</>
              ) : (
                <>
                  <Send className="size-5" /> Gửi thông báo ngay
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Live Preview */}
        <motion.div
          variants={{
            hidden: { opacity: 0, x: 20 },
            show: { opacity: 1, x: 0 },
          }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Eye className="size-5 text-emerald-600" />
            </div>
            <h4 className="text-lg font-black text-slate-800">Xem trước</h4>
          </div>

          <div className="bg-slate-50 rounded-[40px] p-10 border border-slate-100 border-dashed min-h-[400px] flex items-center justify-center relative overflow-hidden">
            {/* Abstract Background for Preview */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl -ml-32 -mb-32" />

            {formData.title || formData.message ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl shadow-slate-200 border border-white relative z-10"
              >
                <div className="flex gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${formData.type === "success"
                        ? "bg-emerald-50"
                        : formData.type === "warning"
                          ? "bg-amber-50"
                          : formData.type === "error"
                            ? "bg-rose-50"
                            : "bg-blue-50"
                      }`}
                  >
                    {formData.type === "success"
                      ? "✅"
                      : formData.type === "warning"
                        ? "⚠️"
                        : formData.type === "error"
                          ? "🚨"
                          : "📢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-black text-slate-800 text-[15px] mb-1 truncate">
                      {formData.title || "Tiêu đề mẫu"}
                    </h5>
                    <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-3">
                      {formData.message ||
                        "Nội dung thông báo sẽ xuất hiện ở đây khi bạn nhập vào biểu mẫu bên trái..."}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        Vừa xong
                      </span>
                      {formData.link && (
                        <span className="text-[10px] font-black text-blue-600 flex items-center gap-1">
                          Xem chi tiết <ChevronRight className="size-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center space-y-4 max-w-xs grayscale opacity-40">
                <Bell className="size-16 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-400">
                  Nhập thông tin để xem trước giao diện hiển thị phía người dùng
                </p>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
              💡
            </div>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              <strong>Mẹo:</strong> Hãy sử dụng các loại thông báo khác nhau để
              thu hút sự chú ý. Loại <b>Cảnh báo</b> hoặc <b>Khẩn cấp</b> nên
              được dùng cho các thay đổi quan trọng về chính sách hoặc bảo trì
              hệ thống.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- NEW ADMIN VIEWS ---

// 1. Transactions View
const TransactionsView = ({ transactions }: { transactions: any[] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white/80 backdrop-blur-2xl border-2 border-white rounded-[40px] shadow-xl shadow-slate-200/30 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">
              Lịch sử Giao dịch
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
              Quản lý và đối soát giao dịch hệ thống
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-full md:w-auto px-6 py-4 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-[24px] shadow-lg shadow-emerald-200/50 text-white flex flex-col justify-center transform hover:scale-105 transition-all">
              <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5 opacity-80">
                Tổng doanh thu
              </span>
              <span className="text-2xl font-black tracking-tight">
                {transactions
                  .filter((t) => t.status === "success")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString("vi-VN")}
                <span className="text-sm ml-1 opacity-80">VNĐ</span>
              </span>
            </div>
          </div>
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Mã GD
                </th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Người dùng
                </th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Số tiền
                </th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nội dung
                </th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Trạng thái
                </th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {transactions.map((t) => (
                <tr
                  key={t._id}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6 font-black text-slate-400 text-xs whitespace-nowrap group-hover:text-indigo-500 transition-colors">
                    #{t.invoiceId || t._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all">
                        {getInitials(
                          t.userId?.fullName || "User",
                          t.userId?.username,
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {t.userId?.fullName}
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 truncate">
                          {t.userId?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">
                    {t.amount.toLocaleString("vi-VN")}<span className="text-[10px] text-slate-400 ml-1">VNĐ</span>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500 max-w-[200px] truncate group-hover:text-slate-700 transition-colors">
                    {t.description}
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${t.status === "success"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : t.status === "pending"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}
                    >
                      {t.status === "success"
                        ? "Thành công"
                        : t.status === "pending"
                          ? "Chờ xử lý"
                          : "Thất bại"}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[11px] font-bold text-slate-400 whitespace-nowrap">
                    {formatDateVietnamese(t.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                <CreditCard className="size-8 text-slate-300" />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                Chưa có giao dịch nào
              </p>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
          {transactions.map((t) => (
            <div key={t._id} className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  MÃ GD: <span className="text-indigo-500">#{t.invoiceId || t._id.slice(-8).toUpperCase()}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${t.status === "success"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : t.status === "pending"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}
                >
                  {t.status === "success"
                    ? "Thành công"
                    : t.status === "pending"
                      ? "Chờ xử lý"
                      : "Thất bại"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600 shadow-sm">
                  {getInitials(
                    t.userId?.fullName || "User",
                    t.userId?.username,
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-black text-slate-800 truncate">
                    {t.userId?.fullName}
                  </div>
                  <div className="text-xs font-bold text-slate-400 truncate">
                    {t.userId?.email}
                  </div>
                </div>
              </div>

              <div className="text-sm font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100/50 leading-relaxed">
                {t.description}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-lg font-black text-emerald-600 tracking-tight">
                  {t.amount.toLocaleString("vi-VN")}<span className="text-[10px] ml-1 uppercase text-slate-400">VNĐ</span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {formatDateVietnamese(t.createdAt)}
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Chưa có giao dịch nào
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 2. Advanced Analytics View
const AdvancedAnalyticsView = ({ stats }: { stats: any }) => {
  const contactRate =
    stats?.totalViews > 0
      ? Math.round((stats.totalBookings / stats.totalViews) * 100)
      : 0;

  const successRate =
    stats?.totalViews > 0
      ? Math.round((stats.totalTransactionsSuccess / stats.totalViews) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {/* Conversion Rate Card */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[35px] p-8 shadow-sm col-span-2">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
          <BarChart3 className="size-5 text-indigo-600" />
          Tỷ lệ chuyển đổi hệ thống
        </h3>
        <div className="flex items-end gap-12 h-64 px-10">
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className="w-full bg-slate-50 rounded-2xl relative overflow-hidden h-48">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                className="absolute bottom-0 inset-x-0 bg-blue-500/10 border-t-2 border-blue-500"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-black text-blue-600 text-xl">
                  {stats?.totalViews?.toLocaleString()}
                </div>
                <div className="text-[8px] font-black text-blue-400 uppercase">
                  100%
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
              Lượt xem tin
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className="w-full bg-slate-50 rounded-2xl relative overflow-hidden h-48">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(contactRate, 5)}%` }}
                className="absolute bottom-0 inset-x-0 bg-indigo-500/10 border-t-2 border-indigo-500"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-black text-indigo-600 text-xl">
                  {stats?.totalBookings?.toLocaleString()}
                </div>
                <div className="text-[8px] font-black text-indigo-400 uppercase">
                  {contactRate}%
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
              Liên hệ / Đặt lịch
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className="w-full bg-slate-50 rounded-2xl relative overflow-hidden h-48">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(successRate, 5)}%` }}
                className="absolute bottom-0 inset-x-0 bg-emerald-500/10 border-t-2 border-emerald-500"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-black text-emerald-600 text-xl">
                  {stats?.totalTransactionsSuccess?.toLocaleString()}
                </div>
                <div className="text-[8px] font-black text-emerald-400 uppercase">
                  {successRate}%
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
              Giao dịch thành công
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[35px] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between">
        <div>
          <h3 className="text-indigo-100 font-bold text-sm uppercase tracking-widest mb-2">
            Đăng ký mới
          </h3>
          <div className="text-4xl font-black">
            {stats?.newUsers?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-indigo-200 mt-2 font-medium">
            Người dùng mới gia nhập trong tháng này
          </p>
        </div>
        <div className="pt-8 border-t border-white/10 mt-8">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-200 mb-2">
            <span>Mục tiêu tháng</span>
            <span>
              {Math.min(Math.round(((stats?.newUsers || 0) / 100) * 100), 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(Math.min(((stats?.newUsers || 0) / 100) * 100), 100)}%`,
              }}
              className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 3. Subscriptions Admin View
const SubscriptionsAdminView = ({
  plans,
  onRefresh,
}: {
  plans: any[];
  onRefresh: () => void;
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setIsEditorOpen(true);
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xoá (ngừng kích hoạt) gói này không?",
      )
    )
      return;
    try {
      const res = await api.delete(`/api/admin/subscriptions/plans/${id}`);
      if (res.status === 200) {
        toast.success("Đã xoá gói dịch vụ thành công! 🗑️");
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xoá gói dịch vụ");
    }
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (editingPlan) {
        await api.put(
          `/api/admin/subscriptions/plans/${editingPlan._id}`,
          data,
        );
        toast.success("Cập nhật gói dịch vụ thành công! ✨");
      } else {
        await api.post("/api/admin/subscriptions/plans", data);
        toast.success("Thêm mới gói dịch vụ thành công! 🎉");
      }
      setIsEditorOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể lưu thông tin gói");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter mb-2">
            Gói dịch vụ hệ thống
          </h3>
          <p className="text-sm font-bold text-slate-400">
            Cấu hình các gói Listing dành cho Landlord
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 hover:scale-105 transition-all text-white rounded-[22px] h-14 px-8 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-none shadow-xl shadow-blue-200/50"
        >
          <Plus className="size-5" /> Thêm gói mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <motion.div
            key={plan._id}
            whileHover={{ y: -10, scale: 1.02 }}
            className="bg-white/80 backdrop-blur-3xl rounded-[42px] border border-white/60 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden group"
          >
            {/* Decorative Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />

            <div className="flex justify-between items-start mb-10">
              <div className="bg-gradient-to-br from-emerald-500 via-blue-500 to-indigo-600 p-4 rounded-[22px] shadow-lg shadow-blue-100/50 text-white">
                <Ticket className="size-8" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                >
                  <Edit className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                {plan.name}
              </h4>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {Number(plan.price).toLocaleString("vi-VN")}
                </span>
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  đ / tháng
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              {(plan.features || []).map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 bg-emerald-100/50 p-1 rounded-lg text-emerald-600 flex-shrink-0">
                    <CheckCircle className="size-3" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-600 leading-relaxed">
                    {typeof f === "string" ? f : f.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Landlord đang dùng
              </span>
              <div className="flex items-center gap-3">
                {/* Badge hiển thị targetRole */}
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${plan.targetRole === "broker"
                      ? "bg-violet-100 text-violet-700"
                      : plan.targetRole === "all"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-100 text-blue-700"
                    }`}
                >
                  {plan.targetRole === "broker"
                    ? "💼 Môi Giới"
                    : plan.targetRole === "all"
                      ? "🌍 Tất cả"
                      : "🏠 Chủ Nhà"}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-lg font-black text-slate-800">
                    {plan.activeUsers || 0}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <PlanEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        initialData={editingPlan}
        isSaving={isSaving}
      />
    </motion.div>
  );
};

// Plan Editor Dialog Content
const PlanEditorDialog = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
}: any) => {
  const [formData, setFormData] = useState<any>({
    name: "",
    planId: "",
    price: 0,
    yearlyPrice: 0,
    description: "",
    badge: "",
    badgeColor: "bg-blue-100 text-blue-700",
    icon: "Star",
    cta: "Chọn gói",
    ctaVariant: "default",
    features: [],
    targetRole: "landlord",
  });

  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        planId: initialData.planId || "",
        price: initialData.price || 0,
        yearlyPrice: initialData.yearlyPrice || 0,
        description: initialData.description || "",
        badge: initialData.badge || "",
        badgeColor: initialData.badgeColor || "bg-blue-100 text-blue-700",
        icon: initialData.icon || "Star",
        cta: initialData.cta || "Chọn gói",
        ctaVariant: initialData.ctaVariant || "default",
        features: initialData.features || [],
        targetRole: initialData.targetRole || "landlord",
      });
    } else {
      setFormData({
        name: "",
        planId: "",
        price: 0,
        yearlyPrice: 0,
        description: "",
        badge: "",
        badgeColor: "bg-blue-100 text-blue-700",
        icon: "Star",
        cta: "Chọn gói",
        ctaVariant: "default",
        features: [],
        targetRole: "landlord",
      });
    }
  }, [initialData, isOpen]);

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFormData({
      ...formData,
      features: [
        ...formData.features,
        { text: newFeature.trim(), included: true },
      ],
    });
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_: any, i: number) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative bg-white rounded-[44px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
          >
            {/* Modal Header */}
            <div className="p-10 pb-6 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter">
                  {initialData
                    ? "Cập nhật Gói Dịch Vụ"
                    : "Thiết kế Gói Dịch Vụ Mới"}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                  Thông tin cơ bản & Đặc quyền quyền lợi
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"
              >
                <XCircle className="size-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Tên gói dịch vụ
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="VD: Premium, Platinum..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Giá tiền (VNĐ/tháng)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Giá năm (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.yearlyPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearlyPrice: Number(e.target.value),
                      })
                    }
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Mã định danh (Plan ID)
                  </label>
                  <input
                    value={formData.planId}
                    onChange={(e) =>
                      setFormData({ ...formData, planId: e.target.value })
                    }
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="v.d: gold-2026"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Đối tượng áp dụng (Target Role)
                </label>
                <select
                  value={formData.targetRole}
                  onChange={(e) =>
                    setFormData({ ...formData, targetRole: e.target.value })
                  }
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                >
                  <option value="all">Ẩp dụng cho tất cả (all)</option>
                  <option value="landlord">Chỉ dành cho Chủ Nhà (landlord)</option>
                  <option value="broker">Chỉ dành cho Môi Giới (broker)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Mô tả ngắn gọn
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full h-24 bg-slate-50 border border-slate-100 rounded-[22px] p-6 text-sm font-bold text-slate-600 focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none"
                  placeholder="Mô tả tóm tắt quyền lợi của gói..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Danh sách Đặc quyền
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                      placeholder="Tính năng mới..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button
                      onClick={addFeature}
                      type="button"
                      variant="outline"
                      className="h-10 px-4 rounded-xl border-dashed border-slate-200 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-none"
                    >
                      <Plus className="size-3 mr-1.5" /> Thêm
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.features.map((feature: any, idx: number) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx}
                      className="flex items-center gap-3 group"
                    >
                      <div className="flex-1 relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                          <CheckCircle className="size-4" />
                        </div>
                        <input
                          value={
                            typeof feature === "string" ? feature : feature.text
                          }
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            if (typeof newFeatures[idx] === "string") {
                              newFeatures[idx] = e.target.value;
                            } else {
                              newFeatures[idx] = {
                                ...newFeatures[idx],
                                text: e.target.value,
                              };
                            }
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-600 focus:border-emerald-500 focus:bg-white outline-none transition-all group-hover:bg-slate-100/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </motion.div>
                  ))}
                  {formData.features.length === 0 && (
                    <p className="text-[10px] text-slate-400 font-bold text-center py-4 italic">
                      Chưa có tính năng nào được thêm
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 pt-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-12 px-8 rounded-[22px] font-black text-xs uppercase tracking-widest text-slate-500"
              >
                Huỷ bỏ
              </Button>
              <Button
                onClick={() => onSave(formData)}
                disabled={isSaving}
                className="h-12 px-10 rounded-[22px] bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest border-none shadow-xl shadow-blue-200/50 hover:scale-105 transition-all"
              >
                {isSaving
                  ? "Đang lưu..."
                  : initialData
                    ? "Lưu thay đổi"
                    : "Khởi tạo Gói"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 3.5 Global Pricing View (New Dedicated Page)
const GlobalPricingView = ({ onRefresh }: { onRefresh: () => void }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/settings");
      if (res.status === 200) {
        setSettings(res.data);
      }
    } catch (error) {
      toast.error("Không thể tải cấu hình giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const res = await api.put("/api/admin/settings", settings);
      if (res.status === 200) {
        toast.success("Đã cập nhật biểu phí dịch vụ thành công! ✨");
        onRefresh();
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật biểu phí");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Đang tải biểu phí...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter">
            Quản trị Biểu phí & Dịch vụ
          </h3>
          <p className="text-sm font-bold text-slate-400 mt-1">
            Thiết lập chi phí vận hành cho toàn bộ hệ thống MapHome
          </p>
        </div>
        <Button
          onClick={handleUpdate}
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 hover:scale-105 transition-all text-white rounded-[22px] h-14 px-10 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-none shadow-xl shadow-blue-200/50"
        >
          {saving ? (
            <RefreshCw className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}
          {saving ? "Đang xử lý..." : "Lưu cấu hình"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
        {/* Verification Fees */}
        <PricingCard
          title="Xác thực Cơ bản"
          icon={<Zap className="size-6" />}
          color="blue"
          value={settings.pricing.basicVerification}
          description="Áp dụng xác minh qua SĐT/Zalo"
          onChange={(val) =>
            setSettings({
              ...settings,
              pricing: {
                ...settings.pricing,
                basicVerification: parseInt(val) || 0,
              },
            })
          }
        />

        <PricingCard
          title="Xác thực Thực địa"
          icon={<ShieldCheck className="size-6" />}
          color="amber"
          value={settings.pricing.premiumVerification}
          description="Nhân viên MapHome đến kiểm tra tận nơi"
          onChange={(val) =>
            setSettings({
              ...settings,
              pricing: {
                ...settings.pricing,
                premiumVerification: parseInt(val) || 0,
              },
            })
          }
        />

        {/* Posting Fees */}
        <PricingCard
          title="Phí Đăng Bài"
          icon={<Plus className="size-6" />}
          color="emerald"
          value={settings.pricing.postRoomFee || 0}
          description="Áp dụng cho mỗi tin đăng mới"
          onChange={(val) =>
            setSettings({
              ...settings,
              pricing: { ...settings.pricing, postRoomFee: parseInt(val) || 0 },
            })
          }
        />

        <PricingCard
          title="Phí Đẩy Bài (Push)"
          icon={<TrendingUp className="size-6" />}
          color="violet"
          value={settings.pricing.pushRoomFee || 0}
          description="Dịch vụ đẩy tin lên đầu trang"
          onChange={(val) =>
            setSettings({
              ...settings,
              pricing: { ...settings.pricing, pushRoomFee: parseInt(val) || 0 },
            })
          }
        />

        <PricingCard
          title="Tin Đăng Gấp"
          icon={<AlertTriangle className="size-6" />}
          color="rose"
          value={settings.pricing.urgentRoomFee || 0}
          description="Gắn nhãn 'Gấp' cho tin đăng"
          onChange={(val) =>
            setSettings({
              ...settings,
              pricing: {
                ...settings.pricing,
                urgentRoomFee: parseInt(val) || 0,
              },
            })
          }
        />

        {/* Commissions */}
        <PricingCard
          title="Hoa hồng Giao dịch"
          icon={<span className="font-black text-lg">%</span>}
          color="indigo"
          value={settings.pricing.commissionRate || 0}
          description="Tỷ lệ thu phí trên mỗi giao dịch"
          unit="%"
          onChange={(val) =>
            setSettings({
              ...settings,
              pricing: {
                ...settings.pricing,
                commissionRate: parseInt(val) || 0,
              },
            })
          }
        />
      </div>
    </motion.div>
  );
};

const PricingCard = ({
  title,
  icon,
  color,
  value,
  description,
  onChange,
  unit = "VNĐ",
}: any) => {
  const theme = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "group-hover:border-blue-300", glow: "group-hover:shadow-blue-500/30", grad: "from-blue-100/50 to-white", ring: "focus:border-blue-400 focus:ring-blue-500/20" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "group-hover:border-amber-300", glow: "group-hover:shadow-amber-500/30", grad: "from-amber-100/50 to-white", ring: "focus:border-amber-400 focus:ring-amber-500/20" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "group-hover:border-emerald-300", glow: "group-hover:shadow-emerald-500/30", grad: "from-emerald-100/50 to-white", ring: "focus:border-emerald-400 focus:ring-emerald-500/20" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", border: "group-hover:border-violet-300", glow: "group-hover:shadow-violet-500/30", grad: "from-violet-100/50 to-white", ring: "focus:border-violet-400 focus:ring-violet-500/20" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", border: "group-hover:border-rose-300", glow: "group-hover:shadow-rose-500/30", grad: "from-rose-100/50 to-white", ring: "focus:border-rose-400 focus:ring-rose-500/20" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "group-hover:border-indigo-300", glow: "group-hover:shadow-indigo-500/30", grad: "from-indigo-100/50 to-white", ring: "focus:border-indigo-400 focus:ring-indigo-500/20" },
  }[color as string] || { bg: "bg-slate-50", text: "text-slate-600", border: "group-hover:border-slate-300", glow: "group-hover:shadow-slate-500/30", grad: "from-slate-100/50 to-white", ring: "focus:border-slate-400 focus:ring-slate-500/20" };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`bg-gradient-to-br ${theme.grad} rounded-[40px] p-1 shadow-xl shadow-slate-200/40 ${theme.glow} transition-all duration-500 group`}
    >
      <div className={`bg-white/90 backdrop-blur-2xl rounded-[36px] border-2 border-white ${theme.border} p-8 h-full flex flex-col justify-between transition-colors duration-500 relative overflow-hidden`}>
        {/* Background Decorative Blob */}
        <div className={`absolute -right-12 -top-12 w-48 h-48 ${theme.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none`} />

        <div className="space-y-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className={`w-16 h-16 rounded-[24px] ${theme.bg} ${theme.text} flex items-center justify-center shadow-inner border border-white transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-500`}>
              {icon}
            </div>
            <div className={`px-3 py-1.5 rounded-xl ${theme.bg} ${theme.text} text-[9px] font-black uppercase tracking-widest border border-white shadow-sm flex items-center gap-1`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
              Dịch vụ
            </div>
          </div>

          <div>
            <h4 className="text-[22px] font-black text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
              {title}
            </h4>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              Mức phí thiết lập
            </label>
            <div className="relative group/input">
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-14 bg-slate-50/50 hover:bg-white border-2 border-slate-100 rounded-[20px] px-6 text-xl font-black ${theme.text} focus:ring-4 ${theme.ring} focus:bg-white outline-none transition-all shadow-inner`}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase pointer-events-none bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                {unit}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100/50 relative z-10">
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed flex items-start gap-2">
            <span className={`text-[14px] ${theme.text}`}>✦</span> {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// 4. Blog Admin View
const BlogAdminView = ({ blogs, onAdd, onEdit, onDelete }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            Kiểm duyệt Blog & Tin tức
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Quản lý nội dung bài viết và truyền thông trên MapHome
          </p>
        </div>
        <Button
          onClick={() => onAdd()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-indigo-100"
        >
          <Plus className="size-5" /> Viết bài mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {blogs.map((blog: any) => (
          <div
            key={blog._id}
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[35px] overflow-hidden shadow-sm flex group h-48"
          >
            <div className="w-1/3 relative overflow-hidden">
              <img
                src={
                  blog.image ||
                  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1073&auto=format&fit=crop"
                }
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                    {blog.category}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {blog.date}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-800 line-clamp-1 leading-relaxed mb-2 group-hover:text-indigo-600 transition-colors">
                  {blog.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 font-medium">
                  {blog.excerpt}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {blog.authorAvatar ? (
                    <img
                      src={blog.authorAvatar}
                      className="size-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-slate-200 border border-white shadow-sm flex items-center justify-center text-[8px] font-black uppercase">
                      {blog.author?.substring(0, 2) || "AD"}
                    </div>
                  )}
                  <span className="text-[9px] font-black text-slate-400 capitalize">
                    {blog.author || "Admin"}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(blog)}
                    className="size-8 rounded-xl hover:bg-slate-100"
                  >
                    <Edit className="size-4 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(blog._id)}
                    className="size-8 rounded-xl hover:bg-rose-50 hover:text-rose-500 text-slate-400"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {blogs.length === 0 && (
          <div className="col-span-2 py-20 bg-slate-50/50 rounded-[35px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
            <Newspaper className="size-12 mb-4 opacity-20" />
            <p className="font-bold">Chưa có bài viết nào được xuất bản</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
