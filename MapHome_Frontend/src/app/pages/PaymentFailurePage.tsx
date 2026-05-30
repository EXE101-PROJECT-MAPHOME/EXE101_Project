import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  X,
  AlertCircle,
  CreditCard,
  RefreshCw,
  MessageCircle,
  ChevronLeft,
  CheckCircle2,
  Wallet,
  Phone,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

const failureReasons = [
  { id: "declined", label: "Thẻ bị từ chối", icon: CreditCard },
  { id: "insufficient", label: "Không đủ số dư", icon: Wallet },
  { id: "timeout", label: "Hết thời gian giao dịch", icon: AlertCircle },
];

const suggestions = [
  {
    icon: Wallet,
    title: "Kiểm tra số dư tài khoản",
    description: "Đảm bảo tài khoản có đủ số dư để thanh toán",
  },
  {
    icon: CreditCard,
    title: "Thử phương thức thanh toán khác",
    description: "Sử dụng thẻ khác hoặc ví điện tử MoMo, ZaloPay",
  },
  {
    icon: Phone,
    title: "Liên hệ ngân hàng nếu thẻ bị khóa",
    description: "Gọi hotline ngân hàng để kiểm tra tình trạng thẻ",
  },
];

export function PaymentFailurePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedReason, setSelectedReason] = useState("declined");

  const [searchParams] = useSearchParams();

  // Get data from navigation state or URL params
  const tier = location.state?.tier;
  const amount = location.state?.amount;
  const errorCode = location.state?.errorCode || searchParams.get("code") || "VNP_099";

  const currentTime = new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleRetry = () => {
    // Navigate back to checkout
    navigate("/checkout", {
      state: {
        selectedTier: tier?.id || "standard",
        billingCycle: "monthly",
      },
    });
  };

  const handleChangePaymentMethod = () => {
    // In real app, show payment method selector
    toast.info(
      "🔄 Chuyển đến trang chọn phương thức thanh toán...\n\nDemo: Bạn có thể chọn PayOS, MoMo, ZaloPay, v.v.",
    );
    handleRetry();
  };

  const SelectedReasonIcon =
    failureReasons.find((r) => r.id === selectedReason)?.icon || AlertCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-gray-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-[600px] w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Subtle pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80px] h-[80px] rounded-full bg-red-200 animate-pulse opacity-20"></div>
            </div>

            {/* Main error icon */}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
              <X className="size-9 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Thanh toán không thành công
          </h1>
          <p className="text-gray-600">
            Giao dịch của bạn đã bị hủy hoặc không thể hoàn tất
          </p>
        </div>

        {/* Error Reason Card */}
        <Card className="bg-red-50 border-2 border-red-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <SelectedReasonIcon className="size-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-3">
                  Nguyên nhân có thể
                </h3>
                <Select
                  value={selectedReason}
                  onValueChange={setSelectedReason}
                >
                  <SelectTrigger className="w-full bg-white border-red-300 focus:ring-red-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {failureReasons.map((reason) => {
                      const Icon = reason.icon;
                      return (
                        <SelectItem key={reason.id} value={reason.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="size-4" />
                            {reason.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What to do section */}
        <Card className="border-2 border-gray-200 mb-8">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="size-5 text-blue-600" />
              Bạn có thể làm gì?
            </h3>

            <div className="space-y-4">
              {suggestions.map((suggestion, idx) => {
                const Icon = suggestion.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="size-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary (if available) */}
        {tier && amount && (
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-700 text-sm mb-3">
                Đơn hàng chưa hoàn tất
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{tier.name}</p>
                  <p className="text-xs text-gray-500">1 tháng</p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {amount.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg h-12"
            onClick={handleRetry}
          >
            <RefreshCw className="size-4 mr-2" />
            Thử lại
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-2 border-gray-300 hover:border-gray-400 font-semibold h-12"
            onClick={handleChangePaymentMethod}
          >
            <CreditCard className="size-4 mr-2" />
            Đổi phương thức thanh toán
          </Button>
        </div>

        {/* Back to Pricing Link */}
        <div className="text-center mb-6">
          <button
            onClick={() => navigate("/pricing")}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm inline-flex items-center gap-2 hover:gap-3 transition-all"
          >
            <ChevronLeft className="size-4" />
            Về trang chọn gói
          </button>
        </div>

        {/* Support Line */}
        <Card className="bg-blue-50 border-2 border-blue-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <MessageCircle className="size-4 text-blue-600" />
              <span className="text-gray-700">Cần hỗ trợ?</span>
              <button className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                Chat với chúng tôi
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Error Code Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              Mã lỗi: {errorCode}
            </span>
            {" · "}
            <span>Thời gian: {currentTime}</span>
          </p>
        </div>

        {/* Additional Help */}
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="size-4 text-amber-600" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-amber-900 mb-1">
                Đảm bảo an toàn 100%
              </p>
              <p className="text-amber-800 text-xs leading-relaxed">
                Không có khoản phí nào được trừ từ tài khoản của bạn. Thông tin
                thẻ được bảo mật hoàn toàn bởi PayOS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
