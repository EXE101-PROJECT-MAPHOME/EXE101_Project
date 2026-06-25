import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from "framer-motion";
import { useAuth } from "@/app/contexts/AuthContext";
import api from "@/app/utils/api";
import { getAvatarUrl, getInitials } from "@/app/utils/avatarUtils";
import { RentalProperty, VerificationRequest } from "@/app/components/types";
import { Button } from "@/app/components/ui/button";
import { EditPropertyDialog } from "@/app/components/EditPropertyDialog";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import CalendarView from "@/app/components/CalendarView";
import {
  FileText, PlusCircle, Eye, Edit, Trash2, MapPin, Clock,
  CalendarDays, TrendingUp, Star, ShieldCheck, LayoutDashboard,
  Settings, Bell, Loader2, Menu, X as XIcon, Phone, Mail,
  Users, Sparkles, Zap, Bot, ChevronRight, ArrowUpRight,
  BarChart3, Activity, Target, Award, Handshake, LogOut,
  Home, CheckCircle2, XCircle, AlertCircle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type DashboardTab = "overview" | "posts" | "bookings" | "leads" | "settings";

const menuItems: Array<{ id: DashboardTab; label: string; icon: any; description: string }> = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard, description: "Analytics & KPIs" },
  { id: "posts", label: "Tin quản lý", icon: FileText, description: "Bất động sản" },
  { id: "bookings", label: "Lịch xem phòng", icon: CalendarDays, description: "Lịch hẹn" },
  { id: "leads", label: "Khách hàng (AI)", icon: Bot, description: "AI Matching" },
  { id: "settings", label: "Cài đặt", icon: Settings, description: "Tài khoản" },
];

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("vi-VN");
    });
  }, [spring]);

  return <span ref={ref}>0</span>;
}

// ─── Floating Orb Background ─────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-12%] right-[-8%] w-[45%] h-[45%] bg-violet-400/8 rounded-full blur-[130px]"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-[-12%] left-[-8%] w-[50%] h-[50%] bg-indigo-300/10 rounded-full blur-[140px]"
      />
      <motion.div
        animate={{ x: [0, 20, -20, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        className="absolute top-[35%] left-[25%] w-[30%] h-[30%] bg-amber-300/7 rounded-full blur-[110px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[60%] right-[15%] w-[20%] h-[20%] bg-teal-300/8 rounded-full blur-[100px]"
      />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, gradient, shadow, trend, onClick, delay = 0
}: {
  label: string; value: number; icon: any; gradient: string; shadow: string;
  trend?: number; onClick?: () => void; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-5 md:p-6 border border-white/60 cursor-pointer group overflow-hidden ${shadow}`}
      style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.6)" }}
    >
      {/* Glow accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />

      <div className="flex justify-between items-start mb-4">
        <p className="text-xs text-slate-500 font-semibold leading-tight pr-2">{label}</p>
        <div className={`p-2.5 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="size-4 text-white" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-3xl font-black text-slate-900 tracking-tight">
          <AnimatedNumber value={value} />
        </span>
        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.3 }}
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
              }`}
          >
            <TrendingUp className={`size-3 ${trend < 0 ? "rotate-180" : ""}`} />
            {Math.abs(trend)}%
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BrokerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, isAuthenticated, refreshProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<RentalProperty | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean; title?: string; description?: string; onConfirm?: () => Promise<void> | void;
  }>({ open: false });

  const [brokerPosts, setBrokerPosts] = useState<RentalProperty[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0, approvedProperties: 0, pendingProperties: 0,
    totalBookings: 0, totalViews: 0, totalFavorites: 0,
    trends: { totalPostsTrend: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeTab = (searchParams.get("tab") as DashboardTab) || "overview";
  const setActiveTab = (tab: DashboardTab) => setSearchParams({ tab });

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [statsRes, postsRes, bookingsRes, leadsRes] = await Promise.all([
        api.get("/api/broker/analytics"),
        api.get("/api/broker/properties"),
        api.get("/api/broker/bookings"),
        api.get("/api/broker/leads"),
      ]);
      setStats(statsRes.data);
      setBrokerPosts(postsRes.data);
      setBookings(bookingsRes.data);
      setLeads(leadsRes.data.leads || []);
    } catch (err: any) {
      toast.error("Không thể tải dữ liệu Dashboard.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "broker") {
      navigate("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, user?.role, navigate]);

  const handleDeleteProperty = (id: string) => {
    setConfirmDelete({
      open: true, title: "Xóa tin đăng",
      description: "Bạn có chắc chắn muốn xóa tin đăng này? Thao tác này không thể hoàn tác.",
      onConfirm: async () => {
        try {
          await api.delete(`/api/properties/${id}`);
          setBrokerPosts(prev => prev.filter(p => p._id !== id && p.id !== id));
          toast.success("Đã xóa tin đăng trọ thành công!");
        } catch { toast.error("Không thể xóa tin đăng."); }
        finally { setConfirmDelete({ open: false }); }
      },
    });
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}/status`, { status });
      toast.success("Cập nhật trạng thái lịch hẹn thành công!");
      const res = await api.get("/api/broker/bookings");
      setBookings(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật trạng thái.");
    }
  };

  const statCards = useMemo(() => [
    { label: "Tổng tin quản lý", value: stats.totalProperties, icon: FileText, gradient: "from-violet-500 to-indigo-600", shadow: "shadow-violet-500/10", trend: stats.trends?.totalPostsTrend, onClick: () => setActiveTab("posts") },
    { label: "Lịch hẹn xem nhà", value: stats.totalBookings, icon: CalendarDays, gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/10", onClick: () => setActiveTab("bookings") },
    { label: "Tổng lượt xem", value: stats.totalViews, icon: Eye, gradient: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/10" },
    { label: "Quan tâm", value: stats.totalFavorites, icon: Star, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/10" },
  ], [stats]);

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <FloatingOrbs />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="relative z-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
            <Sparkles className="size-6 text-white" />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] relative z-10"
        >
          Đang tải dashboard môi giới
        </motion.p>
      </div>
    );
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <motion.div
        initial={mobile ? { opacity: 0, x: -16 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-8 cursor-pointer group"
        onClick={() => navigate("/")}
      >
        <div className="relative">
          <div className="p-2.5 bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all duration-300">
            <Sparkles className="size-5 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 leading-tight">MapHome</h1>
          <p className="text-[9px] font-black bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent uppercase tracking-[0.2em]">
            Môi giới Console
          </p>
        </div>
      </motion.div>

      {/* Nav */}
      <nav className="space-y-1 flex-1">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              initial={mobile ? { opacity: 0, x: -20 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.06 }}
              whileHover={{ x: active ? 0 : 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTab(item.id); if (mobile) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${active
                  ? "text-white shadow-lg shadow-violet-500/25"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-2xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3.5 w-full">
                <Icon className={`size-[18px] shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                <div className="flex-1 text-left">
                  <span className="block leading-tight">{item.label}</span>
                  <span className={`text-[10px] font-medium leading-none ${active ? "text-violet-100" : "text-slate-400"}`}>
                    {item.description}
                  </span>
                </div>
                {active && <ChevronRight className="size-3.5 text-white/60 shrink-0" />}
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* User section */}
      <motion.div
        initial={mobile ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="pt-5 border-t border-slate-200/60 space-y-2"
      >
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-slate-50 to-violet-50/50 rounded-2xl border border-slate-200/60">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.avatar ? (
              <img src={getAvatarUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(user?.fullName, user?.username)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900 truncate">{user?.fullName || user?.username}</p>
            {(() => {
              const tier = user?.subscriptionTier || "Free";
              const isFree = tier.toLowerCase() === "free";
              return (
                <span className={`text-[9px] font-black uppercase tracking-wider ${isFree ? "text-slate-500" : "text-amber-600"}`}>
                  ✦ Môi giới {isFree ? "Thường" : tier}
                </span>
              );
            })()}
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 text-sm font-semibold transition-all duration-200"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </button>
      </motion.div>
    </>
  );

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      <FloatingOrbs />

      <div className="flex flex-1 relative z-10">
        {/* ─── Desktop Sidebar ─── */}
        <aside className="hidden md:flex flex-col w-72 bg-white/70 backdrop-blur-xl border-r border-slate-200/40 p-6 shrink-0 h-screen sticky top-0">
          <SidebarContent />
        </aside>

        {/* ─── Mobile Header ─── */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/40 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-md shadow-violet-500/20">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <span className="font-black text-slate-900 text-sm tracking-tight">MapHome</span>
              <span className="text-[8px] font-black text-violet-600 block uppercase tracking-widest leading-none">Môi giới</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => fetchData(true)}
              className="p-2 hover:bg-slate-100 rounded-xl"
            >
              <motion.div animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.8, repeat: isRefreshing ? Infinity : 0 }}>
                <RefreshCw className="size-4 text-slate-500" />
              </motion.div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl"
            >
              <AnimatePresence mode="wait">
                <motion.div key={sidebarOpen ? "x" : "menu"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  {sidebarOpen ? <XIcon className="size-5 text-slate-700" /> : <Menu className="size-5 text-slate-700" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* ─── Mobile Sidebar ─── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900 z-30 md:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed top-0 bottom-0 left-0 w-72 bg-white/95 backdrop-blur-xl z-40 p-6 flex flex-col md:hidden shadow-2xl shadow-slate-900/20"
              >
                <SidebarContent mobile />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Xin chào, {user?.fullName?.split(" ").slice(-1)[0] || user?.username}!
                </h2>
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.3 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-amber-500/25"
                >
                  <Handshake className="size-3" />
                  Môi giới
                </motion.span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => fetchData(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, repeat: isRefreshing ? Infinity : 0 }}>
                  <RefreshCw className="size-4" />
                </motion.div>
                Làm mới
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/post-room")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-violet-500/25 transition-all"
              >
                <PlusCircle className="size-4" />
                Đăng tin mới
              </motion.button>
            </div>
          </motion.div>

          {/* ===== OVERVIEW ===== */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-8">

                {/* Hero Banner */}
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-5 md:p-8 text-white shadow-2xl shadow-violet-600/20">
                  {/* Animated decorative elements */}
                  <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-8 -top-8 w-48 h-48 border border-white/10 rounded-full" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                      <motion.span
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] md:text-xs font-black uppercase tracking-wider mb-3 border border-white/20"
                      >
                        <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                          <Sparkles className="size-3 text-amber-300" />
                        </motion.div>
                        Môi giới Chuyên nghiệp
                      </motion.span>
                      <motion.h3
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="text-xl md:text-3xl font-black tracking-tight mb-2"
                      >
                        Chào mừng trở lại! 👋
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                        className="text-violet-100/90 text-xs md:text-sm font-medium max-w-lg leading-relaxed"
                      >
                        Trợ lý AI đã phân tích <strong className="text-white">{leads.length}</strong> khách tiềm năng phù hợp với địa bàn của bạn.
                      </motion.p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: "spring" }}
                      className="flex gap-2.5 shrink-0"
                    >
                      {[
                        { label: "Tin hoạt động", value: stats.approvedProperties, icon: CheckCircle2 },
                        { label: "Đang chờ", value: stats.pendingProperties, icon: Clock },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className="flex-1 md:flex-none bg-white/10 backdrop-blur-md px-4 md:px-5 py-3 md:py-4 rounded-2xl border border-white/15 text-center">
                            <Icon className="size-4 text-violet-200 mx-auto mb-1.5 opacity-70" />
                            <span className="block text-[8px] md:text-[9px] text-violet-200 font-black uppercase tracking-widest leading-none mb-1.5">{item.label}</span>
                            <span className="text-xl md:text-2xl font-black">{item.value}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {statCards.map((card, i) => (
                    <StatCard key={i} {...card} delay={i * 0.08} />
                  ))}
                </div>

                {/* Two-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Bookings */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/60 shadow-sm"
                    style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md shadow-blue-500/20">
                          <CalendarDays className="size-3.5 text-white" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900">Lịch hẹn gần đây</h3>
                      </div>
                      <button onClick={() => setActiveTab("bookings")} className="text-[11px] text-violet-600 font-bold hover:text-violet-800 flex items-center gap-1 transition-colors">
                        Xem tất cả <ArrowUpRight className="size-3" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                          <CalendarDays className="size-8 opacity-30 mb-2" />
                          <p className="text-xs font-semibold">Chưa có lịch hẹn nào</p>
                        </div>
                      ) : bookings.slice(0, 4).map((b, idx) => (
                        <motion.div
                          key={b._id || idx}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + idx * 0.07 }}
                          className="flex items-center gap-3 p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl transition-colors cursor-default border border-slate-100"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                            {(b.userId?.fullName || b.customerName || "?")[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{b.userId?.fullName || b.customerName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{b.propertyId?.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-slate-500">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("vi-VN") : ""}</p>
                            <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1 ${b.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : b.status === "pending" ? "bg-amber-100 text-amber-700" : b.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                              }`}>
                              {b.status === "confirmed" ? "Đã duyệt" : b.status === "pending" ? "Chờ duyệt" : b.status === "completed" ? "Hoàn tất" : "Đã hủy"}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* AI Leads */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/60"
                    style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md shadow-violet-500/20">
                          <Bot className="size-3.5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Khách tiềm năng (AI)</h3>
                          <p className="text-[10px] text-slate-400 font-medium">Phân tích hành vi thực tế</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab("leads")} className="text-[11px] text-violet-600 font-bold hover:text-violet-800 flex items-center gap-1 transition-colors">
                        Xem tất cả <ArrowUpRight className="size-3" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {leads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                          <Bot className="size-8 opacity-30 mb-2" />
                          <p className="text-xs font-semibold">Chưa có AI lead nào</p>
                        </div>
                      ) : leads.slice(0, 4).map((l, idx) => (
                        <motion.div
                          key={l._id || idx}
                          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.07 }}
                          className="p-3.5 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 hover:from-violet-100/60 rounded-2xl border border-violet-100/60 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black">
                                {(l.fullName || l.name || "?")[0]}
                              </div>
                              <p className="text-xs font-bold text-slate-900">{l.fullName || l.name}</p>
                            </div>
                            <span className="text-[9px] font-black uppercase bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Target className="size-2.5" /> AI Match
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            {l.requirements?.district && `Quận ${l.requirements.district}`}
                            {l.requirements?.budget && ` • Tối đa ${l.requirements.budget.toLocaleString("vi-VN")} đ`}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Performance Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 border border-slate-700/50 text-white overflow-hidden relative"
                >
                  <motion.div animate={{ x: ["0%", "100%"] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-transparent via-white/3 to-transparent skew-x-12" />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="size-4 text-violet-400" />
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Hiệu suất tháng này</span>
                      </div>
                      <p className="text-2xl font-black">
                        {stats.approvedProperties} / {stats.totalProperties}
                        <span className="text-sm font-bold text-slate-400 ml-2">tin đăng đã duyệt</span>
                      </p>
                    </div>
                    <div className="w-full md:w-64">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                        <span>Tỷ lệ duyệt</span>
                        <span className="text-violet-400">
                          {stats.totalProperties > 0 ? Math.round((stats.approvedProperties / stats.totalProperties) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${stats.totalProperties > 0 ? (stats.approvedProperties / stats.totalProperties) * 100 : 0}%` }}
                          transition={{ delay: 0.7, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ===== POSTS ===== */}
            {activeTab === "posts" && (
              <motion.div key="posts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Danh sách tin đăng</h3>
                    <p className="text-sm text-slate-500 font-medium">{brokerPosts.length} bất động sản đang quản lý</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/post-room")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-violet-500/20"
                  >
                    <PlusCircle className="size-4" /> Đăng tin mới
                  </motion.button>
                </div>

                {brokerPosts.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/80 rounded-3xl border border-slate-200/60">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                      <FileText className="size-14 text-slate-300 mb-4" />
                    </motion.div>
                    <p className="text-slate-400 text-sm font-semibold">Chưa có tin đăng nào được quản lý</p>
                    <button onClick={() => navigate("/post-room")} className="mt-4 px-5 py-2 bg-violet-600 text-white text-sm font-bold rounded-2xl">Đăng tin ngay</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {brokerPosts.map((post, idx) => (
                      <motion.div
                        key={post._id || post.id}
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.06, ease: [0.23, 1, 0.32, 1] }}
                        whileHover={{ y: -4 }}
                        className="bg-white/90 rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-400 group flex flex-col sm:flex-row"
                      >
                        <div className="relative h-44 sm:h-auto sm:w-40 shrink-0 bg-slate-100 overflow-hidden">
                          {post.image ? (
                            <img src={post.image} alt={post.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-violet-50">
                              <FileText className="size-10 text-slate-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className={`absolute top-3 left-3 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${post.status === "approved" ? "bg-emerald-600/90" : post.status === "expired" ? "bg-red-500/90" : "bg-amber-500/90"
                            }`}>
                            {post.status === "approved" ? "✓ Hoạt động" : post.status === "expired" ? "Hết hạn" : "⏳ Chờ duyệt"}
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-violet-700 transition-colors">{post.name}</h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 line-clamp-1">
                              <MapPin className="size-3 text-slate-400 shrink-0" />
                              {post.address}
                            </p>
                            {post.price && (
                              <p className="text-sm font-black text-violet-700 mt-2">
                                {Number(post.price).toLocaleString("vi-VN")} đ<span className="text-[10px] font-medium text-slate-400">/tháng</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700 font-black text-[10px] sm:text-xs">
                                {(post as any).ownerName ? (post as any).ownerName[0].toUpperCase() : "C"}
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block leading-none">Chủ nhà</span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-800">{(post as any).ownerName || "Chưa rõ"}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setEditingProperty(post)}
                                className="p-1.5 sm:p-2 rounded-xl hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors">
                                <Edit className="size-4" />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteProperty(post._id || (post as any).id)}
                                className="p-1.5 sm:p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="size-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== BOOKINGS ===== */}
            {activeTab === "bookings" && (
              <motion.div key="bookings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Lịch xem phòng</h3>
                  <p className="text-sm text-slate-500 font-medium">{bookings.length} lịch hẹn đang quản lý</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/60 shadow-sm">
                  <CalendarView
                    bookings={bookings.map(b => ({
                      id: b._id || b.id,
                      title: `${b.userId?.fullName || b.customerName || "Khách"} — ${b.propertyId?.name || "Phòng trọ"}`,
                      date: b.bookingDate,
                      time: b.bookingTime,
                      status: b.status,
                      phone: b.userId?.phone || b.customerPhone,
                    }))}
                    onUpdateStatus={handleUpdateBookingStatus}
                  />
                </div>
              </motion.div>
            )}

            {/* ===== LEADS ===== */}
            {activeTab === "leads" && (
              <motion.div key="leads" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }} className="space-y-6">
                {/* AI Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-xl shadow-violet-500/20">
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-12 -top-12 w-48 h-48 border border-white/10 rounded-full" />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-white/15 rounded-2xl border border-white/20">
                      <Bot className="size-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg mb-1">Phân tích Khách hàng bằng AI</h3>
                      <p className="text-violet-100/80 text-sm font-medium leading-relaxed">
                        Hệ thống AI của MapHome phân tích hành vi tìm kiếm và ghép nối khách thuê phù hợp nhất với bất động sản của bạn.
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-full border border-white/20">
                          <Award className="size-3 text-amber-300" /> {leads.length} khách phù hợp
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-full border border-white/20">
                          <Zap className="size-3 text-yellow-300" /> Cập nhật thời gian thực
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-white/80 rounded-3xl border border-slate-200/60">
                    <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity }}>
                      <Bot className="size-14 text-slate-300 mb-4" />
                    </motion.div>
                    <p className="text-slate-400 text-sm font-semibold">Chưa phát hiện AI leads phù hợp</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {leads.map((l, idx) => (
                      <motion.div
                        key={l._id || idx}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06, ease: [0.23, 1, 0.32, 1] }}
                        whileHover={{ y: -3 }}
                        className="bg-white/90 rounded-3xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-md shadow-violet-500/20">
                              {(l.fullName || l.name || "?")[0]}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 text-sm">{l.fullName || l.name}</h4>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="size-3" /> {l.phone || "Chưa có SĐT"}
                              </p>
                            </div>
                          </div>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="text-[9px] font-black uppercase bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1"
                          >
                            <Target className="size-2.5" /> Phù hợp AI
                          </motion.span>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-100">
                          {l.requirements?.district && (
                            <div className="flex items-center gap-2 text-xs">
                              <MapPin className="size-3.5 text-violet-400 shrink-0" />
                              <span className="text-slate-500">Khu vực:</span>
                              <span className="font-bold text-slate-900">Quận {l.requirements.district}</span>
                            </div>
                          )}
                          {l.requirements?.budget && (
                            <div className="flex items-center gap-2 text-xs">
                              <BarChart3 className="size-3.5 text-emerald-400 shrink-0" />
                              <span className="text-slate-500">Ngân sách:</span>
                              <span className="font-bold text-slate-900">{l.requirements.budget.toLocaleString("vi-VN")} đ</span>
                            </div>
                          )}
                          {l.note && (
                            <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl px-3 py-2 mt-2">"{l.note}"</p>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          {l.phone && (
                            <a href={`tel:${l.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-2xl transition-colors border border-violet-100">
                              <Phone className="size-3.5" /> Gọi ngay
                            </a>
                          )}
                          {l.email && (
                            <a href={`mailto:${l.email}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-2xl transition-colors border border-slate-200">
                              <Mail className="size-3.5" /> Email
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== SETTINGS ===== */}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Cài đặt tài khoản</h3>
                    <p className="text-sm text-slate-500 font-medium">Thông tin và cấu hình tài khoản môi giới</p>
                  </div>

                  {/* Profile Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 rounded-3xl p-6 border border-slate-200/60 shadow-sm"
                  >
                    <div className="flex items-center gap-5 mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-violet-500/25">
                          {user?.avatar ? (
                            <img src={getAvatarUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                          ) : getInitials(user?.fullName, user?.username)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-base">{user?.fullName || user?.username}</h4>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider mt-1">
                          <Handshake className="size-3" /> Môi giới Chuyên nghiệp
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Tên hiển thị", value: user?.fullName, icon: Users },
                        { label: "Số điện thoại", value: user?.phone, icon: Phone },
                        { label: "Email liên hệ", value: user?.email, icon: Mail },
                      ].map((field, i) => {
                        const Icon = field.icon;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                          >
                            <div className="w-8 h-8 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center shrink-0">
                              <Icon className="size-4 text-violet-500" />
                            </div>
                            <div>
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</span>
                              <span className="text-sm font-bold text-slate-900">{field.value || "Chưa thiết lập"}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="mt-5 pt-5 border-t border-slate-100 flex gap-3">
                      <button onClick={() => window.alert("Tính năng Chỉnh sửa thông tin đang được phát triển cho phiên bản Web. Vui lòng sử dụng Mobile App để chỉnh sửa!")}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-2xl shadow-md shadow-violet-500/20 hover:opacity-90 transition-opacity"
                      >
                        <Edit className="size-4" /> Chỉnh sửa thông tin
                      </button>
                      <button onClick={() => window.alert("Tính năng Cài đặt đang được phát triển cho phiên bản Web. Vui lòng sử dụng Mobile App để cài đặt!")}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                      >
                        <Settings className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDelete.open}
        title={confirmDelete.title}
        description={confirmDelete.description}
        onConfirm={confirmDelete.onConfirm}
        onCancel={() => setConfirmDelete({ open: false })}
      />

      {editingProperty && (
        <EditPropertyDialog
          property={editingProperty}
          isOpen={!!editingProperty}
          onClose={() => setEditingProperty(null)}
          onSuccess={async () => {
            setEditingProperty(null);
            const res = await api.get("/api/broker/properties");
            setBrokerPosts(res.data);
          }}
        />
      )}
    </div>
  );
}
