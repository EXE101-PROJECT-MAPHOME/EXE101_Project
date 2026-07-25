import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RentalProperty } from "@/app/components/types";
import { useProperties } from "@/app/contexts/useProperties";
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  CheckCircle,
} from "lucide-react";
import api from "@/app/utils/api";
import { toast } from "sonner";

interface RequestVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
}

export function RequestVerificationDialog({
  isOpen,
  onClose,
  landlordId,
  landlordName,
  landlordPhone,
}: RequestVerificationDialogProps) {
  const { properties } = useProperties();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [pricing, setPricing] = useState({
    basicVerification: 0,
    premiumVerification: 0,
  });

  // Fetch pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await api.get("/api/verifications/pricing");
        if (res.status === 200) {
          setPricing(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch verification pricing", err);
      }
    };
    fetchPricing();
  }, []);

  // Filter properties belonging to this landlord
  const landlordProperties = properties.filter(
    (p) => p.ownerName === landlordName || p.pinInfo?.pinnedBy === landlordId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPropertyId || !scheduledDate) {
      toast.warning("Vui lòng chọn căn trọ và ngày hẹn");
      return;
    }

    const property = properties.find(
      (p) => (p.id || p._id) === selectedPropertyId,
    );
    if (!property) return;

    setIsSubmitting(true);
    try {
      const payload = {
        propertyId: property.id || property._id,
        propertyName: property.name,
        landlordId,
        landlordName,
        scheduledDate,
        scheduledTime,
        notes,
        address: property.address,
        phone: landlordPhone,
      };

      const res = await api.post("/api/verifications", payload);

      if (res.status === 200 || res.status === 201) {
        const verificationId = res.data._id || res.data.id;
        
        toast.loading("Đang chuyển hướng sang cổng thanh toán PayOS...");
        
        try {
          const paymentRes = await api.post("/api/payments/create", {
            amount: pricing.premiumVerification || 500000,
            description: "Phi xac thuc thuc te",
            planId: "premium_verification",
            verificationId,
            appReturnUrl: window.location.href, // Returns to LandlordDashboard
          });

          if (paymentRes.status === 200 && paymentRes.data.url) {
            window.location.href = paymentRes.data.url;
          } else {
            throw new Error("Không thể tạo link thanh toán");
          }
        } catch (paymentErr: any) {
          console.error(paymentErr);
          toast.error("Không thể kết nối với PayOS. Vui lòng thử thanh toán lại trong Dashboard.");
          onClose();
          window.location.reload();
        }
      } else {
        throw new Error("Gửi yêu cầu thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Có lỗi xảy ra. Không thể gửi yêu cầu. ❌",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <ShieldCheck className="size-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Yêu cầu kiểm tra & Cấp Tích Xanh
                </h2>
                <p className="text-green-100 text-sm">
                  Nâng cao độ tin cậy của tin đăng
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Benefits */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="size-5 text-green-600" />
              Lợi ích khi có Tích Xanh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <div className="text-2xl mb-1">⭐</div>
                <p className="text-xs font-semibold text-gray-900">
                  Ưu tiên hiển thị
                </p>
                <p className="text-xs text-gray-600">Lên top tìm kiếm</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="text-2xl mb-1">🛡️</div>
                <p className="text-xs font-semibold text-gray-900">
                  Tăng độ tin cậy
                </p>
                <p className="text-xs text-gray-600">Đã kiểm tra thực tế</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="text-2xl mb-1">📈</div>
                <p className="text-xs font-semibold text-gray-900">
                  Nhiều lượt xem
                </p>
                <p className="text-xs text-gray-600">+50% người thuê</p>
              </div>
            </div>
          </div>

          {/* Select Property */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Chọn căn trọ cần kiểm tra *
            </Label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              required
            >
              <option value="">-- Chọn căn trọ --</option>
              {landlordProperties.map((property) => (
                <option
                  key={property._id || property.id}
                  value={property._id || property.id}
                >
                  {property.name} - {property.address}
                  {property.greenBadge ? " ✅ (Đã có tích xanh)" : ""}
                </option>
              ))}
            </select>
            {landlordProperties.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                Bạn chưa có tin đăng nào. Vui lòng đăng tin trước khi yêu cầu
                kiểm tra.
              </p>
            )}
          </div>

          {/* Schedule Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="size-4" />
                Ngày hẹn *
              </Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="text-sm"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="size-4" />
                Giờ hẹn *
              </Label>
              <select
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                required
              >
                <option value="08:00">08:00 - 09:00</option>
                <option value="09:00">09:00 - 10:00</option>
                <option value="10:00">10:00 - 11:00</option>
                <option value="11:00">11:00 - 12:00</option>
                <option value="13:00">13:00 - 14:00</option>
                <option value="14:00">14:00 - 15:00</option>
                <option value="15:00">15:00 - 16:00</option>
                <option value="16:00">16:00 - 17:00</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Ghi chú thêm (tùy chọn)
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Hẹn tại cổng chính, gọi trước 15 phút..."
              className="w-full min-h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
            />
          </div>

          {/* Inspection Process */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle className="size-4" />
              Quy trình kiểm tra
            </h4>
            <ol className="space-y-2 text-xs text-blue-800">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <span>Admin xác nhận lịch hẹn (trong 24h)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <span>Đội ngũ kiểm tra đến hiện trường đúng giờ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                <span>Đánh giá: vị trí GPS, điều kiện phòng, pháp lý</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                  4
                </span>
                <span>Cấp Tích Xanh (Basic/Premium/Platinum) nếu đạt</span>
              </li>
              <li className="flex items-start gap-2 pt-2 border-t border-blue-100 mt-2">
                <Award className="size-4 text-blue-600 flex-shrink-0" />
                <span className="font-bold">
                  Chi phí: {pricing.premiumVerification.toLocaleString()}đ / lần
                  kiểm tra
                </span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              disabled={landlordProperties.length === 0 || isSubmitting}
            >
              <ShieldCheck className="size-4 mr-2" />
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
