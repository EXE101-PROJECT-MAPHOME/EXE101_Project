import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/contexts/AuthContext";
import api from "@/app/utils/api";
import { getAvatarUrl, getInitials } from "@/app/utils/avatarUtils";
import { formatDateVietnamese } from "@/app/utils/dateUtils";
import { RentalProperty, VerificationRequest } from "@/app/components/types";
import { Button } from "@/app/components/ui/button";
import { RequestVerificationDialog } from "@/app/components/RequestVerificationDialog";
import { SubscriptionManagement } from "@/app/components/SubscriptionManagement";
import { EditPropertyDialog } from "@/app/components/EditPropertyDialog";
import { PropertyExpiryBadge } from "@/app/components/PropertyExpiryBadge";
import { PropertyRenewalModal } from "@/app/components/PropertyRenewalModal";
import {
  Home,
  LogOut,
  FileText,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Maximize,
  CheckCircle,
  Clock,
  XCircle,
  CalendarDays,
  TrendingUp,
  Star,
  ShieldCheck,
  Award,
  CreditCard,
  LayoutDashboard,
  Settings,
  Camera,
  Upload,
  User,
  Users,
  MessageSquare,
  Sparkles,
  Bot,
  AlertTriangle,
  Zap,
  Bell,
  Loader2,
  Menu,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import CalendarView from "@/app/components/CalendarView";

// Active tab type
type DashboardTab =
  | "overview"
  | "posts"
  | "bookings"
  | "leads"
  | "subscription"
  | "verification"
  | "notifications"
  | "settings";

// Sidebar menu items
const menuItems: Array<{
  id: DashboardTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "posts", label: "Tin đăng của tôi", icon: FileText },
  { id: "bookings", label: "Lịch hẹn", icon: CalendarDays },
  { id: "leads", label: "Khách hàng (AI)", icon: Users },
  { id: "subscription", label: "Gói đăng ký", icon: CreditCard },
  { id: "verification", label: "Yêu cầu xác thực", icon: ShieldCheck },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

const formatTrendNumber = (num: number) => {
  if (num > 0) return `+${num}`;
  if (num < 0) return `${num}`;
  return "0";
};

export function LandlordDashboardV2() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, isAuthenticated, updateUser, refreshProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<RentalProperty | null>(
    null,
  );

  // States for API data
  const [landlordPosts, setLandlordPosts] = useState<RentalProperty[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<
    VerificationRequest[]
  >([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [landlordDistricts, setLandlordDistricts] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    approvedPosts: 0,
    pendingPosts: 0,
    totalViews: 0,
    totalFavorites: 0,
    trends: {
      totalPostsTrend: 0,
      approvedPostsTrend: 0,
      pendingPostsTrend: 0,
    },
  });
  const [verificationPricing, setVerificationPricing] = useState({
    basicVerification: 0,
    premiumVerification: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    onConfirm?: () => Promise<void> | void;
  }>({ open: false });
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedPropertyForRenewal, setSelectedPropertyForRenewal] =
    useState<RentalProperty | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [verifyingPropertyId, setVerifyingPropertyId] = useState<string | null>(
    null,
  );

  // Helper compute for expiration warnings
  const { expiredCount, soonToExpireCount } = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    let expired = 0;
    let soon = 0;

    landlordPosts.forEach((post) => {
      if (post.status === "expired") {
        expired++;
      } else if (post.expiryDate) {
        const expiry = new Date(post.expiryDate);
        if (expiry < now) {
          expired++;
        } else if (expiry < threeDaysFromNow) {
          soon++;
        }
      }
    });

    return { expiredCount: expired, soonToExpireCount: soon };
  }, [landlordPosts]);

  const ExpiryWarningBanner = () => {
    if (expiredCount === 0 && soonToExpireCount === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 rounded-[32px] bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-100 p-6 shadow-sm overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200 animate-pulse">
              <AlertTriangle className="size-7" />
            </div>
            <div>
              <h4 className="text-xl font-black text-amber-900 leading-tight">
                {expiredCount > 0
                  ? `Bạn có ${expiredCount} tin đăng đã hết hạn!`
                  : `Bạn có ${soonToExpireCount} tin đăng sắp hết hạn!`}
              </h4>
              <p className="text-amber-700 font-bold text-sm mt-1">
                Gia hạn ngay để tiếp tục tiếp cận khách hàng và không bị gỡ khỏi
                bản đồ.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setActiveTab("posts")}
            className="whitespace-nowrap px-8 py-6 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-xl shadow-amber-200/50 transition-all hover:scale-105 active:scale-95 border-none"
          >
            <Zap className="size-4 mr-2" />
            Gia hạn ngay
          </Button>
        </div>
      </motion.div>
    );
  };

  // Get active tab from URL params, default to 'overview'
  const activeTab = (searchParams.get("tab") as DashboardTab) || "overview";

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "landlord") {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        if (activeTab === "overview") {
          const [analyticsRes, propertiesRes] = await Promise.all([
            api.get("/api/landlord/analytics"),
            api.get("/api/landlord/properties"),
          ]);
          const data = analyticsRes.data;
          setStats({
            totalPosts: data.totalProperties || 0,
            approvedPosts: data.approvedProperties || 0,
            pendingPosts: data.pendingProperties || 0,
            totalViews: data.totalViews || 0,
            totalFavorites: data.totalFavorites || 0,
            trends: data.trends || {
              totalPostsTrend: 0,
              approvedPostsTrend: 0,
              pendingPostsTrend: 0,
            },
          });
          setLandlordPosts(propertiesRes.data);
        } else if (activeTab === "posts") {
          const response = await api.get("/api/landlord/properties");
          setLandlordPosts(response.data);
        } else if (activeTab === "bookings") {
          const response = await api.get("/api/landlord/bookings");
          setBookings(response.data);
        } else if (activeTab === "verification") {
          const [reqsRes, pricingRes] = await Promise.all([
            api.get("/api/landlord/verification-requests"),
            api.get("/api/verifications/pricing"),
          ]);
          setVerificationRequests(reqsRes.data);
          setVerificationPricing(pricingRes.data);
        } else if (activeTab === "leads") {
          const response = await api.get("/api/landlord/leads");
          setLeads(response.data.leads || []);
          setLandlordDistricts(response.data.districts || []);
        } else if (activeTab === "notifications") {
          const response = await api.get("/api/notifications");
          setNotifications(response.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch landlord data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, navigate, activeTab]);

  // Real-time notifications via Socket.IO
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "landlord") return;

    const token = localStorage.getItem("token");
    const socketUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.debug("[Socket] Connected", socket.id);
    });

    socket.on("notification", (notif: any) => {
      try {
        setNotifications((prev) => [notif, ...(prev || [])]);
        // show a subtle toast for new landlord notifications
        toast.success(`${notif.title} — ${notif.message}`);
      } catch (err) {
        console.error("Failed to handle incoming notification", err);
      }
    });

    socket.on("disconnect", () => {
      console.debug("[Socket] Disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  const handleToggleAvailability = async (property: RentalProperty) => {
    const newStatus = !property.available;
    const loadingToast = toast.loading("Đang cập nhật trạng thái...");
    try {
      const res = await api.put(
        `/api/properties/${property._id || property.id}`,
        {
          available: newStatus,
        },
      );
      if (res.status === 200) {
        toast.success(
          newStatus
            ? "Đã chuyển sang trạng thái: Còn trống! ✅"
            : "Đã chuyển sang trạng thái: Đã cho thuê! 🏠",
          { id: loadingToast },
        );
        setLandlordPosts((prev) =>
          prev.map((p) =>
            (p._id || p.id) === (property._id || property.id)
              ? { ...p, available: newStatus }
              : p,
          ),
        );

        // Update stats if we are on overview
        if (activeTab === "overview") {
          setStats((prev) => ({
            ...prev,
            approvedPosts: newStatus
              ? prev.approvedPosts + 1
              : prev.approvedPosts - 1,
          }));
        }
      }
    } catch (err) {
      toast.error("Cập nhật thất bại! ❌", { id: loadingToast });
    }
  };

  const handleRenewProperty = async (property: RentalProperty) => {
    if (!property._id && !property.id) return;

    setSelectedPropertyForRenewal(property);
    setRenewalModalOpen(true);
  };

  const handleConfirmRenewal = async () => {
    if (!selectedPropertyForRenewal || isRenewing) return;

    setIsRenewing(true);
    const loadingToast = toast.loading("Đang gia hạn tin đăng...");

    try {
      const res = await api.put(
        `/api/properties/${selectedPropertyForRenewal._id || selectedPropertyForRenewal.id}/renew`,
      );

      if (res.status === 200) {
        toast.success(
          "Gia hạn tin đăng thành công! ✅ Tin của bạn sẽ hiển thị thêm 30 ngày.",
          { id: loadingToast },
        );

        // Update the property in the list with the response from server
        const updatedProperty = res.data;
        setLandlordPosts((prev) =>
          prev.map((p) =>
            (p._id || p.id) === (updatedProperty._id || updatedProperty.id)
              ? updatedProperty
              : p,
          ),
        );

        // Close modal
        setRenewalModalOpen(false);
        setSelectedPropertyForRenewal(null);
      }
    } catch (err) {
      console.error("Renewal failed:", err);
      toast.error("Gia hạn thất bại! ❌ Vui lòng thử lại.", {
        id: loadingToast,
      });
    } finally {
      setIsRenewing(false);
    }
  };

  const handleVerifyLocation = async (property: RentalProperty) => {
    const propertyId = property._id || property.id;
    setVerifyingPropertyId(propertyId);

    const loadingToast = toast.loading("📍 Đang lấy vị trí GPS của bạn...");

    if (!("geolocation" in navigator)) {
      toast.error(
        "Trình duyệt không hỗ trợ GPS. Vui lòng sử dụng trình duyệt khác.",
        { id: loadingToast },
      );
      setVerifyingPropertyId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const res = await api.post(
            `/api/properties/${propertyId}/verify-location`,
            {
              lat: latitude,
              lng: longitude,
              accuracy: Math.round(accuracy),
            },
          );

          if (res.status === 200) {
            const { verification } = res.data;

            // Update property in state with new verification level
            setLandlordPosts((prev) =>
              prev.map((p) =>
                (p._id || p.id) === propertyId
                  ? {
                      ...p,
                      verificationLevel: verification.verificationLevel,
                      greenBadge: verification.greenBadge,
                    }
                  : p,
              ),
            );

            // Show appropriate toast
            if (verification.isVerified) {
              toast.success(
                `✓ Xác thực GPS thành công! Khoảng cách: ${verification.distance.m}m`,
                { id: loadingToast },
              );
            } else {
              toast.warning(
                `⚠️ Vị trí lệch ${verification.distance.m}m. Vui lòng kiểm tra lại.`,
                { id: loadingToast },
              );
            }
          }
        } catch (err: any) {
          console.error("GPS verification error:", err);
          toast.error(err.response?.data?.message || "Xác thực GPS thất bại!", {
            id: loadingToast,
          });
        } finally {
          setVerifyingPropertyId(null);
        }
      },
      () => {
        toast.error(
          "Không thể lấy vị trí GPS. Vui lòng kiểm tra quyền truy cập vị trí.",
          { id: loadingToast },
        );
        setVerifyingPropertyId(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: string,
  ) => {
    const loadingToast = toast.loading("Đang cập nhật trạng thái...");
    try {
      const res = await api.put(`/api/bookings/${bookingId}/status`, {
        status,
      });
      if (res.status === 200) {
        const statusText =
          status === "confirmed"
            ? "đã xác nhận"
            : status === "completed"
              ? "đã hoàn thành"
              : "đã huỷ";

        toast.success(`Lịch hẹn ${statusText}! ✨`, { id: loadingToast });

        // Cập nhật state local để UI phản hồi ngay lập tức
        setBookings((prev) =>
          prev.map((b) =>
            (b._id || b.id) === bookingId ? { ...b, status } : b,
          ),
        );
      }
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái. ❌", { id: loadingToast });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    const loadingToast = toast.loading("Đang xoá tin đăng...");
    try {
      const res = await api.delete(`/api/properties/${propertyId}`);
      if (res.status === 200) {
        toast.success("Đã xoá tin đăng thành công! 🗑️", { id: loadingToast });
        setLandlordPosts((prev) =>
          prev.filter((p) => (p._id || p.id) !== propertyId),
        );
        if (activeTab === "overview") {
          setStats((prev) => ({
            ...prev,
            totalPosts: Math.max(0, prev.totalPosts - 1),
            approvedPosts: Math.max(0, prev.approvedPosts - 1),
          }));
        }
      }
    } catch (err) {
      toast.error("Xoá thất bại! ❌", { id: loadingToast });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const setActiveTab = (tab: DashboardTab) => {
    setSearchParams({ tab });
  };

  const getStatusBadge = (
    status: "approved" | "pending" | "rejected" | "reported" | "expired",
  ) => {
    const badges = {
      approved: {
        label: "Đã duyệt",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      pending: {
        label: "Chờ duyệt",
        color: "bg-orange-100 text-orange-800",
        icon: Clock,
      },
      expired: {
        label: "Hết hạn",
        color: "bg-red-100 text-red-800",
        icon: AlertTriangle,
      },
      rejected: {
        label: "Từ chối",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
      reported: {
        label: "Bị báo cáo",
        color: "bg-rose-100 text-rose-800",
        icon: AlertTriangle,
      },
    };
    const badge = badges[status as keyof typeof badges] || badges["pending"];
    const Icon = badge.icon;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-black ${badge.color} flex items-center gap-1 w-fit shadow-sm`}
      >
        <Icon className="size-3" />
        {badge.label.toUpperCase()}
      </span>
    );
  };

  const getPostActionConfig = (post: RentalProperty) => {
    const status = post.status || "approved";

    if (status === "expired") {
      return {
        label: "Gia hạn",
        icon: Zap,
        className:
          "bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700",
        onClick: handleRenewProperty,
      };
    }

    if (status === "pending") {
      return {
        label: "Chờ duyệt",
        icon: Clock,
        className: "bg-orange-50 text-orange-600 cursor-not-allowed",
        disabled: true,
      };
    }

    if (status === "rejected") {
      return {
        label: "Bị từ chối",
        icon: XCircle,
        className: "bg-rose-50 text-rose-600 cursor-not-allowed",
        disabled: true,
      };
    }

    if (status === "reported") {
      return {
        label: "Bị báo cáo",
        icon: AlertTriangle,
        className: "bg-rose-50 text-rose-600 cursor-not-allowed",
        disabled: true,
      };
    }

    return {
      label: post.available ? "Ngừng thuê" : "Mở thuê",
      icon: post.available ? XCircle : CheckCircle,
      className: post.available
        ? "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700",
      onClick: handleToggleAvailability,
    };
  };

  const getVerificationBadge = (level: number) => {
    const badges = [
      { label: "Chưa xác thực", color: "bg-gray-100 text-gray-800" },
      { label: "Cấp 1", color: "bg-yellow-100 text-yellow-800" },
      { label: "Cấp 2", color: "bg-blue-100 text-blue-800" },
      { label: "Cấp 3", color: "bg-green-100 text-green-800" },
    ];
    const badge = badges[level] || badges[0];
    // subscriptionTier từ API /user/me luôn là planName thực từ DB (Basic, Standard, Pro, v.v.)
    const tier = user?.subscriptionTier || "Free";
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.label} - {tier}
      </span>
    );
  };

  if (!isAuthenticated || user?.role !== "landlord") {
    return null;
  }

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "leads":
        return (
          <motion.div
            key="leads"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-12"
          >
            {/* Hero Header Section */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-maphome-500/10 via-indigo-500/5 to-maphome-400/10 rounded-[2.5rem] blur-xl" />
              <div className="relative bg-gradient-to-br from-white via-white to-maphome-50/40 rounded-[2rem] border border-maphome-200/40 p-10 md:p-14 shadow-lg shadow-maphome-500/5 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-maphome-100/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-indigo-100/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tight leading-tight mb-2">
                        Khách hàng tiềm năng
                      </h2>
                      <p className="text-lg text-indigo-500/80 font-black leading-relaxed">
                        từ{" "}
                        <span className="bg-gradient-to-r from-maphome-600 to-indigo-600 bg-clip-text text-transparent font-black">
                          AI Advisor
                        </span>
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="flex-shrink-0"
                    >
                      <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl shadow-lg shadow-amber-400/50">
                        <Sparkles size={32} className="text-white" />
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap mt-8">
                    <div className="flex items-center gap-3 px-5 py-3 bg-white/60 border border-maphome-200/60 rounded-2xl shadow-sm">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                        {leads.length > 0 ? `${leads.length} khách` : "Chưa có"}
                      </span>
                    </div>
                    <p className="text-slate-600 font-bold text-base">
                      {leads.length > 0
                        ? `Những người đang tìm phòng ở khu vực của bạn`
                        : `Sẵn sàng để bạn kết nối`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Districts Badge Cloud */}
            {landlordDistricts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="px-2"
              >
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">
                  📍 Khu vực hoạt động
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {landlordDistricts.map((dist, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.08 }}
                      className="px-5 py-2.5 bg-gradient-to-r from-white to-maphome-50/60 text-slate-700 rounded-2xl text-sm font-black border border-maphome-200/50 flex items-center gap-2 shadow-sm hover:shadow-md hover:border-maphome-300 transition-all cursor-default group"
                    >
                      <MapPin
                        size={16}
                        className="text-maphome-500 group-hover:animate-float"
                      />
                      {dist}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {leads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {leads.map((lead, idx) => (
                  <motion.div
                    key={lead._id}
                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.06,
                      duration: 0.44,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.99 }}
                    className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-maphome-200 smooth-transition will-change-transform transform-gpu relative overflow-hidden"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-maphome-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 will-change-transform" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-maphome-500 to-maphome-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform transform-gpu will-change-transform">
                          <User size={28} />
                        </div>
                        <div>
                          <h4 className="font-black text-xl text-slate-800 group-hover:text-maphome-700 transition-colors">
                            {lead.name || "Khách ẩn danh"}
                          </h4>
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            {formatDateVietnamese(lead.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8 bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50 group-hover:bg-white transition-colors smooth-transition">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                            Khu vực tìm kiếm
                          </span>
                          <span className="text-sm font-black text-maphome-700 flex items-center gap-1">
                            <MapPin size={14} />
                            {lead.requirements.district}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                            Ngân sách tối đa
                          </span>
                          <span className="text-sm font-black text-emerald-600 flex items-center gap-1">
                            <DollarSign size={14} />
                            {Number(lead.requirements.maxPrice).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            VNĐ
                          </span>
                        </div>
                        {lead.requirements.amenities &&
                          lead.requirements.amenities.length > 0 && (
                            <div className="pt-2">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-2">
                                Tiện nghi mong muốn
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {lead.requirements.amenities
                                  .slice(0, 3)
                                  .map((ame: string, i: number) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-black bg-white border border-slate-100 px-2.5 py-1 rounded-xl text-slate-600 shadow-sm"
                                    >
                                      {ame}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>

                      <Button
                        className="w-full py-7 rounded-2xl bg-maphome-600 hover:bg-maphome-700 text-white font-black shadow-xl shadow-maphome-100 group-hover:shadow-maphome-200 transition-all flex items-center justify-center gap-2 border-none transform-gpu will-change-transform smooth-transition hover:-translate-y-1 active:scale-95"
                        onClick={() => {
                          toast.info(
                            "Tính năng 'Mở khóa số điện thoại' sẽ sớm khả dụng! 🔒",
                          );
                        }}
                      >
                        <MessageSquare size={18} />
                        Liên hệ khách hàng
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative max-w-3xl mx-auto mt-16"
              >
                {/* Backdrop blur effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-maphome-100/30 via-indigo-100/20 to-maphome-100/30 rounded-[3rem] blur-3xl" />

                <div className="relative bg-white/90 backdrop-blur-lg border border-white rounded-[3rem] shadow-2xl shadow-maphome-500/10 p-12 md:p-20 text-center overflow-hidden">
                  {/* Decorative background elements */}
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-maphome-100/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-16 right-0 w-64 h-64 bg-indigo-100/15 rounded-full blur-3xl" />

                  <div className="relative z-10">
                    {/* Icon with animated ring */}
                    <motion.div
                      className="relative w-40 h-40 mx-auto mb-12"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                    >
                      {/* Animated ping ring */}
                      <div className="absolute inset-0 bg-maphome-500 rounded-full opacity-20 animate-ping" />

                      {/* Main icon container */}
                      <div className="absolute inset-0 bg-gradient-to-br from-maphome-50 to-indigo-50 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-maphome-500/20 border border-maphome-200/50 border-t-maphome-300">
                        <Bot
                          size={80}
                          className="text-maphome-600 animate-float"
                        />
                      </div>

                      {/* Floating sparkles */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute -top-4 -right-4 p-3.5 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-2xl shadow-lg shadow-amber-400/60 origin-center"
                      >
                        <Sparkles size={24} />
                      </motion.div>
                    </motion.div>

                    {/* Text content */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight leading-tight">
                        Đang tìm kiếm khách thuê
                      </h3>
                      <p className="text-lg text-slate-600 font-medium mb-12 leading-relaxed max-w-xl mx-auto">
                        AI Advisor đang phân tích nhu cầu của các khách hàng
                        tiềm năng ở khu vực hoạt động. Khi có người phù hợp,
                        thông tin sẽ xuất hiện tại đây ngay lập tức.
                      </p>

                      {/* Status indicators */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="px-7 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl flex items-center gap-3 border border-emerald-200/50 shadow-md"
                        >
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-sm font-black text-emerald-700 uppercase tracking-widest">
                            AI Đang hoạt động
                          </span>
                        </motion.div>
                      </div>

                      {/* Info message */}
                      <div className="mt-10 p-5 bg-maphome-50/40 rounded-2xl border border-maphome-200/40 border-dashed">
                        <p className="text-sm font-bold text-slate-600">
                          💡 <span className="text-maphome-700">Mẹo:</span> Đảm
                          bảo thông tin phòng trọ của bạn chi tiết và hấp dẫn để
                          tăng cơ hội kết nối với khách hàng.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case "subscription":
        return (
          <motion.div
            key="subscription"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SubscriptionManagement />
          </motion.div>
        );

      case "verification":
        return (
          <motion.div
            key="verification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            <div>
              <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">
                Xác thực tin đăng
              </h2>
              <p className="text-indigo-400/90 text-lg font-black mt-1 drop-shadow-sm">
                Nâng tầm uy tín cho phòng trọ của bạn với "Tích xanh MapHome"
              </p>
            </div>

            {/* Premium Verification Banner */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 shadow-2xl shadow-green-100">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />

              <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex gap-8 items-center max-w-xl">
                  <div className="flex-shrink-0 w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center shadow-xl border border-white/20">
                    <ShieldCheck className="size-14 text-white" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-3xl font-black mb-3 tracking-tight">
                      Gói xác thực thực tế
                    </h3>
                    <p className="text-green-50 text-lg font-medium opacity-90 leading-relaxed">
                      Chuyên viên sẽ đến kiểm tra thực trạng phòng trọ • Chỉ với{" "}
                      <span className="underline font-black">
                        {verificationPricing.basicVerification.toLocaleString()}
                        đ
                      </span>{" "}
                      • Tăng 5x tỉ lệ khách thuê.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowVerificationDialog(true)}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 px-10 py-8 rounded-2xl text-lg font-black shadow-2xl hover:translate-y-[-4px] transition-all active:scale-95 group border-none"
                >
                  <ShieldCheck className="size-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Đặt lịch kiểm tra ngay
                </Button>
              </div>
            </div>

            {/* Verification Requests List */}
            {verificationRequests.length > 0 ? (
              <div className="space-y-6">
                <h4 className="font-black text-2xl bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent flex items-center gap-3 ml-2">
                  <div className="p-2 bg-orange-100/50 rounded-xl">
                    <Clock className="size-6 text-orange-600" />
                  </div>
                  Lịch sử yêu cầu
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {verificationRequests.map((req) => (
                    <div
                      key={req._id || req.id}
                      className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-white/50 rounded-2xl">
                          <FileText className="size-6 text-gray-700" />
                        </div>
                        <span
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                            req.status === "completed"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : req.status === "approved"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : req.status === "rejected"
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : "bg-orange-100 text-orange-700 border border-orange-200 animate-pulse"
                          }`}
                        >
                          {req.status === "completed"
                            ? "✓ Hoàn thành"
                            : req.status === "approved"
                              ? "✓ Đã duyệt"
                              : req.status === "rejected"
                                ? "✗ Từ chối"
                                : "⏳ Đang xử lý"}
                        </span>
                      </div>
                      <h4 className="font-black text-2xl text-gray-900 mb-2 truncate">
                        {req.propertyName}
                      </h4>
                      <div className="space-y-3 mb-6">
                        <p className="text-gray-500 font-bold flex items-center gap-2 text-sm">
                          <MapPin className="size-4 text-emerald-500" />
                          <span className="truncate">{req.address}</span>
                        </p>
                        <p className="text-gray-900 font-black flex items-center gap-2">
                          <CalendarDays className="size-4 text-blue-600" />
                          {formatDateVietnamese(req.scheduledDate)} •{" "}
                          {req.scheduledTime}
                        </p>
                      </div>

                      {req.notes && (
                        <div className="p-4 bg-white/30 rounded-2xl border border-white/20">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter mb-1">
                            Ghi chú từ MapHome
                          </p>
                          <p className="text-sm text-gray-700 font-medium italic">
                            "{req.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-20 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3">
                  <ShieldCheck className="size-12 text-gray-400" />
                </div>
                <h3 className="text-4xl font-black bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-700 bg-clip-text text-transparent mb-3 tracking-tight">
                  Chưa có yêu cầu nào
                </h3>
                <p className="text-emerald-500 text-lg font-black mb-10 max-w-sm mx-auto drop-shadow-sm">
                  Hãy đăng ký kiểm tra thực tế để nâng cấp phòng trọ của bạn lên
                  tiêu chuẩn 5 sao.
                </p>
                <Button
                  onClick={() => setShowVerificationDialog(true)}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 px-10 py-7 rounded-2xl shadow-2xl shadow-green-100 transition-all hover:scale-105 active:scale-95 text-lg font-black"
                >
                  <ShieldCheck className="size-5 mr-3" />
                  Bắt đầu ngay
                </Button>
              </div>
            )}
          </motion.div>
        );

      case "bookings":
        return (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent tracking-tight">
                  Lịch hẹn thông minh
                </h2>
                <p className="text-indigo-400/90 text-lg font-black mt-1 drop-shadow-sm">
                  Giao diện lịch biểu giúp bạn quản lý thời gian xem phòng tối
                  ưu
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="size-3 rounded-full bg-amber-500 shadow-sm" />
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    Chờ duyệt
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="size-3 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    Đã xác nhận
                  </span>
                </div>
              </div>
            </div>

            {bookings.length > 0 ? (
              <CalendarView
                bookings={bookings}
                onUpdateStatus={handleUpdateBookingStatus}
              />
            ) : (
              <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-20 text-center mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner -rotate-3">
                  <CalendarDays className="size-12 text-gray-400" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                  Chưa có lịch hẹn nào
                </h3>
                <p className="text-gray-500 text-lg font-medium mb-10 max-w-sm mx-auto">
                  Bạn sẽ nhận được thông báo khi có khách hàng muốn xem phòng
                  của bạn.
                </p>
              </div>
            )}
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent tracking-tight">
                  Thông báo
                </h2>
                <p className="text-slate-400 font-black mt-1">
                  Tất cả thông báo về tài khoản và tin đăng của bạn
                </p>
              </div>
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={async () => {
                    try {
                      await api.put("/api/notifications/read-all");
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, isRead: true })),
                      );
                      toast.success("Đã đánh dấu tất cả là đã đọc ✅");
                    } catch {
                      toast.error("Không thể đánh dấu tất cả.");
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-black hover:bg-amber-100 transition-all"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-20 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Bell className="size-12 text-amber-400" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                  Không có thông báo mới
                </h3>
                <p className="text-gray-400 font-medium text-base max-w-xs mx-auto">
                  Khi có cập nhật từ hệ thống, thông báo sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((n: any) => (
                  <div
                    key={n._id}
                    onClick={async () => {
                      if (!n.isRead) {
                        try {
                          await api.put(`/api/notifications/${n._id}/read`);
                          setNotifications((prev) =>
                            prev.map((x) =>
                              x._id === n._id ? { ...x, isRead: true } : x,
                            ),
                          );
                        } catch {
                          // silent
                        }
                      }
                    }}
                    className={`flex items-start gap-5 p-6 rounded-3xl border transition-all cursor-pointer group ${
                      n.isRead
                        ? "bg-white border-gray-100 opacity-70 hover:opacity-100"
                        : "bg-amber-50 border-amber-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        n.type === "success"
                          ? "bg-green-100"
                          : n.type === "warning"
                            ? "bg-amber-100"
                            : "bg-indigo-100"
                      }`}
                    >
                      {n.type === "success"
                        ? "✅"
                        : n.type === "warning"
                          ? "⚠️"
                          : "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p
                          className={`font-black text-base truncate ${n.isRead ? "text-slate-600" : "text-slate-900"}`}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="flex-shrink-0 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-sm" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-slate-400 font-bold">
                        {new Date(n.createdAt || Date.now()).toLocaleString(
                          "vi-VN",
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );

      case "settings":
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-4xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tight mb-2">
                Cài đặt tài khoản
              </h2>
              <p className="text-indigo-400 font-black drop-shadow-sm text-lg">
                Quản lý bảo mật và thông ẩn danh tính cá nhân
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
                <h3 className="font-black text-2xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-8 flex items-center gap-3">
                  <div className="p-2 bg-blue-100/50 rounded-xl shadow-inner">
                    <Settings className="size-6 text-blue-600" />
                  </div>
                  Thông tin cá nhân
                </h3>

                <div className="flex flex-col md:flex-row items-start gap-10">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-green-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-black transform transition-transform group-hover:scale-105">
                        {user?.avatar ? (
                          <img
                            src={getAvatarUrl(user.avatar) || ""}
                            alt="Avatar"
                            className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                          />
                        ) : (
                          getInitials(user?.fullName, user?.username)
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Camera className="size-10 text-white" />
                        </div>
                      </div>
                      <label className="absolute -bottom-4 -right-4 p-4 bg-green-600 text-white rounded-2xl shadow-2xl cursor-pointer hover:bg-green-700 transition-all transform hover:scale-110 active:scale-95 group">
                        <Camera className="size-6 group-hover:rotate-12 transition-transform" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const formData = new FormData();
                            formData.append("image", file);

                            const loadingToast = toast.loading(
                              "Đang tải ảnh lên...",
                            );
                            try {
                              const uploadRes = await api.post(
                                "/api/upload/single",
                                formData,
                                {
                                  headers: {
                                    "Content-Type": "multipart/form-data",
                                  },
                                },
                              );

                              if (
                                uploadRes.status === 200 ||
                                uploadRes.status === 201
                              ) {
                                const { url } = uploadRes.data;
                                const updateRes = await api.put(
                                  `/api/user/${(user as any)?._id || user?.id}`,
                                  { avatar: url },
                                );

                                if (updateRes.status === 200) {
                                  updateUser(updateRes.data);
                                  toast.success(
                                    "Thay đổi ảnh đại diện thành công! ✨",
                                    { id: loadingToast },
                                  );
                                  setTimeout(
                                    () => window.location.reload(),
                                    800,
                                  );
                                }
                              }
                            } catch (err) {
                              console.error(err);
                              toast.error("Lỗi không thể tải ảnh. ❌", {
                                id: loadingToast,
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">
                        Thay đổi chân dung
                      </p>
                      <p className="text-[9px] text-gray-400 mt-1 max-w-[120px] leading-relaxed">
                        JPG hoặc PNG. Tối đa 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Form Section */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const target = e.target as any;
                      const fullName = target.fullName.value;
                      const phone = target.phone.value;

                      const updateToast = toast.loading("Đang cập nhật...");
                      try {
                        const res = await api.put(
                          `/api/user/${(user as any)?._id || user?.id}`,
                          {
                            fullName,
                            phone,
                          },
                        );
                        if (res.status === 200) {
                          updateUser(res.data);
                          toast.success("Hồ sơ đã được lưu! ✨", {
                            id: updateToast,
                          });
                          setTimeout(() => window.location.reload(), 800);
                        }
                      } catch (err: any) {
                        toast.error(
                          err.response?.data?.message || "Không thể lưu hồ sơ.",
                          { id: updateToast },
                        );
                      }
                    }}
                    className="flex-1 space-y-6 w-full"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                          Họ và tên
                        </label>
                        <input
                          name="fullName"
                          defaultValue={user?.fullName || user?.username}
                          className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-[24px] outline-none transition-all shadow-inner font-bold text-slate-800 placeholder:text-slate-300"
                          placeholder="Nguyễn Văn A"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                          Số điện thoại
                        </label>
                        <input
                          name="phone"
                          defaultValue={user?.phone || ""}
                          className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-[24px] outline-none transition-all shadow-inner font-bold text-slate-800 placeholder:text-slate-300"
                          placeholder="09xx xxx xxx"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        Email
                        <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                          Cố định
                        </span>
                      </label>
                      <input
                        disabled
                        value={user?.email || ""}
                        className="w-full px-6 py-5 bg-slate-100 border-2 border-transparent text-slate-400 rounded-[24px] cursor-not-allowed font-bold"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full md:w-auto px-12 py-8 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 hover:opacity-90 text-white font-black rounded-[24px] transition-all shadow-[0_15px_40px_rgba(59,130,246,0.3)] hover:scale-[1.03] active:scale-95 border-none"
                    >
                      Lưu thay đổi hồ sơ
                    </Button>
                  </form>
                </div>
              </div>

              {/* Security Card */}
              <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
                <h3 className="font-black text-2xl bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent mb-8 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/50 rounded-xl shadow-inner">
                    <ShieldCheck className="size-6 text-emerald-600" />
                  </div>
                  Bảo mật
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const target = e.target as any;
                    const currentPassword = target.currentPassword.value;
                    const newPassword = target.newPassword.value;

                    const changeToast = toast.loading(
                      "Đang xác thực bảo mật...",
                    );
                    try {
                      const res = await api.put("/api/auth/change-password", {
                        currentPassword,
                        newPassword,
                      });
                      if (res.status === 200) {
                        toast.success("Đổi mật khẩu thành công! 🔐", {
                          id: changeToast,
                        });
                        setTimeout(() => {
                          logout();
                          navigate("/login");
                        }, 1500);
                      }
                    } catch (err: any) {
                      toast.error(
                        err.response?.data?.message ||
                          "Xác thực không chính xác.",
                        { id: changeToast },
                      );
                    }
                  }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="••••••••"
                      className="w-full px-5 py-4 bg-white/60 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all shadow-inner font-medium text-gray-900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="••••••••"
                      className="w-full px-5 py-4 bg-white/60 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all shadow-inner font-medium text-gray-900"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full py-7 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="size-5" />
                      Cập nhật bảo mật
                    </Button>
                  </div>
                </form>
                <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    🔍 <strong className="uppercase">Lưu ý:</strong> Sau khi đổi
                    mật khẩu, bạn sẽ cần đăng nhập lại trên tất cả các thiết bị
                    để đảm bảo an toàn.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "overview":
      default:
        return (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            {/* Expiry Warning Banner */}
            <ExpiryWarningBanner />

            {/* Page Header */}
            {activeTab === "overview" && (
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-2 sm:mb-3"
                  >
                    Chào buổi sáng, <br />
                    <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                      {user?.fullName || user?.username}!
                    </span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-indigo-600/60 text-sm sm:text-xl font-bold"
                  >
                    Dưới đây là thống kê hiệu suất bài đăng của bạn hôm nay.
                  </motion.p>
                </div>
                <div className="flex bg-white/50 backdrop-blur-md rounded-2xl p-1 border border-slate-200 shadow-sm overflow-hidden self-start">
                  <div className="px-4 py-2 bg-white rounded-xl shadow-lg shadow-slate-200/50 font-black text-indigo-600 text-sm">
                    Hôm nay
                  </div>
                  <div className="px-4 py-2 font-bold text-indigo-400 text-sm hover:text-indigo-600 cursor-pointer transition-colors">
                    7 ngày qua
                  </div>
                </div>
              </div>
            )}

            {activeTab === "overview" && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
              >
                {[
                  {
                    label: "Tin đăng",
                    value: stats.totalPosts,
                    icon: FileText,
                    bg: "bg-blue-50",
                    iconBg: "from-blue-500 to-indigo-600",
                    text: "text-blue-600",
                  },
                  {
                    label: "Đã duyệt",
                    value: stats.approvedPosts,
                    icon: CheckCircle,
                    bg: "bg-emerald-50",
                    iconBg: "from-emerald-500 to-teal-600",
                    text: "text-emerald-600",
                  },
                  {
                    label: "Chờ duyệt",
                    value: stats.pendingPosts,
                    icon: Clock,
                    bg: "bg-orange-50",
                    iconBg: "from-orange-500 to-amber-600",
                    text: "text-orange-600",
                  },
                  {
                    label: "Lượt xem",
                    value: stats.totalViews.toLocaleString(),
                    icon: Eye,
                    bg: "bg-purple-50",
                    iconBg: "from-purple-500 to-indigo-700",
                    text: "text-purple-600",
                  },
                  {
                    label: "Yêu thích",
                    value: stats.totalFavorites,
                    icon: Star,
                    bg: "bg-amber-50",
                    iconBg: "from-amber-400 to-rose-500",
                    text: "text-amber-600",
                  },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.96 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { type: "spring", bounce: 0.35 },
                      },
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden rounded-2xl p-3 shadow-sm border border-white/80 ${stat.bg} min-h-[100px]`}
                    style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                  >
                    {/* Top: Icon only */}
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                        }}
                        className={`bg-gradient-to-br ${stat.iconBg} flex-shrink-0`}
                      >
                        <stat.icon className="size-4 text-white" />
                      </div>
                    </div>

                    {/* Bottom: Label + Value */}
                    <div style={{ marginTop: 12 }}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5 truncate">
                        {stat.label}
                      </p>
                      <p className={`text-xl font-black tracking-tight leading-none ${stat.text}`}>
                        {stat.value}
                      </p>
                    </div>

                    {/* Decorative bg circle */}
                    <div
                      style={{
                        position: "absolute", bottom: -20, right: -20,
                        width: 70, height: 70, borderRadius: "50%",
                        background: "rgba(255,255,255,0.35)",
                        filter: "blur(10px)",
                        pointerEvents: "none",
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Action Bar & Post List Section */}
            <div className="space-y-6 mt-14">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h3 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter leading-tight">
                    {activeTab === "posts"
                      ? "Kho tin đăng của bạn"
                      : "Tin đăng gần nhất"}
                  </h3>
                  <p className="text-lg text-indigo-500/80 font-black mt-1">
                    Quản lý và cập nhật trạng thái các phòng trọ
                  </p>
                </motion.div>
                <Button
                  onClick={() => navigate("/post-room")}
                  className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 hover:opacity-90 px-8 py-7 rounded-[22px] shadow-2xl shadow-blue-100 transition-all hover:scale-[1.05] active:scale-95 text-base font-black border-none"
                >
                  <PlusCircle className="size-5 mr-3" />
                  Đăng tin mới
                </Button>
              </div>

              {/* Posts Grid Layout */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
                className="grid grid-cols-2 gap-3 sm:gap-8 pb-10"
              >
                {landlordPosts
                  .slice(0, activeTab === "overview" ? 4 : 20)
                  .map((post) => {
                    const greenBadgeLevel =
                      post.verificationLevel === "verified" ? 3 : 0;
                    const propertyStatus = post.status || "approved";

                    return (
                      <motion.div
                        key={post.id || post._id}
                        variants={{
                          hidden: { opacity: 0, scale: 0.9, y: 20 },
                          visible: {
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            transition: { type: "spring", bounce: 0.4 },
                          },
                        }}
                        whileHover={{
                          y: -10,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 15,
                          },
                        }}
                        className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer"
                        onClick={() => navigate(`/room/${post._id || post.id}`)}
                      >
                        {/* Property Image */}
                        <div className="relative h-36 sm:h-48 overflow-hidden bg-slate-100">
                          {(post.images?.[0] || post.image) ? (
                            <img
                              src={post.images?.[0] || post.image}
                              alt={post.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.name)}&background=6366f1&color=fff&size=400`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                              <FileText className="size-10 text-slate-400" />
                            </div>
                          )}
                          {/* Status badge overlay */}
                          <div className="absolute top-2.5 left-2.5">
                            <div className="scale-90 origin-top-left">
                              {getStatusBadge(propertyStatus as any)}
                            </div>
                          </div>
                          {!post.available && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="px-3 py-1.5 bg-rose-500 text-white text-xs font-black rounded-full shadow-lg">
                                ĐÃ THUÊ
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3.5 sm:p-5">
                          {/* Title + verification */}
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight line-clamp-2 flex-1">
                              {post.name}
                            </h4>
                            <div className="flex-shrink-0">
                              {getVerificationBadge(greenBadgeLevel)}
                            </div>
                          </div>

                          {/* Address */}
                          <p className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mb-3 truncate">
                            <MapPin className="size-3 flex-shrink-0 text-indigo-400" />
                            {post.address}
                          </p>

                          {/* Price + Area row */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-black text-emerald-600">
                              {(post.price || 0).toLocaleString("vi-VN")}đ
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {post.area} m²
                            </span>
                          </div>

                          {/* Stats + Actions */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                              <span className="flex items-center gap-1">
                                <Star className="size-3 text-amber-400" />
                                {post.favorites || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="size-3 text-blue-400" />
                                {post.views || 0}
                              </span>
                            </div>

                            {activeTab === "posts" && (
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const action = getPostActionConfig(post);
                                  const ActionIcon = action.icon;
                                  return (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (action.disabled) return;
                                        if (action.onClick) {
                                          action.onClick(post);
                                        }
                                      }}
                                      variant="ghost"
                                      disabled={action.disabled}
                                      size="sm"
                                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all flex items-center gap-1 ${action.className} ${
                                        action.disabled ? "opacity-70" : ""
                                      }`}
                                    >
                                      <ActionIcon className="size-3" />
                                      <span className="hidden sm:inline">{action.label}</span>
                                    </Button>
                                  );
                                })()}
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingProperty(post);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                  title="Chỉnh sửa tin"
                                >
                                  <Edit className="size-3" />
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete({
                                      open: true,
                                      title: "Xác nhận xoá tin đăng",
                                      description:
                                        "Bạn có chắc chắn muốn xoá tin đăng này? Hành động này không thể hoàn tác.",
                                      onConfirm: () =>
                                        handleDeleteProperty(
                                          post._id || post.id,
                                        ),
                                    });
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all"
                                  title="Xoá tin đăng"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            )}

                          </div>

                          {/* Expiry badge */}
                          {post.expiryDate && (
                            <div className="mt-2">
                              <PropertyExpiryBadge
                                expiryDate={post.expiryDate}
                                status={propertyStatus as any}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
              </motion.div>

              {/* Empty State */}
              {landlordPosts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[40px] shadow-sm p-24 text-center"
                >
                  <div className="w-28 h-28 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-slate-200/50 rotate-3 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 opacity-50" />
                    <FileText className="size-12 text-slate-300 relative z-10" />
                  </div>
                  <h3 className="text-4xl font-black bg-gradient-to-r from-slate-800 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-4 tracking-tight">
                    Chưa có tin đăng nào
                  </h3>
                  <p className="text-indigo-400 text-lg font-black mb-12 max-w-sm mx-auto leading-relaxed drop-shadow-sm">
                    Bắt đầu đăng tin cho thuê để tiếp cận hàng nghìn người tìm
                    trọ trên hệ thống của chúng tôi.
                  </p>
                  <Button
                    onClick={() => navigate("/post-room")}
                    className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 hover:opacity-90 px-12 py-8 rounded-[24px] shadow-2xl shadow-blue-100 transition-all hover:scale-105 active:scale-95 text-xl font-black border-none"
                  >
                    <PlusCircle className="size-6 mr-3" />
                    Đăng tin đầu tiên
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex font-sans">
      {/* Background Aura Effects */}
      {/* Static Background Gradient - Maximum Smoothness */}
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-[#f0f9f5] via-white to-[#f0f2f9]" />

      {/* Mobile Header - Only visible on small screens */}
      <div className="fixed top-0 left-0 right-0 h-16 md:hidden bg-white border-b border-slate-100 flex items-center px-4 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {sidebarOpen ? (
            <XIcon className="size-6 text-slate-900" />
          ) : (
            <Menu className="size-6 text-slate-900" />
          )}
        </button>
        <div className="ml-4 flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 via-blue-500 to-indigo-600 p-2 rounded-lg">
            <Home className="size-4 text-white" />
          </div>
          <h1 className="font-black text-lg text-slate-900">MapHome</h1>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation - Responsive */}
      <aside className={`fixed md:static w-80 h-screen bg-white/70 backdrop-blur-3xl border-r border-white/40 flex-shrink-0 overflow-hidden flex flex-col z-40 shadow-[4px_0_30px_rgba(0,0,0,0.02)] transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        {/* Logo Section */}
        <div className="p-10">
          <div className="flex items-center gap-4 px-2 hover:scale-105 transition-transform">
            <div className="bg-gradient-to-br from-emerald-500 via-blue-500 to-indigo-600 p-3 rounded-[20px] shadow-2xl shadow-blue-100">
              <Home className="size-8 text-white" />
            </div>
            <div>
              <h1 className="font-black text-3xl bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter leading-none">
                MapHome
              </h1>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-1.5 rounded-full mt-2 inline-block shadow-lg shadow-blue-100/50">
                Landlord Portal
              </span>
            </div>
          </div>
        </div>

        {/* User Quick Profile */}
        <div className="mx-6 p-5 rounded-3xl bg-white/50 border border-white/60 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-xl overflow-hidden bg-gradient-to-br from-green-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black flex-shrink-0 hover:rotate-3 transition-transform">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar) || ""}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user?.fullName, user?.username)
              )}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-black text-gray-900 truncate leading-tight">
                {user?.fullName || user?.username}
              </p>
              <div className="mt-1">
                {user?.verificationLevel !== undefined &&
                  getVerificationBadge(user.verificationLevel)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Menu */}
        <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-5 px-6 py-5 rounded-[28px] text-sm font-black tracking-tight transition-all relative group ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 text-white shadow-[0_15px_35px_rgba(59,130,246,0.25)] scale-[1.03]"
                      : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                  }`}
                >
                  <div
                    className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : ""}`}
                  >
                    <Icon className="size-5 flex-shrink-0" />
                  </div>
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute right-6 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Action Footer */}
        <div className="p-6 space-y-3 mt-auto mb-4">
          <Button
            variant="ghost"
            onClick={() => {
              navigate("/");
              setSidebarOpen(false);
            }}
            className="w-full justify-start gap-4 px-5 py-6 rounded-2xl font-bold text-gray-600 hover:bg-white/60 hover:text-gray-900 group"
          >
            <Home className="size-5 transition-transform group-hover:-translate-y-0.5" />
            Về trang chủ
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-4 px-5 py-6 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 group shadow-sm bg-rose-50/10"
          >
            <LogOut className="size-5 transition-transform group-hover:translate-x-1" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content Area - Glass Canvas */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar relative z-10 flex flex-col h-screen md:mt-0 mt-16">
        {/* Top Navbar Blur Effect */}
        <div className="sticky top-0 h-10 bg-gradient-to-b from-white to-transparent pointer-events-none z-30 opacity-60" />

        <div className="flex-1 w-full flex flex-col">
          <main className="max-w-[1400px] w-full mx-auto px-3 sm:px-6 md:px-12 pt-8 pb-20 flex-1">
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
          </main>
        </div>
      </div>

      {/* Verification Request Dialog */}
      <RequestVerificationDialog
        isOpen={showVerificationDialog}
        onClose={() => setShowVerificationDialog(false)}
        landlordId={(user as any)?._id || user?.id || "unknown"}
        landlordName={user?.fullName || user?.username || "Chủ trọ"}
        landlordPhone={user?.phone || "0123456789"}
      />

      <ConfirmDialog
        open={confirmDelete.open}
        title={confirmDelete.title}
        description={confirmDelete.description}
        confirmText="Xoá"
        cancelText="Huỷ"
        onConfirm={async () => {
          await confirmDelete.onConfirm?.();
          setConfirmDelete({ open: false });
        }}
        onCancel={() => setConfirmDelete({ open: false })}
      />

      {/* Edit Property Dialog */}
      <EditPropertyDialog
        isOpen={!!editingProperty}
        onClose={() => setEditingProperty(null)}
        property={editingProperty}
        onSuccess={() => {
          api
            .get("/api/landlord/properties")
            .then((res) => setLandlordPosts(res.data))
            .catch(console.error);
        }}
      />

      {/* Property Renewal Modal */}
      {selectedPropertyForRenewal && (
        <PropertyRenewalModal
          isOpen={renewalModalOpen}
          onClose={() => {
            setRenewalModalOpen(false);
            setSelectedPropertyForRenewal(null);
          }}
          onRenew={handleConfirmRenewal}
          propertyName={selectedPropertyForRenewal.name}
          currentExpiryDate={
            selectedPropertyForRenewal.expiryDate || new Date().toISOString()
          }
          isLoading={isRenewing}
        />
      )}
    </div>
  );
}
