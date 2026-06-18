import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { formatDateVietnamese } from "@/app/utils/dateUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import {
  Check,
  ChevronLeft,
  Shield,
  Lock,
  CreditCard,
  Smartphone,
  Calendar,
  MapPin,
  Home,
  Star,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Users,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/utils/api";
import { useAuth } from "@/app/contexts/AuthContext";

interface PricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  badge?: string;
}

const inspectionTypeLabels: Record<string, string> = {
  standard: "Kiểm tra tiêu chuẩn",
  detailed: "Kiểm tra chi tiết",
  urgent: "Kiểm tra khẩn cấp",
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile, user } = useAuth();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ discountPercentage: number; voucherId: string; code: string } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // Voucher Wallet states
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [savedVouchers, setSavedVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Đọc state từ location trước, fallback sessionStorage nếu bị mất (iframe/sandbox issue)
  const rawState =
    location.state ||
    (() => {
      try {
        const stored = sessionStorage.getItem("inspectionCheckoutData");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Xóa sau khi đọc để tránh dùng lại
          sessionStorage.removeItem("inspectionCheckoutData");
          return parsed;
        }
      } catch (_) {}
      return null;
    })();

  const checkoutType = rawState?.type || "subscription";
  const isInspection = checkoutType === "inspection";
  const inspectionData = rawState?.inspectionData;

  const selectedTierId = rawState?.selectedTier || "standard";
  const billingCycle = rawState?.billingCycle || "monthly";
  const selectedTier = plans.find((p) => p.planId === selectedTierId);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const res = await api.get("/api/subscriptions/plans");
        if (res.status === 200) {
          setPlans(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast.error("Không thể tải thông báo gói dịch vụ. Vui lòng thử lại.");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchSavedVouchers = async () => {
      if (!user) return;
      try {
        setLoadingVouchers(true);
        const res = await api.get("/api/vouchers/me/saved");
        if (res.status === 200) {
          setSavedVouchers(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch saved vouchers:", error);
      } finally {
        setLoadingVouchers(false);
      }
    };
    fetchSavedVouchers();
  }, [user]);

  useEffect(() => {
    // Chỉ redirect nếu KHÔNG có bất kỳ data nào (tránh redirect vô lý)
    // Sau khi đã load plans xong mà vẫn không thấy selectedTier
    if (!loadingPlans && !isInspection && !selectedTier) {
      navigate("/pricing");
    }
  }, [loadingPlans, isInspection, selectedTier, navigate]);

  if (loadingPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Đang tải cấu hình thanh toán...
          </p>
        </div>
      </div>
    );
  }

  if (!isInspection && !selectedTier) return null;

  // Nếu là inspection nhưng thiếu data → hiển thị thông báo thay vì redirect
  if (isInspection && !inspectionData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Không tìm thấy thông tin lịch hẹn
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Phiên làm việc đã hết hạn hoặc xảy ra lỗi. Vui lòng quay lại và
              điền lại thông tin.
            </p>
            <Button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ChevronLeft className="size-4 mr-2" />
              Quay lại Admin Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const serviceFee: number = 0;
  const baseAmount = isInspection ? 199000 : selectedTier.price;
  const discountAmount = appliedVoucher ? (baseAmount * appliedVoucher.discountPercentage) / 100 : 0;
  const totalAmount = baseAmount - discountAmount + serviceFee;
  const duration = isInspection
    ? "1 lần kiểm tra"
    : billingCycle === "monthly"
      ? "1 tháng (30 ngày)"
      : "12 tháng (1 năm)";

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setValidatingVoucher(true);
    try {
      const res = await api.post("/api/vouchers/validate", {
        code: voucherCode,
        planId: isInspection ? "inspection" : selectedTierId,
      });
      setAppliedVoucher({
        discountPercentage: res.data.discountPercentage,
        voucherId: res.data.voucherId,
        code: voucherCode.toUpperCase(),
      });
      toast.success(res.data.message || "Áp dụng mã giảm giá thành công!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã giảm giá không hợp lệ");
      setAppliedVoucher(null);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast.warning("Vui lòng đồng ý với điều khoản sử dụng để tiếp tục");
      return;
    }

    try {
      setIsProcessing(true);

      // Nếu là gói miễn phí (amount = 0), kích hoạt trực tiếp không qua cổng thanh toán
      if (!isInspection && totalAmount === 0) {
        try {
          const res = await api.post("/api/subscriptions/subscribe", {
            planId: selectedTierId,
          });
          if (res.status === 200) {
            toast.success("Kích hoạt gói dịch vụ miễn phí thành công! 🎉");
            // Gọi refreshProfile để cập nhật state sidebar
            await refreshProfile();
            navigate(`/payment-success?planId=${selectedTierId}&orderId=free-${Date.now()}&amount=0`);
          }
          return;
        } catch (error: any) {
          console.error("Free subscription activation failed:", error);
          toast.error(
            error.response?.data?.message || "Không thể kích hoạt gói dịch vụ miễn phí."
          );
          return;
        }
      }

      // 1. Create payment on backend
      const res = await api.post("/api/payments/create", {
        amount: totalAmount,
        description: isInspection
          ? `Thanh toán kiểm tra căn trọ: ${inspectionData.propertyName}`
          : `Nâng cấp gói: ${selectedTier.name} (${billingCycle})`,
        planId: isInspection ? "inspection" : selectedTierId,
        voucherId: appliedVoucher?.voucherId || null,
      });

      if (res.status === 200 && res.data.url) {
        // 2. Redirect to PayOS
        window.location.href = res.data.url;
      } else {
        throw new Error("Failed to create payment URL");
      }
    } catch (error: any) {
      console.error("Payment initiation failed:", error);
      toast.error(
        error.response?.data?.message || "Không thể khởi tạo thanh toán.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* spacer to offset fixed navbar height (prevents overlap) */}
      <div className="h-16" aria-hidden="true" />

      {/* Progress Stepper */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 px-6 py-4">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                    <Check className="size-5" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-semibold text-green-600 mt-2 whitespace-nowrap">
                    {isInspection ? "Đặt lịch" : "Chọn gói"}
                  </span>
                </div>
                <div className="h-0.5 w-20 bg-green-600 mx-2" />
              </div>
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white animate-pulse">
                    <span className="font-bold">2</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 mt-2 whitespace-nowrap">
                    Xác nhận
                  </span>
                </div>
                <div className="h-0.5 w-20 bg-gray-300 mx-2" />
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <span className="font-bold">3</span>
                </div>
                <span className="text-xs font-medium text-gray-400 mt-2 whitespace-nowrap">
                  Hoàn tất
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            <Button
              variant="ghost"
              onClick={() =>
                navigate(isInspection ? "/admin/dashboard" : "/pricing")
              }
              className="mb-4"
            >
              <ChevronLeft className="size-4 mr-2" />
              {isInspection ? "Quay lại Admin Dashboard" : "Quay lại chọn gói"}
            </Button>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isInspection
                  ? "Thanh toán kiểm tra thực địa"
                  : "Xác nhận đơn hàng"}
              </h1>
              <p className="text-gray-600">
                {isInspection
                  ? "Xác nhận thông tin lịch kiểm tra và thanh toán"
                  : "Kiểm tra thông tin trước khi thanh toán"}
              </p>
            </div>

            {/* INSPECTION ORDER DETAILS */}
            {isInspection && (
              <>
                <Card className="rounded-2xl shadow-sm border border-gray-100">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl flex items-center gap-2">
                            <ShieldCheck className="size-6 text-blue-600" />
                            Kiểm tra thực địa
                          </CardTitle>
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            Xác thực
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-base">
                          <Calendar className="size-4" />
                          Loại:{" "}
                          <strong>
                            {inspectionTypeLabels[
                              inspectionData.inspectionType
                            ] || "Kiểm tra tiêu chuẩn"}
                          </strong>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          199.000đ
                        </div>
                        <div className="text-sm text-gray-500">/1 lần</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="size-5 text-amber-500" />
                      Dịch vụ bao gồm:
                    </h3>
                    <ul className="space-y-2.5">
                      {[
                        "Kiểm tra thực tế tại địa chỉ căn trọ",
                        "Xác thực vị trí GPS chính xác",
                        "Chụp ảnh & quay video hiện trường",
                        "Đánh giá điều kiện phòng, an ninh, PCCC",
                        "Cấp Tích Xanh nếu đạt yêu cầu",
                        "Báo cáo chi tiết kết quả kiểm tra",
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                            <Check
                              className="size-3.5 text-blue-600"
                              strokeWidth={3}
                            />
                          </div>
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 text-sm mb-1">
                          Đội ngũ kiểm tra sẽ liên hệ xác nhận
                        </p>
                        <p className="text-xs text-blue-700">
                          Sau khi thanh toán, đội ngũ sẽ liên hệ trong vòng 24h
                          để xác nhận lịch hẹn
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border border-gray-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="size-5 text-gray-600" />
                      Thông tin lịch kiểm tra
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-1.5">
                        <Users className="size-3.5" /> Chủ trọ
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Họ tên:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {inspectionData.landlordName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">SĐT:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {inspectionData.landlordPhone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-1.5">
                        <MapPin className="size-3.5" /> Căn trọ
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Tên:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {inspectionData.propertyName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Số phòng:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {inspectionData.roomCount || "N/A"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Địa chỉ:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {inspectionData.propertyAddress}
                            {inspectionData.district
                              ? `, ${inspectionData.district}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="text-xs font-bold uppercase text-blue-700 mb-3 flex items-center gap-1.5">
                        <Clock className="size-3.5" /> Lịch hẹn
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-blue-600">Ngày:</span>
                          <span className="ml-2 font-semibold text-blue-900">
                            {formatDateVietnamese(
                              inspectionData.scheduledDate,
                              true,
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-600">Giờ:</span>
                          <span className="ml-2 font-semibold text-blue-900">
                            {inspectionData.scheduledTime}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-blue-600">Loại:</span>
                          <span className="ml-2 font-semibold text-blue-900">
                            {inspectionTypeLabels[
                              inspectionData.inspectionType
                            ] || "Kiểm tra tiêu chuẩn"}
                          </span>
                        </div>
                      </div>
                      {inspectionData.notes && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <span className="text-blue-600 text-sm">
                            Ghi chú:
                          </span>
                          <p className="text-sm font-medium text-blue-900 mt-1 italic">
                            &quot;{inspectionData.notes}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* SUBSCRIPTION ORDER DETAILS */}
            {!isInspection && (
              <>
                <Card className="rounded-2xl shadow-sm border border-gray-100">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl">
                            {selectedTier.name}
                          </CardTitle>
                          {selectedTier.badge && (
                            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                              {selectedTier.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2 text-base">
                          <Calendar className="size-4" />
                          Thời hạn: <strong>{duration}</strong>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedTier.price.toLocaleString("vi-VN")}đ
                        </div>
                        <div className="text-sm text-gray-500">/tháng</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="size-5 text-amber-500" />
                      Tính năng bao gồm:
                    </h3>
                    <ul className="space-y-2.5">
                      {selectedTier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                            <Check
                              className="size-3.5 text-green-600"
                              strokeWidth={3}
                            />
                          </div>
                          <span className="text-sm text-gray-700">
                            {typeof feature === "string"
                              ? feature
                              : feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 text-sm mb-1">
                          Kích hoạt ngay sau thanh toán
                        </p>
                        <p className="text-xs text-blue-700">
                          Gói dịch vụ sẽ được áp dụng tự động cho tin đăng của
                          bạn
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border border-gray-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="size-5 text-gray-600" />
                      Thông tin tin đăng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="size-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Phòng trọ cao cấp gần trường
                        </p>
                        <p className="text-xs text-gray-500">
                          123 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà
                          Nội
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Loại hình:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          Phòng trọ
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Diện tích:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          25m²
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Giá thuê:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          3.000.000đ/tháng
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Trạng thái:</span>
                        <Badge
                          variant="outline"
                          className="ml-2 border-green-500 text-green-700"
                        >
                          Sẵn sàng
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Terms & Conditions */}
            <Card className="rounded-2xl shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5 text-gray-600" />
                  Điều khoản sử dụng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                  <p>
                    Bằng việc thanh toán, bạn đồng ý với các điều khoản sau:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 ml-2">
                    {isInspection ? (
                      <>
                        <li>
                          Phí kiểm tra thực địa là 199.000đ/lần, không hoàn lại
                          sau khi đội ngũ đã xác nhận lịch
                        </li>
                        <li>
                          Đội ngũ kiểm tra sẽ liên hệ xác nhận lịch hẹn trong
                          vòng 24h
                        </li>
                        <li>
                          Kết quả kiểm tra sẽ được gửi báo cáo chi tiết trong
                          48h sau kiểm tra
                        </li>
                        <li>
                          Nếu hủy trước khi đội ngũ xác nhận, bạn sẽ được hoàn
                          tiền 100%
                        </li>
                        <li>
                          MapHome cam kết bảo mật thông tin thanh toán của bạn
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          Gói dịch vụ sẽ được kích hoạt ngay sau khi thanh toán
                          thành công
                        </li>
                        <li>
                          Thời hạn sử dụng bắt đầu tính từ thời điểm kích hoạt
                        </li>
                        <li>
                          Bạn có thể hủy đăng ký bất kỳ lúc nào trong phần Cài
                          đặt
                        </li>
                        <li>
                          Chính sách hoàn tiền 100% trong vòng 7 ngày đầu tiên
                        </li>
                      </>
                    )}
                  </ul>
                  <Separator className="my-4" />
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) =>
                      setAgreedToTerms(checked as boolean)
                    }
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-700 cursor-pointer leading-relaxed"
                  >
                    Tôi đã đọc và đồng ý với{" "}
                    <a
                      href="/policy"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      điều khoản sử dụng
                    </a>{" "}
                    và{" "}
                    <a
                      href="/policy"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      chính sách bảo mật
                    </a>{" "}
                    của MapHome
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Payment Panel */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <Card className="border border-gray-100 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 border-b px-6 py-4">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="size-5" />
                    Chi tiết thanh toán
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">
                          {isInspection
                            ? "Kiểm tra thực địa"
                            : selectedTier.name}
                        </p>
                        <p className="text-xs text-gray-500">× {duration}</p>
                      </div>
                      <p className="font-extrabold text-2xl text-blue-600">
                        {baseAmount.toLocaleString("vi-VN")}đ
                      </p>
                    </div>

                    {appliedVoucher && (
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-emerald-600 flex items-center gap-1">
                          <Tag className="size-3" /> Giảm giá ({appliedVoucher.discountPercentage}%)
                        </p>
                        <p className="font-bold text-emerald-600">
                          -{discountAmount.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <p className="text-gray-600">Phí dịch vụ</p>
                      <p className="font-medium text-green-600">
                        {serviceFee === 0
                          ? "Miễn phí"
                          : `${serviceFee.toLocaleString("vi-VN")}đ`}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Voucher Input */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Tag className="size-4 text-emerald-600" /> Mã giảm giá
                      </p>
                      {user && (
                        <button
                          type="button"
                          onClick={() => setShowVoucherModal(true)}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 focus:outline-none"
                        >
                          Chọn từ ví voucher
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã voucher"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        disabled={!!appliedVoucher}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold uppercase disabled:bg-gray-100 disabled:text-gray-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                      {appliedVoucher ? (
                        <Button variant="outline" onClick={() => { setAppliedVoucher(null); setVoucherCode(""); }} className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                          Hủy
                        </Button>
                      ) : (
                        <Button onClick={handleApplyVoucher} disabled={!voucherCode || validatingVoucher} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                          {validatingVoucher ? "..." : "Áp dụng"}
                        </Button>
                      )}
                    </div>
                    {appliedVoucher && (
                      <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                        <span>Đã áp dụng mã: {appliedVoucher.code}</span>
                        <span className="bg-emerald-200/50 px-2 py-0.5 rounded">-{appliedVoucher.discountPercentage}%</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-gray-900">
                      Tổng cộng
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalAmount.toLocaleString("vi-VN")}đ
                    </p>
                  </div>

                  <Separator />

                  <Button
                    onClick={handlePayment}
                    disabled={!agreedToTerms || isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-xl rounded-full py-4 text-lg uppercase tracking-wider"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Lock className="size-4 mr-2" />
                        {totalAmount === 0
                          ? "Kích hoạt gói dịch vụ (Miễn phí)"
                          : "Thanh toán qua VietQR (PayOS)"}
                      </>
                    )}
                  </Button>

                  {totalAmount > 0 && (
                    <>
                      <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">VN</span>
                          </div>
                          <span className="font-bold text-green-700">PayOS</span>
                        </div>
                        <Lock className="size-4 text-blue-600" />
                      </div>

                      <p className="text-xs text-center text-gray-500 leading-relaxed">
                        Bạn sẽ được chuyển đến cổng thanh toán PayOS an toàn để hoàn
                        tất giao dịch.
                      </p>

                      <Separator />

                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-3 text-center">
                          Phương thức thanh toán được chấp nhận
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <Smartphone className="size-6 text-gray-600 mx-auto mb-1" />
                              <p className="text-[10px] text-gray-600 font-medium">
                                QR Pay
                              </p>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <CreditCard className="size-6 text-gray-600 mx-auto mb-1" />
                              <p className="text-[10px] text-gray-600 font-medium">
                                ATM
                              </p>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-700 mb-1">
                                VISA
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-6 h-6 rounded-full bg-pink-600 mx-auto mb-1 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  M
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-600 font-medium">
                                MoMo
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {totalAmount === 0 && (
                    <p className="text-xs text-center text-gray-500 leading-relaxed py-2">
                      Gói dịch vụ này hoàn toàn miễn phí. Bấm nút phía trên để kích hoạt ngay lập tức mà không cần thanh toán.
                    </p>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Shield className="size-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800 leading-relaxed">
                      <strong>Bảo mật 100%.</strong> Mọi giao dịch được mã hóa
                      SSL 256-bit. MapHome không lưu trữ thông tin thẻ của bạn.
                    </p>
                  </div>

                  {!agreedToTerms && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Vui lòng đồng ý với điều khoản sử dụng ở phần bên trái
                        để tiếp tục
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 rounded-2xl">
                  <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="size-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">
                        Đảm bảo hoàn tiền 100%
                      </h4>
                      <p className="text-sm text-green-700 leading-relaxed">
                        {isInspection
                          ? "Nếu hủy trước khi đội ngũ xác nhận lịch, bạn sẽ được hoàn lại toàn bộ số tiền."
                          : "Nếu không hài lòng trong 7 ngày đầu, bạn sẽ được hoàn lại toàn bộ số tiền."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </main>

      {/* Shopee-style Voucher Selector Modal themed in MapHome Emerald/Indigo */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="size-5 text-emerald-600 animate-pulse" />
                <h3 className="text-xl font-black text-emerald-950">Ví Voucher Của Bạn</h3>
              </div>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
              {loadingVouchers ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="size-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải ví voucher...</p>
                </div>
              ) : savedVouchers.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Tag className="size-8 text-slate-300" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">Ví voucher trống</h4>
                  <p className="text-xs text-slate-400 max-w-[240px] mx-auto">Hãy lưu thêm mã ưu đãi tại Trang chủ hoặc Dashboard để sử dụng khi thanh toán.</p>
                </div>
              ) : (
                savedVouchers.map((voucher) => {
                  const currentPlanId = isInspection ? "inspection" : selectedTierId;
                  const isApplicable = !voucher.applicablePlans || voucher.applicablePlans.length === 0 || 
                    voucher.applicablePlans.some((plan: any) => {
                      const id = typeof plan === 'object' ? (plan.planId || plan._id || '') : plan;
                      return String(id).toLowerCase() === String(currentPlanId).toLowerCase();
                    });

                  return (
                    <div
                      key={voucher._id || voucher.id}
                      className={`flex rounded-2xl border overflow-hidden relative transition-all ${
                        isApplicable
                          ? "bg-white border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200"
                          : "bg-slate-50/70 border-slate-100 opacity-60"
                      }`}
                    >
                      {/* Left: Tear-off */}
                      <div
                        className={`w-[25%] flex flex-col items-center justify-center text-center p-2 text-white relative overflow-hidden ${
                          isApplicable
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                            : "bg-slate-400"
                        }`}
                      >
                        <span className="text-[9px] font-black tracking-widest opacity-80">GIẢM</span>
                        <div className="flex items-baseline justify-center">
                          <span className="text-2xl font-black">{voucher.discountPercentage}</span>
                          <span className="text-[10px] font-bold ml-0.5">%</span>
                        </div>
                      </div>

                      {/* Cutout line */}
                      <div className="absolute left-[25%] top-0 bottom-0 w-0 border-l border-dashed border-slate-200 z-10" />
                      <div className="absolute left-[25%] top-0 w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 border-b border-slate-100 z-20" />
                      <div className="absolute left-[25%] bottom-0 w-3 h-3 bg-white rounded-full -translate-x-1/2 translate-y-1/2 border-t border-slate-100 z-20" />

                      {/* Right: Info */}
                      <div className="w-[75%] p-4 flex flex-col justify-between bg-white pl-5">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                              {voucher.code}
                            </span>
                            {!isApplicable && (
                              <span className="bg-red-50 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-100 uppercase">
                                Không khả dụng
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{voucher.title || "Ưu đãi thanh toán"}</h4>
                          <p className="text-slate-400 text-[10px] mt-0.5 line-clamp-1">
                            Hạn dùng: {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                          </p>
                        </div>

                        {/* Bottom row */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-[10px] text-slate-500 max-w-[180px] line-clamp-1 font-medium">
                            {isApplicable ? (
                              voucher.description || "Áp dụng cho đơn hàng hiện tại"
                            ) : (
                              <span className="text-red-500 font-bold text-xs">
                                Chỉ áp dụng cho gói: {voucher.applicablePlans.map((p: any) => typeof p === 'object' ? p.name : p).join(', ')}
                              </span>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            disabled={!isApplicable}
                            onClick={() => {
                              setVoucherCode(voucher.code);
                              setAppliedVoucher({
                                discountPercentage: voucher.discountPercentage,
                                voucherId: voucher._id || voucher.id,
                                code: voucher.code,
                              });
                              setShowVoucherModal(false);
                              toast.success(`Đã áp dụng mã: ${voucher.code} (-${voucher.discountPercentage}%)`);
                            }}
                            className={`h-7 px-3 text-xs font-black rounded-lg transition-transform active:scale-95 ${
                              isApplicable
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                            }`}
                          >
                            Áp dụng
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t flex justify-end">
              <Button
                onClick={() => setShowVoucherModal(false)}
                className="bg-slate-900 hover:bg-black text-white rounded-xl h-10 px-6 text-sm font-bold shadow-sm"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
