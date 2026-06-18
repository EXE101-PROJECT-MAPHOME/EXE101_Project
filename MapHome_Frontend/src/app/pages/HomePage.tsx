import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/app/utils/api";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Search,
  FileText,
  PhoneCall,
  Star,
  Quote,
  Users,
  Building2,
  Map,
  TrendingUp,
  ArrowRight,
  Clock,
  Eye,
  Heart,
  CheckCircle2,
  Shield,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Home,
  Tag,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useProperties } from "@/app/contexts/useProperties";
import { useAuth } from "@/app/contexts/AuthContext";
import { PropertyCard } from "@/app/components/PropertyCard";
import { Footer } from "@/app/components/Footer";
import { Navbar } from "@/app/components/Navbar";
import { HeroCarousel } from "@/app/components/HeroCarousel";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { CompareFloatingBar } from "@/app/components/CompareFloatingBar";
import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.2 } },
  viewport: { once: true },
};

// ─── Statistics Counter Animation ─────────────────────────────
function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div
      ref={ref}
      className="text-3xl md:text-4xl lg:text-5xl font-bold text-white will-change-[contents]"
    >
      {count.toLocaleString("vi-VN")}
      {suffix}
    </div>
  );
}
// ─── Constants ───────────────────────────────────────────────
const HCMC_DISTRICTS = [
  {
    name: "Quận 1",
    count: 1250,
    image:
      "https://images.unsplash.com/photo-1559592442-7e18ad73d800?auto=format&fit=crop&q=80&w=800",
    isHot: true,
  },
  {
    name: "Quận 7",
    count: 850,
    image:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
    isHot: true,
  },
  {
    name: "Bình Thạnh",
    count: 920,
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=800",
    isHot: true,
  },
  {
    name: "Quận 3",
    count: 640,
    image:
      "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800",
    isHot: false,
  },
  {
    name: "Quận 10",
    count: 710,
    image:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=800",
    isHot: false,
  },
  {
    name: "Thủ Đức",
    count: 1100,
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800",
    isHot: true,
  },
];

// ─── Main Component ──────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate();
  const propertySliderRef = useRef<Slider>(null);
  const testimonialSliderRef = useRef<Slider>(null);
  const [districts, setDistricts] = useState<any[]>(HCMC_DISTRICTS);

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalDistricts: 12,
    satisfactionRate: 98,
  });
  const [promotedVouchers, setPromotedVouchers] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [statsRes, districtsRes, reviewsRes, blogsRes, vouchersRes] =
          await Promise.allSettled([
            api.get("/api/properties/stats/public"),
            api.get("/api/properties/stats/districts"),
            api.get("/api/reviews/latest"),
            api.get("/api/blogs?limit=3"),
            api.get("/api/vouchers/promoted"),
          ]);

        // Use HCM districts by default as requested by user
        setDistricts(HCMC_DISTRICTS);

        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (reviewsRes.status === "fulfilled")
          setTestimonials(reviewsRes.value.data);
        if (blogsRes.status === "fulfilled") setBlogPosts(blogsRes.value.data);
        if (vouchersRes.status === "fulfilled") setPromotedVouchers(vouchersRes.value.data);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      }
    };
    fetchHomeData();
  }, []);

  const { properties } = useProperties();
  const { user } = useAuth();
  const [savedVoucherIds, setSavedVoucherIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSavedVouchers = async () => {
      if (user) {
        try {
          const res = await api.get("/api/vouchers/me/saved");
          if (res.status === 200) {
            setSavedVoucherIds(res.data.map((v: any) => v._id || v.id));
          }
        } catch (error) {
          console.error("Failed to fetch saved vouchers:", error);
        }
      } else {
        setSavedVoucherIds([]);
      }
    };
    fetchSavedVouchers();
  }, [user]);

  const handleToggleSaveVoucher = async (voucher: any) => {
    if (!user) {
      navigator.clipboard.writeText(voucher.code);
      toast.success(`Đã sao chép mã: ${voucher.code}. Đăng nhập để lưu vào ví!`);
      return;
    }

    const isSaved = savedVoucherIds.includes(voucher._id || voucher.id);
    const voucherId = voucher._id || voucher.id;

    try {
      if (isSaved) {
        const res = await api.post(`/api/vouchers/${voucherId}/unsave`);
        if (res.status === 200) {
          setSavedVoucherIds(prev => prev.filter(id => id !== voucherId));
          toast.success(`Đã bỏ lưu voucher: ${voucher.code}`);
        }
      } else {
        const res = await api.post(`/api/vouchers/${voucherId}/save`);
        if (res.status === 200) {
          setSavedVoucherIds(prev => [...prev, voucherId]);
          toast.success(`Đã lưu voucher vào ví: ${voucher.code} 🎉`);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể thực hiện yêu cầu.");
    }
  };

  const verifiedProperties = properties
    .filter((p) => p.verificationLevel === "verified")
    .slice(0, 8);

  const propertySliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  const testimonialSliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <Navbar />
      <HeroCarousel />

      <main className="flex-1 w-full">
        {/* ━━━ Promoted Vouchers ━━━ */}
        {user?.role === "landlord" && promotedVouchers.length > 0 && (
          <section className="bg-slate-50 py-8 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <Tag className="size-5 text-emerald-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-emerald-950">Ưu Đãi Hôm Nay</h2>
              </div>
              <div className="flex overflow-x-auto pb-6 pt-2 gap-6 snap-x hide-scrollbar px-2">
                {promotedVouchers.map((voucher) => {
                  // Calculate progress for Flash Sale feel
                  let progressPercent = 0;
                  let progressText = "Còn lại rất ít";
                  if (voucher.maxUses) {
                    progressPercent = Math.min(100, (voucher.usedCount / voucher.maxUses) * 100);
                    progressText = `Đã dùng ${Math.round(progressPercent)}%`;
                  } else {
                    progressPercent = 85; // Fake high urgency if unlimited
                    progressText = "Sắp hết hạn";
                  }

                  const isSaved = savedVoucherIds.includes(voucher._id || voucher.id);

                  return (
                    <div 
                      key={voucher._id} 
                      className="flex-shrink-0 w-[320px] md:w-[420px] bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] transition-all snap-center flex relative border border-emerald-100/50 group"
                    >
                      {/* Left Side: Gradient/Image (The "Tear-off" part) */}
                      <div className="w-[35%] relative bg-gradient-to-br from-emerald-600 to-teal-700 flex flex-col items-center justify-center p-3 text-center z-10 overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-lg translate-y-1/3 -translate-x-1/3" />
                        
                        <span className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                          VOUCHER
                        </span>
                        <div className="flex items-baseline justify-center">
                          <span className="text-3xl md:text-4xl font-black text-white leading-none">
                            {voucher.discountPercentage}
                          </span>
                          <span className="text-lg font-bold text-white ml-0.5">%</span>
                        </div>
                        <span className="text-white/80 text-[10px] font-bold mt-1 bg-white/20 px-2 py-0.5 rounded-full">
                          GIẢM
                        </span>
                      </div>

                      {/* Ticket Cutout Line */}
                      <div className="absolute left-[35%] top-0 bottom-0 w-0 border-l-[3px] border-dashed border-white/80 z-20" />
                      
                      {/* Top and Bottom semi-circle cutouts */}
                      <div className="absolute left-[35%] top-0 w-4 h-4 bg-slate-50 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-inner z-30" />
                      <div className="absolute left-[35%] bottom-0 w-4 h-4 bg-slate-50 rounded-full -translate-x-1/2 translate-y-1/2 shadow-inner z-30" />

                      {/* Right Side: Details */}
                      <div className="w-[65%] p-4 md:p-5 flex flex-col bg-white z-10">
                        <div className="flex-1">
                          <h3 className="font-black text-slate-800 text-sm md:text-base mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {voucher.title || "Siêu Sale Bất Ngờ"}
                          </h3>
                          <p className="text-slate-500 text-[11px] md:text-xs line-clamp-2 leading-snug h-[34px]">
                            {voucher.description || `Sử dụng mã để được giảm ${voucher.discountPercentage}%`}
                          </p>
                        </div>
                        
                        <div className="mt-2 space-y-3">
                          {/* Progress Bar (Flash sale feel) */}
                          <div className="relative w-full h-3.5 bg-emerald-50 rounded-full overflow-hidden flex items-center justify-center border border-emerald-100">
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                            {/* Animated sheen effect on progress bar */}
                            <div className="absolute top-0 left-0 h-full w-10 bg-white/30 -skew-x-12 animate-[shimmer_2s_infinite]" />
                            <span className="relative z-10 text-[8px] font-black text-emerald-950 uppercase tracking-widest drop-shadow-md">
                              {progressText}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="bg-slate-50 px-2 py-1 rounded border border-dashed border-slate-200">
                              <span className="font-black text-slate-700 tracking-wider text-xs">{voucher.code}</span>
                            </div>
                            <Button 
                              onClick={() => handleToggleSaveVoucher(voucher)}
                              className={`rounded-full h-8 px-4 text-xs font-bold transition-all duration-300 active:scale-95 shadow-md ${
                                isSaved
                                  ? "bg-emerald-50 hover:bg-rose-50 hover:text-rose-600 text-emerald-700 border border-emerald-200/60 shadow-none hover:border-rose-200 group/btn"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 border-none"
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <span className="group-hover/btn:hidden">Đã lưu</span>
                                  <span className="hidden group-hover/btn:inline">Bỏ lưu</span>
                                </>
                              ) : (
                                "Lưu mã"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden py-8 md:py-14 w-full"
        >
          {/* Background Aura */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/4 w-[100%] h-[200%] bg-white/10 blur-[100px] rounded-full"
          />

          <div className="relative max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 flex flex-wrap justify-center gap-y-6 sm:gap-y-8 gap-x-2 sm:gap-x-6 md:gap-8 text-center">
            {[
              {
                icon: Building2,
                target: stats.totalProperties,
                suffix: "+",
                label: "Phòng trọ",
              },
              {
                icon: Users,
                target: stats.totalUsers,
                suffix: "+",
                label: "Người dùng",
              },
              {
                icon: Map,
                target: stats.totalDistricts,
                suffix: "",
                label: "Quận / Huyện",
              },
              {
                icon: CheckCircle2,
                target: stats.satisfactionRate,
                suffix: "%",
                label: "Hài lòng",
              },
            ].map((stat) => (
              <div key={stat.label} className="group space-y-1 sm:space-y-2 w-[45%] sm:w-[40%] md:w-[20%] flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-md rounded-lg sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-white/20 group-hover:scale-110 group-hover:bg-white/20 transition-transform duration-300 will-change-transform">
                  <stat.icon className="size-5 sm:size-6 md:size-7 text-green-200" />
                </div>
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                <p className="text-green-100/80 text-[10px] sm:text-xs md:text-sm font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━ Features ━━━ */}
        <motion.section
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto py-12 md:py-20 lg:py-32 px-3 sm:px-4 lg:px-6 relative overflow-hidden w-full"
        >
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-green-100/30 blur-[120px] rounded-full -translate-x-1/2" />

          <motion.div variants={fadeIn} className="text-center mb-12 sm:mb-16 md:mb-24">
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent pb-2 sm:pb-3 tracking-tighter will-change-transform">
              Tại Sao Chọn MapHome?
            </h2>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto font-medium mt-3 sm:mt-4">
              Nền tảng tìm trọ hiện đại với công nghệ tiên tiến, giúp bạn tìm
              được ngôi nhà thứ hai một cách dễ dàng và nhanh chóng nhất.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative z-10 w-full">
            {[
              {
                icon: MapPin,
                gradient: "from-green-500 to-emerald-600",
                shadow: "shadow-green-900/10",
                title: "Bản đồ tương tác",
                desc: "Xem vị trí chính xác và khám phá các tiện ích xung quanh như bệnh viện, trường học, siêu thị chỉ với một cú chạm duy nhất.",
                delay: 0.1,
              },
              {
                icon: Home,
                gradient: "from-blue-500 to-indigo-600",
                shadow: "shadow-blue-900/10",
                title: "Thông tin đầy đủ",
                desc: "Chi tiết về giá cả, diện tích, tiện nghi, hình ảnh thực tế 100% và thông tin liên hệ trực tiếp chủ trọ minh bạch.",
                delay: 0.2,
              },
              {
                icon: Shield,
                gradient: "from-purple-500 to-pink-600",
                shadow: "shadow-purple-900/10",
                title: "Hệ thống xác thực",
                desc: "Cơ chế Trust is King xác thực vị trí GPS tại chỗ, đảm bảo an toàn tuyệt đối và sự an tâm hoàn hảo cho người thuê.",
                delay: 0.3,
              },
            ].map((f) => (
              <motion.div
                variants={{
                  initial: { opacity: 0, y: 30 },
                  whileInView: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: f.delay,
                      duration: 0.8,
                      type: "spring",
                    },
                  },
                }}
                whileHover={{ y: -12 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                key={f.title}
                className={`bg-white rounded-2xl sm:rounded-3xl md:rounded-[48px] p-5 sm:p-6 md:p-10 shadow-lg sm:shadow-xl md:shadow-2xl ${f.shadow} hover:shadow-emerald-900/10 group border border-slate-50 flex flex-col items-center text-center relative overflow-hidden will-change-transform h-full`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-bl-full opacity-50" />

                <div className="relative mb-4 sm:mb-6 md:mb-8">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${f.gradient} blur-2xl opacity-20 group-hover:opacity-40 will-change-[opacity]`}
                  />
                  <div
                    className={`bg-gradient-to-br ${f.gradient} w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl md:rounded-[32px] flex items-center justify-center shadow-lg sm:shadow-xl group-hover:scale-110 group-hover:rotate-6 relative z-10 p-4 sm:p-5 will-change-transform`}
                  >
                    <f.icon className="size-full text-white" />
                  </div>
                </div>

                <h3 className="font-black text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 sm:mb-3 md:mb-4 text-emerald-950 relative z-10 leading-tight">
                  {f.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed relative z-10 font-medium pb-2 flex-grow">
                  {f.desc}
                </p>

                <div
                  className={`w-12 h-1 sm:w-14 sm:h-1.5 md:w-16 bg-gradient-to-r ${f.gradient} mt-4 sm:mt-6 md:mt-8 rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 will-change-transform`}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ━━━ How It Works ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-b from-slate-50 to-white py-12 md:py-20 lg:py-32 relative overflow-hidden w-full"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16 md:mb-24">
              <span className="text-green-600 font-black text-xs uppercase tracking-[0.4em] mb-4 block">
                Hành trình trải nghiệm
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent pb-2 will-change-transform">
                Tìm trọ chỉ với 4 bước
              </h2>

              <p className="text-base md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mt-4">
                Quy trình được tối ưu hóa tối đa, giúp bạn tiết kiệm thời gian
                và đảm bảo an toàn tuyệt đối.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-12 md:gap-8">
              {[
                {
                  step: 1,
                  icon: Search,
                  title: "Tìm kiếm",
                  desc: "Nhập khu vực, mức giá hoặc tìm gần chỗ làm/trường học",
                  color: "bg-blue-600",
                  shadow: "shadow-blue-900/20",
                },
                {
                  step: 2,
                  icon: Map,
                  title: "Xem bản đồ",
                  desc: "Khám phá vị trí thực tế trên bản đồ, xem tiện ích xung quanh",
                  color: "bg-green-600",
                  shadow: "shadow-green-900/20",
                },
                {
                  step: 3,
                  icon: FileText,
                  title: "So sánh",
                  desc: "Đánh giá giá cả, diện tích, tiện nghi và mức độ xác thực",
                  color: "bg-purple-600",
                  shadow: "shadow-purple-900/20",
                },
                {
                  step: 4,
                  icon: PhoneCall,
                  title: "Liên hệ",
                  desc: "Gọi trực tiếp hoặc đặt lịch xem phòng online nhanh chóng",
                  color: "bg-orange-600",
                  shadow: "shadow-orange-900/20",
                },
              ].map((s, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.15,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 300,
                  }}
                  key={s.step}
                  className="relative group will-change-transform"
                >
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-[50px] left-[65%] w-[70%] h-[3px] bg-gradient-to-r from-slate-100 to-slate-200 z-0" />
                  )}

                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className={`${s.color} w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-2xl ${s.shadow} relative overflow-hidden will-change-transform`}
                    >
                      <div className="absolute inset-0 bg-white/20 -translate-y-full group-hover:translate-y-full transition-transform duration-500 ease-in-out will-change-transform" />
                      <s.icon className="size-8 sm:size-10 text-white" />

                      <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white shadow-xl flex items-center justify-center text-[10px] sm:text-sm font-black text-slate-800 border-2 sm:border-4 border-slate-50 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors duration-300 will-change-transform">
                        {s.step}
                      </div>
                    </motion.div>

                    <h3 className="font-black text-base sm:text-xl mb-2 sm:mb-3 text-emerald-950 group-hover:text-green-600 transition-colors duration-300 text-center">
                      {s.title}
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm md:text-base leading-relaxed max-w-[240px] text-center font-medium">
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto py-20 md:py-32 px-4 relative overflow-hidden"
        >
          {/* Section Background Aura */}
          <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-emerald-50/30 blur-[120px] rounded-full -z-10" />

          <div className="text-center mb-12 md:mb-16">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2.5 bg-emerald-50 px-6 py-3 rounded-full mb-6 border border-emerald-100 shadow-sm"
            >
              <div className="size-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-black text-emerald-900/90 uppercase tracking-[0.2em]">
                Hệ thống đã xác thực
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-emerald-900 mb-4 tracking-tighter leading-tight will-change-transform">
              Nhà Trọ Uy Tín
            </h2>

            <p className="text-base md:text-xl text-emerald-950/60 font-medium max-w-2xl mx-auto">
              Các tin đăng được xác thực trực tiếp tại chỗ qua hệ thống{" "}
              <span className="text-emerald-600 font-bold">Trust is King</span>
            </p>
          </div>

          <div className="relative group">
            <button
              onClick={() => propertySliderRef.current?.slickPrev()}
              className="absolute -left-3 md:-left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl w-14 h-14 flex items-center justify-center opacity-0 group-hover:opacity-100 border border-white transition-opacity duration-300 will-change-opacity"
            >
              <ChevronLeft className="size-6 text-emerald-950" />
            </button>
            <button
              onClick={() => propertySliderRef.current?.slickNext()}
              className="absolute -right-3 md:-right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl w-14 h-14 flex items-center justify-center opacity-0 group-hover:opacity-100 border border-white transition-opacity duration-300 will-change-opacity"
            >
              <ChevronRight className="size-6 text-emerald-950" />
            </button>

            <div className="property-carousel-wrapper">
              <Slider ref={propertySliderRef} {...propertySliderSettings}>
                {verifiedProperties.map((property) => (
                  <div key={property.id} className="px-3 pb-8">
                    <PropertyCard
                      property={property}
                      onClick={() => navigate(`/room/${property.id}`)}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          </div>

          <div className="text-center mt-12 md:mt-16">
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={() => navigate("/map")}
              className="group relative overflow-hidden px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[24px] text-lg font-black shadow-2xl flex items-center justify-center gap-3 mx-auto will-change-transform"
            >
              <div className="absolute inset-0 w-1/4 h-full bg-white/20 -skew-x-[30deg] -translate-x-[150%] group-hover:translate-x-[400%] transition-transform duration-700 ease-in-out will-change-transform" />
              Xem tất cả trên bản đồ
              <ArrowRight className="size-5" />
            </motion.button>
          </div>
        </motion.section>

        {/* ━━━ Browse by District ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="bg-gray-50 py-12 md:py-20"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16 md:mb-24">
              <span className="text-emerald-600 font-black text-xs uppercase tracking-[0.4em] mb-4 block">
                Thành phố Hồ Chí Minh
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent pb-3 will-change-transform">
                Khám Phá Theo Quận
              </h2>

              <p className="text-base md:text-xl text-emerald-950/60 font-medium max-w-2xl mx-auto mt-4">
                Các khu vực trọng điểm với hàng nghìn phòng trọ tốt nhất tại Sài
                Gòn.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-8">
              {districts.map((d, i) => (
                <motion.button
                  key={d.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  whileHover={{ y: -8 }}
                  onClick={() => navigate("/map")}
                  className="w-[47%] md:w-[45%] lg:w-[30%] group relative rounded-[20px] md:rounded-[32px] overflow-hidden aspect-[4/3] md:aspect-[16/11] cursor-pointer shadow-xl hover:shadow-emerald-900/10 will-change-transform border border-slate-100 flex-shrink-0"
                >
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-emerald-950/90 via-emerald-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 will-change-opacity" />

                  <ImageWithFallback
                    src={d.image}
                    alt={d.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out will-change-transform"
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-8 z-20 text-left">
                    <motion.h3 className="text-white font-black text-base sm:text-lg md:text-2xl lg:text-3xl tracking-tighter mb-0.5 md:mb-1">
                      {d.name}
                    </motion.h3>
                    <p className="text-emerald-50/80 text-[9px] sm:text-[10px] md:text-sm font-bold uppercase tracking-widest">
                      {d.count.toLocaleString("vi-VN")} phòng trọ
                    </p>
                  </div>

                  {d.isHot && (
                    <div className="absolute top-2 right-2 md:top-5 md:right-5 z-20 px-2.5 py-1 md:px-4 md:py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl md:rounded-2xl flex items-center gap-1.5 md:gap-2 shadow-xl">
                      <div className="size-1.5 md:size-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.2em]">
                        Hot
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 border-[3px] md:border-[6px] border-white/0 group-hover:border-white/10 transition-colors duration-500 rounded-[20px] md:rounded-[32px] z-30" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ━━━ Testimonials ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-white to-green-50/50"
        >
          <div className="absolute top-1/4 -right-20 w-80 h-80 bg-green-200/20 blur-[100px] rounded-full" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-10 md:mb-16">
              <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3 block">
                Cảm nhận từ khách hàng
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent pb-1 will-change-transform">
                Người Dùng Nói Gì?
              </h2>

              <p className="text-sm md:text-base lg:text-lg text-emerald-950/70 font-medium max-w-2xl mx-auto">
                Lắng nghe những câu chuyện tìm thấy " tổ ấm" thực sự từ hàng
                nghìn khách hàng của chúng tôi.
              </p>
            </div>

            <div className="relative group">
              <button
                onClick={() => testimonialSliderRef.current?.slickPrev()}
                className="absolute -left-3 md:-left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-md shadow-xl rounded-full w-12 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 border border-white transition-opacity duration-300 will-change-opacity"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                onClick={() => testimonialSliderRef.current?.slickNext()}
                className="absolute -right-3 md:-right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-md shadow-xl rounded-full w-12 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 border border-white transition-opacity duration-300 will-change-opacity"
              >
                <ChevronRight className="size-6" />
              </button>

              <div className="testimonial-carousel-wrapper">
                <Slider
                  ref={testimonialSliderRef}
                  {...testimonialSliderSettings}
                >
                  {testimonials.map((t) => (
                    <div key={t.id} className="px-3 pb-10">
                      <motion.div
                        whileHover={{ y: -8, scale: 1.01 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="bg-white border border-white/60 rounded-[40px] p-8 shadow-2xl shadow-green-900/5 h-full flex flex-col group relative will-change-transform"
                      >
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-green-500 scale-0 group-hover:scale-100 transition-transform duration-300 border border-green-50 will-change-transform">
                          <Quote className="size-6 fill-green-500 opacity-20" />
                        </div>

                        <div className="flex items-center gap-1 mb-6">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-4 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-slate-100"}`}
                            />
                          ))}
                        </div>

                        <p className="text-slate-600 text-base leading-relaxed mb-8 italic font-medium">
                          \"{t.text}\"
                        </p>

                        <div className="mt-auto flex items-center gap-4 pt-6 border-t border-slate-50">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                              {t.avatar}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <CheckCircle2 className="size-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="font-black text-[15px] text-emerald-950 tracking-tight">
                              {t.name}
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                              {t.role}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ━━━ Blog / Tips ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="bg-slate-50 py-16 md:py-24 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-20 bg-white" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                  <TrendingUp className="size-3" /> Xu hướng tìm trọ
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent pb-1 will-change-transform">
                  Kinh Nghiệm Thuê Trọ
                </h2>

                <div className="w-20 h-1.5 bg-emerald-500 rounded-full" />
              </div>
              <motion.button
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="inline-flex items-center text-sm font-black text-emerald-600 gap-2 group cursor-pointer will-change-transform"
                onClick={() => navigate("/blog")}
              >
                Khám phá kho kiến thức
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <ArrowRight className="size-4" />
                </div>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.slice(0, 3).map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 hover:shadow-green-900/10 cursor-pointer group border border-slate-100 flex flex-col will-change-transform"
                  onClick={() => navigate("/blog")}
                >
                  <div className="relative h-56 overflow-hidden">
                    <ImageWithFallback
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 will-change-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 will-change-opacity" />
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[10px] font-black px-4 py-2 rounded-xl text-emerald-700 uppercase tracking-widest shadow-lg">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-7 flex-1 flex flex-col">
                    <h3 className="font-black text-lg mb-3 text-emerald-950 group-hover:text-green-600 transition-colors duration-300 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-50">
                      <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-green-600" />
                          {post.readTime}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="size-3.5 text-blue-600" />
                          {post.views.toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {post.date}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ━━━ CTA for Landlords ━━━ */}
        <motion.section
          {...fadeIn}
          className="relative py-24 md:py-32 overflow-hidden"
        >
          <div className="absolute inset-0">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1649663724528-3bd2ce98b6e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW50YWwlMjBwcm9wZXJ0eSUyMGxhbmRsb3JkJTIwbWVldGluZ3xlbnwxfHx8fDE3NzE5MTUzMDF8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Landlord CTA"
              className="w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-950/95 via-green-900/90 to-emerald-900/80" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/30 blur-[120px] rounded-full"
            />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full mb-8"
            >
              <div className="size-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">
                Dành riêng cho chủ trọ
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tighter leading-tight">
              Tối Ưu Doanh Thu
              <br />
              <span className="text-emerald-400">Từ Bất Động Sản Của Bạn</span>
            </h2>

            <p className="text-green-50 text-base md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              Gia nhập cộng đồng hơn 5.000+ chủ trọ đang kinh doanh hiệu quả
              trên MapHome. Đăng tin xác thực để nhận ưu tiên hiển thị và tiếp
              cận đúng khách hàng mục tiêu.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => navigate("/post-room")}
                className="group relative overflow-hidden px-10 py-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-[24px] text-lg font-black shadow-2xl flex items-center justify-center gap-3 will-change-transform"
              >
                <div className="absolute inset-0 w-1/4 h-full bg-white/20 -skew-x-[30deg] -translate-x-[150%] group-hover:translate-x-[400%] transition-transform duration-700 ease-in-out will-change-transform" />
                <FileText className="size-5" />
                Đăng tin miễn phí ngay
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => navigate("/contact")}
                className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-[24px] text-lg font-black flex items-center justify-center gap-3 will-change-transform"
              >
                Tìm hiểu thêm
                <ArrowRight className="size-5" />
              </motion.button>
            </div>

            <div className="mt-16 pt-10 border-t border-white/10 flex flex-wrap justify-center gap-y-8 gap-x-2 sm:gap-x-8 text-center">
              {[
                { label: "Tiếp cận", value: "10k+" },
                { label: "Tin đăng", value: "50k+" },
                { label: "Chủ trọ", value: "5k+" },
                { label: "Xác thực", value: "100%" },
              ].map((item) => (
                <div key={item.label} className="w-[45%] md:w-[20%] flex flex-col items-center">
                  <p className="text-2xl font-black text-white">{item.value}</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />
      <CompareFloatingBar />
    </div>
  );
}
