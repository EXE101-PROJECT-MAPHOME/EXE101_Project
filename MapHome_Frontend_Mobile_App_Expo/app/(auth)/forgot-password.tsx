import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, Phone, KeyRound, Lock } from "lucide-react-native";
import api from "../../utils/api";

type Step = "request" | "verifyOtp" | "resetPassword" | "success";
type Method = "email" | "phone";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<Step>("request");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const requestReset = async () => {
    if (method === "email") {
      if (!email.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập email.");
        return;
      }
      try {
        setLoading(true);
        await api.post("/api/auth/forgot-password", { email: email.trim() });
        setStep("success");
      } catch (err: any) {
        Alert.alert(
          "Lỗi",
          err?.response?.data?.message || "Không thể gửi yêu cầu.",
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert("Lỗi", "Số điện thoại không hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/auth/forgot-password-phone", {
        phone: phone.trim(),
      });
      setStep("verifyOtp");
      Alert.alert("Thành công", "Mã OTP đã được gửi đến điện thoại của bạn.");
    } catch (err: any) {
      Alert.alert("Lỗi", err?.response?.data?.message || "Không thể gửi OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert("Lỗi", "Mã OTP phải có 6 chữ số.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/auth/verify-otp-phone", {
        phone: phone.trim(),
        otp: otp.trim(),
      });
      setResetToken(res.data?.resetToken || "");
      setStep("resetPassword");
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!resetToken) {
      Alert.alert(
        "Lỗi",
        "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.",
      );
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/auth/reset-password-phone", {
        resetToken,
        newPassword,
      });
      setStep("success");
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể đổi mật khẩu.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderRequestStep = () => (
    <View>
      <View className="flex-row bg-slate-100 rounded-2xl p-1 mb-6">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-xl items-center ${method === "email" ? "bg-white" : ""}`}
          onPress={() => {
            setMethod("email");
            setStep("request");
          }}
        >
          <Text
            className={`font-bold ${method === "email" ? "text-emerald-700" : "text-slate-500"}`}
          >
            Email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-xl items-center ${method === "phone" ? "bg-white" : ""}`}
          onPress={() => {
            setMethod("phone");
            setStep("request");
          }}
        >
          <Text
            className={`font-bold ${method === "phone" ? "text-emerald-700" : "text-slate-500"}`}
          >
            Số điện thoại
          </Text>
        </TouchableOpacity>
      </View>

      {method === "email" ? (
        <View className="mb-5">
          <Text className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">
            Email
          </Text>
          <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-14 px-4">
            <Mail size={20} color="#94a3b8" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ban@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 ml-3 h-full text-base font-medium text-slate-700"
            />
          </View>
        </View>
      ) : (
        <View className="mb-5">
          <Text className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 ml-1">
            Số điện thoại
          </Text>
          <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-14 px-4">
            <Phone size={20} color="#94a3b8" />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="09xxxxxxxx"
              keyboardType="phone-pad"
              className="flex-1 ml-3 h-full text-base font-medium text-slate-700"
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={requestReset}
        disabled={loading}
        className="w-full bg-emerald-600 h-14 rounded-2xl items-center justify-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-black text-base">Tiếp tục</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOtpStep = () => (
    <View>
      <View className="mb-5">
        <Text className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">
          Mã OTP
        </Text>
        <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-14 px-4">
          <KeyRound size={20} color="#94a3b8" />
          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="Nhập 6 chữ số"
            keyboardType="number-pad"
            maxLength={6}
            className="flex-1 ml-3 h-full text-base font-medium text-slate-700"
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={verifyOtp}
        disabled={loading}
        className="w-full bg-emerald-600 h-14 rounded-2xl items-center justify-center mb-3"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-black text-base">Xác thực OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setStep("request")}
        className="items-center"
      >
        <Text className="text-slate-500 font-semibold">
          Nhập lại số điện thoại
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderResetStep = () => (
    <View>
      <View className="mb-4">
        <Text className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">
          Mật khẩu mới
        </Text>
        <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-14 px-4">
          <Lock size={20} color="#94a3b8" />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Tối thiểu 8 ký tự"
            secureTextEntry
            className="flex-1 ml-3 h-full text-base font-medium text-slate-700"
          />
        </View>
      </View>

      <View className="mb-5">
        <Text className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 ml-1">
          Xác nhận mật khẩu
        </Text>
        <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-14 px-4">
          <Lock size={20} color="#94a3b8" />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
            className="flex-1 ml-3 h-full text-base font-medium text-slate-700"
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={submitNewPassword}
        disabled={loading}
        className="w-full bg-emerald-600 h-14 rounded-2xl items-center justify-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-black text-base">Đổi mật khẩu</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSuccessStep = () => (
    <View className="items-center py-8">
      <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-5">
        <Text className="text-3xl">✓</Text>
      </View>
      <Text className="text-2xl font-black text-emerald-950 text-center mb-2">
        Khôi phục thành công
      </Text>
      <Text className="text-slate-500 text-center mb-8">
        {method === "email"
          ? "Mật khẩu mới đã được gửi qua email của bạn."
          : "Mật khẩu của bạn đã được thay đổi thành công."}
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/login")}
        className="w-full bg-emerald-600 h-14 rounded-2xl items-center justify-center"
      >
        <Text className="text-white font-black text-base">
          Quay lại đăng nhập
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 py-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center mb-6 self-start"
            >
              <ArrowLeft size={18} color="#0f172a" />
              <Text className="text-slate-900 font-bold ml-2">Quay lại</Text>
            </TouchableOpacity>

            <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <Text className="text-2xl font-black text-emerald-950 mb-2">
                Khôi phục mật khẩu
              </Text>
              <Text className="text-slate-500 mb-6">
                {step === "request" && "Chọn phương thức để đặt lại mật khẩu."}
                {step === "verifyOtp" &&
                  "Nhập mã OTP được gửi về số điện thoại của bạn."}
                {step === "resetPassword" &&
                  "Thiết lập mật khẩu mới để tiếp tục đăng nhập."}
                {step === "success" && "Bạn có thể đăng nhập lại ngay bây giờ."}
              </Text>

              {step === "request" && renderRequestStep()}
              {step === "verifyOtp" && renderOtpStep()}
              {step === "resetPassword" && renderResetStep()}
              {step === "success" && renderSuccessStep()}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
