import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/app/utils/api";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";

import {
  Home,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  validateEmail,
  validatePassword,
  validateToken,
  validatePasswordMatch,
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

  // Reset form states
  const resetFormStates = () => {
    setEmail("");
    setError("");
    setErrors({
      email: "",
    });
  };

  // Step 1: Request password reset token
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors({
      email: "",
    });

    // Validate email
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

        {/* Animated Aura Blobs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-green-500/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-blue-600/20 blur-[100px] rounded-full"
        />

        {/* Logo Content */}
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
              <p className="text-white/80 mt-2 text-lg">
                Tìm đúng trọ - Ở đúng nơi
              </p>
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
          {/* Glass Card Container */}
          <div className="bg-white/95 backdrop-blur-3xl border border-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 lg:p-12 space-y-8 overflow-hidden relative group">
            {/* Subtle Inner Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

            {/* Back Button */}
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium mb-2"
            >
              <ArrowLeft className="size-4" />
              Quay lại đăng nhập
            </button>

            {/* Header */}
            <header className="space-y-3 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:hidden flex justify-center mb-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Lock className="size-8 text-white" />
                </div>
              </motion.div>

              <h2 className="text-3xl lg:text-4xl font-[900] bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent tracking-tight leading-tight">
                {step === "email" ? "Khôi phục mật khẩu" : "Thành công!"}
              </h2>
              <p className="text-slate-400 font-semibold text-base lg:text-lg leading-relaxed">
                {step === "email"
                  ? "Nhập email của bạn để nhận mật khẩu mới"
                  : "Mật khẩu mới đã được gửi vào email của bạn"}
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

            {/* Step 1: Email Request */}
            {step === "email" && (
              <motion.form
                onSubmit={handleRequestReset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Email Input */}
                <motion.div
                  className="space-y-2.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="text-[14px] font-black text-emerald-600/80 uppercase tracking-wide ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:bg-emerald-50 group-focus-within:text-emerald-500 transition-all duration-300">
                      <Mail className="size-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      onBlur={() => {
                        const result = validateEmail(email);
                        setErrors((prev) => ({
                          ...prev,
                          email: result.error || "",
                        }));
                      }}
                      placeholder="bạn@example.com"
                      className={`w-full pl-16 h-14 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 rounded-2xl transition-all shadow-sm font-medium border ${errors.email ? "border-red-500" : "border-slate-200"}`}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                    >
                      <AlertCircle className="size-3" />
                      {errors.email}
                    </motion.p>
                  )}
                </motion.div>

                {/* Info Box */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/50 rounded-2xl p-4 text-sm text-slate-600 space-y-2"
                >
                  <p className="font-semibold text-slate-700">
                    Chúng tôi sẽ gửi mật khẩu mới vào email của bạn
                  </p>
                  <p className="text-xs text-slate-500">
                    Hãy chắc chắn rằng bạn nhập đúng địa chỉ email đã đăng ký.
                  </p>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { delay: 0.3 } },
                  }}
                  initial="hidden"
                  animate="show"
                  className="flex gap-3 pt-2"
                >
                  <Button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex-1 h-14 bg-slate-200 hover:bg-slate-300 text-slate-900 font-[800] rounded-[1.25rem] transition-all active:scale-[0.98]"
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-14 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-[800] shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all rounded-[1.25rem] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi email
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          →
                        </motion.span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center justify-center py-10 space-y-7"
              >
                {/* Success Icon with Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(16, 185, 129, 0.7)",
                        "0 0 0 20px rgba(16, 185, 129, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                  >
                    <CheckCircle className="size-10 text-white" />
                  </motion.div>
                </motion.div>

                {/* Success Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center space-y-4 w-full"
                >
                  <h3 className="text-2xl font-[900] bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    Thành công!
                  </h3>
                  <div className="space-y-3">
                    <p className="text-slate-700 font-semibold text-base">
                      Mật khẩu mới đã được gửi vào email
                    </p>
                    <div className="inline-block px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-emerald-700 font-bold text-sm break-all">
                        {email}
                      </p>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">
                      Mật khẩu tạm thời sẽ được gửi ngay tức thì. Nếu không
                      thấy, vui lòng kiểm tra{" "}
                      <span className="font-semibold text-slate-600">
                        hộp thư rác (Spam)
                      </span>
                    </p>
                  </div>
                </motion.div>

                {/* Email Tips */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-full bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200/50 rounded-2xl p-4 space-y-3"
                >
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <Mail className="size-4 text-blue-600" />
                    Hướng dẫn
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">1.</span>
                      <span>Mở email để xem mật khẩu tạm thời</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">2.</span>
                      <span>Đăng nhập bằng mật khẩu tạm thời</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">3.</span>
                      <span>Đổi thành mật khẩu mới của bạn</span>
                    </li>
                  </ul>
                </motion.div>

                {/* Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="w-full pt-2"
                >
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-[800] text-base shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all rounded-[1.25rem] flex items-center justify-center gap-2"
                  >
                    Quay về Đăng nhập
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.span>
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
              <span className="text-xs text-slate-400 font-medium">hoặc</span>
              <div className="flex-1 h-px bg-gradient-to-l from-slate-200 to-transparent" />
            </div>

            {/* Footer Links */}
            <div className="flex items-center justify-between gap-4 text-xs font-medium">
              <button
                onClick={() => navigate("/login")}
                className="text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Có tài khoản? Đăng nhập
              </button>
              <button
                onClick={() => navigate("/register")}
                className="text-emerald-600 hover:text-emerald-700 font-bold"
              >
                Tạo tài khoản mới
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
