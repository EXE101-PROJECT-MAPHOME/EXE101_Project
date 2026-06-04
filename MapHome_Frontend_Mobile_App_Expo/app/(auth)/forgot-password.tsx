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
import ROUTES, { navigateTo } from "@/constants/routes";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import api from "../../utils/api";

type Step = "request" | "success";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const icon = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");
  const [step, setStep] = useState<Step>("request");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");

  const requestReset = async () => {
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
  };

  const renderRequestStep = () => (
    <View>
      <View className="mb-5">
        <Text className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">
          Email
        </Text>
        <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-14 px-4">
          <Mail size={20} color={icon} />
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



  const renderSuccessStep = () => (
    <View className="items-center py-8">
      <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-5">
        <Text className="text-3xl">✓</Text>
      </View>
      <Text className="text-2xl font-black text-emerald-700 text-center mb-2">
        Khôi phục thành công
      </Text>
      <Text className="text-slate-500 text-center mb-8">
        Mật khẩu mới đã được gửi qua email của bạn.
      </Text>
      <TouchableOpacity
        onPress={() => navigateTo(router, ROUTES.LOGIN, true)}
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
              <ArrowLeft size={18} color={icon} />
              <Text className="text-slate-900 font-bold ml-2">Quay lại</Text>
            </TouchableOpacity>

            <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <Text className="text-2xl font-black text-emerald-700 mb-2">
                Khôi phục mật khẩu
              </Text>
              <Text className="text-slate-500 mb-6">
                {step === "request" && "Nhập email của bạn để nhận mật khẩu mới."}
                {step === "success" && "Bạn có thể đăng nhập lại ngay bây giờ."}
              </Text>

              {step === "request" && renderRequestStep()}
              {step === "success" && renderSuccessStep()}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
