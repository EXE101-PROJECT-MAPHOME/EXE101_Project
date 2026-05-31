import React, { useState, useEffect } from "react";
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
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import {
  Home,
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import ROUTES, { navigateTo } from "@/constants/routes";
import { useAuth } from "../../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

// Required for expo-auth-session on Android
WebBrowser.maybeCompleteAuthSession();

// Google OAuth — Client IDs from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ??
  "817734182215-ijh0r2a1fbcsm5u5nams9e92obh5cmck.apps.googleusercontent.com";

// iOS: created in Google Console with Bundle ID = host.exp.exponent (Expo Go)
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

// Google G logo SVG component
function GoogleLogo() {
  return (
    <Svg width={22} height={22} viewBox="0 0 48 48" style={{ marginRight: 10 }}>
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.01c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();

  const tint = useThemeColor({}, "tint");
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const icon = useThemeColor({}, "icon");
  const info = useThemeColor({}, "info");
  const danger = useThemeColor({}, "danger");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({ identifier: "", password: "" });
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Google.useAuthRequest handles redirect URI, PKCE, and discovery automatically
  // useProxy: true → use Expo Auth Proxy so Expo Go can handle the redirect
  // Without proxy, iOS uses com.googleusercontent.apps.xxx:// scheme which Expo Go doesn't support (404)
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_WEB_CLIENT_ID, // Bắt buộc dùng Web Client ID cho iOS khi dùng proxy
      androidClientId: GOOGLE_WEB_CLIENT_ID,
    },
    // @ts-ignore - Bỏ qua lỗi TS vì SDK mới báo deprecate nhưng ta vẫn cần dùng cho Expo Go
    { useProxy: true },
  );

  // Handle Google OAuth response
  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      const { authentication } = response;
      // Pass both tokens to backend — backend can verify via idToken or accessToken
      handleGoogleToken(
        authentication?.accessToken ?? "",
        authentication?.idToken,
      );
    } else if (response.type === "error" || response.type === "dismiss") {
      setGoogleLoading(false);
      if (response.type === "error") {
        setError("Đăng nhập Google bị huỷ hoặc thất bại. Vui lòng thử lại.");
      }
    }
  }, [response]);

  const handleGoogleToken = async (
    accessToken: string,
    idToken?: string | null,
  ) => {
    try {
      setGoogleLoading(true);
      const res = await googleLogin({
        accessToken,
        idToken: idToken ?? undefined,
      });
      if (res.success) {
        navigateByRole(res.role);
      } else {
        setError(res.message || "Đăng nhập Google thất bại.");
      }
    } catch {
      setError("Không thể kết nối tới máy chủ khi đăng nhập Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    // @ts-ignore
    await promptAsync({ useProxy: true }); // must match hook's useProxy setting
    // Loading state is controlled in the useEffect above
  };

  const navigateByRole = (role?: string) => {
    if (role === "admin") {
      navigateTo(router, ROUTES.ADMIN_DASHBOARD, true);
    } else if (role === "landlord") {
      navigateTo(router, ROUTES.LANDLORD_DASHBOARD, true);
    } else {
      navigateTo(router, ROUTES.HOME, true);
    }
  };

  const validate = () => {
    const newErrors = { identifier: "", password: "" };
    if (!identifier.trim())
      newErrors.identifier =
        "Vui lòng nhập tài khoản, email hoặc số điện thoại";
    if (!password) newErrors.password = "Mật khẩu không được để trống";
    setErrors(newErrors);
    return !newErrors.identifier && !newErrors.password;
  };

  const handleLogin = async () => {
    setError("");
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await login(identifier.trim(), password);
      if (res.success) {
        navigateByRole(res.role);
      } else {
        setError(res.message || "Tài khoản hoặc mật khẩu không đúng");
      }
    } catch {
      setError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={background} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            justifyContent: "center",
            paddingVertical: 48,
          }}
        >
          {/* ── Logo & Header ── */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <LinearGradient
              colors={[tint, tint]}
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                shadowColor: tint,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Home size={36} color="white" />
            </LinearGradient>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "900",
                color: textColor,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Chào mừng trở lại!
            </Text>
            <Text
              style={{
                color: icon,
                textAlign: "center",
                fontSize: 15,
                lineHeight: 22,
                paddingHorizontal: 8,
              }}
            >
              Cùng MapHome tìm kiếm không gian sống lý tưởng của bạn.
            </Text>
          </View>

          {/* ── Form Card ── */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 28,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 20,
              elevation: 4,
              borderWidth: 1,
              borderColor: "#f1f5f9",
            }}
          >
            {/* Tài khoản */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#059669",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                Tài khoản
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  height: 56,
                  paddingHorizontal: 16,
                  backgroundColor: identifierFocused ? tint : background,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: errors.identifier
                    ? danger
                    : identifierFocused
                      ? tint
                      : "#e2e8f0",
                }}
              >
                <User size={20} color={identifierFocused ? tint : icon} />
                <TextInput
                  value={identifier}
                  onChangeText={(t) => {
                    setIdentifier(t);
                    if (t.trim()) setErrors((e) => ({ ...e, identifier: "" }));
                    setError("");
                  }}
                  onFocus={() => setIdentifierFocused(true)}
                  onBlur={() => {
                    setIdentifierFocused(false);
                    if (!identifier.trim())
                      setErrors((e) => ({
                        ...e,
                        identifier:
                          "Vui lòng nhập tài khoản, email hoặc số điện thoại",
                      }));
                  }}
                  placeholder="Username, email hoặc số điện thoại"
                  placeholderTextColor={icon}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 15,
                    fontWeight: "500",
                    color: textColor,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.identifier ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 6,
                    marginLeft: 4,
                  }}
                >
                  <AlertCircle size={12} color={danger} />
                  <Text
                    style={{
                      color: danger,
                      fontSize: 12,
                      fontWeight: "600",
                      marginLeft: 4,
                    }}
                  >
                    {errors.identifier}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Mật khẩu */}
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
                Mật khẩu
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  height: 56,
                  paddingHorizontal: 16,
                  backgroundColor: passwordFocused ? info : background,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: errors.password
                    ? danger
                    : passwordFocused
                      ? info
                      : "#e2e8f0",
                }}
              >
                <Lock size={20} color={passwordFocused ? info : icon} />
                <TextInput
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (t) setErrors((e) => ({ ...e, password: "" }));
                    setError("");
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    setPasswordFocused(false);
                    if (!password)
                      setErrors((e) => ({
                        ...e,
                        password: "Mật khẩu không được để trống",
                      }));
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={icon}
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 15,
                    fontWeight: "500",
                    color: textColor,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={icon} />
                  ) : (
                    <Eye size={20} color={icon} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 6,
                    marginLeft: 4,
                  }}
                >
                  <AlertCircle size={12} color={danger} />
                  <Text
                    style={{
                      color: danger,
                      fontSize: 12,
                      fontWeight: "600",
                      marginLeft: 4,
                    }}
                  >
                    {errors.password}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                onPress={() => navigateTo(router, ROUTES.FORGOT_PASSWORD)}
                style={{ alignSelf: "flex-end", marginTop: 10 }}
              >
                <Text style={{ color: tint, fontSize: 13, fontWeight: "700" }}>
                  Quên mật khẩu?
                </Text>
              </TouchableOpacity>
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
                  marginTop: 12,
                  marginBottom: 4,
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

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading || googleLoading}
              style={{ marginTop: 20 }}
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
                      Đăng nhập ngay
                    </Text>
                    <ArrowRight size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 20,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }}
              />
              <Text
                style={{
                  marginHorizontal: 14,
                  fontSize: 11,
                  fontWeight: "800",
                  color: icon,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Tiếp tục nhanh với
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }}
              />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading || googleLoading || !request}
              activeOpacity={0.85}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                height: 56,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: "#e2e8f0",
                backgroundColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
                opacity: !request ? 0.5 : 1,
              }}
            >
              {googleLoading ? (
                <ActivityIndicator color={info} />
              ) : (
                <>
                  <GoogleLogo />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: textColor,
                    }}
                  >
                    Tài khoản Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 20,
              }}
            >
              <Text style={{ color: icon, fontWeight: "500", fontSize: 14 }}>
                Chưa có tài khoản?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => navigateTo(router, ROUTES.REGISTER)}
              >
                <Text style={{ color: tint, fontWeight: "800", fontSize: 14 }}>
                  Đăng ký
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
