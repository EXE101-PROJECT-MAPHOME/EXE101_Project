import { useState } from "react";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import PromptDialog from "@/app/components/PromptDialog";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useVerification } from "@/app/contexts/VerificationContext";
import { useProperties } from "@/app/contexts/useProperties";
import { InspectionDialog } from "@/app/components/InspectionDialog";
import { VerificationRequest } from "@/app/components/types";
import { Button } from "@/app/components/ui/button";
import { formatDateVietnamese } from "@/app/utils/dateUtils";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  Award,
  ShieldCheck,
  User,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";

export function InspectionsView() {
  const { requests, updateRequestStatus } = useVerification();
  const { properties } = useProperties();
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleInspect = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    onConfirm?: () => void;
  }>({ open: false });
  const [promptState, setPromptState] = useState<{
    open: boolean;
    title?: string;
    defaultValue?: string;
    onSubmit?: (val: string) => void;
  }>({ open: false });

  const handleApprove = (requestId: string) => {
    setConfirmState({
      open: true,
      title: "Xác nhận duyệt lịch hẹn kiểm tra?",
      description: "Bạn có muốn duyệt và lên lịch kiểm tra cho yêu cầu này?",
      onConfirm: () => {
        updateRequestStatus(requestId, "approved");
        toast.success("Đã duyệt lịch hẹn! ✅");
      },
    });
  };

  const handleReject = (requestId: string) => {
    setPromptState({
      open: true,
      title: "Lý do từ chối:",
      defaultValue: "",
      onSubmit: (val: string) => {
        if (val) {
          updateRequestStatus(requestId, "rejected");
          toast.error("Đã từ chối yêu cầu! ❌");
        }
      },
    });
  };

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    completed: requests.filter((r) => r.status === "completed").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <InspectionStatCard
          icon={<Clock className="size-5" />}
          label="Chờ duyệt"
          count={stats.pending}
          color="orange"
        />
        <InspectionStatCard
          icon={<CheckCircle className="size-5" />}
          label="Đã duyệt lịch"
          count={stats.approved}
          color="blue"
        />
        <InspectionStatCard
          icon={<Award className="size-5" />}
          label="Đã cấp tích xanh"
          count={stats.completed}
          color="green"
        />
        <InspectionStatCard
          icon={<XCircle className="size-5" />}
          label="Từ chối"
          count={stats.rejected}
          color="red"
        />
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-tight">
              Danh sách yêu cầu kiểm tra
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              Quản lý các lượt thực địa và xác minh căn hộ
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <ClipboardCheck className="size-4" /> Tổng số: {requests.length}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {requests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="size-12 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                Chưa có yêu cầu kiểm tra nào
              </h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Khi chủ trọ gửi yêu cầu xác thực, thông tin sẽ được hiển thị
                ngay tại đây để bạn xử lý.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {requests.map((request) => (
                <InspectionCard
                  key={request.id}
                  request={request}
                  property={properties.find((p) => p.id === request.propertyId)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onInspect={handleInspect}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Inspection Dialog */}
      {selectedRequest && (
        <InspectionDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmText="Xác nhận"
        cancelText="Huỷ"
        onConfirm={() => {
          confirmState.onConfirm?.();
          setConfirmState({ open: false });
        }}
        onCancel={() => setConfirmState({ open: false })}
      />

      <PromptDialog
        open={promptState.open}
        title={promptState.title}
        defaultValue={promptState.defaultValue}
        submitText="Gửi"
        cancelText="Huỷ"
        onSubmit={(val) => {
          promptState.onSubmit?.(val);
          setPromptState({ open: false });
        }}
        onCancel={() => setPromptState({ open: false })}
      />
    </motion.div>
  );
}

function InspectionStatCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: "orange" | "blue" | "green" | "red";
}) {
  const themes = {
    orange:
      "from-orange-500 to-amber-300 shadow-orange-100/50 bg-orange-50 text-orange-600 border-orange-100",
    blue: "from-blue-600 to-indigo-400 shadow-blue-100/50 bg-blue-50 text-blue-600 border-blue-100",
    green:
      "from-emerald-600 to-green-300 shadow-green-100/50 bg-green-50 text-emerald-600 border-green-100",
    red: "from-rose-600 to-red-400 shadow-red-100/50 bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        show: { opacity: 1, scale: 1, y: 0 },
      }}
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-2xl`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border border-white ${themes[color].split(" ")[2]} ${themes[color].split(" ")[3]}`}
        >
          {icon}
        </div>
        <span
          className={`text-3xl font-black bg-gradient-to-r ${themes[color].split(" ").slice(0, 2).join(" ")} bg-clip-text text-transparent`}
        >
          {count}
        </span>
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${themes[color].split(" ").slice(0, 2).join(" ")} opacity-20`}
      />
    </motion.div>
  );
}

function InspectionCard({
  request,
  property,
  onApprove,
  onReject,
  onInspect,
}: any) {
  const statusColors: any = {
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    approved: "bg-blue-50 text-blue-600 border-blue-100",
    completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rejected: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const statusLabels: any = {
    pending: "Đang chờ duyệt",
    approved: "Đã lên lịch",
    completed: "Đã hoàn thành",
    rejected: "Đã từ chối",
  };

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 },
      }}
      whileHover={{ scale: 1.005, y: -2 }}
      className="bg-white rounded-[32px] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group"
    >
      <div className="flex items-center gap-8">
        {/* Photo Container */}
        <div className="relative flex-shrink-0 w-32 h-32 rounded-[24px] overflow-hidden border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform duration-500">
          {property?.image ? (
            <img
              src={property.image}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl">
              🏠
            </div>
          )}
          <div
            className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm blur-bg-md border border-white/30 ${statusColors[request.status]}`}
          >
            {statusLabels[request.status]}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight group-hover:from-emerald-600 group-hover:to-blue-600 transition-all duration-500">
                {request.propertyName}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 self-start">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-xl">
                  <User className="size-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">
                    {request.landlordName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-xl">
                  <Phone className="size-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">
                    {request.phone}
                  </span>
                </div>
              </div>
            </div>

            {request.badgeAwarded && request.badgeAwarded !== "none" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
                <ShieldCheck className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {request.badgeAwarded} Verified
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <MapPin className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">
                  Địa điểm
                </p>
                <p className="text-xs font-bold text-slate-600 truncate">
                  {request.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Calendar className="size-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">
                  Thời gian
                </p>
                <p className="text-xs font-bold text-slate-600">
                  {formatDateVietnamese(request.scheduledDate)} •{" "}
                  {request.scheduledTime}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-50">
            <div className="flex-1">
              {request.notes && (
                <p className="text-[11px] text-slate-400 italic font-medium truncate max-w-sm">
                  " {request.notes} "
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {request.status === "pending" && (
                <>
                  <button
                    onClick={() => onApprove(request.id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    <CheckCircle className="size-4" /> Duyệt lịch
                  </button>
                  <button
                    onClick={() => onReject(request.id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-rose-100 text-rose-500 rounded-2xl text-xs font-black hover:bg-rose-50 transition-all"
                  >
                    <XCircle className="size-4" /> Từ chối
                  </button>
                </>
              )}
              {request.status === "approved" && (
                <button
                  onClick={() => onInspect(request)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                >
                  Tiến hành kiểm tra <ArrowRight className="size-4" />
                </button>
              )}
              {request.status === "completed" && (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black">
                  <CheckCircle className="size-4" /> Đã hoàn tất thực địa
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
