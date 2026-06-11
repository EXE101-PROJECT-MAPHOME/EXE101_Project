import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { VerificationRequest, GreenBadgeLevel } from "@/app/components/types";
import { useVerification } from "@/app/contexts/VerificationContext";
import { useProperties } from "@/app/contexts/useProperties";
import { formatDateVietnamese } from "@/app/utils/dateUtils";
import { X, ShieldCheck, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import api from "@/app/utils/api";

interface InspectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: VerificationRequest;
}

export function InspectionDialog({
  isOpen,
  onClose,
  request,
}: InspectionDialogProps) {
  const { completeInspection } = useVerification();
  const { updateProperty } = useProperties();
  const [notes, setNotes] = useState("");
  const [isApproved, setIsApproved] = useState(true);
  const [checklist, setChecklist] = useState({
    isAccurate: false,
    hasAmenities: false,
    isSecure: false,
    isLegal: false,
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    const requestId = (request as any)._id || request.id;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("badgeAwarded", isApproved ? "verified" : "none");
      formData.append("inspectorNotes", notes);
      formData.append("inspectionChecklist", JSON.stringify(checklist));

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const res = await api.put(
        `/api/admin/verification/${requestId}/complete`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.status === 200 || res.status === 201) {
        if (!isApproved) {
          toast.error("Đã từ chối yêu cầu! ❌");
        } else {
          // Award verified badge in UI
          const greenBadge = {
            level: "verified" as GreenBadgeLevel,
            awardedAt: new Date().toISOString(),
            awardedBy: "admin-001",
            inspectionNotes: notes,
          };

          const propId =
            typeof request.propertyId === "object"
              ? (request.propertyId as any)._id
              : request.propertyId;
          updateProperty(propId, { greenBadge });

          toast.success(
            <div className="flex flex-col gap-1">
              <p className="font-bold">Đã hoàn tất kiểm tra! ✅</p>
              <p className="text-xs">🏆 Cấp Tích Xanh: ĐÃ XÁC THỰC</p>
              <p className="text-xs">📍 Căn trọ: {request.propertyName}</p>
              <p className="text-xs text-gray-500 mt-1 italic">
                Tích xanh đã được hiển thị trên tin đăng & bản đồ!
              </p>
            </div>,
            { duration: 5000 }
          );
        }
        onClose();
      }
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi xảy ra khi cập nhật kết quả.");
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
                <h2 className="text-2xl font-bold">Hoàn thành kiểm tra</h2>
                <p className="text-blue-100 text-sm">
                  Xác thực căn trọ trên nền tảng
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
        <div className="p-6 space-y-6">
          {/* Request Info */}
          <div className="bg-gray-50 rounded-xl p-5 border">
            <h3 className="font-semibold text-gray-900 mb-3">
              Thông tin yêu cầu
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Căn trọ:</p>
                <p className="font-semibold text-gray-900">
                  {request.propertyName}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Chủ trọ:</p>
                <p className="font-semibold text-gray-900">
                  {request.landlordName}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Địa chỉ:</p>
                <p className="font-semibold text-gray-900">{request.address}</p>
              </div>
              <div>
                <p className="text-gray-600">Ngày hẹn:</p>
                <p className="font-semibold text-gray-900">
                  {formatDateVietnamese(request.scheduledDate)} •{" "}
                  {request.scheduledTime}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">SĐT liên hệ:</p>
                <p className="font-semibold text-gray-900">{request.phone}</p>
              </div>
              {request.notes && (
                <div className="col-span-2">
                  <p className="text-gray-600">Ghi chú từ chủ trọ:</p>
                  <p className="font-semibold text-gray-900 italic">
                    "{request.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Approval Toggle */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <button
              onClick={() => setIsApproved(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                isApproved
                  ? "bg-green-50 border-green-500 text-green-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <CheckCircle2 className="size-6" />
              <span className="font-semibold">Đạt yêu cầu</span>
            </button>
            <button
              onClick={() => setIsApproved(false)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                !isApproved
                  ? "bg-red-50 border-red-500 text-red-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <AlertCircle className="size-6" />
              <span className="font-semibold">Không đạt</span>
            </button>
          </div>

          {/* Verification Preview (only show if approved) */}
          {isApproved && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-2">
                  <ShieldCheck
                    className="size-6 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-green-900">
                    Đã được xác thực bởi nền tảng
                  </h4>
                  <p className="text-sm text-green-700">
                    Căn trọ này đã được MapHome kiểm tra và xác nhận
                  </p>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-4 space-y-2">
                <h5 className="font-semibold text-green-900 text-sm mb-3">
                  ✨ Lợi ích khi được xác thực:
                </h5>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      Hiển thị badge "Đã xác thực" trên tin đăng và bản đồ
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Ưu tiên hiển thị trong kết quả tìm kiếm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Tăng độ tin cậy, người thuê yên tâm hơn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Giảm thiểu tin đăng ảo, bảo vệ người dùng</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Inspection Notes */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              {isApproved ? "Ghi chú đánh giá (tùy chọn)" : "Lý do không đạt *"}
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isApproved
                  ? "VD: Vị trí GPS chính xác, phòng đúng mô tả, điều kiện tốt..."
                  : "VD: Vị trí GPS không chính xác, điều kiện phòng không đúng mô tả..."
              }
              className="w-full min-h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none mb-4"
              required={!isApproved}
            />

            {isApproved && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Tiêu chí thẩm định
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.isAccurate}
                        onChange={(e) => setChecklist({ ...checklist, isAccurate: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Hình ảnh & mô tả trung thực
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.hasAmenities}
                        onChange={(e) => setChecklist({ ...checklist, hasAmenities: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Tiện nghi hoạt động tốt
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.isSecure}
                        onChange={(e) => setChecklist({ ...checklist, isSecure: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      An ninh & PCCC đảm bảo
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.isLegal}
                        onChange={(e) => setChecklist({ ...checklist, isLegal: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Pháp lý/chủ nhà hợp lệ
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Upload Minh chứng (Ảnh/Video, Tối đa 30MB)
                  </Label>
                  <label className="flex items-center justify-center w-full min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả file
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, MP4 (Max. 30MB)</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setMediaFiles(Array.from(e.target.files));
                        }
                      }}
                    />
                  </label>
                  {mediaFiles.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Đã chọn {mediaFiles.length} file:
                      <ul className="list-disc pl-5 mt-1">
                        {mediaFiles.map((f, idx) => (
                          <li key={idx} className="truncate">{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleComplete}
              className={`flex-1 ${
                isApproved
                  ? "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              disabled={isSubmitting || (!isApproved && !notes.trim())}
            >
              {isSubmitting ? (
                "Đang xử lý..."
              ) : isApproved ? (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Cấp Tích Xanh
                </>
              ) : (
                <>
                  <AlertCircle className="size-4 mr-2" />
                  Từ chối yêu cầu
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
