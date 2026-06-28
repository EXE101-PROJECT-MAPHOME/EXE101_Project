import { useState, useEffect } from "react";
import {
  Check,
  Home,
  MapPin,
  Rocket,
  Shield,
  Star,
  Zap,
  PackageSearch,
  ArrowRight,
  Sparkles,
  Building2,
  Briefcase,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Navbar } from "@/app/components/Navbar";
import api from "@/app/utils/api";
import { Footer } from "@/app/components/Footer";
import { useAuth } from "@/app/contexts/AuthContext";

/* ─────────── Types ─────────── */
type BillingCycle = "monthly" | "yearly";

interface PricingTier {
  id?: string;
  _id?: string;
  planId: string;
  name: string;
  price: number;
  yearlyPrice: number;
  badge?: string;
  badgeColor?: string;
  icon: string;
  description: string;
  features: Array<{ text: string; included: boolean }>;
  cta: string;
  ctaVariant: "outline" | "secondary" | "default" | "ghost";
  highlighted?: boolean;
  targetRole?: string;
}

/* ─────────── Icon map ─────────── */
const iconMap: Record<string, any> = { Home, MapPin, Star, Rocket, Shield, Zap };
function getIcon(name: string) { return iconMap[name] || Home; }

/* ─────────── Theme per planId ─────────── */
interface Theme {
  cardBg: string;
  headerBg: string;
  iconWrap: string;
  iconColor: string;
  priceColor: string;
  badgeBg: string;
  checkBg: string;
  checkIcon: string;
  btn: string;
  border: string;
  glow: string;
  titleColor: string;
  descColor: string;
  featureText: string;
  priceUnit: string;
}

function getTheme(planId: string, highlighted: boolean, index: number = 0): Theme {
  const id = (planId || "").toLowerCase();

  if (id === "free")
    return {
      cardBg: "bg-gradient-to-b from-slate-50 to-white",
      headerBg: "bg-transparent",
      iconWrap: "bg-white border border-slate-200 shadow-sm",
      iconColor: "text-slate-600",
      priceColor: "text-slate-800",
      badgeBg: "bg-slate-100 text-slate-600 border border-slate-200",
      checkBg: "bg-slate-100",
      checkIcon: "text-slate-400",
      btn: "bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm",
      border: "border-slate-200",
      glow: "",
      titleColor: "text-slate-900",
      descColor: "text-slate-500",
      featureText: "text-slate-700",
      priceUnit: "text-slate-400",
    };

  if (id === "basic")
    return {
      cardBg: "bg-gradient-to-b from-blue-50 to-white",
      headerBg: "bg-transparent",
      iconWrap: "bg-white border border-blue-200 shadow-sm",
      iconColor: "text-blue-600",
      priceColor: "text-blue-700",
      badgeBg: "bg-blue-100 text-blue-700 border border-blue-200",
      checkBg: "bg-blue-500",
      checkIcon: "text-white",
      btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20",
      border: "border-blue-100",
      glow: "",
      titleColor: "text-slate-900",
      descColor: "text-slate-500",
      featureText: "text-slate-700",
      priceUnit: "text-blue-400/80",
    };

  if (id === "standard")
    return {
      cardBg: "bg-gradient-to-br from-indigo-950 to-indigo-900",
      headerBg: "bg-transparent",
      iconWrap: "bg-indigo-500/20 border border-indigo-500/30",
      iconColor: "text-indigo-300",
      priceColor: "text-white",
      badgeBg: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20",
      checkBg: "bg-indigo-500",
      checkIcon: "text-white",
      btn: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25",
      border: "border-indigo-500/20",
      glow: "shadow-indigo-500/20 ring-indigo-500/50",
      titleColor: "text-white",
      descColor: "text-indigo-200/70",
      featureText: "text-slate-200",
      priceUnit: "text-indigo-300/70",
    };

  if (id === "pro")
    return {
      cardBg: "bg-gradient-to-br from-[#09090b] to-[#18181b]",
      headerBg: "bg-transparent",
      iconWrap: "bg-rose-500/20 border border-rose-500/30",
      iconColor: "text-rose-400",
      priceColor: "text-white",
      badgeBg: "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20",
      checkBg: "bg-rose-500",
      checkIcon: "text-white",
      btn: "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25",
      border: "border-rose-500/20",
      glow: "shadow-rose-500/20 ring-rose-500/50",
      titleColor: "text-white",
      descColor: "text-rose-200/60",
      featureText: "text-slate-200",
      priceUnit: "text-rose-300/60",
    };

  // Broker plans
  if (id === "broker-lite")
    return {
      cardBg: "bg-gradient-to-b from-sky-50 to-white",
      headerBg: "bg-transparent",
      iconWrap: "bg-white border border-sky-200 shadow-sm",
      iconColor: "text-sky-600",
      priceColor: "text-sky-700",
      badgeBg: "bg-sky-100 text-sky-700 border border-sky-200",
      checkBg: "bg-sky-500",
      checkIcon: "text-white",
      btn: "bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20",
      border: "border-sky-100",
      glow: "",
      titleColor: "text-slate-900",
      descColor: "text-slate-500",
      featureText: "text-slate-700",
      priceUnit: "text-sky-400/80",
    };

  if (id === "broker-pro")
    return {
      cardBg: "bg-gradient-to-br from-violet-950 to-violet-900",
      headerBg: "bg-transparent",
      iconWrap: "bg-violet-500/20 border border-violet-500/30",
      iconColor: "text-violet-300",
      priceColor: "text-white",
      badgeBg: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20",
      checkBg: "bg-violet-500",
      checkIcon: "text-white",
      btn: "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25",
      border: "border-violet-500/20",
      glow: "shadow-violet-500/20 ring-violet-500/50",
      titleColor: "text-white",
      descColor: "text-violet-200/70",
      featureText: "text-slate-200",
      priceUnit: "text-violet-300/70",
    };

  if (id === "broker-agency")
    return {
      cardBg: "bg-gradient-to-br from-amber-950 to-[#292524]",
      headerBg: "bg-transparent",
      iconWrap: "bg-amber-500/20 border border-amber-500/30",
      iconColor: "text-amber-400",
      priceColor: "text-white",
      badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20",
      checkBg: "bg-amber-500",
      checkIcon: "text-white",
      btn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/20 ring-amber-500/50",
      titleColor: "text-white",
      descColor: "text-amber-200/60",
      featureText: "text-slate-200",
      priceUnit: "text-amber-300/60",
    };

  // Fallback themes for custom plans based on index
  const fallbacks: Theme[] = [
    {
      cardBg: "bg-gradient-to-b from-teal-50 to-white",
      headerBg: "bg-transparent",
      iconWrap: "bg-white border border-teal-200 shadow-sm",
      iconColor: "text-teal-600",
      priceColor: "text-teal-700",
      badgeBg: "bg-teal-100 text-teal-700 border border-teal-200",
      checkBg: "bg-teal-500",
      checkIcon: "text-white",
      btn: "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20",
      border: "border-teal-100",
      glow: "",
      titleColor: "text-slate-900",
      descColor: "text-slate-500",
      featureText: "text-slate-700",
      priceUnit: "text-teal-400/80",
    },
    {
      cardBg: "bg-gradient-to-b from-pink-50 to-white",
      headerBg: "bg-transparent",
      iconWrap: "bg-white border border-pink-200 shadow-sm",
      iconColor: "text-pink-600",
      priceColor: "text-pink-700",
      badgeBg: "bg-pink-100 text-pink-700 border border-pink-200",
      checkBg: "bg-pink-500",
      checkIcon: "text-white",
      btn: "bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-500/20",
      border: "border-pink-100",
      glow: "",
      titleColor: "text-slate-900",
      descColor: "text-slate-500",
      featureText: "text-slate-700",
      priceUnit: "text-pink-400/80",
    },
    {
      cardBg: "bg-gradient-to-br from-cyan-950 to-[#0f172a]",
      headerBg: "bg-transparent",
      iconWrap: "bg-cyan-500/20 border border-cyan-500/30",
      iconColor: "text-cyan-400",
      priceColor: "text-white",
      badgeBg: "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/20",
      checkBg: "bg-cyan-500",
      checkIcon: "text-white",
      btn: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/25",
      border: "border-cyan-500/20",
      glow: "shadow-cyan-500/20 ring-cyan-500/50",
      titleColor: "text-white",
      descColor: "text-cyan-200/60",
      featureText: "text-slate-200",
      priceUnit: "text-cyan-300/60",
    }
  ];

  return fallbacks[index % fallbacks.length];
}

/* ─────────── PricingCard ─────────── */
function PricingCard({ tier, billingCycle, index }: { tier: PricingTier; billingCycle: BillingCycle; index: number }) {
  const navigate = useNavigate();
  const IconComponent = getIcon(tier.icon);
  const displayPrice = billingCycle === "monthly" ? tier.price : tier.yearlyPrice;
  const theme = getTheme(tier.planId, !!tier.highlighted, index);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
      className="flex flex-col h-full"
    >
      <div
        className={`
          relative flex flex-col h-full rounded-2xl border overflow-hidden
          transition-all duration-300
          ${theme.cardBg} ${theme.border}
          ${tier.highlighted
            ? `shadow-2xl ${theme.glow} ring-2 ring-offset-1 ${theme.border}`
            : "shadow-md hover:shadow-xl"
          }
        `}
      >
        {/* ── Popular badge / Top line ── */}
        {tier.highlighted && (
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />
        )}

        {/* ── Header block ── */}
        <div className={`${theme.headerBg} px-5 pt-5 pb-4`}>
          <div className="flex items-start justify-between gap-3">
            {/* Icon */}
            <div className={`${theme.iconWrap} rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <IconComponent className={`${theme.iconColor} w-5 h-5`} />
            </div>

            {/* Badge */}
            {tier.badge && (
              <span className={`${theme.badgeBg} text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0`}>
                {tier.badge}
              </span>
            )}
          </div>

          <h3 className={`mt-3 text-base font-black leading-tight ${theme.titleColor}`}>{tier.name}</h3>
          <p className={`mt-0.5 text-xs font-medium leading-snug line-clamp-2 ${theme.descColor}`}>{tier.description}</p>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-1 overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayPrice}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25, type: "spring", bounce: 0 }}
                className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.priceColor}`}
              >
                {displayPrice === 0 ? "Miễn phí" : new Intl.NumberFormat("vi-VN").format(displayPrice)}
              </motion.span>
            </AnimatePresence>
            {displayPrice > 0 && (
              <span className={`text-sm font-bold ${theme.priceUnit}`}>đ/{billingCycle === "monthly" ? "tháng" : "năm"}</span>
            )}
          </div>

          {billingCycle === "yearly" && displayPrice > 0 && (
            <span className="inline-block mt-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Tiết kiệm 20%
            </span>
          )}
        </div>

        {/* ── Features ── */}
        <div className="flex-1 px-5 py-4 space-y-2.5 relative z-10">
          <div className="h-px w-full bg-slate-200/40 my-2" />
          {tier.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className={`flex-shrink-0 w-4 h-4 rounded-md flex items-center justify-center mt-0.5 ${feature.included ? theme.checkBg : (theme.titleColor === "text-white" ? "bg-white/10" : "bg-slate-200/60")}`}>
                {feature.included
                  ? <Check className={`w-2.5 h-2.5 ${theme.checkIcon}`} strokeWidth={3.5} />
                  : <X className={`w-2.5 h-2.5 ${theme.titleColor === "text-white" ? "text-white/20" : "text-slate-400"}`} strokeWidth={3} />
                }
              </div>
              <span className={`text-xs font-semibold leading-snug ${feature.included ? theme.featureText : (theme.titleColor === "text-white" ? "text-white/20 line-through" : "text-slate-400 line-through")}`}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="p-4 sm:p-5 pt-2">
          <button
            onClick={() => navigate("/checkout", { state: { selectedTier: tier.planId, billingCycle } })}
            className={`
              w-full h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-black
              flex items-center justify-center gap-2
              transition-all duration-200 active:scale-95
              ${theme.btn}
              ${tier.highlighted ? "shadow-lg" : ""}
            `}
          >
            {tier.cta || "Chọn gói"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────── Main Page ─────────── */
export function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultRole = user?.role === "broker" ? "broker" : "landlord";
  const [activeRole, setActiveRole] = useState<"landlord" | "broker">(defaultRole);

  const isBroker = user?.role === "broker";
  const isLandlord = user?.role === "landlord";
  const showRoleSwitcher = !isBroker && !isLandlord;

  useEffect(() => {
    if (user?.role === "broker") setActiveRole("broker");
    else if (user?.role === "landlord") setActiveRole("landlord");
  }, [user?.role]);

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast.warning("Bạn đã hủy giao dịch thanh toán gói cước.");
      const p = new URLSearchParams(searchParams);
      p.delete("cancelled");
      setSearchParams(p, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/subscriptions/plans?role=${activeRole}`);
        if (res.status === 200) {
          setPricingTiers(res.data.filter((t: any) => t.isActive));
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [activeRole]);

  // Determine optimal grid cols based on plan count
  // User requested 2 columns on desktop
  const gridCols = "sm:grid-cols-2 max-w-4xl";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* ══ HERO ══ */}
        <section className="relative bg-white border-b border-slate-100 pt-14 pb-8 sm:pt-28 sm:pb-16 overflow-hidden">
          {/* Soft aura blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-full bg-blue-100/50 rounded-full blur-[120px]" />
            <div className="absolute -top-1/4 -right-1/4 w-1/2 h-full bg-violet-100/40 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
            {/* Pill label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6"
            >
              <Sparkles className="w-3 h-3" />
              MapHome Premium Plans
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight"
            >
              Nâng tầm{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-500">
                tin đăng
              </span>
              <br />
              chốt khách{" "}
              <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
                nhanh hơn
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.16 }}
              className="mt-4 text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-xl mx-auto"
            >
              Chọn giải pháp hiển thị thông minh để tiếp cận đúng đối tượng mục tiêu của bạn.
            </motion.p>

            {/* Controls row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              {/* Role switcher */}
              {showRoleSwitcher && (
                <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1 w-full sm:w-auto relative overflow-x-auto no-scrollbar max-w-full">
                  <button
                    onClick={() => setActiveRole("landlord")}
                    className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-black transition-colors duration-200 z-10 whitespace-nowrap ${
                      activeRole === "landlord"
                        ? "text-blue-700"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {activeRole === "landlord" && (
                      <motion.div layoutId="activeRoleBg" className="absolute inset-0 bg-white shadow-sm rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                    )}
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">Dành cho Chủ Nhà</span>
                  </button>
                  <button
                    onClick={() => setActiveRole("broker")}
                    className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-black transition-colors duration-200 z-10 whitespace-nowrap ${
                      activeRole === "broker"
                        ? "text-violet-700"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {activeRole === "broker" && (
                      <motion.div layoutId="activeRoleBg" className="absolute inset-0 bg-white shadow-sm rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                    )}
                    <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">Dành cho Môi Giới</span>
                  </button>
                </div>
              )}

              {/* Billing toggle */}
              <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1 relative overflow-x-auto no-scrollbar max-w-full">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`relative px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs font-black transition-colors duration-200 z-10 whitespace-nowrap ${
                    billingCycle === "monthly"
                      ? "text-slate-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {billingCycle === "monthly" && (
                    <motion.div layoutId="activeBillingBg" className="absolute inset-0 bg-white shadow-sm rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                  )}
                  Theo tháng
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`relative px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs font-black transition-colors duration-200 flex items-center justify-center gap-1.5 z-10 whitespace-nowrap ${
                    billingCycle === "yearly"
                      ? "text-slate-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {billingCycle === "yearly" && (
                    <motion.div layoutId="activeBillingBg" className="absolute inset-0 bg-white shadow-sm rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                  )}
                  Theo năm
                  <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black">
                    -20%
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ PLANS GRID ══ */}
        <section className="py-8 sm:py-16 px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400"
              >
                <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 border-t-blue-500 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest animate-pulse">
                  Đang tải gói dịch vụ...
                </p>
              </motion.div>
            ) : pricingTiers.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-4 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                  <PackageSearch className="w-9 h-9 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-700">Chưa có gói dịch vụ</h3>
                <p className="text-sm text-slate-400">Vui lòng thử lại hoặc liên hệ quản trị viên.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 h-10 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:border-slate-400 transition-colors"
                >
                  Thử lại
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={activeRole}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`grid grid-cols-1 gap-4 sm:gap-5 mx-auto ${gridCols}`}
              >
                {pricingTiers.map((tier, index) => (
                  <PricingCard key={tier.planId || tier._id} tier={tier} billingCycle={billingCycle} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ══ FAQ / CTA STRIP ══ */}
        <section className="pb-16 px-4">
          <div className="max-w-xl mx-auto bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-center text-white">
            <h2 className="text-lg sm:text-xl font-black mb-2">Cần tư vấn thêm?</h2>
            <p className="text-sm text-white/80 mb-5">
              Đội ngũ MapHome sẵn sàng hỗ trợ bạn chọn gói phù hợp nhất.
            </p>
            <button
              onClick={() => navigate("/lien-he")}
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-black text-sm px-6 h-10 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Liên hệ ngay
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
