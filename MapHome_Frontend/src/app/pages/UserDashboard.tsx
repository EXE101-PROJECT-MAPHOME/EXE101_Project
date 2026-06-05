import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/contexts/AuthContext";
import { formatDateVietnamese } from "@/app/utils/dateUtils";
import {
  getAvatarUrl,
  getInitials,
  getImageUrl,
} from "@/app/utils/avatarUtils";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Home,
  LogOut,
  Heart,
  Search,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Maximize,
  Phone,
  User,
  ChevronRight,
  Star,
  Trash2,
  Eye,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Settings,
  Camera,
  Upload,
  Building,
  Sparkles,
  ArrowRight,
  RefreshCcw,
  Mail,
  Key,
  Lock,
  Activity,
  Info,
  Menu,
  Shield,
  CreditCard,
  ExternalLink,
  ImageIcon,
  CheckCheck,
  Hourglass,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { amenityMeta } from "@/app/constants/amenities";
import api from "@/app/utils/api";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import NotificationCenter from "@/app/components/NotificationCenter";
import { BlogEditorDialog } from "@/app/components/BlogEditorDialog";
import { useRecentlyViewed } from "@/app/hooks/useRecentlyViewed";
import {
  validateFullName,
  validatePhone,
  validatePassword,
} from "@/app/utils/validationRules";

// Define available views for the user dashboard
type UserView =
  | "favorites"
  | "search"
  | "appointments"
  | "inspections"
  | "history"
  | "book"
  | "saved-blogs"
  | "my-blogs"
  | "settings";

interface ConfirmModalState {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm?: () => Promise<void> | void;
}

export function UserDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, isAuthenticated } = useAuth();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<UserView>("favorites");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [myBlogs, setMyBlogs] = useState<any[]>([]);
  const [savedBlogs, setSavedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    open: false,
  });
  const [supportModal, setSupportModal] = useState({
    open: false,
    subject: "",
    message: "",
  });

  // Xử lý query params từ redirect PayOS (payment=cancelled hoặc tab=appointments)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const payment = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");

    if (tab === "appointments") {
      setActiveView("appointments");
      if (payment === "cancelled") {
        toast.warning("Bạn đã hủy thanh toán xác minh. Lịch hẹn vẫn còn hiệu lực — bạn có thể thanh toán lại bất cứ lúc nào.", {
          duration: 6000,
          icon: "⚠️",
        });
      }
      if (bookingId) {
        setHighlightedBookingId(bookingId);
        // Xóa params khỏi URL sau khi đã xử lý
        setTimeout(() => {
          setSearchParams({}, { replace: true });
          setHighlightedBookingId(null);
        }, 5000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;

      try {
        const [favRes, bookRes, inspRes, blogsRes, savedBlogsRes] =
          await Promise.all([
            api.get("/api/user/me/favorites"),
            api.get("/api/user/bookings"),
            api.get("/api/user/inspections"),
            api.get("/api/blogs/my-blogs"),
            api.get("/api/blogs/me/saved"),
          ]);

        setFavorites(favRes.data);
        setAppointments(bookRes.data);
        setInspections(inspRes.data);
        setMyBlogs(blogsRes.data);
        setSavedBlogs(savedBlogsRes.data);
      } catch (err) {
        console.error("Failed to fetch user dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    } else {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Đang tải dữ liệu của bạn...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl shadow-[0_1px_20px_rgba(0,0,0,0.05)] border-b border-white/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <Home className="size-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900 tracking-tight">
                  MapHome
                </h1>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                  User Console
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter bg-green-50 px-2 py-0.5 rounded-full inline-block">
                  Standard Member
                </p>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-[#16a34a] to-[#0ea5e9] flex items-center justify-center text-white font-bold shrink-0">
                {user?.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar) || ""}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    style={{ imageRendering: "-webkit-optimize-contrast" }}
                  />
                ) : (
                  getInitials(user?.fullName, user?.username)
                )}
              </div>
            </div>
            <div className="h-8 w-[1px] bg-gray-200 hidden md:block mx-4" />
            {/* Notification Bell — polls every 8s for new booking updates */}
            <NotificationCenter pollIntervalMs={8000} />
            <div className="h-8 w-[1px] bg-gray-200 hidden md:block mx-1" />
            <Button
              variant="ghost"
              onClick={handleLogout}
              size="sm"
              className="text-gray-500 hover:text-red-600 transition-colors rounded-full px-4"
            >
              <LogOut className="size-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 py-8"
      >
        {/* Welcome Section */}
        <div className="mb-10 text-center md:text-left">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight"
          >
            Xin chào, {user?.fullName || user?.username}! 👋
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-indigo-500/80 text-lg font-bold"
          >
            Nơi quản lý hành trình tìm kiếm ngôi nhà mơ ước của bạn
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {[
            {
              label: "Trọ yêu thích",
              value: favorites.length,
              icon: Heart,
              color: "text-red-500",
              bg: "bg-red-50",
            },
            {
              label: "Lịch hẹn",
              value: appointments.length,
              icon: Calendar,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "Chờ xác nhận",
              value: appointments.filter((a) => a.status === "pending").length,
              icon: Clock,
              color: "text-orange-500",
              bg: "bg-orange-50",
            },
            {
              label: "Đã hoàn thành",
              value: appointments.filter((a) => a.status === "completed")
                .length,
              icon: CheckCircle,
              color: "text-green-500",
              bg: "bg-green-50",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="size-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-indigo-600 mb-1">
                {stat.value}
              </p>
              <p className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest leading-none">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Navigation Tabs - Mobile Dropdown & Desktop Scroll */}
        <div className="relative mb-6">
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2 mb-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest bg-white border border-gray-100 text-gray-600 hover:text-gray-900 shadow-sm transition-all"
            >
              <Menu className="size-4" />
              {menuOpen ? "Đóng Menu" : "Mở Menu"}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {menuOpen && (
            <div className="md:hidden mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { id: "favorites", label: "Trọ yêu thích", icon: Heart },
                { id: "search", label: "Tìm kiếm", icon: Search },
                { id: "appointments", label: "Lịch hẹn", icon: Calendar },
                { id: "inspections", label: "Kiểm tra", icon: ShieldCheck },
                { id: "saved-blogs", label: "Blog lưu", icon: Heart },
                { id: "my-blogs", label: "Bài viết", icon: MessageCircle },
                { id: "history", label: "Lịch sử", icon: Eye },
                { id: "settings", label: "Cài đặt", icon: Settings },
              ].map((tab) => {
                const isActive = activeView === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveView(tab.id as UserView);
                      setMenuOpen(false);
                    }}
                    className={`relative flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm z-10 ${
                      isActive
                        ? "text-white"
                        : "bg-white text-gray-500 hover:text-gray-900 border border-gray-100"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl z-[-1] shadow-lg shadow-green-500/20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <tab.icon className={`size-3 ${isActive ? "text-white" : ""}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Desktop Horizontal Scroll Tabs */}
          <div
            ref={scrollRef}
            className="hidden md:flex items-center gap-3 overflow-x-auto pb-4 custom-h-scrollbar relative scroll-smooth"
          >
            {[
              { id: "favorites", label: "Trọ yêu thích", icon: Heart },
              { id: "search", label: "Tìm kiếm thông minh", icon: Search },
              { id: "appointments", label: "Lịch hẹn của tôi", icon: Calendar },
              { id: "inspections", label: "Yêu cầu kiểm tra", icon: ShieldCheck },
              { id: "saved-blogs", label: "Blog đã lưu", icon: Heart },
              { id: "my-blogs", label: "Bài viết của tôi", icon: MessageCircle },
              { id: "history", label: "Lịch sử đã xem", icon: Eye },
              { id: "settings", label: "Cài đặt", icon: Settings },
            ].map((tab) => {
              const isActive = activeView === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView(tab.id as UserView)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap shadow-sm z-10 ${
                    isActive
                      ? "text-white"
                      : "bg-white text-gray-500 hover:text-gray-900 border border-gray-100"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl z-[-1] shadow-lg shadow-green-500/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon
                    className={`size-4 ${isActive ? "text-white" : ""}`}
                  />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content Views */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {activeView === "favorites" && (
              <FavoritesView
                favorites={favorites}
                setFavorites={setFavorites}
                setConfirmModal={setConfirmModal}
              />
            )}
            {activeView === "search" && <SearchView />}
            {activeView === "appointments" && (
              <AppointmentsView
                appointments={appointments}
                setAppointments={setAppointments}
                inspections={inspections}
                setInspections={setInspections}
                highlightedBookingId={highlightedBookingId}
                setConfirmModal={setConfirmModal}
              />
            )}
            {activeView === "inspections" && (
              <InspectionsView
                inspections={inspections}
                setInspections={setInspections}
                setConfirmModal={setConfirmModal}
              />
            )}
            {activeView === "history" && <RecentlyViewedView />}
            {activeView === "saved-blogs" && (
              <SavedBlogsView
                savedBlogs={savedBlogs}
                setSavedBlogs={setSavedBlogs}
                setConfirmModal={setConfirmModal}
              />
            )}
            {activeView === "my-blogs" && (
              <MyBlogsView
                myBlogs={myBlogs}
                setMyBlogs={setMyBlogs}
                setConfirmModal={setConfirmModal}
              />
            )}
            {activeView === "settings" && (
              <SettingsView setSupportModal={setSupportModal} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.main>
      <ConfirmDialog
        open={confirmModal.open}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText="Xác nhận"
        cancelText="Huỷ"
        onConfirm={async () => {
          await confirmModal.onConfirm?.();
          setConfirmModal({ open: false });
        }}
        onCancel={() => setConfirmModal({ open: false })}
      />

      <SupportModal
        open={supportModal.open}
        user={user}
        initialSubject={supportModal.subject}
        initialMessage={supportModal.message}
        onClose={() => setSupportModal({ ...supportModal, open: false })}
      />

      {/* Floating Support Button */}
      <motion.button
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setSupportModal({
            open: true,
            subject: "",
            message: "",
          });
        }}
        className="fixed bottom-6 right-24 w-16 h-16 bg-gradient-to-br from-emerald-600 to-blue-600 text-white rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center z-[100] group hover:shadow-emerald-500/60 transition-shadow"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <MessageCircle className="size-8 group-hover:scale-110 transition-transform" />
        </motion.div>
        <div className="absolute right-full mr-4 bg-gradient-to-br from-emerald-50 to-blue-50 px-4 py-2 rounded-xl shadow-xl border border-emerald-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap">
          <p className="text-xs font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-widest">
            Gửi yêu cầu hỗ trợ
          </p>
        </div>
      </motion.button>
    </div>
  );
}

// ─── Support Modal Component ──────────────────────────────────────────────────

function SupportModal({
  open,
  onClose,
  initialSubject = "",
  initialMessage = "",
  user,
}: {
  open: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialMessage?: string;
  user: any;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: initialSubject,
    message: initialMessage,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        subject: initialSubject,
        message: initialMessage,
      });
    }
  }, [open, initialSubject, initialMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/contacts", {
        name: user?.fullName || user?.username,
        email: user?.email,
        subject: formData.subject,
        message: formData.message,
      });
      toast.success("Yêu cầu của bạn đã được gửi đi! 🚀");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-8 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="size-6" />
              </button>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <MessageCircle className="size-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    Gửi yêu cầu hỗ trợ
                  </h2>
                  <p className="text-emerald-50 text-sm font-medium opacity-90">
                    Chúng tôi sẽ phản hồi bạn qua Email sớm nhất có thể.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-emerald-600/70 uppercase tracking-widest ml-1">
                  Tiêu đề yêu cầu
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                    <Sparkles className="size-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="Ví dụ: Lỗi khi đặt lịch hẹn xem nhà..."
                    className="w-full h-14 pl-12 pr-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-emerald-600/70 uppercase tracking-widest ml-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải... Bao gồm ngày giờ, tên bất động sản nếu liên quan, và các bước bạn đã thực hiện."
                  rows={5}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-14 rounded-2xl font-black text-slate-500 border-slate-200 hover:bg-slate-50"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-[2] h-14 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Gửi yêu cầu ngay
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg"
          : "bg-white text-gray-700 hover:bg-gray-50 shadow"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// Favorites View Component
function FavoritesView({
  favorites,
  setFavorites,
  setConfirmModal,
}: {
  favorites: any[];
  setFavorites: (favorites: any[]) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
}) {
  const handleRemoveFavorite = async (propertyId: string) => {
    setConfirmModal({
      open: true,
      title: "Xoá khỏi yêu thích",
      description: "Bạn có chắc muốn xóa khỏi danh sách yêu thích?",
      onConfirm: async () => {
        try {
          const res = await api.post("/api/user/me/favorites/toggle", {
            propertyId,
          });

          if (res.status === 200 || res.status === 201) {
            setFavorites(favorites.filter((f) => f._id !== propertyId));
            toast.success("Đã xóa khỏi danh sách yêu thích! ✨");
          }
        } catch (err) {
          console.error("Failed to untoggle favorite:", err);
        }
      },
    });
  };

  const navigate = useNavigate();

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Trống danh sách yêu thích"
        description="Bắt đầu khám phá và lưu lại những căn trọ mơ ước của bạn ngay hôm nay để không bỏ lỡ."
        action={
          <Button
            onClick={() => navigate("/map")}
            className="px-8 h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-2xl font-black shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
          >
            <Search className="size-5 group-hover:rotate-12 transition-transform" />
            Tìm trọ ngay
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {favorites.length} căn trọ đã lưu
        </h3>
        <Button
          variant="outline"
          onClick={() => navigate("/map")}
          className="border-green-300 text-green-700"
        >
          <Search className="size-4 mr-2" />
          Tìm thêm trọ
        </Button>
      </div>

      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4"
      >
        {favorites.map((property) => (
          <motion.div
            key={property._id}
            variants={{
              hidden: { opacity: 0, x: -20 },
              show: { opacity: 1, x: 0 },
            }}
            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start gap-6">
              {/* Image */}
              <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden flex-shrink-0">
                <img
                  src={
                    getImageUrl(property.image) ||
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
                  }
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {property.name}
                      {property.verificationLevel === "verified" && (
                        <span
                          className="ml-2 text-green-600"
                          title="Đã xác thực"
                        >
                          ✓
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        {property.address?.split(",")[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize className="size-4" />
                        {property.area}m²
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        {property.rating?.toFixed(1) || "5.0"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {property.price?.toLocaleString("vi-VN")}đ
                    </div>
                    <div className="text-xs text-gray-500">/tháng</div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{property.address}</p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(property.amenities || {}).map(
                    ([key, value], idx) =>
                      value && (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full capitalize"
                        >
                          {key}
                        </span>
                      ),
                  )}
                </div>

                {/* Contact & Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="size-4" />
                      {property.ownerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="size-4" />
                      {property.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700"
                      onClick={() => navigate(`/room/${property._id}`)}
                    >
                      <Calendar className="size-4 mr-2" />
                      Đặt lịch xem
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                      onClick={() => navigate(`/room/${property._id}`)}
                    >
                      <Eye className="size-4 mr-2" />
                      Xem chi tiết
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveFavorite(property._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// Modern Search View Component with premium UI
function SearchView() {
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    district: "",
    priceMin: "",
    priceMax: "",
    areaMin: "",
    areaMax: "",
    amenities: [] as string[],
    verified: false,
  });

  const districts = [
    "Quận 1",
    "Quận 2",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 6",
    "Quận 7",
    "Quận 8",
    "Quận 9",
    "Quận 10",
    "Quận 11",
    "Quận 12",
    "Thủ Đức",
    "Bình Thạnh",
    "Tân Bình",
    "Phú Nhuận",
    "Gò Vấp",
  ];

  const toggleAmenity = (key: string) => {
    setSearchParams((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter((a) => a !== key)
        : [...prev.amenities, key],
    }));
  };

  const navigate = useNavigate();
  const handleSearch = () => navigate("/map");
  const handleReset = () => {
    setSearchParams({
      keyword: "",
      district: "",
      priceMin: "",
      priceMax: "",
      areaMin: "",
      areaMax: "",
      amenities: [],
      verified: false,
    });
    toast.success("Đã đặt lại bộ lọc! ✨");
  };

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Header Section */}
      <div className="bg-white/80 p-8 sm:p-10 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-green-500/20">
            <Sparkles className="size-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              Tìm kiếm thông minh
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              Sử dụng bộ lọc nâng cao để tìm căn trọ hoàn hảo
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleReset}
          className="rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold px-6 h-12 transition-all border border-gray-100"
        >
          <RefreshCcw className="size-4 mr-2" />
          Đặt lại
        </Button>
      </div>

      <div className="p-8 sm:p-10 space-y-12">
        {/* Section 1: Basic Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-green-500 rounded-full" />
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
              Thông tin cơ bản
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-2">
              <label className="text-xs font-bold text-indigo-500/60 ml-1">
                Từ khóa tìm kiếm
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-indigo-300 group-focus-within:text-green-600 transition-colors" />
                <Input
                  type="text"
                  value={searchParams.keyword}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      keyword: e.target.value,
                    })
                  }
                  placeholder="Tên phòng trọ, khu phố, địa chỉ..."
                  className="pl-12 h-14 rounded-2xl border-indigo-50 bg-white/50 focus:bg-white transition-all text-base border-2 focus:border-green-500 focus:ring-0 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-indigo-500/60 ml-1">
                Khu vực
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-indigo-300" />
                <select
                  value={searchParams.district}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      district: e.target.value,
                    })
                  }
                  className="w-full h-14 pl-12 pr-4 border-2 border-indigo-50 rounded-2xl text-base font-medium focus:border-green-500 focus:outline-none appearance-none bg-white transition-all shadow-sm"
                >
                  <option value="">Tất cả quận/huyện</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-indigo-300 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Range Filters */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
              Khoảng giá & Diện tích
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-2">
                <DollarSign className="size-4 text-green-600" /> Giá thuê hàng
                tháng (VNĐ)
              </label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={searchParams.priceMin}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        priceMin: e.target.value,
                      })
                    }
                    placeholder="Tối thiểu"
                    className="h-14 rounded-2xl border-2 border-gray-100 px-6 font-bold text-gray-900 focus:border-green-500 transition-all shadow-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    Đ
                  </span>
                </div>
                <div className="w-8 h-1 bg-gray-200 rounded-full" />
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={searchParams.priceMax}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        priceMax: e.target.value,
                      })
                    }
                    placeholder="Tối đa"
                    className="h-14 rounded-2xl border-2 border-gray-100 px-6 font-bold text-gray-900 focus:border-green-500 transition-all shadow-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    Đ
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-2">
                <Maximize className="size-4 text-blue-600" /> Diện tích sử dụng
                (m²)
              </label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={searchParams.areaMin}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        areaMin: e.target.value,
                      })
                    }
                    placeholder="Từ"
                    className="h-14 rounded-2xl border-2 border-gray-100 px-6 font-bold text-gray-900 focus:border-blue-500 transition-all shadow-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    m²
                  </span>
                </div>
                <div className="w-8 h-1 bg-gray-200 rounded-full" />
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={searchParams.areaMax}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        areaMax: e.target.value,
                      })
                    }
                    placeholder="Đến"
                    className="h-14 rounded-2xl border-2 border-gray-100 px-6 font-bold text-gray-900 focus:border-blue-500 transition-all shadow-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    m²
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Amenities & Verification */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                Tiện ích mong muốn
              </h4>
            </div>
            <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
              <ShieldCheck className="size-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-700">
                Xác thực bởi MapHome
              </span>
              <input
                type="checkbox"
                id="verified"
                checked={searchParams.verified}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    verified: e.target.checked,
                  })
                }
                className="w-5 h-5 accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(amenityMeta).map(([key, meta]) => {
              const Icon = meta.icon;
              const isActive = searchParams.amenities.includes(key);
              return (
                <motion.button
                  key={key}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleAmenity(key)}
                  className={`flex flex-col items-center justify-center p-5 rounded-[1.5rem] border-2 transition-all gap-3 ${
                    isActive
                      ? "bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white shadow-xl shadow-green-500/30"
                      : "bg-white border-gray-100 text-gray-500 hover:border-green-200 hover:bg-green-50/30"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl ${isActive ? "bg-white/20" : "bg-gray-50"}`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                    {meta.label.split(" ").slice(0, 2).join(" ")}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-10 flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={handleSearch}
            className="w-full sm:flex-[2] h-16 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-3xl text-lg font-black shadow-2xl shadow-green-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <Search className="size-6 mr-3 group-hover:rotate-12 transition-transform" />
            Bắt đầu tìm kiếm ngay
            <ArrowRight className="size-5 ml-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            className="w-full sm:flex-1 h-16 border-2 border-gray-100 rounded-3xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-200 transition-all"
            onClick={() => navigate("/map")}
          >
            <Navigation className="size-5 mr-3 text-blue-500" />
            Xem trên bản đồ
          </Button>
        </div>
      </div>
    </div>
  );
}

// Appointments View Component
function AppointmentsView({
  appointments,
  setAppointments,
  inspections,
  setInspections,
  highlightedBookingId,
  setConfirmModal,
}: {
  appointments: any[];
  setAppointments: (appointments: any[]) => void;
  inspections: any[];
  setInspections: (inspections: any[]) => void;
  highlightedBookingId: string | null;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
}) {
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "completed" | "cancelled"
  >("all");
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    booking: any | null;
  }>({ open: false, booking: null });

  const filteredAppointments =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

  // Kiểm tra booking đã có VerificationRequest chưa
  const hasVerificationRequest = (bookingId: string) =>
    inspections.some((insp) => String(insp.bookingId) === String(bookingId));

  const handleCancelAppointment = async (id: string) => {
    setConfirmModal({
      open: true,
      title: "Hủy lịch hẹn",
      description: "Bạn có chắc muốn hủy lịch hẹn này?",
      onConfirm: async () => {
        try {
          const res = await api.put(`/api/bookings/${id}/cancel`);

          if (res.status === 200) {
            setAppointments(
              appointments.map((a) =>
                a._id === id ? { ...a, status: "cancelled" } : a,
              ),
            );
            toast.success("Đã hủy lịch hẹn thành công! ✅");
          }
        } catch (err) {
          console.error("Failed to cancel booking:", err);
        }
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        label: "Chờ xác nhận",
        color: "bg-orange-100 text-orange-800",
        icon: Clock,
      },
      confirmed: {
        label: "Đã xác nhận",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      completed: {
        label: "Đã hoàn thành",
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color} flex items-center gap-1 w-fit`}
      >
        <Icon className="size-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Tất cả ({appointments.length})
          </FilterButton>
          <FilterButton
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          >
            Chờ xác nhận (
            {appointments.filter((a) => a.status === "pending").length})
          </FilterButton>
          <FilterButton
            active={filter === "confirmed"}
            onClick={() => setFilter("confirmed")}
          >
            Đã xác nhận (
            {appointments.filter((a) => a.status === "confirmed").length})
          </FilterButton>
          <FilterButton
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
          >
            Đã hoàn thành (
            {appointments.filter((a) => a.status === "completed").length})
          </FilterButton>
          <FilterButton
            active={filter === "cancelled"}
            onClick={() => setFilter("cancelled")}
          >
            Đã hủy (
            {appointments.filter((a) => a.status === "cancelled").length})
          </FilterButton>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Chưa có lịch hẹn nào"
          description={
            filter === "all"
              ? "Bạn chưa đặt lịch hẹn xem trọ nào. Hãy tìm căn trọ ưng ý và đặt lịch với chủ trọ ngay!"
              : `Hiện tại bạn không có lịch hẹn nào ở trạng thái này.`
          }
        />
      ) : (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {filteredAppointments.map((appointment) => (
            <motion.div
              key={appointment._id}
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className={`bg-white rounded-xl shadow hover:shadow-lg transition-all p-6 ${
                highlightedBookingId === appointment._id
                  ? "ring-2 ring-orange-400 ring-offset-2 shadow-orange-100"
                  : ""
              }`}
            >
              <div className="flex items-start gap-6">
                {/* Property Image */}
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden flex-shrink-0">
                  <img
                    src={
                      getImageUrl(appointment.propertyId?.image) ||
                      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
                    }
                    alt={appointment.propertyId?.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {appointment.propertyId?.name || "Căn trọ cũ"}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="size-4" />
                        {appointment.propertyId?.address?.split(",")[0] ||
                          "Hồ Chí Minh"}
                      </p>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ngày hẹn</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <Calendar className="size-4" />
                        {formatDateVietnamese(appointment.bookingDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Giờ hẹn</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <Clock className="size-4" />
                        {appointment.bookingTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Chủ trọ</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <User className="size-4" />
                        {appointment.landlordId?.fullName ||
                          appointment.landlordId?.username ||
                          "Chủ trọ"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Liên hệ</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <Phone className="size-4" />
                        {appointment.phone ||
                          appointment.landlordId?.phone ||
                          "N/A"}
                      </p>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Ghi chú:</p>
                      <p className="text-sm text-gray-700">
                        {appointment.notes}
                      </p>
                    </div>
                  )}

                  {appointment.status === "pending" && (
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancelAppointment(appointment._id)}
                      >
                        <XCircle className="size-4 mr-2" />
                        Hủy lịch hẹn
                      </Button>
                    </div>
                  )}

                  {/* Nút thanh toán xác minh khi booking được confirm */}
                  {appointment.status === "confirmed" && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      {hasVerificationRequest(appointment._id) ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
                          <CheckCheck className="size-4 text-green-600" />
                          <span className="text-sm font-bold text-green-700">Yêu cầu xác minh đã được gửi</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Shield className="size-4 text-blue-500" />
                            <span>Xác minh để đảm bảo trọ có thật</span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            onClick={() =>
                              setPaymentModal({ open: true, booking: appointment })
                            }
                          >
                            <Shield className="size-4" />
                            Thanh toán xác minh trọ
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal xác nhận thanh toán phí xác minh */}
      <InspectionPaymentModal
        open={paymentModal.open}
        booking={paymentModal.booking}
        onClose={() => setPaymentModal({ open: false, booking: null })}
        onSuccess={(newInspection) => {
          if (newInspection) setInspections([...inspections, newInspection]);
          setPaymentModal({ open: false, booking: null });
        }}
      />
    </div>
  );
}

// ─── InspectionPaymentModal ────────────────────────────────────────────────────
function InspectionPaymentModal({
  open,
  booking,
  onClose,
  onSuccess,
}: {
  open: boolean;
  booking: any | null;
  onClose: () => void;
  onSuccess: (newInspection?: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState<number>(119000);

  useEffect(() => {
    if (open) {
      api
        .get("/api/payments/inspection-fee")
        .then((res) => setFee(res.data.fee || 119000))
        .catch(() => setFee(119000));
    }
  }, [open]);

  const handlePay = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      const res = await api.post("/api/payments/create", {
        amount: fee,
        planId: "inspection",
        bookingId: booking._id,
        description: "Phi xac minh tro",
      });
      // Redirect đến PayOS checkout
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tạo thanh toán. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <AnimatePresence>
      {open && booking && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-white/20"
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 24, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.25 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-7 text-white relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Shield className="size-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Xác minh phòng trọ</h2>
                  <p className="text-blue-100 text-sm font-medium mt-0.5">
                    Đảm bảo trọ có thật trước khi ký hợp đồng
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-7 space-y-5">
              {/* Thông tin booking */}
              <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Thông tin lịch hẹn
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden flex-shrink-0">
                    <img
                      src={
                        getImageUrl(booking.propertyId?.image) ||
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200"
                      }
                      alt={booking.propertyId?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      {booking.propertyId?.name || "Căn phòng"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="size-3" />
                      {booking.propertyId?.address?.split(",")[0] || "Địa chỉ"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="size-3" />
                      {formatDateVietnamese(booking.bookingDate)} lúc {booking.bookingTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phí */}
              <div className="flex items-center justify-between p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <CreditCard className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Phí xác minh trọ</p>
                    <p className="text-xs text-gray-500">Một lần duy nhất</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-blue-700">{formatPrice(fee)}</p>
              </div>

              {/* Mô tả dịch vụ */}
              <div className="space-y-2.5">
                {[
                  { icon: CheckCheck, text: "Nhân viên kiểm tra thực địa tại địa chỉ trọ" },
                  { icon: BadgeCheck, text: "Xác nhận trọ tồn tại và đúng với thông tin đăng" },
                  { icon: Shield, text: "Cấp huy hiệu ✓ Verified nếu đạt tiêu chuẩn" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="p-1 bg-green-50 rounded-lg flex-shrink-0">
                      <Icon className="size-4 text-green-600" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-500 hover:bg-slate-50"
                  disabled={loading}
                >
                  Để sau
                </Button>
                <Button
                  onClick={handlePay}
                  loading={loading}
                  className="flex-[2] h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <ExternalLink className="size-4" />
                  Thanh toán qua PayOS
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Filter Button Component
function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all z-10 flex items-center justify-center min-w-[100px] ${
        active
          ? "text-white"
          : "bg-gray-50/50 text-gray-400 hover:text-gray-600 border border-gray-100 hover:border-gray-200"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeFilterIndicator"
          className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl z-[-1] shadow-lg shadow-green-500/20"
          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

// Premium Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-2xl p-20 text-center relative overflow-hidden"
    >
      {/* Aura Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-400/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-blue-400/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-28 h-28 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto mb-10 border border-white shrink-0"
        >
          <Icon className="size-12 text-green-600/80" />
        </motion.div>

        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
          {title}
        </h3>
        <p className="text-gray-500 font-medium max-w-md mx-auto mb-10 leading-relaxed">
          {description}
        </p>

        {action && <div className="flex justify-center">{action}</div>}
      </div>
    </motion.div>
  );
}

// Inspections View Component
function InspectionsView({
  inspections,
  setInspections,
  setConfirmModal,
}: {
  inspections: any[];
  setInspections: (inspections: any[]) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
}) {
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "cancelled"
  >("all");

  const filteredInspections =
    filter === "all"
      ? inspections
      : inspections.filter((i) => i.status === filter);

  const handleCancelInspection = async (id: string) => {
    setConfirmModal({
      open: true,
      title: "Hủy yêu cầu kiểm tra",
      description: "Bạn có chắc muốn hủy yêu cầu kiểm tra này?",
      onConfirm: async () => {
        try {
          const res = await api.put(`/api/inspections/${id}/cancel`);

          if (res.status === 200) {
            setInspections(
              inspections.map((i) =>
                i._id === id ? { ...i, status: "cancelled" } : i,
              ),
            );
            toast.success("Đã hủy yêu cầu kiểm tra! 🛡️");
          }
        } catch (err) {
          console.error("Failed to cancel inspection:", err);
        }
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      pending: {
        label: "Đang chờ xét duyệt",
        color: "bg-orange-100 text-orange-800",
        icon: Hourglass,
      },
      approved: {
        label: "Đã duyệt — Chờ kiểm tra",
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
      },
      awaiting_photos: {
        label: "Cần gửi ảnh",
        color: "bg-yellow-100 text-yellow-800",
        icon: ImageIcon,
      },
      photos_submitted: {
        label: "Ảnh đã gửi — Chờ duyệt",
        color: "bg-purple-100 text-purple-800",
        icon: Upload,
      },
      completed: {
        label: "Xác minh thành công",
        color: "bg-green-100 text-green-800",
        icon: BadgeCheck,
      },
      rejected: {
        label: "Không đạt yêu cầu",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-gray-100 text-gray-600",
        icon: XCircle,
      },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1 w-fit`}
      >
        <Icon className="size-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Tất cả ({inspections.length})
          </FilterButton>
          <FilterButton
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          >
            Đang chờ ({inspections.filter((i) => i.status === "pending").length}
            )
          </FilterButton>
          <FilterButton
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
          >
            Đã hoàn thành (
            {inspections.filter((i) => i.status === "completed").length})
          </FilterButton>
          <FilterButton
            active={filter === "cancelled"}
            onClick={() => setFilter("cancelled")}
          >
            Đã hủy ({inspections.filter((i) => i.status === "cancelled").length}
            )
          </FilterButton>
        </div>
      </div>

      {filteredInspections.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <ShieldCheck className="size-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chưa có yêu cầu kiểm tra nào
          </h3>
          <p className="text-gray-600">
            {filter === "all"
              ? "Bạn chưa gửi yêu cầu kiểm tra trọ nào"
              : "Không tìm thấy yêu cầu nào với trạng thái này"}
          </p>
        </div>
      ) : (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {filteredInspections.map((insp) => (
            <motion.div
              key={insp._id}
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden flex-shrink-0">
                  <img
                    src={
                      getImageUrl(insp.propertyId?.image) ||
                      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
                    }
                    alt={insp.propertyId?.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {insp.propertyId?.name || "Căn trọ cũ"}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="size-4" />
                        {insp.propertyId?.address?.split(",")[0] ||
                          "Hồ Chí Minh"}
                      </p>
                    </div>
                    {getStatusBadge(insp.status)}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-3 border-y border-gray-100 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mã yêu cầu</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        #{insp._id?.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ngày gửi</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateVietnamese(insp.createdAt)}
                      </p>
                    </div>
                    {insp.scheduledDate ? (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ngày kiểm tra dự kiến</p>
                        <p className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDateVietnamese(insp.scheduledDate)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Địa điểm</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {insp.propertyId?.address}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Nút hành động tùy theo trạng thái */}
                  <div className="flex items-center justify-between mt-4">
                    {insp.status === "awaiting_photos" && (
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 px-3 py-2 rounded-xl border border-yellow-200 flex-1">
                          <ImageIcon className="size-4 flex-shrink-0" />
                          <span>Vui lòng gửi ảnh thực địa để hoàn tất xác minh</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                          onClick={() => toast.info("Tính năng gửi ảnh đang được phát triển. Vui lòng liên hệ hỗ trợ.")}
                        >
                          <Camera className="size-4" />
                          Gửi ảnh ngay
                        </Button>
                      </div>
                    )}

                    {insp.status === "pending" && (
                      <div className="flex justify-end w-full">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleCancelInspection(insp._id)}
                        >
                          <XCircle className="size-4 mr-2" />
                          Hủy yêu cầu
                        </Button>
                      </div>
                    )}

                    {insp.status === "completed" && insp.badgeAwarded && insp.badgeAwarded !== "none" && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
                        <BadgeCheck className="size-5 text-green-600" />
                        <span className="text-sm font-bold text-green-700">
                          Huy hiệu: {insp.badgeAwarded === "premium" ? "🏆 Premium" : "✅ Verified"}
                        </span>
                      </div>
                    )}

                    {insp.status === "rejected" && insp.inspectorNotes && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700 flex-1">
                        <AlertCircle className="size-4 flex-shrink-0" />
                        <span className="line-clamp-2">{insp.inspectorNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/**
 * SettingsView component for managing user profile and security
 * Allows updating personal info and changing password
 */
function SettingsView({
  setSupportModal,
}: {
  setSupportModal: (val: any) => void;
}) {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "profile" | "search" | "privacy" | "security"
  >("profile");
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Local state for complex settings
  const [localSettings, setLocalSettings] = useState({
    searchPreferences: user?.searchPreferences || {
      districts: [],
      priceRange: { min: 0, max: 50000000 },
    },
    privacySettings: user?.privacySettings || {
      showPhoneBeforeBooking: true,
    },
    security: user?.security || {
      twoFactorEnabled: false,
      loginHistory: [],
    },
  });

  const districtsList = [
    "Quận 1",
    "Quận 2",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 6",
    "Quận 7",
    "Quận 8",
    "Quận 9",
    "Quận 10",
    "Quận 11",
    "Quận 12",
    "Thủ Đức",
    "Bình Thạnh",
    "Tân Bình",
    "Phú Nhuận",
    "Gò Vấp",
    "Bình Tân",
    "Hóc Môn",
    "Củ Chi",
    "Nhà Bè",
    "Bình Chánh",
    "Cần Giờ",
  ];

  const handleSave = async (data: any) => {
    setLoading(true);
    try {
      const userId = user?.id || (user as any)?._id;
      const res = await api.put(`/api/user/${userId}`, data);
      if (res.status === 200) {
        updateUser(res.data);
        toast.success("Cập nhật thành công! ✨");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật. ❌");
    } finally {
      setLoading(false);
    }
  };

  const toggleDistrict = (district: string) => {
    const current = localSettings.searchPreferences?.districts || [];
    const next = current.includes(district)
      ? current.filter((d: string) => d !== district)
      : [...current, district];

    setLocalSettings({
      ...localSettings,
      searchPreferences: {
        ...localSettings.searchPreferences,
        districts: next,
      },
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar Navigation */}
      <div className="lg:w-72 shrink-0">
        <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-4 border border-white/50 shadow-xl space-y-2 sticky top-24">
          <TabNav
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            icon={<User />}
            label="Hồ sơ cá nhân"
          />
          <TabNav
            active={activeTab === "search"}
            onClick={() => setActiveTab("search")}
            icon={<Search />}
            label="Sở thích tìm kiếm"
          />
          <TabNav
            active={activeTab === "privacy"}
            onClick={() => setActiveTab("privacy")}
            icon={<ShieldCheck />}
            label="Quyền riêng tư"
          />
          <TabNav
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
            icon={<Key />}
            label="Bảo mật & Đăng nhập"
          />
        </div>
      </div>

      {/* Main Form Content */}
      <div className="flex-1">
        <div className="bg-white/70 backdrop-blur-xl rounded-[42px] border border-white/60 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-8 md:p-12 flex-1 relative">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <SectionHeader
                    title="Thông tin cá nhân"
                    description="Cập nhật thông tin cơ bản để mọi người nhận diện bạn."
                  />

                  <div className="flex flex-col items-center gap-4 pb-8 border-b border-gray-100">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-4xl font-black">
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
                      <label className="absolute -bottom-2 -right-2 p-3 bg-white text-green-600 rounded-2xl shadow-xl cursor-pointer hover:bg-green-600 hover:text-white transition-all transform hover:scale-110 border border-gray-100">
                        <Camera className="size-5" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append("image", file);
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
                                await handleSave({
                                  avatar: uploadRes.data.url,
                                });
                              }
                            } catch (err) {
                              toast.error("Lỗi upload ảnh.");
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      handleSave({
                        fullName: form.get("fullName"),
                        username: form.get("username"),
                        phone: form.get("phone"),
                      });
                    }}
                  >
                    <InputGroup
                      name="fullName"
                      label="Họ và tên"
                      defaultValue={user?.fullName || ""}
                      icon={<User />}
                    />
                    <InputGroup
                      name="phone"
                      label="Số điện thoại"
                      defaultValue={user?.phone || ""}
                      icon={<Phone />}
                    />
                    <InputGroup
                      name="username"
                      label="Tên đăng nhập"
                      defaultValue={user?.username || ""}
                      icon={<User />}
                    />
                    <InputGroup
                      name="email"
                      label="Địa chỉ Email"
                      defaultValue={user?.email || ""}
                      icon={<Mail />}
                      disabled
                    />
                    <div className="flex items-center justify-between mt-2 ml-1">
                      <p className="text-[10px] text-slate-400 italic">
                        * Để bảo mật, việc thay đổi Email cần sự xác nhận của
                        Quản trị viên.
                      </p>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSupportModal({
                            open: true,
                            subject: "",
                            message: "",
                          });
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2 rounded-lg transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40"
                      >
                        <MessageCircle className="size-4" />
                        Gửi yêu cầu hỗ trợ
                      </motion.button>
                    </div>
                    <div className="md:col-span-2 pt-4">
                      <Button
                        type="submit"
                        loading={loading}
                        className="w-full h-14 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Lưu thay đổi hồ sơ
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "search" && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <SectionHeader
                    title="Sở thích tìm kiếm"
                    description="Chúng tôi sẽ ưu tiên hiển thị các phòng trọ phù hợp với tiêu chí của bạn."
                  />

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-emerald-600/70 uppercase tracking-widest ml-1">
                        Khu vực quan tâm (Quận/Huyện)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {districtsList.map((d) => (
                          <button
                            key={d}
                            onClick={() => toggleDistrict(d)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              localSettings.searchPreferences?.districts?.includes(
                                d,
                              )
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                                : "bg-white text-slate-500 border-slate-100 hover:border-emerald-200 hover:text-emerald-700"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-emerald-600/70 uppercase tracking-widest ml-1">
                          Giá tối thiểu (VNĐ)
                        </label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                            <DollarSign className="size-5" />
                          </div>
                          <input
                            type="number"
                            value={
                              localSettings.searchPreferences?.priceRange
                                ?.min || 0
                            }
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                searchPreferences: {
                                  ...localSettings.searchPreferences,
                                  priceRange: {
                                    ...localSettings.searchPreferences
                                      ?.priceRange,
                                    min: Number(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full h-12 pl-12 pr-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-emerald-600/70 uppercase tracking-widest ml-1">
                          Giá tối đa (VNĐ)
                        </label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                            <DollarSign className="size-5" />
                          </div>
                          <input
                            type="number"
                            value={
                              localSettings.searchPreferences?.priceRange
                                ?.max || 50000000
                            }
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                searchPreferences: {
                                  ...localSettings.searchPreferences,
                                  priceRange: {
                                    ...localSettings.searchPreferences
                                      ?.priceRange,
                                    max: Number(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full h-12 pl-12 pr-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      handleSave({
                        searchPreferences: localSettings.searchPreferences,
                      })
                    }
                    loading={loading}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-8"
                  >
                    Lưu cấu hình tìm kiếm
                  </Button>
                </motion.div>
              )}

              {activeTab === "privacy" && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <SectionHeader
                    title="Quyền riêng tư"
                    description="Kiểm soát thông tin nào chủ trọ có thể nhìn thấy."
                  />

                  <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 mb-1">
                          Công khai số điện thoại
                        </h4>
                        <p className="text-sm text-slate-500">
                          Cho phép chủ nhà xem số điện thoại của bạn ngay cả khi
                          chưa xác nhận lịch hẹn.
                        </p>
                      </div>
                      <Toggle
                        checked={
                          localSettings.privacySettings
                            ?.showPhoneBeforeBooking ?? true
                        }
                        onChange={(val) =>
                          setLocalSettings({
                            ...localSettings,
                            privacySettings: {
                              ...localSettings.privacySettings,
                              showPhoneBeforeBooking: val,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-xs text-slate-400 italic">
                        <Info className="size-3 inline mr-1 mb-0.5" />
                        Lưu ý: MapHome luôn bảo vệ dữ liệu của bạn. Chúng tôi
                        chỉ cung cấp thông tin liên hệ khi bạn có ý định xem
                        phòng thực sự.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      handleSave({
                        privacySettings: localSettings.privacySettings,
                      })
                    }
                    loading={loading}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-8"
                  >
                    Cập nhật quyền riêng tư
                  </Button>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div>
                    <SectionHeader
                      title="Bảo mật tài khoản"
                      description="Bảo vệ tài khoản của bạn bằng các lớp bảo mật mạnh mẽ."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm">
                            <ShieldCheck className="size-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-amber-900 leading-none mb-1">
                              Xác thực 2 lớp (2FA)
                            </p>
                            <p className="text-[10px] text-amber-600 font-bold">
                              Tăng cường bảo mật qua Email
                            </p>
                          </div>
                        </div>
                        <Toggle
                          color="amber"
                          checked={
                            localSettings.security?.twoFactorEnabled || false
                          }
                          onChange={(val) =>
                            setLocalSettings({
                              ...localSettings,
                              security: {
                                ...localSettings.security,
                                twoFactorEnabled: val,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
                            <Key className="size-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-emerald-900 leading-none mb-1">
                              Đổi mật khẩu thủ công
                            </p>
                            <p className="text-[10px] text-emerald-600 font-bold">
                              Cập nhật mật khẩu định kỳ
                            </p>
                          </div>
                        </div>
                        <Toggle
                          color="emerald"
                          checked={showPasswordForm}
                          onChange={(val) => setShowPasswordForm(val)}
                        />
                      </div>

                      <AnimatePresence>
                        {showPasswordForm && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:col-span-2 overflow-hidden"
                          >
                            <div className="bg-slate-50/50 rounded-3xl p-8 border border-dashed border-slate-200 mt-2 space-y-6">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
                                  <Key className="size-5" />
                                </div>
                                <h4 className="font-bold text-slate-800">
                                  Cài đặt mật khẩu mới
                                </h4>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup
                                  type="password"
                                  name="currentPassword"
                                  label="Mật khẩu hiện tại"
                                  placeholder="••••••••"
                                  icon={<Lock />}
                                />
                                <InputGroup
                                  type="password"
                                  name="newPassword"
                                  label="Mật khẩu mới"
                                  placeholder="••••••••"
                                  icon={<Key />}
                                />
                              </div>

                              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                                  Lưu ý: Mật khẩu phải có ít nhất 8 ký tự, bao
                                  gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                                  Bạn sẽ bị đăng xuất sau khi đổi thành công.
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                loading={loading}
                                onClick={async (e) => {
                                  const container = (
                                    e.target as HTMLElement
                                  ).closest(".space-y-6");
                                  const currentPass = (
                                    container?.querySelector(
                                      'input[name="currentPassword"]',
                                    ) as HTMLInputElement
                                  )?.value;
                                  const newPass = (
                                    container?.querySelector(
                                      'input[name="newPassword"]',
                                    ) as HTMLInputElement
                                  )?.value;

                                  if (!currentPass || !newPass) {
                                    toast.error(
                                      "Vui lòng nhập đầy đủ thông tin mật khẩu.",
                                    );
                                    return;
                                  }

                                  if (newPass.length < 8) {
                                    toast.error(
                                      "Mật khẩu mới phải có ít nhất 8 ký tự.",
                                    );
                                    return;
                                  }

                                  setLoading(true);
                                  try {
                                    const res = await api.put(
                                      "/api/auth/change-password",
                                      {
                                        currentPassword: currentPass,
                                        newPassword: newPass,
                                      },
                                    );
                                    if (res.status === 200) {
                                      toast.success(
                                        "Đổi mật khẩu thành công! 🔐",
                                      );
                                      setShowPasswordForm(false);
                                      // Clear inputs
                                      (
                                        container?.querySelector(
                                          'input[name="currentPassword"]',
                                        ) as HTMLInputElement
                                      ).value = "";
                                      (
                                        container?.querySelector(
                                          'input[name="newPassword"]',
                                        ) as HTMLInputElement
                                      ).value = "";
                                    }
                                  } catch (err: any) {
                                    const errorData = err.response?.data;
                                    if (
                                      errorData?.errors &&
                                      errorData.errors.length > 0
                                    ) {
                                      toast.error(errorData.errors[0].message);
                                    } else {
                                      toast.error(
                                        errorData?.message ||
                                          "Mật khẩu hiện tại không chính xác.",
                                      );
                                    }
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="w-full h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl font-black text-xs shadow-sm"
                              >
                                Xác nhận đổi mật khẩu
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-indigo-500/60 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                      Lịch sử đăng nhập (10 phiên gần nhất)
                    </h4>
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-inner">
                      <div className="divide-y divide-slate-100">
                        {localSettings.security?.loginHistory?.length > 0 ? (
                          localSettings.security.loginHistory.map(
                            (h: any, i: number) => (
                              <div
                                key={i}
                                className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`p-2 rounded-xl ${h.os === "Windows" ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-600"}`}
                                  >
                                    <Activity className="size-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 leading-none mb-1">
                                      {h.browser} on {h.os}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                                      {h.device}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[11px] font-black text-slate-600">
                                    {h.ip}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-bold">
                                    {new Date(h.lastLogin).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="p-10 text-center text-slate-400 font-medium italic">
                            Chưa có lịch sử đăng nhập.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      handleSave({ security: localSettings.security })
                    }
                    loading={loading}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Lưu thay đổi bảo mật
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interaction Helpers ──────────────────────────────────────────────────────

function TabNav({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[13px] font-black tracking-tight transition-all active:scale-95 ${
        active
          ? "text-white"
          : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeUserTab"
          className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl shadow-lg shadow-emerald-500/20"
        />
      )}
      <span className="relative z-10 [&>svg]:size-5">
        {active ? React.cloneElement(icon, { className: "text-white" }) : icon}
      </span>
      <span className="relative z-10">{label}</span>
      {active && (
        <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full z-10" />
      )}
    </button>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">
        {title}
      </h3>
      <p className="text-sm font-bold text-emerald-600/60 italic">
        {description}
      </p>
    </div>
  );
}

function InputGroup({
  name,
  label,
  icon,
  defaultValue,
  value,
  onChange,
  type = "text",
  disabled = false,
}: any) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-black text-emerald-600/70 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none [&>svg]:size-5">
          {icon}
        </div>
        <input
          name={name}
          type={type}
          disabled={disabled}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          className="w-full h-12 pl-12 pr-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner disabled:bg-slate-100 disabled:text-slate-400"
        />
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  color = "emerald",
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  color?: string;
}) {
  const colors: any = {
    emerald: "peer-checked:bg-emerald-600",
    amber: "peer-checked:bg-amber-600",
    blue: "peer-checked:bg-blue-600",
  };
  return (
    <label className="relative inline-flex items-center cursor-pointer scale-110">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-7 after:transition-all ${colors[color]} shadow-inner`}
      ></div>
    </label>
  );
}

// ─── Recently Viewed View ─────────────────────────────────────────────────────
function RecentlyViewedView() {
  const navigate = useNavigate();
  const { history, removeItem, clearHistory } = useRecentlyViewed();

  if (history.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="Chưa có lịch sử xem"
        description="Những phòng trọ bạn đã xem sẽ xuất hiện tại đây để bạn dễ dàng quay lại."
        action={
          <Button
            onClick={() => navigate("/map")}
            className="px-8 h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-2xl font-black shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
          >
            <Search className="size-5 group-hover:rotate-12 transition-transform" />
            Khám phá phòng trọ
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {history.length} phòng đã xem gần đây
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Lưu cục bộ trên trình duyệt này
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/map")}
            className="border-green-300 text-green-700"
          >
            <Search className="size-4 mr-2" />
            Tìm thêm trọ
          </Button>
          <Button
            variant="outline"
            onClick={clearHistory}
            className="border-red-200 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="size-4 mr-2" />
            Xóa tất cả
          </Button>
        </div>
      </div>

      {/* Property Cards */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.07 } },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4"
      >
        {history.map((item) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, x: -20 },
              show: { opacity: 1, x: 0 },
            }}
            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-4"
          >
            <div className="flex items-start gap-5">
              {/* Thumbnail */}
              <div
                className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => navigate(`/room/${item.id}`)}
              >
                <img
                  src={
                    item.image ||
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
                  }
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400";
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-base font-bold text-gray-900 truncate cursor-pointer hover:text-green-700 transition-colors"
                      onClick={() => navigate(`/room/${item.id}`)}
                    >
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="size-3.5 text-green-600 flex-shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                    title="Xóa khỏi lịch sử"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-green-600 font-bold">
                    {item.price.toLocaleString("vi-VN")}đ/tháng
                  </span>
                  <span className="text-gray-400 flex items-center gap-1">
                    <Maximize className="size-3.5" />
                    {item.area}m²
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.available
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.available ? "🟢 Còn phòng" : "🔴 Hết phòng"}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-gray-400">
                    Đã xem: {new Date(item.viewedAt).toLocaleString("vi-VN")}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 h-8 text-xs"
                    onClick={() => navigate(`/room/${item.id}`)}
                  >
                    <Calendar className="size-3.5 mr-1.5" />
                    Đặt lịch xem
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Saved Blogs View ────────────────────────────────────────────────────────
function SavedBlogsView({
  savedBlogs,
  setSavedBlogs,
  setConfirmModal,
}: {
  savedBlogs: any[];
  setSavedBlogs: (blogs: any[]) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
}) {
  const navigate = useNavigate();

  const handleUnsave = async (blogId: string) => {
    setConfirmModal({
      open: true,
      title: "Bỏ lưu bài viết",
      description: "Bạn có chắc chắn muốn bỏ lưu bài viết này không?",
      onConfirm: async () => {
        try {
          const res = await api.post(`/api/blogs/${blogId}/save`);
          if (res.status === 200) {
            setSavedBlogs(savedBlogs.filter((b) => b._id !== blogId));
            toast.success("Đã bỏ lưu bài viết! ✨");
          }
        } catch (err) {
          console.error("Failed to unsave blog:", err);
          toast.error("Không thể bỏ lưu bài viết. Vui lòng thử lại.");
        }
      },
    });
  };

  if (savedBlogs.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Chưa có bài viết đã lưu"
        description="Lưu lại những kiến thức và mẹo hay để đọc sau nhé."
        action={
          <Button
            onClick={() => navigate("/blog")}
            className="px-8 h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-2xl font-black shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
          >
            <Search className="size-5 group-hover:rotate-12 transition-transform" />
            Khám phá Blog
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {savedBlogs.map((blog) => (
        <motion.div
          key={blog._id}
          whileHover={{ y: -5 }}
          className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
        >
          <div
            className="aspect-video relative overflow-hidden cursor-pointer"
            onClick={() => navigate(`/blog/${blog._id}`)}
          >
            <img
              src={blog.image || "/images/blog-placeholder.jpg"}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute top-4 right-4">
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/90 backdrop-blur-md hover:bg-white text-red-500 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsave(blog._id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                {blog.category}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <h4
              className="font-black text-gray-900 leading-tight mb-2 line-clamp-2 hover:text-green-600 cursor-pointer transition-colors"
              onClick={() => navigate(`/blog/${blog._id}`)}
            >
              {blog.title}
            </h4>
            <p className="text-gray-500 text-xs line-clamp-2 mb-4">
              {blog.excerpt}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-gray-100 overflow-hidden border border-white shadow-sm">
                  <img
                    src={blog.authorAvatar || getAvatarUrl(blog.author)}
                    alt={blog.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-bold text-gray-700">
                  {blog.author}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="size-3.5" />
                  <span className="text-[11px] font-bold">
                    {blog.views || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── My Blogs View ───────────────────────────────────────────────────────────
function MyBlogsView({
  myBlogs,
  setMyBlogs,
  setConfirmModal,
}: {
  myBlogs: any[];
  setMyBlogs: (blogs: any[]) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
}) {
  const navigate = useNavigate();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);

  const handleDeleteBlog = async (blogId: string) => {
    setConfirmModal({
      open: true,
      title: "Xóa bài viết",
      description:
        "Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/api/blogs/${blogId}`);
          if (res.status === 200) {
            setMyBlogs(myBlogs.filter((b) => b._id !== blogId));
            toast.success("Đã xóa bài viết thành công!");
          }
        } catch (err) {
          console.error("Failed to delete blog:", err);
          toast.error("Không thể xóa bài viết. Vui lòng thử lại.");
        }
      },
    });
  };

  const handleEditBlog = (blog: any) => {
    setEditingBlog(blog);
    setEditorOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
            <CheckCircle className="size-3" /> Đã đăng
          </span>
        );
      case "pending":
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
            <Clock className="size-3" /> Chờ duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
            <XCircle className="size-3" /> Bị từ chối
          </span>
        );
      case "draft":
        return (
          <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
            <Settings className="size-3" /> Bản nháp
          </span>
        );
      default:
        return null;
    }
  };

  if (myBlogs.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Bạn chưa có bài viết nào"
        description="Chia sẻ kinh nghiệm và mẹo tìm trọ của bạn với cộng đồng nhé."
        action={
          <Button
            onClick={() => navigate("/blog")}
            className="px-8 h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-2xl font-black shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
          >
            <Sparkles className="size-5 group-hover:rotate-12 transition-transform" />
            Bắt đầu viết Blog
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Quản lý bài viết ({myBlogs.length})
        </h3>
        <Button
          onClick={() => navigate("/blog")}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest px-6"
        >
          Viết bài mới
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {myBlogs.map((blog) => (
          <motion.div
            key={blog._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-5 hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {blog.status === "rejected" && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
            )}

            <div className="size-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
              <img
                src={blog.image || "/images/blog-placeholder.jpg"}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  {getStatusBadge(blog.status)}
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    {blog.category} • {formatDateVietnamese(blog.createdAt)}
                  </span>
                </div>
                <h4 className="font-black text-gray-900 truncate pr-20">
                  {blog.title}
                </h4>
                {blog.status === "rejected" && blog.rejectionReason && (
                  <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-start gap-1">
                    <Info className="size-3 flex-shrink-0 mt-0.5" />
                    Lý do từ chối: {blog.rejectionReason}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 rounded-xl font-bold text-[11px] border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleEditBlog(blog)}
                >
                  <Settings className="size-3.5 mr-1.5" /> Sửa bài
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 rounded-xl font-bold text-[11px] border-red-100 text-red-500 hover:bg-red-50"
                  onClick={() => handleDeleteBlog(blog._id)}
                >
                  <Trash2 className="size-3.5 mr-1.5" /> Xóa
                </Button>
                {blog.status === "published" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 rounded-xl font-bold text-[11px] border-gray-200 text-gray-600 hover:bg-gray-50"
                    onClick={() => navigate(`/blog/${blog._id}`)}
                  >
                    <Eye className="size-3.5 mr-1.5" /> Xem
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <BlogEditorDialog
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingBlog(null);
        }}
        initialData={editingBlog}
        onSave={async (data) => {
          try {
            if (editingBlog?._id) {
              // Update existing blog
              await api.put(`/api/blogs/${editingBlog._id}`, data);
              toast.success("Cập nhật bài viết thành công!");
            } else {
              // Create new blog (if we add this functionality later)
              await api.post("/api/blogs", data);
              toast.success("Gửi bài viết thành công!");
            }

            setEditorOpen(false);
            setEditingBlog(null);

            // Refresh blog list
            const res = await api.get("/api/blogs/my-blogs");
            setMyBlogs(res.data);
          } catch (err) {
            console.error("Failed to save blog:", err);
            toast.error("Không thể lưu bài viết. Vui lòng thử lại.");
          }
        }}
      />
    </div>
  );
}
