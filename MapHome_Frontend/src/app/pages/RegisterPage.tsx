import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ArrowLeft, Home, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
  validatePhone,
  getPasswordStrength,
} from "@/app/utils/validationRules";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"user" | "landlord" | "admin" | "broker">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Password strength tracking
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasDigit: false,
    hasSpecialChar: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const fullNameValidation = validateFullName(fullName);
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const phoneValidation = validatePhone(phone);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validatePasswordMatch(
      password,
      confirmPassword,
    );

    // Update field errors
    setFieldErrors({
      fullName: fullNameValidation.error || "",
      username: usernameValidation.error || "",
      email: emailValidation.error || "",
      phone: phoneValidation.error || "",
      password: passwordValidation.error || "",
      confirmPassword: confirmPasswordValidation.error || "",
    });

    // Check if all fields are valid
    if (
      !fullNameValidation.valid ||
      !usernameValidation.valid ||
      !emailValidation.valid ||
      !phoneValidation.valid ||
      !passwordValidation.valid ||
      !confirmPasswordValidation.valid
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        username,
        email,
        password,
        confirmPassword,
        fullName,
        phone,
        role,
      });

      if (!result.success) {
        setError(result.message || "Đăng ký thất bại");
        setLoading(false);
        return;
      }

      setError(null); // Clear any previous errors
      // No longer auto-login to follow user request
      setSuccess(
        "Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...",
      );
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Lỗi mạng");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="size-5" />
          </Button>
          <Home className="size-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">MapHome</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="size-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Đăng ký tài khoản
            </h2>
            <p className="text-gray-600">Tạo tài khoản để bắt đầu tìm trọ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <Input
                type="text"
                placeholder="chutro123"
                value={username}
                onChange={(e) => {
                  setUsername((e.target as HTMLInputElement).value);
                  if ((e.target as HTMLInputElement).value.trim()) {
                    setFieldErrors({ ...fieldErrors, username: "" });
                  }
                }}
                onBlur={() => {
                  const result = validateUsername(username);
                  setFieldErrors({
                    ...fieldErrors,
                    username: result.error || "",
                  });
                }}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.username
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
                required
              />
              {fieldErrors.username && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <Input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => {
                  setFullName((e.target as HTMLInputElement).value);
                  if ((e.target as HTMLInputElement).value.trim()) {
                    setFieldErrors({ ...fieldErrors, fullName: "" });
                  }
                }}
                onBlur={() => {
                  const result = validateFullName(fullName);
                  setFieldErrors({
                    ...fieldErrors,
                    fullName: result.error || "",
                  });
                }}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.fullName
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
                required
              />
              {fieldErrors.fullName && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail((e.target as HTMLInputElement).value);
                  if ((e.target as HTMLInputElement).value.trim()) {
                    setFieldErrors({ ...fieldErrors, email: "" });
                  }
                }}
                onBlur={() => {
                  const result = validateEmail(email);
                  setFieldErrors({ ...fieldErrors, email: result.error || "" });
                }}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
                required
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <Input
                type="tel"
                placeholder="0123456789"
                value={phone}
                onChange={(e) => {
                  setPhone((e.target as HTMLInputElement).value);
                  if (!e.target.value || e.target.value.trim()) {
                    setFieldErrors({ ...fieldErrors, phone: "" });
                  }
                }}
                onBlur={() => {
                  const result = validatePhone(phone);
                  setFieldErrors({ ...fieldErrors, phone: result.error || "" });
                }}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.phone
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {fieldErrors.phone}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Tuỳ chọn - Format: 0123456789 hoặc 84123456789
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  const newPassword = (e.target as HTMLInputElement).value;
                  setPassword(newPassword);
                  setPasswordStrength(getPasswordStrength(newPassword));
                  if (newPassword) {
                    setFieldErrors({ ...fieldErrors, password: "" });
                  }
                }}
                onBlur={() => {
                  const result = validatePassword(password);
                  setFieldErrors({
                    ...fieldErrors,
                    password: result.error || "",
                  });
                }}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
                required
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {fieldErrors.password}
                </p>
              )}
              {password && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-gray-600">
                    Yêu cầu mật khẩu:
                  </p>
                  <ul className="space-y-1.5">
                    <li
                      className={`text-xs flex items-center gap-2 ${passwordStrength.minLength ? "text-green-600" : "text-gray-400"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${passwordStrength.minLength ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      Tối thiểu 8 ký tự
                    </li>
                    <li
                      className={`text-xs flex items-center gap-2 ${passwordStrength.hasLowercase ? "text-green-600" : "text-gray-400"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${passwordStrength.hasLowercase ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      Chứa chữ thường (a-z)
                    </li>
                    <li
                      className={`text-xs flex items-center gap-2 ${passwordStrength.hasUppercase ? "text-green-600" : "text-gray-400"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${passwordStrength.hasUppercase ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      Chứa chữ hoa (A-Z)
                    </li>
                    <li
                      className={`text-xs flex items-center gap-2 ${passwordStrength.hasDigit ? "text-green-600" : "text-gray-400"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${passwordStrength.hasDigit ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      Chứa chữ số (0-9)
                    </li>
                    <li
                      className={`text-xs flex items-center gap-2 ${passwordStrength.hasSpecialChar ? "text-green-600" : "text-gray-400"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${passwordStrength.hasSpecialChar ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      Chứa ký tự đặc biệt (!@#$%^&*...)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword((e.target as HTMLInputElement).value);
                  if ((e.target as HTMLInputElement).value) {
                    setFieldErrors({ ...fieldErrors, confirmPassword: "" });
                  }
                }}
                onBlur={() => {
                  const result = validatePasswordMatch(
                    password,
                    confirmPassword,
                  );
                  setFieldErrors({
                    ...fieldErrors,
                    confirmPassword: result.error || "",
                  });
                }}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex gap-4 items-center flex-wrap">
              <label className="text-sm font-medium text-gray-700">
                Bạn là
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={role === "landlord"}
                  onChange={() => setRole("landlord")}
                />
                Chủ trọ
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={role === "broker"}
                  onChange={() => setRole("broker")}
                />
                Người môi giới
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                />
                Người tìm trọ
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={role === "admin"}
                  onChange={() => setRole("admin")}
                />
                Quản trị viên
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-600 mt-2 p-3 bg-red-50 rounded-lg flex items-center gap-2">
                <AlertCircle className="size-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 mt-2 p-3 bg-green-50 rounded-lg">
                {success}
              </div>
            )}

            <Button
              type="submit"
              disabled={
                loading || !!success || Object.values(fieldErrors).some((err) => err)
              }
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="size-4 mr-2" />
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-green-600 font-medium hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
