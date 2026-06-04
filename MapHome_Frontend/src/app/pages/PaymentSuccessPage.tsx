import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/app/contexts/AuthContext";
import api from "@/app/utils/api";
import { formatDateVietnamese } from "@/app/utils/dateUtils";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import {
  Check,
  Home,
  ArrowRight,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Calendar,
  MapPin,
} from "lucide-react";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();

  const checkoutType =
    location.state?.type || searchParams.get("type") || "subscription";
  const isInspection = checkoutType === "inspection";

  // Plan data reconstruction if coming from redirect
  const planIdFromUrl = searchParams.get("planId");
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/subscriptions/plans");
        if (res.status === 200) {
          setAvailablePlans(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch plans in success page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Tìm tier trong danh sách plans đã load từ API
  const tierFromList =
    location.state?.tier ||
    (planIdFromUrl
      ? availablePlans.find((p) => p.planId === planIdFromUrl)
      : null);

  // Fallback: Nếu API không trả về plan (ví dụ plan đã bị admin xóa),
  // vẫn hiển thị thông tin cơ bản dựa vào planId trong URL để không mất trang success
  const tier = tierFromList || (planIdFromUrl && !loading
    ? { planId: planIdFromUrl, name: planIdFromUrl.charAt(0).toUpperCase() + planIdFromUrl.slice(1) }
    : null);

  const amountStr = searchParams.get("amount");
  const amount =
    location.state?.amount || (amountStr ? Number(amountStr) : null);
  const orderId = location.state?.orderId || searchParams.get("orderId");
  const inspectionData = location.state?.inspectionData;

  // Chỉ redirect nếu KHÔNG có cả planId lẫn amount lẫn orderId (thực sự không hợp lệ)
  useEffect(() => {
    if (!loading && !isInspection && !planIdFromUrl && (!amount || !orderId)) {
      navigate("/pricing");
    }
  }, [loading, planIdFromUrl, amount, orderId, navigate, isInspection]);

  // Auto-redirect countdown after data loaded successfully
  useEffect(() => {
    if (loading || !tier || !amount || !orderId) return;
    const destination = isInspection 
      ? "/admin/dashboard" 
      : user?.role === "user" 
        ? "/user/dashboard" 
        : "/landlord/dashboard";
    if (countdown <= 0) {
      // replace:true → location.key thay đổi → SubscriptionManagement sẽ refetch subscription mới
      navigate(destination, { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, loading, tier, amount, orderId, navigate, isInspection, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Đang tải thông tin giao dịch...
          </p>
        </div>
      </div>
    );
  }

  if (!tier || !amount || !orderId) {
    return null;
  }

  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + 30);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      {/* Confetti Elements */}
      <div className="confetti-container">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: [
                "#3b82f6",
                "#10b981",
                "#f59e0b",
                "#ec4899",
                "#8b5cf6",
              ][Math.floor(Math.random() * 5)],
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Progress Stepper */}
      <div className="bg-white border-b shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4">
            {/* Step 1 - Completed */}
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                  <Check className="size-5" strokeWidth={3} />
                </div>
                <span className="text-xs font-semibold text-green-600 mt-2 whitespace-nowrap">
                  Chọn gói
                </span>
              </div>
              <div className="h-0.5 w-20 bg-green-600 mx-2" />
            </div>

            {/* Step 2 - Completed */}
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                  <Check className="size-5" strokeWidth={3} />
                </div>
                <span className="text-xs font-semibold text-green-600 mt-2 whitespace-nowrap">
                  Xác nhận
                </span>
              </div>
              <div className="h-0.5 w-20 bg-green-600 mx-2" />
            </div>

            {/* Step 3 - Completed */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                <Check className="size-5" strokeWidth={3} />
              </div>
              <span className="text-xs font-semibold text-green-600 mt-2 whitespace-nowrap">
                Hoàn tất
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[700px] mx-auto px-4 py-16 relative z-10">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[100px] h-[100px] rounded-full bg-green-200 animate-ping opacity-20"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[90px] h-[90px] rounded-full bg-green-300 animate-pulse opacity-30"></div>
            </div>

            {/* Main icon */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl">
              <Check className="size-10 text-white" strokeWidth={4} />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            Thanh toán thành công! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            {isInspection
              ? "Lịch kiểm tra thực địa đã được xác nhận"
              : `Gói ${tier.name} của bạn đã được kích hoạt`}
          </p>
        </div>

        {/* Activation Summary Card */}
        <Card className="border-2 border-gray-200 shadow-lg mb-8">
          <CardContent className="p-8">
            <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
              {isInspection && <ShieldCheck className="size-5 text-blue-600" />}
              {isInspection ? "Thông tin lịch kiểm tra" : "Thông tin kích hoạt"}
            </h3>

            <div className="space-y-4">
              {/* Dịch vụ */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">
                  {isInspection ? "Dịch vụ" : "Gói đăng ký"}
                </span>
                <span className="font-semibold text-gray-900">{tier.name}</span>
              </div>

              {/* Mã giao dịch */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Mã giao dịch</span>
                <code className="font-mono font-semibold text-blue-600 text-sm bg-blue-50 px-3 py-1 rounded">
                  {orderId}
                </code>
              </div>

              {/* Số tiền */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Số tiền</span>
                <span className="font-bold text-green-600 text-lg">
                  {amount.toLocaleString("vi-VN")}đ
                </span>
              </div>

              {isInspection && inspectionData ? (
                <>
                  {/* Căn trọ */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Căn trọ</span>
                    <span className="font-semibold text-gray-900">
                      {inspectionData.propertyName}
                    </span>
                  </div>

                  {/* Địa chỉ */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 flex items-center gap-1">
                      <MapPin className="size-3.5" /> Địa chỉ
                    </span>
                    <span className="font-semibold text-gray-900 text-right max-w-[60%]">
                      {inspectionData.propertyAddress}
                      {inspectionData.district
                        ? `, ${inspectionData.district}`
                        : ""}
                    </span>
                  </div>

                  {/* Chủ trọ */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Chủ trọ</span>
                    <span className="font-semibold text-gray-900">
                      {inspectionData.landlordName} -{" "}
                      {inspectionData.landlordPhone}
                    </span>
                  </div>

                  {/* Ngày kiểm tra */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Calendar className="size-3.5" /> Ngày kiểm tra
                    </span>
                    <span className="font-semibold text-blue-700">
                      {new Date(
                        inspectionData.scheduledDate,
                      ).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      - {inspectionData.scheduledTime}
                    </span>
                  </div>

                  {/* Trạng thái */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-600">Trạng thái</span>
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-300 font-semibold px-3 py-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                      Đã xác nhận lịch
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  {/* Ngày kích hoạt */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Ngày kích hoạt</span>
                    <span className="font-semibold text-gray-900">
                      {formatDateVietnamese(today)}
                    </span>
                  </div>

                  {/* Ngày hết hạn */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Ngày hết hạn</span>
                    <span className="font-semibold text-gray-900">
                      {formatDateVietnamese(expiryDate)}
                    </span>
                  </div>

                  {/* Trạng thái */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-600">Trạng thái</span>
                    <Badge className="bg-green-100 text-green-700 border border-green-300 font-semibold px-3 py-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Đang hoạt động
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {isInspection ? (
            <>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-lg h-14 text-base"
                onClick={() => navigate("/admin/dashboard")}
              >
                <LayoutDashboard className="size-5 mr-2" />
                Về Admin Dashboard
                <ArrowRight className="size-5 ml-2" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-gray-400 font-semibold h-14 text-base"
                onClick={() => navigate("/")}
              >
                <Home className="size-5 mr-2" />
                Về trang chủ
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg h-14 text-base"
                onClick={() => navigate("/post-room")}
              >
                <Home className="size-5 mr-2" />
                Đăng tin ngay
                <ArrowRight className="size-5 ml-2" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-gray-400 font-semibold h-14 text-base"
                onClick={() => navigate(user?.role === "user" ? "/user/dashboard" : "/landlord/dashboard")}
              >
                <LayoutDashboard className="size-5 mr-2" />
                Về trang quản lý
              </Button>
            </>
          )}
        </div>

        {/* Email Confirmation Note */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Mail className="size-4 text-blue-600 flex-shrink-0" />
          <p>
            {isInspection ? (
              "Thông tin kiểm tra đã được gửi đến đội ngũ xác thực. Chúng tôi sẽ liên hệ xác nhận trong 24h."
            ) : (
              <>
                Email xác nhận đã được gửi đến{" "}
                <span className="font-semibold text-blue-700">
                  landlord@example.com
                </span>
              </>
            )}
          </p>
        </div>

        {/* Auto-redirect countdown */}
        {!isInspection && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500">
              Tự động chuyển về{" "}
              <span className="font-semibold text-blue-600">trang quản lý</span>{" "}
              sau{" "}
              <span className="font-bold text-blue-700 text-base">{countdown}</span>{" "}
              giây...
            </p>
            {/* Progress bar */}
            <div className="w-full max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setCountdown(9999)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Huỷ tự động chuyển trang
            </button>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          opacity: 0;
          animation: confetti-fall linear forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 0;
            transform: translateY(0) rotateZ(0deg);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotateZ(720deg);
          }
        }
      `}</style>
    </div>
  );
}
