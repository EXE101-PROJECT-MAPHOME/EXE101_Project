import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import api from "@/app/utils/api";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Home,
  Lock,
  User,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  Shield,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  validateUsernameOrEmail,
  validatePassword,
  validateUsername,
  validateEmail,
  validatePasswordMatch,
  validateFullName,
  validatePhone,
  getPasswordStrength,
} from "@/app/utils/validationRules";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register, googleLogin, logout } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminExists, setAdminExists] = useState(false);

  // Check on mount if an admin already exists to conditionally lock the role option
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/auth/admin-exists`)
      .then((r) => r.json())
      .then((data) => setAdminExists(data.exists))
      .catch(() => { }); // silently fail - default stays unlocked
  }, []);

  // Login form - single smart identifier field
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState({
    identifier: "",
    password: "",
  });

  // Detect input type for hint display
  const detectInputType = (val: string) => {
    if (/^[0-9+]{9,12}$/.test(val.replace(/\s/g, ""))) return "phone";
    if (val.includes("@")) return "email";
    if (val.length > 0) return "username";
    return "none";
  };
  const inputType = detectInputType(loginIdentifier);

  // Register form
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    role: "landlord" as "landlord" | "user" | "admin",
  });

  const [registerErrors, setRegisterErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasDigit: false,
    hasSpecialChar: false,
  });

  // Show/Hide password states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const checkMaintenanceBeforeRedirect = async (role?: string): Promise<boolean> => {
    if (role === "admin") return true;
    try {
      const settingsRes = await api.get("/api/settings/public").catch(() => null);
      if (settingsRes?.data?.maintenanceMode === true) {
        setError("Hệ thống đang nâng cấp, vui lòng thử lại trong vài ngày hoặc vài phút nữa.");
        await logout();
        return false;
      }
    } catch (e) {
      console.error("Failed to check maintenance settings", e);
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const errors = { identifier: "", password: "" };

    if (!loginIdentifier.trim()) {
      errors.identifier = "Vui lòng nhập tài khoản, email hoặc số điện thoại";
    }
    if (!loginPassword) {
      errors.password = "Mật khẩu không được để trống";
    }

    setLoginErrors(errors);
    if (errors.identifier || errors.password) return;

    try {
      const result = await login(loginIdentifier.trim(), loginPassword);
      if (result.success) {
        const allowed = await checkMaintenanceBeforeRedirect(result.role);
        if (!allowed) return;

        toast.success("Đăng nhập thành công!");
        if (result.role === "admin") {
          navigate("/admin/dashboard");
        } else if (result.role === "landlord") {
          navigate("/landlord/dashboard");
        } else {
          navigate("/");
        }
      } else {
        setError(result.message || "Tài khoản hoặc mật khẩu không đúng");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi đăng nhập");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate all fields
    const fullNameError = validateFullName(registerData.fullName);
    const usernameError = validateUsername(registerData.username);
    const emailError = validateEmail(registerData.email);
    const passwordError = validatePassword(registerData.password);
    const confirmPasswordError = validatePasswordMatch(
      registerData.password,
      registerData.confirmPassword,
    );
    const phoneError = validatePhone(registerData.phone);

    setRegisterErrors({
      fullName: fullNameError.error || "",
      username: usernameError.error || "",
      email: emailError.error || "",
      password: passwordError.error || "",
      confirmPassword: confirmPasswordError.error || "",
      phone: phoneError.error || "",
    });

    if (
      !fullNameError.valid ||
      !usernameError.valid ||
      !emailError.valid ||
      !passwordError.valid ||
      !confirmPasswordError.valid ||
      !phoneError.valid
    ) {
      return;
    }

    const { confirmPassword, ...dataToSubmit } = registerData;
    try {
      const result = await register(dataToSubmit as any);
      if (result.success) {
        setSuccess(
          "Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...",
        );
        setTimeout(() => {
          setMode("login");
          setSuccess("");
          setError(""); // Clear any registration validation error
          // Điền sẵn username vừa đăng ký
          setLoginIdentifier(registerData.username);
          // Reset form
          setRegisterData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            fullName: "",
            phone: "",
            role: "landlord",
          });
          setRegisterErrors({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            fullName: "",
            phone: "",
          });
        }, 1500);
      } else {
        setError(result.message || "Đăng ký thất bại");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi đăng ký");
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setError("");
      const result = await googleLogin({ idToken: tokenResponse.credential });
      if (result.success) {
        const allowed = await checkMaintenanceBeforeRedirect(result.role);
        if (!allowed) return;

        if (result.role === "admin") navigate("/admin/dashboard");
        else if (result.role === "landlord") navigate("/landlord/dashboard");
        else navigate("/");
      } else {
        setError(result.message || "Đăng nhập Google thất bại");
      }
    } catch (err) {
      setError("Lỗi khi xử lý đăng nhập Google");
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setError("");
        const result = await googleLogin({
          accessToken: tokenResponse.access_token,
          role: mode === "register" ? registerData.role : undefined,
        });
        if (result.success) {
          const allowed = await checkMaintenanceBeforeRedirect(result.role);
          if (!allowed) return;

          toast.success("Đăng nhập bằng Google thành công!");
          if (result.role === "admin") navigate("/admin/dashboard");
          else if (result.role === "landlord") navigate("/landlord/dashboard");
          else navigate("/");
        } else {
          setError(result.message || "Đăng nhập Google thất bại");
        }
      } catch (err) {
        setError("Lỗi khi xử lý đăng nhập Google");
      }
    },
    onError: () => setError("Đăng nhập Google thất bại"),
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden relative">
      {/* Decorative Background Glows for Right Side */}
      <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-60">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-100/60 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-blue-100/60 blur-[110px] rounded-full" />
      </div>

      {/* Left Side - Image with Overlay (Unchanged) */}
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

      {/* Right Side - Premium Form */}
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

            {/* Header */}
            <header className="space-y-3 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:hidden flex justify-center mb-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Home className="size-8 text-white" />
                </div>
              </motion.div>

              <h2 className="text-3xl lg:text-4xl font-[900] bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent tracking-tight leading-tight">
                {mode === "login"
                  ? "Chào mừng bạn đến với MapHome"
                  : "Khởi tạo hành trình"}
              </h2>
              <p className="text-slate-400 font-semibold text-lg leading-relaxed">
                {mode === "login"
                  ? "Cùng MapHome tìm kiếm không gian sống lý tưởng của bạn."
                  : "Tham gia cùng cộng đồng tìm trọ hiện đại nhất hiện nay."}
              </p>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-6"
              >
                {mode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Smart Identifier Input */}
                    <motion.div variants={itemVariants} className="space-y-2.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[14px] font-black text-emerald-600/80 uppercase tracking-wide">
                          Tài khoản
                        </label>
                        {/* Dynamic type badge */}
                        <AnimatePresence mode="wait">
                          {inputType !== "none" && (
                            <motion.span
                              key={inputType}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${inputType === "phone"
                                ? "bg-blue-50 text-blue-500"
                                : inputType === "email"
                                  ? "bg-purple-50 text-purple-500"
                                  : "bg-emerald-50 text-emerald-500"
                                }`}
                            >
                              {inputType === "phone" ? (
                                <><Phone className="inline size-3 mr-1" />Số điện thoại</>
                              ) : inputType === "email" ? (
                                <><Mail className="inline size-3 mr-1" />Email</>
                              ) : (
                                <><User className="inline size-3 mr-1" />Username</>
                              )}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 size-10 bg-slate-100 rounded-xl flex items-center justify-center transition-all duration-300 group-focus-within:bg-emerald-50 group-focus-within:text-emerald-500 text-slate-400">
                          {inputType === "phone" ? (
                            <Phone className="size-5 text-blue-500" />
                          ) : inputType === "email" ? (
                            <Mail className="size-5 text-purple-500" />
                          ) : (
                            <User className="size-5" />
                          )}
                        </div>
                        <Input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => {
                            setLoginIdentifier(e.target.value);
                            if (e.target.value.trim()) {
                              setLoginErrors({ ...loginErrors, identifier: "" });
                            }
                          }}
                          onBlur={() => {
                            if (!loginIdentifier.trim()) {
                              setLoginErrors({ ...loginErrors, identifier: "Vui lòng nhập tài khoản, email hoặc số điện thoại" });
                            }
                          }}
                          placeholder="Username, email hoặc số điện thoại"
                          className={`h-14 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 rounded-2xl transition-all shadow-sm font-medium border ${loginErrors.identifier ? "border-red-500" : "border-slate-200"
                            }`}
                          style={{ paddingLeft: '4rem' }}
                          autoComplete="username"
                        />
                      </div>
                      {loginErrors.identifier ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                        >
                          <AlertCircle className="size-3" />
                          {loginErrors.identifier}
                        </motion.p>
                      ) : (
                        <p className="text-[11px] text-slate-400 ml-1">
                          Chấp nhận username, email hoặc số điện thoại
                        </p>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[14px] font-black text-blue-600/80 uppercase tracking-wide">
                          Mật khẩu
                        </label>
                      </div>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-all duration-300">
                          <Lock className="size-5" />
                        </div>
                        <Input
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (e.target.value) {
                              setLoginErrors({ ...loginErrors, password: "" });
                            }
                          }}
                          onBlur={() => {
                            if (!loginPassword) {
                              setLoginErrors({
                                ...loginErrors,
                                password: "Mật khẩu không được để trống",
                              });
                            }
                          }}
                          placeholder="••••••••"
                          className={`h-14 bg-white focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-2xl transition-all shadow-sm border ${loginErrors.password ? "border-red-500" : "border-slate-200"}`}
                          style={{ paddingLeft: '4rem', paddingRight: '3rem' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="size-5" />
                          ) : (
                            <Eye className="size-5" />
                          )}
                        </button>
                      </div>
                      {loginErrors.password && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                        >
                          <AlertCircle className="size-3" />
                          {loginErrors.password}
                        </motion.p>
                      )}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate("/forgot-password")}
                          className="text-[13px] font-bold text-emerald-500 hover:text-emerald-600 hover:underline decoration-2 underline-offset-4 transition-colors pt-2"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-700 shadow-sm"
                      >
                        <AlertCircle className="size-6 text-rose-500 flex-shrink-0" />
                        <span className="text-[14px] font-bold">{error}</span>
                      </motion.div>
                    )}

                    <motion.div variants={itemVariants} className="pt-2">
                      <Button
                        type="submit"
                        className="w-full h-15 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-[800] text-lg shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all rounded-[1.25rem] group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Đăng nhập ngay
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </Button>
                    </motion.div>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div variants={itemVariants} className="space-y-2">
                        <label className="text-[12px] font-black text-emerald-600/70 uppercase tracking-widest ml-1">
                          Họ và tên
                        </label>
                        <Input
                          value={registerData.fullName}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              fullName: e.target.value,
                            });
                            if (e.target.value.trim()) {
                              setRegisterErrors({
                                ...registerErrors,
                                fullName: "",
                              });
                            }
                          }}
                          onBlur={() => {
                            const result = validateFullName(
                              registerData.fullName,
                            );
                            setRegisterErrors({
                              ...registerErrors,
                              fullName: result.error || "",
                            });
                          }}
                          placeholder="Nguyễn Văn A"
                          className={`h-13 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl font-medium border transition-colors ${registerErrors.fullName ? "border-red-500" : "border-slate-200"}`}
                          required
                        />
                        {registerErrors.fullName && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                          >
                            <AlertCircle className="size-3" />
                            {registerErrors.fullName}
                          </motion.p>
                        )}
                      </motion.div>
                      <motion.div variants={itemVariants} className="space-y-2">
                        <label className="text-[12px] font-black text-blue-600/70 uppercase tracking-widest ml-1">
                          Số điện thoại
                        </label>
                        <Input
                          value={registerData.phone}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              phone: e.target.value,
                            });
                            if (!e.target.value || e.target.value.trim()) {
                              setRegisterErrors({
                                ...registerErrors,
                                phone: "",
                              });
                            }
                          }}
                          onBlur={() => {
                            const result = validatePhone(registerData.phone);
                            setRegisterErrors({
                              ...registerErrors,
                              phone: result.error || "",
                            });
                          }}
                          placeholder="091..."
                          className={`h-13 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl font-medium border transition-colors ${registerErrors.phone ? "border-red-500" : "border-slate-200"}`}
                        />
                        {registerErrors.phone && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                          >
                            <AlertCircle className="size-3" />
                            {registerErrors.phone}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Email liên lạc
                      </label>
                      <Input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => {
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          });
                          if (e.target.value.trim()) {
                            setRegisterErrors({ ...registerErrors, email: "" });
                          }
                        }}
                        onBlur={() => {
                          const result = validateEmail(registerData.email);
                          setRegisterErrors({
                            ...registerErrors,
                            email: result.error || "",
                          });
                        }}
                        placeholder="email@example.com"
                        className={`h-13 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl font-medium border transition-colors ${registerErrors.email ? "border-red-500" : "border-slate-200"}`}
                        required
                      />
                      {registerErrors.email && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                        >
                          <AlertCircle className="size-3" />
                          {registerErrors.email}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-emerald-600/70 uppercase tracking-widest ml-1">
                          Tên đăng nhập
                        </label>
                        <Input
                          value={registerData.username}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              username: e.target.value,
                            });
                            if (e.target.value.trim()) {
                              setRegisterErrors({
                                ...registerErrors,
                                username: "",
                              });
                            }
                          }}
                          onBlur={() => {
                            const result = validateUsername(
                              registerData.username,
                            );
                            setRegisterErrors({
                              ...registerErrors,
                              username: result.error || "",
                            });
                          }}
                          placeholder="username"
                          className={`h-13 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl font-medium border transition-colors ${registerErrors.username ? "border-red-500" : "border-slate-200"}`}
                          required
                        />
                        {registerErrors.username && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                          >
                            <AlertCircle className="size-3" />
                            {registerErrors.username}
                          </motion.p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-blue-600/70 uppercase tracking-widest ml-1">
                          Mật khẩu
                        </label>
                        <div className="relative group">
                          <Input
                            type={showRegisterPassword ? "text" : "password"}
                            value={registerData.password}
                            onChange={(e) => {
                              setRegisterData({
                                ...registerData,
                                password: e.target.value,
                              });
                              setPasswordStrength(
                                getPasswordStrength(e.target.value),
                              );
                              if (e.target.value) {
                                setRegisterErrors({
                                  ...registerErrors,
                                  password: "",
                                });
                              }
                            }}
                            onBlur={() => {
                              const result = validatePassword(
                                registerData.password,
                              );
                              setRegisterErrors({
                                ...registerErrors,
                                password: result.error || "",
                              });
                            }}
                            placeholder="••••••••"
                            className={`h-13 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl font-medium border transition-colors ${registerErrors.password ? "border-red-500" : "border-slate-200"}`}
                            style={{ paddingRight: '3rem' }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            {showRegisterPassword ? (
                              <EyeOff className="size-5" />
                            ) : (
                              <Eye className="size-5" />
                            )}
                          </button>
                        </div>
                        {registerErrors.password && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                          >
                            <AlertCircle className="size-3" />
                            {registerErrors.password}
                          </motion.p>
                        )}
                        {registerData.password && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 space-y-1.5"
                          >
                            <div className="text-xs font-semibold text-slate-600 ml-1">
                              Yêu cầu mật khẩu:
                            </div>
                            <div className="space-y-1 ml-1">
                              <div
                                className={`text-xs flex items-center gap-2 ${passwordStrength.minLength ? "text-emerald-600" : "text-slate-400"}`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${passwordStrength.minLength ? "bg-emerald-500" : "bg-slate-300"}`}
                                />
                                Tối thiểu 8 ký tự
                              </div>
                              <div
                                className={`text-xs flex items-center gap-2 ${passwordStrength.hasLowercase ? "text-emerald-600" : "text-slate-400"}`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${passwordStrength.hasLowercase ? "bg-emerald-500" : "bg-slate-300"}`}
                                />
                                Chứa chữ thường (a-z)
                              </div>
                              <div
                                className={`text-xs flex items-center gap-2 ${passwordStrength.hasUppercase ? "text-emerald-600" : "text-slate-400"}`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${passwordStrength.hasUppercase ? "bg-emerald-500" : "bg-slate-300"}`}
                                />
                                Chứa chữ hoa (A-Z)
                              </div>
                              <div
                                className={`text-xs flex items-center gap-2 ${passwordStrength.hasDigit ? "text-emerald-600" : "text-slate-400"}`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${passwordStrength.hasDigit ? "bg-emerald-500" : "bg-slate-300"}`}
                                />
                                Chứa chữ số (0-9)
                              </div>
                              <div
                                className={`text-xs flex items-center gap-2 ${passwordStrength.hasSpecialChar ? "text-emerald-600" : "text-slate-400"}`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${passwordStrength.hasSpecialChar ? "bg-emerald-500" : "bg-slate-300"}`}
                                />
                                Chứa ký tự đặc biệt (!@#$%^&*...)
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative group">
                        <Input
                          type={showRegisterConfirmPassword ? "text" : "password"}
                          value={registerData.confirmPassword}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              confirmPassword: e.target.value,
                            });
                            if (e.target.value) {
                              setRegisterErrors({
                                ...registerErrors,
                                confirmPassword: "",
                              });
                            }
                          }}
                          onBlur={() => {
                            const result = validatePasswordMatch(
                              registerData.password,
                              registerData.confirmPassword,
                            );
                            setRegisterErrors({
                              ...registerErrors,
                              confirmPassword: result.error || "",
                            });
                          }}
                          placeholder="••••••••"
                          className={`h-13 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl font-medium border transition-colors ${registerErrors.confirmPassword ? "border-red-500" : "border-slate-200"}`}
                          style={{ paddingRight: '3rem' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                        >
                          {showRegisterConfirmPassword ? (
                            <EyeOff className="size-5" />
                          ) : (
                            <Eye className="size-5" />
                          )}
                        </button>
                      </div>
                      {registerErrors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"
                        >
                          <AlertCircle className="size-3" />
                          {registerErrors.confirmPassword}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Lựa chọn vai trò của bạn
                      </label>
                      <div className="relative">
                        <select
                          value={registerData.role}
                          onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as "landlord" | "user" })}
                          className="w-full h-13 bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl font-bold text-slate-700 border border-slate-200 transition-colors px-4 appearance-none outline-none cursor-pointer hover:border-emerald-300"
                        >
                          <option value="landlord">Chủ trọ (Đăng tin cho thuê)</option>
                          <option value="user">Khách thuê (Tìm thuê phòng)</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </motion.div>

                    {error && (
                      <motion.div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-700">
                        <AlertCircle className="size-5 text-rose-500" />
                        <span className="text-[13px] font-bold">{error}</span>
                      </motion.div>
                    )}

                    {success && (
                      <motion.div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-emerald-700">
                        <CheckCircle className="size-5 text-emerald-500" />
                        <span className="text-[13px] font-bold">{success}</span>
                      </motion.div>
                    )}

                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        disabled={
                          !Object.values(registerErrors).every((err) => !err)
                        }
                        className="w-full h-15 bg-gradient-to-br from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-[800] text-lg shadow-2xl shadow-emerald-500/20 rounded-[1.25rem] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Đăng ký tài khoản
                      </Button>
                    </motion.div>
                  </form>
                )}

                {/* Unified Social/Toggle Footer */}
                <motion.div variants={itemVariants} className="pt-4 space-y-6">
                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] font-[900] text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      Tiếp tục nhanh với
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        onClick={() => loginWithGoogle()}
                        variant="outline"
                        className="w-full h-15 border-2 border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 text-slate-700 rounded-2xl font-[800] transition-all flex items-center justify-center gap-4 shadow-sm group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                          <svg className="size-5" viewBox="0 0 48 48">
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.01c4.51-4.18 7.09-10.36 7.09-17.65z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
                            />
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            />
                          </svg>
                        </div>
                        Tài khoản Google
                      </Button>
                    </motion.div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode(mode === "login" ? "register" : "login");
                          setError("");
                          setSuccess("");
                        }}
                        className="group py-2"
                      >
                        <span className="text-slate-400 font-bold text-sm">
                          {mode === "login"
                            ? "Khám phá lần đầu?"
                            : "Bạn đã có tài khoản?"}
                        </span>
                        <span className="ml-2 text-emerald-600 group-hover:text-emerald-700 font-black text-sm underline-offset-8 decoration-2 underline">
                          {mode === "login"
                            ? "Tạo tài khoản ngay"
                            : "Đăng nhập tại đây"}
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Footer Navigation */}
            <div className="pt-4 flex justify-center border-t border-slate-100/50">
              <button
                onClick={() => navigate("/")}
                className="text-xs font-black text-slate-300 hover:text-slate-900 transition-all uppercase tracking-[0.2em] flex items-center gap-3 group"
              >
                <div className="w-10 h-px bg-slate-100 group-hover:w-16 group-hover:bg-slate-900 transition-all duration-500" />
                Về trang chủ
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
