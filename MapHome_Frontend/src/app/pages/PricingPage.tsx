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
  Sparkle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/app/components/Navbar";
import api from "@/app/utils/api";
import { Footer } from "@/app/components/Footer";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

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
  icon: string | typeof Home;
  description: string;
  features: Array<{ text: string; included: boolean }>;
  cta: string;
  ctaVariant: "outline" | "secondary" | "default" | "ghost";
  highlighted?: boolean;
}

const iconMap: Record<string, any> = {
  Home,
  MapPin,
  Star,
  Rocket,
  Shield,
  Zap,
};

function getIcon(name: string) {
  return iconMap[name] || Home;
}

function PricingCard({
  tier,
  billingCycle,
}: {
  tier: PricingTier;
  billingCycle: BillingCycle;
}) {
  const navigate = useNavigate();
  const IconComponent =
    typeof tier.icon === "string" ? getIcon(tier.icon) : tier.icon;
  const displayPrice =
    billingCycle === "monthly" ? tier.price : tier.yearlyPrice;

  // Theme map with explicit, static Tailwind classes per plan name
  const themeMap: Record<string, any> = {
    default: {
      gradient: "bg-gradient-to-br from-slate-100 to-white",
      icon: "text-slate-600",
      accent: "bg-slate-500",
      glow: "shadow-lg shadow-slate-200/30",
      ring: "ring-slate-200/30",
      checkBg: "bg-slate-100 text-slate-400",
      button: "bg-slate-900 text-white hover:brightness-95",
    },
    basic: {
      gradient: "bg-gradient-to-br from-slate-50 to-white",
      icon: "text-slate-700",
      accent: "bg-slate-700",
      glow: "shadow-lg shadow-slate-200/30",
      ring: "ring-slate-200/30",
      checkBg: "bg-slate-100 text-slate-400",
      button: "bg-slate-700 text-white hover:brightness-95",
    },
    blue: {
      gradient: "bg-gradient-to-br from-blue-50 to-blue-100",
      icon: "text-blue-600",
      accent: "bg-blue-600",
      glow: "shadow-lg shadow-blue-200/30",
      ring: "ring-blue-200/30",
      checkBg: "bg-blue-600 text-white",
      button: "bg-blue-600 text-white hover:brightness-95",
    },
    standard: {
      gradient: "bg-gradient-to-br from-violet-50 to-indigo-50",
      icon: "text-violet-600",
      accent: "bg-violet-600",
      glow: "shadow-2xl shadow-violet-200/30",
      ring: "ring-violet-200/30",
      checkBg: "bg-violet-600 text-white",
      button:
        "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-95",
    },
    pro: {
      gradient: "bg-gradient-to-br from-rose-50 to-amber-50",
      icon: "text-rose-600",
      accent: "bg-rose-600",
      glow: "shadow-lg shadow-rose-200/30",
      ring: "ring-rose-200/30",
      checkBg: "bg-rose-600 text-white",
      button: "bg-rose-600 text-white hover:brightness-95",
    },
    summer: {
      gradient: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      icon: "text-emerald-600",
      accent: "bg-emerald-600",
      glow: "shadow-lg shadow-emerald-200/30",
      ring: "ring-emerald-200/30",
      checkBg: "bg-emerald-600 text-white",
      button: "bg-emerald-600 text-white hover:brightness-95",
    },
  };

  let theme = themeMap.default;
  if (tier.name.includes("Cơ Bản") || tier.name.includes("Cơ Ban"))
    theme = themeMap.basic;
  else if (tier.name.toLowerCase().includes("basic")) theme = themeMap.blue;
  else if (tier.name.toLowerCase().includes("standard"))
    theme = themeMap.standard;
  else if (tier.name.toLowerCase().includes("pro")) theme = themeMap.pro;
  else if (tier.name.toLowerCase().includes("summer")) theme = themeMap.summer;

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -15, scale: 1.02 }}
      className="flex flex-col h-full group perspective-1000"
    >
      <Card
        className={`relative h-full flex flex-col transition-all duration-700 overflow-hidden border-none ${tier.highlighted ? theme.glow + " ring-2 " + theme.ring : "shadow-slate-200/50 ring-1 ring-slate-100"} bg-white/80 backdrop-blur-3xl rounded-[3rem]`}
      >
        {/* Luminous 3.0: Multicolor Mesh Header Aura */}
        <div
          className={`absolute top-0 left-0 w-full h-1/3 opacity-30 pointer-events-none ${theme.gradient} blur-[80px] -translate-y-1/2`}
        />

        {/* Floating Glass Badge */}
        {tier.badge && (
          <div className="absolute top-6 right-6 z-20">
            <div className="px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-md border border-white shadow-xl flex items-center gap-2 group-hover:scale-110 transition-transform">
              <div
                className={`size-1.5 rounded-full animate-pulse ${theme.accent}`}
              />
              <span
                className={`text-[10px] font-black uppercase tracking-widest text-slate-800`}
              >
                {tier.badge}
              </span>
            </div>
          </div>
        )}

        <CardHeader className="pt-[clamp(24px,3.5vh,56px)] pb-[clamp(12px,2vh,32px)] items-center text-center px-[clamp(12px,2vw,40px)] relative z-10">
          {/* Embedded Theme Icon Surface */}
          <div className="relative mb-8">
            <div
              className={`${theme.gradient} absolute inset-0 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity`}
            />
            <div className="w-[clamp(44px,6vw,72px)] h-[clamp(44px,6vw,72px)] rounded-[2.5rem] bg-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.1),inset_0_-4px_8px_rgba(0,0,0,0.05)] border border-slate-50 flex items-center justify-center relative z-10 group-hover:rotate-6 transition-transform duration-500">
              <IconComponent
                className={`${theme.icon} drop-shadow-sm`}
                style={{
                  width: "clamp(28px,3.5vw,44px)",
                  height: "clamp(28px,3.5vw,44px)",
                }}
              />
            </div>
          </div>

          <h3
            className={`text-3xl font-black mb-3 tracking-tight ${theme.icon}`}
          >
            {tier.name}
          </h3>
          <p
            className={`text-sm font-bold leading-relaxed max-w-[200px] ${theme.icon} text-opacity-80`}
          >
            {tier.description}
          </p>
        </CardHeader>

        <CardContent className="flex-1 px-[clamp(12px,2vw,40px)] relative z-10">
          <div className="flex flex-col items-center mb-12">
            <div className="relative">
              <span
                className={`font-black tracking-tighter block ${theme.icon} text-[clamp(32px,4.5vw,56px)] leading-none`}
              >
                {new Intl.NumberFormat("vi-VN").format(displayPrice)}
              </span>
              <span
                className={`absolute -top-1 -right-6 text-xl font-bold ${theme.icon}`}
              >
                đ
              </span>
            </div>
            <span
              className={`text-[clamp(10px,1vw,12px)] font-black uppercase tracking-[0.3em] mt-3 ${theme.icon}`}
            >
              Per {billingCycle === "monthly" ? "Month" : "Year"}
            </span>

            {billingCycle === "yearly" && (
              <Badge
                className={`mt-4 bg-slate-100 text-slate-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black italic`}
              >
                Save 20% Annually
              </Badge>
            )}
          </div>

          <div className="space-y-5">
            <p
              className={`text-[clamp(10px,1vw,12px)] uppercase font-black tracking-widest mb-4 ml-1 ${theme.icon}`}
            >
              Included Benefits
            </p>
            {tier.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 group/item">
                <div
                  className={`p-1.5 rounded-xl transition-all duration-300 ${feature.included ? theme.checkBg : "bg-slate-100 text-slate-300"}`}
                >
                  <Check className="size-3.5" strokeWidth={4} />
                </div>
                <span
                  className={`text-[clamp(12px,1.2vw,16px)] font-bold transition-colors ${feature.included ? `${theme.icon}` : "text-slate-300 line-through"}`}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="px-[clamp(12px,2vw,40px)] pb-[clamp(12px,2vh,32px)] pt-[clamp(8px,1.5vh,24px)] relative z-10">
          <Button
            className={`w-full h-[clamp(44px,5vh,72px)] rounded-[2rem] text-[clamp(16px,1.6vw,20px)] font-black transition-all duration-500 relative overflow-hidden group/btn ${theme.button} ${tier.highlighted ? "shadow-2xl border-none" : "shadow-xl"} `}
            onClick={() => {
              navigate("/checkout", {
                state: { selectedTier: tier.planId, billingCycle },
              });
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {(() => {
                const label = (tier.cta || "").toString().trim();
                return label.length > 0 ? label : "Chọn";
              })()}
              <ArrowRight className="size-5 group-hover/btn:translate-x-1.5 transition-transform" />
            </span>
            {tier.highlighted && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            )}
          </Button>

          {tier.highlighted && (
            <div
              className={`${theme.gradient} absolute -bottom-10 left-1/2 -translate-x-1/2 w-[90%] h-20 opacity-10 blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`}
            />
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/subscriptions/plans");
        if (res.status === 200) {
          const data = res.data;
          setPricingTiers(data.filter((t: any) => t.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* Mesh Gradient Aura Background */}
        <section className="relative pt-32 pb-48 overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[30%] -left-[10%] w-[80%] h-[80%] bg-blue-100/40 rounded-full blur-[140px]" />
            <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full blur-[110px]" />
            <div className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] bg-emerald-50/40 rounded-full blur-[130px] animate-pulse" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <Sparkle className="size-3 fill-blue-400" /> MapHome Premium Plans
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[clamp(34px,5.5vw,88px)] font-extrabold text-slate-900 mb-8 tracking-tight leading-[0.95]"
            >
              <span className="text-slate-700">Nâng tầm</span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-violet-600 to-emerald-500">
                tin đăng
              </span>
              <br />
              <span className="text-slate-700">chốt khách</span>{" "}
              <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-400">
                nhanh hơn
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[clamp(15px,1.6vw,20px)] text-slate-500/90 font-medium max-w-3xl mx-auto mb-16 leading-relaxed"
            >
              Chọn giải pháp hiển thị thông minh để tiếp cận đúng đối tượng
              khách hàng mục tiêu của bạn. Hiệu quả vượt trội so với phương pháp
              truyền thống.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="bg-white/40 backdrop-blur-3xl p-2 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/50 inline-flex gap-2 relative z-20">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`relative px-8 py-3.5 rounded-xl text-sm font-black transition-all duration-300 ${
                    billingCycle === "monthly"
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {billingCycle === "monthly" && (
                    <motion.div
                      layoutId="cyclebg"
                      className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20"
                    />
                  )}
                  <span className="relative z-10">Theo tháng</span>
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`relative px-8 py-3.5 rounded-xl text-sm font-black transition-all duration-300 ${
                    billingCycle === "yearly"
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {billingCycle === "yearly" && (
                    <motion.div
                      layoutId="cyclebg"
                      className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20"
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    Theo năm
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-[8px] text-white">
                      SAVE 20%
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-6 -mt-32 relative z-30">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-10 auto-rows-min items-start justify-items-center max-w-[1200px] mx-auto"
          >
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="w-full py-40 flex flex-col items-center justify-center gap-8 text-gray-400">
                  <div className="size-16 border-[6px] border-white/10 border-t-blue-500 rounded-full animate-spin" />
                  <p className="font-black text-sm uppercase tracking-widest animate-pulse">
                    Đang kiến tạo bảng giá...
                  </p>
                </div>
              ) : pricingTiers.length === 0 ? (
                <div className="w-full py-32 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6 shadow-xl">
                    <PackageSearch className="size-10 text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">
                    Chưa tìm thấy gói dịch vụ
                  </h3>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-8 px-10 h-14 rounded-2xl border-2 font-black"
                  >
                    Thử lại ngay
                  </Button>
                </div>
              ) : (
                pricingTiers.map((tier) => {
                  const isPro =
                    tier.name && tier.name.toLowerCase().includes("pro");
                  if (isPro) {
                    return (
                      <div
                        key={tier.planId || tier._id}
                        className={`col-span-full w-full flex justify-center`}
                      >
                        <div className="w-full">
                          <PricingCard
                            tier={tier}
                            billingCycle={billingCycle}
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={tier.planId || tier._id}
                      className="w-full h-full flex justify-center"
                    >
                      <div className="w-full">
                        <PricingCard tier={tier} billingCycle={billingCycle} />
                      </div>
                    </div>
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
