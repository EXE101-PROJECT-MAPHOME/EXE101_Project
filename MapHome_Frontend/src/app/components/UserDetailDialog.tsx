import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Home,
  ClipboardList,
  Shield,
  ShieldAlert,
  MapPin,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import api from "@/app/utils/api";
import { toast } from "sonner";
import { getAvatarUrl, getInitials } from "@/app/utils/avatarUtils";
import { RoleBadge } from "@/app/components/RoleBadge";

interface UserDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserDetailDialog({
  isOpen,
  onClose,
  userId,
}: UserDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "properties" | "bookings"
  >("profile");
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetail();
    } else {
      setData(null);
      setActiveTab("profile");
    }
  }, [isOpen, userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/users/${userId}`);
      if (res.status === 200) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="user-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            key="user-dialog"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, type: "spring", bounce: 0.18 }}
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-[#e0f2fe]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#22c55e] to-[#0ea5e9] p-8 text-white relative">
              <motion.button
                onClick={onClose}
                whileHover={{
                  scale: 1.09,
                  backgroundColor: "rgba(255,255,255,0.18)",
                }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Đóng"
              >
                <X className="size-6" />
              </motion.button>
              <div className="flex items-center gap-7">
                <motion.div
                  layoutId="user-avatar"
                  className="relative size-24 rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg shadow-[#bbf7d0]/30 bg-gradient-to-br from-[#16a34a] to-[#0ea5e9] overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, type: "spring", bounce: 0.3 }}
                >
                  {data?.user?.avatar ? (
                    <img
                      src={getAvatarUrl(data.user.avatar) || ""}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      style={{ imageRendering: "-webkit-optimize-contrast" }}
                    />
                  ) : (
                    <span className="text-5xl font-extrabold text-white select-none">
                      {getInitials(data?.user?.fullName, data?.user?.username)}
                    </span>
                  )}
                  {/* Status badge */}
                  <span
                    className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                      data?.user?.status === "active"
                        ? "bg-[#22c55e]"
                        : "bg-slate-300"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
                  </span>
                </motion.div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">
                      {data?.user?.fullName ||
                        data?.user?.username ||
                        "Đang tải..."}
                    </h2>
                    <RoleBadge
                      role={(data?.user?.role as any) || "user"}
                      showIcon={true}
                      className="!bg-white/20 !border-white/30"
                    />
                  </div>
                  <p className="text-white/90 text-base flex items-center gap-2 font-medium drop-shadow-sm">
                    <Mail className="size-4" /> {data?.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#e0f2fe] bg-[#f1f5f9]/60 px-8 pt-2 pb-1 relative">
              {[
                { id: "profile", label: "Hồ sơ" },
                ...(data?.user?.role === "landlord"
                  ? [
                      {
                        id: "properties",
                        label: `Căn hộ (${data?.properties?.length || 0})`,
                      },
                    ]
                  : []),
                {
                  id: "bookings",
                  label: `Lịch hẹn (${data?.bookings?.length || 0})`,
                },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-7 py-3 text-base font-bold transition-all rounded-2xl focus:outline-none ${
                    activeTab === tab.id
                      ? "text-[#16a34a]"
                      : "text-slate-400 hover:text-[#0ea5e9]"
                  }`}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ zIndex: 1 }}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute left-2 right-2 -bottom-1 h-1 rounded-full bg-gradient-to-r from-[#22c55e] to-[#0ea5e9] shadow-md"
                      transition={{
                        type: "spring",
                        bounce: 0.3,
                        duration: 0.5,
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#fcfdfe]">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <div className="size-10 border-4 border-[#e0f2fe] border-t-[#16a34a] rounded-full animate-spin" />
                  <p className="text-slate-400 text-base font-medium animate-pulse">
                    Đang truy xuất dữ liệu...
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {activeTab === "profile" && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{
                        duration: 0.22,
                        type: "spring",
                        bounce: 0.18,
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      <motion.div
                        whileHover={{
                          y: -2,
                          boxShadow: "0 8px 32px 0 #bbf7d0cc",
                        }}
                        className="bg-white rounded-3xl border border-[#e0f2fe] shadow-md p-7 space-y-5 transition-all"
                      >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <User className="size-4" /> Thông tin cơ bản
                        </h4>
                        <div className="space-y-4">
                          <InfoItem
                            label="Họ tên"
                            value={data?.user?.fullName || "Chưa cập nhật"}
                          />
                          <InfoItem
                            label="Username"
                            value={data?.user?.username}
                          />
                          <InfoItem label="Email" value={data?.user?.email} />
                          <InfoItem
                            label="Số điện thoại"
                            value={data?.user?.phone || "---"}
                          />
                        </div>
                      </motion.div>
                      <motion.div
                        whileHover={{
                          y: -2,
                          boxShadow: "0 8px 32px 0 #e0f2fecc",
                        }}
                        className="bg-white rounded-3xl border border-[#e0f2fe] shadow-md p-7 space-y-5 transition-all"
                      >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Shield className="size-4" /> Trạng thái tài khoản
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500 text-sm">
                              Trạng thái:
                            </span>
                            <motion.span
                              key={data?.user?.status}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm transition-colors ${
                                data?.user?.status === "active"
                                  ? "bg-[#bbf7d0] text-[#15803d] border border-[#22c55e]/30"
                                  : "bg-[#fee2e2] text-[#b91c1c] border border-[#f87171]/30"
                              }`}
                            >
                              {data?.user?.status === "active"
                                ? "ĐANG HOẠT ĐỘNG"
                                : "BỊ KHOÁ"}
                            </motion.span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-slate-50/50 transition-colors rounded-xl px-2 -mx-2">
                            <span className="text-gray-500 text-sm font-medium">
                              Vai trò:
                            </span>
                            <RoleBadge
                              role={(data?.user?.role as any) || "user"}
                              showIcon={false}
                              className="scale-90"
                            />
                          </div>

                          <InfoItem
                            label="Ngày tham gia"
                            value={
                              data?.user?.createdAt
                                ? new Date(
                                    data.user.createdAt,
                                  ).toLocaleDateString("vi-VN")
                                : "---"
                            }
                          />
                          <InfoItem
                            label="Cấp độ xác minh"
                            value={`${data?.user?.verificationLevelLabel || "Level 1"} - ${data?.user?.subscriptionTier || "Standard"}`}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === "properties" && (
                    <motion.div
                      key="properties"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{
                        duration: 0.22,
                        type: "spring",
                        bounce: 0.18,
                      }}
                      className="space-y-6"
                    >
                      {data?.properties?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {data.properties.map((prop: any) => (
                            <motion.div
                              key={prop._id}
                              whileHover={{
                                y: -3,
                                scale: 1.02,
                                boxShadow: "0 8px 32px 0 #e0f2fecc",
                              }}
                              className="bg-white rounded-3xl border border-[#e0f2fe] shadow-md p-5 flex gap-5 items-center transition-all group"
                            >
                              <div className="w-20 h-20 rounded-2xl bg-[#f1f5f9] flex-shrink-0 flex items-center justify-center text-3xl font-bold text-[#e0e7ef] overflow-hidden">
                                {prop.image ? (
                                  <img
                                    src={prop.image}
                                    className="w-full h-full object-cover rounded-2xl"
                                  />
                                ) : (
                                  "🏠"
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-slate-800 truncate mb-1 group-hover:text-[#16a34a] transition-colors text-base">
                                  {prop.name}
                                </h5>
                                <p className="text-xs text-slate-400 flex items-start gap-1 mb-2">
                                  <MapPin className="size-3 mt-0.5 shrink-0" />{" "}
                                  {prop.address}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-[#16a34a]">
                                    {prop.price?.toLocaleString()}đ/th
                                  </span>
                                  <motion.span
                                    key={prop.status}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border ${
                                      prop.status === "approved"
                                        ? "bg-[#bbf7d0] text-[#15803d] border-[#22c55e]/30"
                                        : "bg-[#fef9c3] text-[#b45309] border-[#fde68a]/30"
                                    }`}
                                  >
                                    {prop.status === "approved"
                                      ? "HIỂN THỊ"
                                      : "CHỜ DUYỆT"}
                                  </motion.span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState icon={<Home />} text="Chưa đăng tin nào" />
                      )}
                    </motion.div>
                  )}

                  {activeTab === "bookings" && (
                    <motion.div
                      key="bookings"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{
                        duration: 0.22,
                        type: "spring",
                        bounce: 0.18,
                      }}
                      className="space-y-6"
                    >
                      {data?.bookings?.length > 0 ? (
                        <div className="bg-white rounded-3xl border border-[#e0f2fe] overflow-hidden shadow-md">
                          <table className="w-full text-sm">
                            <thead className="bg-[#f1f5f9]">
                              <tr className="border-b border-[#e0f2fe]">
                                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[11px]">
                                  Căn hộ
                                </th>
                                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[11px]">
                                  Thời gian
                                </th>
                                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[11px]">
                                  Đối tác
                                </th>
                                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase text-[11px]">
                                  Trạng thái
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e0f2fe]">
                              {data.bookings.map((b: any) => (
                                <tr
                                  key={b._id}
                                  className="hover:bg-[#f1f5f9]/60 transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-slate-800">
                                      {b.propertyId?.name || "N/A"}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                      {b.propertyId?.address}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-slate-700">
                                      {new Date(
                                        b.bookingDate,
                                      ).toLocaleDateString("vi-VN")}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {b.bookingTime}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {data?.user?.role === "landlord" ? (
                                      <div className="flex items-center gap-2">
                                        <div className="size-6 rounded-full bg-[#e0f2fe] text-[#0ea5e9] flex items-center justify-center text-[11px] font-bold">
                                          {b.userId?.username
                                            ?.substring(0, 1)
                                            .toUpperCase()}
                                        </div>
                                        <span className="text-slate-600 font-medium">
                                          {b.customerName}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <div className="size-6 rounded-full bg-[#fef9c3] text-[#b45309] flex items-center justify-center text-[11px] font-bold">
                                          {b.landlordId?.name
                                            ?.substring(0, 1)
                                            .toUpperCase()}
                                        </div>
                                        <span className="text-slate-600 font-medium">
                                          {b.landlordId?.name}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <motion.span
                                      key={b.status}
                                      initial={{ scale: 0.9, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0.9, opacity: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded shadow-sm border ${
                                        b.status === "completed"
                                          ? "bg-[#bbf7d0] text-[#15803d] border-[#22c55e]/30"
                                          : b.status === "confirmed"
                                            ? "bg-[#e0f2fe] text-[#0ea5e9] border-[#38bdf8]/30"
                                            : "bg-[#fef9c3] text-[#b45309] border-[#fde68a]/30"
                                      }`}
                                    >
                                      {b.status === "pending"
                                        ? "Chờ duyệt"
                                        : b.status === "confirmed"
                                          ? "Đã xác nhận"
                                          : b.status === "completed"
                                            ? "Hoàn thành"
                                            : b.status}
                                    </motion.span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <EmptyState
                          icon={<ClipboardList />}
                          text="Chưa có lịch hẹn nào"
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-8 font-bold border-gray-200 text-gray-500 hover:bg-white hover:text-gray-900 whitespace-nowrap"
              >
                Đóng
              </Button>
              {!loading && data?.user && (
                <>
                  <Button
                    className={`px-8 font-bold text-white shadow-lg ${
                      data?.user?.status === "active"
                        ? "bg-[#dc2626] hover:bg-[#b91c1c] shadow-red-200"
                        : "bg-[#16a34a] hover:bg-[#15803d] shadow-green-200"
                    }`}
                    onClick={() => setLockConfirmOpen(true)}
                  >
                    {data?.user?.status === "active"
                      ? "Khoá tài khoản"
                      : "Mở khoá tài khoản"}
                  </Button>
                  <ConfirmDialog
                    open={lockConfirmOpen}
                    title={
                      data?.user?.status === "active"
                        ? "Xác nhận khoá"
                        : "Xác nhận mở khoá"
                    }
                    description={`Bạn có chắc muốn ${data?.user?.status === "active" ? "khoá" : "mở khoá"} tài khoản này?`}
                    confirmText="Xác nhận"
                    cancelText="Huỷ"
                    onConfirm={() => {
                      toast.info(
                        "Tính năng cập nhật trạng thái đã sẵn có ngoài danh sách.",
                      );
                      setLockConfirmOpen(false);
                    }}
                    onCancel={() => setLockConfirmOpen(false)}
                  />
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 text-sm">{label}:</span>
      <span className="text-[#0f172a] font-bold text-sm text-right">
        {value}
      </span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-gray-300 gap-3 grayscale opacity-60">
      <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
        <div className="[&>svg]:size-8 text-gray-300">{icon}</div>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider">{text}</p>
    </div>
  );
}
