import React, { useState } from "react";
import { Wrench, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/app/utils/api";
import { Button } from "@/app/components/ui/button";

export function MaintenancePage() {
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      const res = await api.get("/api/settings/public");
      if (res.status === 200) {
        if (res.data?.maintenanceMode === false) {
          toast.success("Hệ thống đã hoạt động bình thường! ✨");
          navigate("/");
        } else {
          toast.info("Hệ thống vẫn đang trong quá trình bảo trì. Vui lòng quay lại sau.");
        }
      }
    } catch (error) {
      console.error("Failed to check status:", error);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Background Decorative Auras */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-100/40 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/30 blur-[110px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[550px] text-center space-y-8 bg-white/80 backdrop-blur-md border border-white p-10 lg:p-14 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.05)] relative z-10"
      >
        {/* Subtle top indicator */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500 rounded-t-[3rem]" />

        {/* Animated Icon Container */}
        <div className="flex justify-center">
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.05, 0.95, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 5,
              ease: "easeInOut"
            }}
            className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-600 shadow-inner border border-rose-100/30"
          >
            <Wrench className="size-10" />
          </motion.div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-[900] bg-gradient-to-r from-rose-600 to-rose-800 bg-clip-text text-transparent tracking-tight">
            Hệ thống đang bảo trì
          </h2>
          <p className="text-slate-500 font-semibold text-base leading-relaxed px-4">
            MapHome đang được nâng cấp để mang lại trải nghiệm tốt nhất cho bạn. Vui lòng thử lại sau ít phút.
          </p>
        </div>

        <div className="pt-4 space-y-4">
          <Button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white font-[800] text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-[0.98] transition-all rounded-2xl group border-none"
          >
            <RotateCcw className={`size-4 mr-2 ${checking ? "animate-spin" : "group-hover:-rotate-45 transition-transform"}`} />
            {checking ? "Đang kiểm tra..." : "Kiểm tra lại"}
          </Button>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Cảm ơn bạn đã kiên nhẫn chờ đợi
          </p>
        </div>
      </motion.div>
    </div>
  );
}
