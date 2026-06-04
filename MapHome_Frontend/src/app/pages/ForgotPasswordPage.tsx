import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/app/utils/api";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";

import {
  Home,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  validateEmail,
} from "@/app/utils/validationRules";

type Step = "email" | "success";

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  // State management
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  // Error state
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({
    email: "",
  });

  // Step 1 (Email): Request password reset
  const handleRequestEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors((prev) => ({ ...prev, email: "" }));

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrors((prev) => ({ ...prev, email: emailValidation.error }));
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setStep("success");
      toast.success("Mật khẩu mới đã được gửi đến email của bạn");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Có lỗi xảy ra";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-screen bg-slate-50 flex font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden relative">
        {/* Decorative Background Glows */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-60">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-100/60 blur-[130px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-blue-100/60 blur-[110px] rounded-full" />
        </div>

        {/* Left Side - Image with Overlay */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] overflow-hidden">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80)",
            }}
          />

          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-green-500/20 blur-[120px] rounded-full"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 100, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-blue-600/20 blur-[100px] rounded-full"
          />

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative z-10 flex flex-col items-center justify-center w-full text-white"
          >
            <div className="inline-flex items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Home className="size-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-tight">MapHome</h1>
                <p className="text-white/80 mt-2 text-lg">Tìm đúng trọ - Ở đúng nơi</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10 bg-white/10 lg:bg-transparent">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-[500px]"
          >
            <div className="bg-white/95 backdrop-blur-3xl border border-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 lg:p-12 space-y-8 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

              {/* Back Button */}
              <button
                onClick={() => {
                  navigate("/login");
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium mb-2"
              >
                <ArrowLeft className="size-4" />
                Quay lại
              </button>

              {/* Header */}
              <header className="space-y-3 text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-[900] bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent tracking-tight leading-tight">
                  {step === "success" ? "Thành công!" : "Khôi phục mật khẩu"}
                </h2>
                <p className="text-slate-400 font-semibold text-base lg:text-lg leading-relaxed">
                  {step === "email" && "Nhập email của bạn để nhận mật khẩu mới"}
                  {step === "success" && "Mật khẩu mới đã được gửi vào email"}
                </p>
              </header>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-gap-3 gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 font-medium">{error}</p>
                </motion.div>
              )}

              {/* Forms Container */}
              <AnimatePresence mode="wait">
                {/* Email Form */}
                {step === "email" && (
                  <motion.form
                    key="email"
                    onSubmit={handleRequestEmailReset}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2.5">
                      <label className="text-[14px] font-black text-emerald-600/80 uppercase tracking-wide ml-1">Email</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:bg-emerald-50 group-focus-within:text-emerald-500 transition-all duration-300">
                          <Mail className="size-5" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="bạn@example.com"
                          className={`w-full pl-16 h-14 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 rounded-2xl transition-all shadow-sm font-medium border ${errors.email ? "border-red-500" : "border-slate-200"}`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"><AlertCircle className="size-3" />{errors.email}</p>}
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-[800] rounded-[1.25rem] shadow-xl shadow-emerald-500/20 active:scale-[0.98]">
                      {loading ? "Đang gửi..." : "Gửi mật khẩu mới"}
                    </Button>
                  </motion.form>
                )}

                {/* Success View */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-6"
                  >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="size-10 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Thành công!</h3>
                      <p className="text-slate-500">
                        Mật khẩu mới đã được gửi vào email của bạn. Vui lòng kiểm tra hộp thư.
                      </p>
                    </div>
                    <Button onClick={() => navigate("/login")} className="w-full h-14 bg-emerald-600 text-white font-bold rounded-[1.25rem]">
                      Quay lại Đăng nhập
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
