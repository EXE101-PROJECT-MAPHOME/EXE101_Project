import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import CustomAlert from "@/components/CustomAlert";
import {
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Home,
  UserCheck,
  Building2,
  ChevronDown,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "../../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

export type Role = "user" | "landlord" | "admin" | "broker";

interface FormErrors {
  fullName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      setError("");
      setErrors({
        fullName: "",
        phone: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
      });
    }, [])
  );

  const tint = useThemeColor({}, "tint");
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const icon = useThemeColor({}, "icon");
  const info = useThemeColor({}, "info");
  const danger = useThemeColor({}, "danger");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success" as "success" | "error" | "info",
    hideButtons: false,
    onConfirm: () => {},
  });

  const [errors, setErrors] = useState<FormErrors>({
    fullName: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // Focus states
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  const setFieldFocus = (field: string, val: boolean) =>
    setFocused((f) => ({ ...f, [field]: val }));

  // Inline validation
  const validateField = (field: keyof FormErrors, value: string) => {
    let msg = "";
    switch (field) {
      case "fullName":
        if (!value.trim()) msg = "Vui lòng nhập họ và tên";
        else if (value.trim().length < 2)
          msg = "Họ và tên phải có ít nhất 2 ký tự";
        break;
      case "phone":
        if (!value.trim()) msg = "Vui lòng nhập số điện thoại";
        else if (!/^(0|\+84)[0-9]{8,10}$/.test(value.replace(/\s/g, "")))
          msg = "Số điện thoại không hợp lệ";
        break;
      case "email":
        if (!value.trim()) msg = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          msg = "Email không hợp lệ";
        break;
      case "username":
        if (!value.trim()) msg = "Vui lòng nhập tên đăng nhập";
        else if (value.length < 3) msg = "Tên đăng nhập ít nhất 3 ký tự";
        else if (!/^[a-zA-Z0-9_]+$/.test(value))
          msg = "Chỉ chứa chữ, số và dấu gạch dưới";
        break;
      case "password":
        if (!value) msg = "Vui lòng nhập mật khẩu";
        else if (value.length < 8) msg = "Mật khẩu ít nhất 8 ký tự";
        else if (!/[a-z]/.test(value)) msg = "Cần ít nhất 1 chữ thường";
        else if (!/[A-Z]/.test(value)) msg = "Cần ít nhất 1 chữ hoa";
        else if (!/[0-9]/.test(value)) msg = "Cần ít nhất 1 chữ số";
        else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) msg = "Cần ít nhất 1 ký tự đặc biệt";
        break;
      case "confirmPassword":
        if (!value) msg = "Vui lòng xác nhận mật khẩu";
        else if (value !== password) msg = "Mật khẩu không khớp";
        break;
    }
    setErrors((e) => ({ ...e, [field]: msg }));
    return !msg;
  };

  const validateAll = () => {
    const fields: [keyof FormErrors, string][] = [
      ["fullName", fullName],
      ["phone", phone],
      ["email", email],
      ["username", username],
      ["password", password],
      ["confirmPassword", confirmPassword],
    ];
    let valid = true;
    const newErrors: FormErrors = {
      fullName: "",
      phone: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    };
    fields.forEach(([field, value]) => {
      let msg = "";
      switch (field) {
        case "fullName":
          if (!value.trim()) msg = "Vui lòng nhập họ và tên";
          else if (value.trim().length < 2)
            msg = "Họ và tên phải có ít nhất 2 ký tự";
          break;
        case "phone":
          if (value.trim() && !/^(?:\+?84|0)(3|5|7|8|9)[0-9]{8}$/.test(value.replace(/\s/g, "")))
            msg = "Số điện thoại không hợp lệ";
          break;
        case "email":
          if (!value.trim()) msg = "Vui lòng nhập email";
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            msg = "Email không hợp lệ";
          break;
        case "username":
          if (!value.trim()) msg = "Vui lòng nhập tên đăng nhập";
          else if (value.length < 3) msg = "Tên đăng nhập ít nhất 3 ký tự";
          else if (!/^[a-zA-Z0-9_]+$/.test(value))
            msg = "Chỉ chứa chữ, số và dấu gạch dưới";
          break;
        case "password":
          if (!value) msg = "Vui lòng nhập mật khẩu";
          else if (value.length < 8) msg = "Mật khẩu ít nhất 8 ký tự";
          else if (!/[a-z]/.test(value)) msg = "Cần ít nhất 1 chữ thường";
          else if (!/[A-Z]/.test(value)) msg = "Cần ít nhất 1 chữ hoa";
          else if (!/[0-9]/.test(value)) msg = "Cần ít nhất 1 chữ số";
          else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) msg = "Cần ít nhất 1 ký tự đặc biệt";
          break;
        case "confirmPassword":
          if (!value) msg = "Vui lòng xác nhận mật khẩu";
          else if (value !== password) msg = "Mật khẩu không khớp";
          break;
      }
      if (msg) {
        newErrors[field] = msg;
        valid = false;
      }
    });
    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    setError("");
    if (!validateAll()) return;

    try {
      setLoading(true);
      const res = await register({
        username,
        email,
        password,
        confirmPassword,
        fullName,
        phone,
        role,
      });
      if (res.success) {
        setAlertConfig({
          visible: true,
          title: "Đăng ký thành công",
          message: "Tài khoản của bạn đã được tạo thành công. Đang chuyển hướng...",
          type: "success",
          hideButtons: true,
          onConfirm: () => {},
        });
        setTimeout(() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          navigateTo(router, ROUTES.LOGIN, true);
        }, 1500);
      } else {
        setError(
          res.message || "Đăng ký tài khoản thất bại. Vui lòng thử lại.",
        );
        setLoading(false);
      }
    } catch {
      setLoading(false);
      setError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    }
  };

  const inputStyle = (field: string, hasError: boolean) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: hasError
      ? danger
      : focused[field]
        ? field === "password" || field === "confirmPassword"
          ? info
          : tint
        : "#e2e8f0",
    height: 52,
    paddingHorizontal: 14,
  });

  const ErrorMsg = ({ msg }: { msg: string }) =>
    msg ? (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 5,
          marginLeft: 2,
        }}
      >
        <AlertCircle size={11} color="#ef4444" />
        <Text
          style={{
            color: "#ef4444",
            fontSize: 11,
            fontWeight: "600",
            marginLeft: 3,
          }}
        >
          {msg}
        </Text>
      </View>
    ) : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48 }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <LinearGradient
              colors={[tint, tint]}
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                shadowColor: tint,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Home size={32} color="white" />
            </LinearGradient>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: textColor,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              Khởi tạo hành trình
            </Text>
            <Text
              style={{
                color: icon,
                textAlign: "center",
                fontSize: 14,
                lineHeight: 20,
                paddingHorizontal: 16,
              }}
            >
              Tham gia cùng cộng đồng tìm trọ hiện đại nhất hiện nay.
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 28,
              padding: 22,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 20,
              elevation: 4,
              borderWidth: 1,
              borderColor: "#f1f5f9",
            }}
          >
            {/* Role Selector */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 10,
                  marginLeft: 4,
                }}
              >
                Bạn là
              </Text>
              <View style={{ position: "relative" }}>
                <TouchableOpacity
                  onPress={() => setShowRoleDropdown(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: "#e2e8f0",
                    backgroundColor: background,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {role === "user" ? (
                      <UserCheck size={18} color={tint} />
                    ) : role === "broker" ? (
                      <Building2 size={18} color="#f59e0b" />
                    ) : (
                      <Building2 size={18} color={info} />
                    )}
                    <Text
                      style={{
                        marginLeft: 8,
                        fontWeight: "700",
                        fontSize: 14,
                        color: role === "user" ? tint : role === "broker" ? "#d97706" : info,
                      }}
                    >
                      {role === "user" ? "Người thuê" : role === "broker" ? "Môi giới" : "Chủ nhà"}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={icon} />
                </TouchableOpacity>

                <Modal visible={showRoleDropdown} transparent animationType="fade">
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(0,0,0,0.3)",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 24,
                    }}
                    onPress={() => setShowRoleDropdown(false)}
                    activeOpacity={1}
                  >
                    <View
                      style={{
                        backgroundColor: "white",
                        width: "100%",
                        borderRadius: 20,
                        padding: 12,
                      }}
                    >
                      <Text
                        style={{
                          textAlign: "center",
                          fontWeight: "800",
                          fontSize: 16,
                          paddingVertical: 12,
                          color: textColor,
                          marginBottom: 8,
                        }}
                      >
                        Chọn vai trò của bạn
                      </Text>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 16,
                          borderRadius: 14,
                          backgroundColor: role === "user" ? tint + "15" : "white",
                          marginBottom: 8,
                        }}
                        onPress={() => {
                          setRole("user");
                          setShowRoleDropdown(false);
                        }}
                      >
                        <UserCheck size={22} color={tint} />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={{ fontWeight: "800", color: tint, fontSize: 15 }}>Người thuê</Text>
                          <Text style={{ fontSize: 12, color: icon, marginTop: 2 }}>Tìm phòng trọ, căn hộ cho thuê</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 16,
                          borderRadius: 14,
                          backgroundColor: role === "broker" ? "#f59e0b15" : "white",
                          marginBottom: 8,
                        }}
                        onPress={() => {
                          setRole("broker");
                          setShowRoleDropdown(false);
                        }}
                      >
                        <Building2 size={22} color="#f59e0b" />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={{ fontWeight: "800", color: "#d97706", fontSize: 15 }}>Người môi giới</Text>
                          <Text style={{ fontSize: 12, color: icon, marginTop: 2 }}>Môi giới trọ & Quản lý nhiều chủ trọ</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 16,
                          borderRadius: 14,
                          backgroundColor: role === "landlord" ? info + "15" : "white",
                        }}
                        onPress={() => {
                          setRole("landlord");
                          setShowRoleDropdown(false);
                        }}
                      >
                        <Building2 size={22} color={info} />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={{ fontWeight: "800", color: info, fontSize: 15 }}>Chủ nhà</Text>
                          <Text style={{ fontSize: 12, color: icon, marginTop: 2 }}>Đăng tin và quản lý phòng trọ</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>
            </View>

            {/* Row: Full Name + Phone */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: "#16a34a",
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    marginBottom: 7,
                    marginLeft: 2,
                  }}
                >
                  Họ và tên
                </Text>
                <View style={inputStyle("fullName", !!errors.fullName)}>
                  <TextInput
                    value={fullName}
                    onChangeText={(t) => {
                      setFullName(t);
                      if (errors.fullName && t.trim().length >= 2)
                        setErrors((e) => ({ ...e, fullName: "" }));
                    }}
                    onFocus={() => setFieldFocus("fullName", true)}
                    onBlur={() => {
                      setFieldFocus("fullName", false);
                      validateField("fullName", fullName);
                    }}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor={icon}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "500",
                      color: textColor,
                    }}
                  />
                </View>
                <ErrorMsg msg={errors.fullName} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: "#2563eb",
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    marginBottom: 7,
                    marginLeft: 2,
                  }}
                >
                  Điện thoại
                </Text>
                <View style={inputStyle("phone", !!errors.phone)}>
                  <Phone size={16} color={focused["phone"] ? info : icon} />
                  <TextInput
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t);
                      if (errors.phone) setErrors((e) => ({ ...e, phone: "" }));
                    }}
                    onFocus={() => setFieldFocus("phone", true)}
                    onBlur={() => {
                      setFieldFocus("phone", false);
                      validateField("phone", phone);
                    }}
                    placeholder="091..."
                    placeholderTextColor="#cbd5e1"
                    keyboardType="phone-pad"
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#1e293b",
                    }}
                  />
                </View>
                <ErrorMsg msg={errors.phone} />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                Email liên lạc
              </Text>
              <View style={inputStyle("email", !!errors.email)}>
                <Mail size={18} color={focused["email"] ? tint : icon} />
                <TextInput
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))
                      setErrors((e) => ({ ...e, email: "" }));
                  }}
                  onFocus={() => setFieldFocus("email", true)}
                  onBlur={() => {
                    setFieldFocus("email", false);
                    validateField("email", email);
                  }}
                  placeholder="email@example.com"
                  placeholderTextColor={icon}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#1e293b",
                  }}
                />
              </View>
              <ErrorMsg msg={errors.email} />
            </View>

            {/* Username */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#16a34a",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                Tên đăng nhập
              </Text>
              <View style={inputStyle("username", !!errors.username)}>
                <User size={18} color={focused["username"] ? tint : icon} />
                <TextInput
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    if (
                      errors.username &&
                      t.length >= 3 &&
                      /^[a-zA-Z0-9_]+$/.test(t)
                    )
                      setErrors((e) => ({ ...e, username: "" }));
                  }}
                  onFocus={() => setFieldFocus("username", true)}
                  onBlur={() => {
                    setFieldFocus("username", false);
                    validateField("username", username);
                  }}
                  placeholder="username"
                  placeholderTextColor="#cbd5e1"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#1e293b",
                  }}
                />
              </View>
              <ErrorMsg msg={errors.username} />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#2563eb",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                Mật khẩu
              </Text>
              <View style={inputStyle("password", !!errors.password)}>
                <Lock size={18} color={focused["password"] ? info : icon} />
                <TextInput
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (errors.password)
                      setErrors((e) => ({ ...e, password: "" }));
                    // Re-validate confirmPassword if already typed
                    if (confirmPassword && t !== confirmPassword) {
                      setErrors((e) => ({
                        ...e,
                        confirmPassword: "Mật khẩu không khớp",
                      }));
                    } else if (confirmPassword) {
                      setErrors((e) => ({ ...e, confirmPassword: "" }));
                    }
                  }}
                  onFocus={() => setFieldFocus("password", true)}
                  onBlur={() => {
                    setFieldFocus("password", false);
                    validateField("password", password);
                  }}
                  placeholder="Mật khẩu mạnh (hoa, thường, số, ký tự đặc biệt)"
                  placeholderTextColor={icon}
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 14,
                    fontWeight: "500",
                    color: textColor,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={icon} />
                  ) : (
                    <Eye size={18} color={icon} />
                  )}
                </TouchableOpacity>
              </View>
              <ErrorMsg msg={errors.password} />
            </View>

            {/* Confirm Password */}
            <View style={{ marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#2563eb",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                Xác nhận mật khẩu
              </Text>
              <View
                style={inputStyle("confirmPassword", !!errors.confirmPassword)}
              >
                <Lock
                  size={18}
                  color={focused["confirmPassword"] ? info : icon}
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (errors.confirmPassword && t === password)
                      setErrors((e) => ({ ...e, confirmPassword: "" }));
                  }}
                  onFocus={() => setFieldFocus("confirmPassword", true)}
                  onBlur={() => {
                    setFieldFocus("confirmPassword", false);
                    validateField("confirmPassword", confirmPassword);
                  }}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry={!showConfirmPassword}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#1e293b",
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ padding: 4 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={icon} />
                  ) : (
                    <Eye size={18} color={icon} />
                  )}
                </TouchableOpacity>
              </View>
              <ErrorMsg msg={errors.confirmPassword} />
            </View>

            {/* Error Banner */}
            {error ? (
              <View
                style={{
                  backgroundColor: "#fef2f2",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#fecaca",
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 14,
                }}
              >
                <AlertCircle size={18} color={danger} />
                <Text
                  style={{
                    color: "#dc2626",
                    fontSize: 13,
                    fontWeight: "700",
                    marginLeft: 10,
                    flex: 1,
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={{ marginTop: 22 }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={loading ? [icon, icon] : [tint, tint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  shadowColor: tint,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: loading ? 0 : 0.35,
                  shadowRadius: 12,
                  elevation: loading ? 0 : 6,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "900",
                        fontSize: 17,
                        marginRight: 8,
                      }}
                    >
                      Đăng ký ngay
                    </Text>
                    <ArrowRight size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 18,
              }}
            >
              <Text style={{ color: icon, fontWeight: "500", fontSize: 14 }}>
                Đã có tài khoản?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => navigateTo(router, ROUTES.LOGIN)}
              >
                <Text style={{ color: tint, fontWeight: "800", fontSize: 14 }}>
                  Đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <CustomAlert {...alertConfig} />
    </KeyboardAvoidingView>
  );
}
