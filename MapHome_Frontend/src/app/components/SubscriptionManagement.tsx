import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Check,
  X,
  Crown,
  Star,
  TrendingUp,
  CreditCard,
  Calendar,
  ArrowRight,
  Download,
  Phone,
  ShieldCheck,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import api from "@/app/utils/api";
import { toast } from "sonner";

export function SubscriptionManagement() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [showComparison, setShowComparison] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [subRes, transRes] = await Promise.all([
          api.get("/api/subscriptions/me"),
          api.get("/api/transactions/me"),
        ]);

        setSubscription(subRes.data);
        setTransactions(transRes.data);
      } catch (err) {
        console.error("Failed to fetch subscription data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
    // Refetch khi user quay về từ trang payment-success (state.refresh = true)
  }, [user, location.key]);

  const handleRenew = () => navigate("/pricing");
  const handleUpgrade = () => navigate("/pricing");

  const handleCancelSubscription = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy gói dịch vụ hiện tại? Hành động này sẽ làm mới gói dịch vụ của bạn về trạng thái Free"
      )
    )
      return;
    try {
      setLoading(true);
      const res = await api.post("/api/subscriptions/cancel");
      if (res.status === 200) {
        toast.success(
          "Đã hủy gói dịch vụ thành công! Tài khoản của bạn đã quay về gói Free."
        );
        // Lấy lại thông tin subscription mới (Free)
        const subRes = await api.get("/api/subscriptions/me");
        setSubscription(subRes.data);

        // Kích hoạt cập nhật thông tin user mới từ API về profile context
        const userRes = await api.get("/api/user/me");
        if (userRes.status === 200) {
          updateUser(userRes.data);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể hủy gói dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.info(`📥 Đang tải hóa đơn ${invoiceId}...\n\nDemo: File PDF sẽ được tải xuống.`);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" />
          <p className="font-bold text-gray-500 animate-pulse">Khởi tạo dữ liệu gói cước...</p>
        </div>
      </div>
    );
  }

  const currentSub = subscription || {
    planName: "Gói Cơ bản (Miễn phí)",
    status: "active",
    startDate: user?.createdAt || new Date().toISOString(),
    expiryDate: null,
    features: ["Đăng tin thường", "Hiển thị bảng lọc cơ bản", "Hỗ trợ cộng đồng"],
  };

  const daysRemaining = currentSub.expiryDate
    ? Math.max(0, Math.ceil((new Date(currentSub.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalDays = 30;
  const progressPercent = currentSub.expiryDate ? (daysRemaining / totalDays) * 100 : 0;

  const isPaidPlan = currentSub.planName &&
    !currentSub.planName.toLowerCase().includes("free") &&
    !currentSub.planName.toLowerCase().includes("miễn phí");

  const usageStats = subscription?.usageStats || [
    { label: "Tin đã đăng", value: "0/1", icon: Zap, color: "blue", trend: "+100%" },
    { label: "Lượt xem", value: "0", icon: TrendingUp, color: "emerald", trend: "0" },
    { label: "Xác thực", value: "0", icon: ShieldCheck, color: "amber", trend: "Dự kiến 1" },
  ];

  const comparisonFeatures = [
    { name: "Số lượng tin đăng", standard: "20 tin", pro: "50 tin", highlighted: true },
    { name: "Hiển thị ưu tiên", standard: "Cơ bản", pro: "Ưu tiên Top 1", highlighted: true },
    { name: "Tích xanh xác thực", standard: "3-5 ngày", pro: "Hỗ trợ 24h", highlighted: true },
    { name: "Thống kê nâng cao", standard: false, pro: true },
    { name: "Hỗ trợ 24/7", standard: false, pro: true },
    { name: "Quản lý tập trung", standard: true, pro: true },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* 1. Glassmorphic Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-200 shadow-xl shadow-slate-200/40 p-[1px]"
      >
        {/* Elegant Muted Mesh Background */}
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-slate-50 animate-pulse" />
          <div className="absolute -top-[10%] -right-[10%] w-[70%] h-[70%] bg-violet-400/10 blur-[120px] rounded-full animate-bounce" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-rose-500/10 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/4 w-[40%] h-[40%] bg-cyan-400/5 blur-[110px] rounded-full" />
        </div>

        {/* Subtle Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-multiply" />

        <div className="relative z-10 p-10 md:p-14 bg-white/40 backdrop-blur-[2px] h-full flex flex-col lg:flex-row items-center justify-between gap-12 border border-white/50">
          {/* Left Side: Plan Info */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-6 mb-8">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl flex-shrink-0"
              >
                <Crown className="size-10 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-4 mb-2 flex-wrap">
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                    {currentSub.planName}
                  </h3>
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                    Đang hoạt động
                  </Badge>
                </div>
                <p className="text-slate-400 font-bold flex items-center gap-2">
                  <Calendar className="size-4 text-blue-500" />
                  Kích hoạt: {new Date(currentSub.startDate).toLocaleDateString("vi-VN")}
                  {currentSub.expiryDate && ` • Hết hạn: ${new Date(currentSub.expiryDate).toLocaleDateString("vi-VN")}`}
                </p>
              </div>
            </div>

            {/* Progress Visualization */}
            {currentSub.expiryDate ? (
              <div className="space-y-4 max-w-xl">
                <div className="flex items-end justify-between">
                  <span className="text-slate-900 text-3xl font-black">
                    {daysRemaining} <span className="text-lg font-medium text-slate-400">Ngày còn lại</span>
                  </span>
                  <span className="text-blue-600 font-black text-xs uppercase tracking-widest">{progressPercent.toFixed(0)}% Còn lại</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  />
                </div>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.01, x: 2 }}
                className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm max-w-md ring-1 ring-slate-100/50"
              >
                <p className="text-slate-600 font-bold leading-relaxed flex items-center gap-3">
                  <Zap className="size-5 text-yellow-500" />
                  Bạn đang sử dụng gói mặc định. Nâng cấp để nhận nhiều ưu tiên hiển thị hơn!
                </p>
              </motion.div>
            )}
          </div>

          {/* Right Side: Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto">
            <Button
              onClick={handleRenew}
              className="group h-20 px-8 bg-indigo-600 text-white hover:bg-indigo-700 rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 flex-1 lg:flex-none border-none"
            >
              Gia hạn ngay
              <ArrowRight className="size-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={handleUpgrade}
              className="h-20 px-8 bg-white text-blue-600 hover:bg-blue-50 border-2 border-blue-100 rounded-3xl font-black text-lg shadow-lg shadow-blue-50 transition-all hover:scale-[1.02] active:scale-95 flex-1 lg:flex-none"
            >
              <Zap className="size-6 mr-3 text-yellow-500 fill-yellow-500" />
              Nâng cấp lên Pro
            </Button>
            {isPaidPlan && (
              <Button
                onClick={handleCancelSubscription}
                className="h-20 px-8 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border-2 border-rose-100 rounded-3xl font-black text-lg shadow-lg shadow-rose-50/50 transition-all hover:scale-[1.02] active:scale-95 flex-1 lg:flex-none flex items-center justify-center gap-3"
              >
                <X className="size-6" />
                Hủy gói cước
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 2. Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unlocked Features */}
        <div className="lg:col-span-1 space-y-6">
          <h4 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3 ml-2">
            <Check className="size-6 text-emerald-600" />
            Tính năng sở hữu
          </h4>
          <div className="space-y-3">
            {currentSub.features.map((feature: string, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="p-2 bg-green-50 rounded-lg group-hover:scale-110 transition-transform">
                  <Check className="size-4 text-green-600" />
                </div>
                <span className="font-bold text-gray-700">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Usage Stats (Vibrant Light Glass Cards) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {usageStats.map((stat: any, idx: number) => {
            const IconMap: Record<string, any> = {
              Star, star: Star,
              TrendingUp, trendingup: TrendingUp,
              ShieldCheck, shieldcheck: ShieldCheck,
              Zap, zap: Zap,
            };
            const Icon = typeof stat.icon === "string" ? (IconMap[stat.icon] || Star) : stat.icon;
            const cardGradients = {
              blue: "from-blue-600 to-indigo-700 shadow-blue-100",
              emerald: "from-emerald-500 to-teal-600 shadow-emerald-100",
              orange: "from-orange-500 to-amber-600 shadow-orange-100",
              purple: "from-purple-600 to-indigo-800 shadow-purple-100",
              amber: "from-amber-400 to-orange-500 shadow-amber-100"
            };
            const gradientClass = cardGradients[stat.color as keyof typeof cardGradients] || cardGradients.blue;

            return (
              <motion.div
                key={idx}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative rounded-[2.5rem] p-[1px] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 transition-all duration-500 overflow-hidden"
              >
                {/* Vibrant Background Aura */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass.split(' shadow')[0]} opacity-5 group-hover:opacity-10 transition-opacity blur-3xl`} />

                <div className="relative bg-white/60 backdrop-blur-3xl rounded-[calc(2.5rem-1px)] p-8 h-full flex flex-col items-center border border-white">
                  {/* Icon with Vibrant Gradient Container */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br ${gradientClass.split(' shadow')[0]} ${gradientClass.split(' ')[2]}`}>
                    <Icon className="size-8 text-white" />
                  </div>

                  <div className="relative z-10 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <p className={`text-5xl font-black tracking-tighter mb-2 bg-gradient-to-br ${gradientClass.split(' shadow')[0]} bg-clip-text text-transparent`}>
                      {stat.value}
                    </p>
                    <Badge variant="outline" className="border-slate-100 text-slate-500 bg-slate-50/50 text-[9px] font-black rounded-full px-4 py-1.5 transition-colors group-hover:bg-white group-hover:border-slate-200">
                      <TrendingUp className="size-3 text-emerald-500 mr-2" />
                      {stat.trend}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Comparison Section */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <div>
            <h4 className="text-3xl font-black bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 bg-clip-text text-transparent tracking-tight">Cân nhắc lựa chọn gói?</h4>
            <p className="text-indigo-400 font-black mt-1 drop-shadow-sm">So sánh để tìm giải pháp tối ưu nhất cho bài đăng của bạn</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowComparison(!showComparison)}
            className="px-8 py-7 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-black flex items-center gap-3 transition-all"
          >
            {showComparison ? "Thu gọn bảng" : "Xem bảng so sánh chi tiết"}
            <ChevronRight className={`size-5 transition-transform duration-300 ${showComparison ? "rotate-90" : ""}`} />
          </Button>
        </div>

        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-indigo-100/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        <th className="text-left py-6 px-4 text-xs font-black text-indigo-400 uppercase tracking-widest">Tính năng tiêu biểu</th>
                        <th className="text-center py-6 px-4 text-xl font-black text-indigo-600">Standard</th>
                        <th className="text-center py-6 px-4">
                          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white px-6 py-4 rounded-2xl text-xl font-black inline-flex items-center gap-2 shadow-xl shadow-indigo-600/20">
                            PRO <Zap className="size-5 text-yellow-400" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((feature, idx) => (
                        <tr key={idx} className="border-b border-gray-50 group hover:bg-indigo-50/20 transition-colors">
                          <td className="py-6 px-4 font-bold text-gray-700 flex items-center gap-2">
                            {feature.name}
                            {feature.highlighted && <div className="size-1.5 bg-orange-400 rounded-full animate-pulse" />}
                          </td>
                          <td className="py-6 px-4 text-center font-medium text-gray-500">
                            {typeof feature.standard === "boolean" ? (
                              feature.standard ? <Check className="size-5 text-green-500 mx-auto" /> : <X className="size-5 text-gray-300 mx-auto" />
                            ) : feature.standard}
                          </td>
                          <td className="py-6 px-4 text-center font-black text-indigo-700 bg-indigo-50/10">
                            {typeof feature.pro === "boolean" ? (
                              feature.pro ? <Check className="size-6 text-indigo-600 mx-auto" /> : <X className="size-6 text-gray-300 mx-auto" />
                            ) : feature.pro}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Transactions & Support */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* History Table */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between ml-2">
            <h4 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent flex items-center gap-3">
              <CreditCard className="size-6 text-indigo-600" />
              Lịch sử giao dịch
            </h4>
            <Badge variant="outline" className="border-indigo-100 text-indigo-500 px-4 py-1 font-black shadow-sm">Gần đây nhất</Badge>
          </div>
          <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr className="border-b border-gray-100">
                    <th className="py-5 px-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày</th>
                    <th className="py-5 px-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dịch vụ</th>
                    <th className="py-5 px-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Thanh toán</th>
                    <th className="py-5 px-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Tải file</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300 font-bold italic">
                          <CreditCard className="size-10" />
                          Chưa ghi nhận giao dịch nào
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-5 px-6 font-bold text-gray-500 text-sm">
                          {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-5 px-6">
                          <p className="font-black text-indigo-950 text-base">{t.description}</p>
                          <p className="text-[10px] font-black text-emerald-600 uppercase mt-1 flex items-center gap-1">
                            <span className="size-1 bg-emerald-600 rounded-full" />
                            {t.paymentMethod}
                          </p>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <span className="font-black text-indigo-600 text-lg">{(t.amount || 0).toLocaleString("vi-VN")}đ</span>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDownloadInvoice(t.invoiceId)}
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            <Download className="size-5" />
                          </motion.button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 5. Support Card (Vibrant Light) */}
        <div className="xl:col-span-4 h-full">
          <motion.div
            whileHover={{ y: -10 }}
            className="relative h-full rounded-[3rem] overflow-hidden group shadow-2xl shadow-indigo-100/30 bg-white border border-white"
          >
            {/* Animated Mesh Background (Soft & Vibrant) */}
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 via-blue-400/10 to-emerald-300/20 animate-pulse" />
              <div className="absolute -top-[20%] -right-[20%] w-[120%] h-[120%] bg-indigo-500/10 blur-[100px] rounded-full" />
              <div className="absolute -bottom-[20%] -left-[20%] w-[110%] h-[110%] bg-blue-500/10 blur-[80px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 p-10 h-full backdrop-blur-3xl flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-8 shadow-xl shadow-indigo-100">
                  <Star className="size-8 text-white fill-white" />
                </div>
                <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                  Cần tư vấn <br /> về gói cước?
                </h4>
                <p className="text-slate-500 font-bold leading-relaxed">
                  Đội ngũ chuyên viên MapHome luôn sẵn sàng hỗ trợ bạn lựa chọn giải pháp tối ưu nhất.
                </p>
              </div>

              <Button className="w-full h-16 mt-8 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 border-none">
                Liên hệ ngay
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
