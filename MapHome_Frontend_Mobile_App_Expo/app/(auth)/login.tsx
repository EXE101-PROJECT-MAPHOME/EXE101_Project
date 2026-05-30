import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Home, User, Lock, ArrowRight } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tài khoản và mật khẩu.");
      return;
    }
    try {
      setLoading(false);
      setLoading(true);
      const res = await login(identifier, password);
      setLoading(false);
      if (res.success) {
        Alert.alert("Thành công", "Đăng nhập thành công!");
        router.replace("/(tabs)");
      } else {
        Alert.alert("Thất bại", res.message || "Đăng nhập thất bại.");
      }
    } catch {
      setLoading(false);
      Alert.alert("Lỗi", "Không thể kết nối tới máy chủ.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 justify-center py-12">
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-emerald-600 items-center justify-center mb-4 shadow-lg">
              <Home size={32} color="white" />
            </View>
            <Text className="text-3xl font-black text-emerald-950 text-center mb-2">
              Chào mừng trở lại!
            </Text>
            <Text className="text-slate-500 text-center text-base">
              Cùng MapHome tìm kiếm không gian sống lý tưởng của bạn.
            </Text>
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <View className="mb-4">
              <Text className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">
                Tài khoản
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-14 px-4 focus:border-emerald-500">
                <User size={20} color="#94a3b8" />
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="Username, email hoặc số điện thoại"
                  className="flex-1 ml-3 h-full text-base font-medium text-slate-700"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 ml-1">
                Mật khẩu
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-14 px-4 focus:border-blue-500">
                <Lock size={20} color="#94a3b8" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  className="flex-1 ml-3 h-full text-base font-medium text-slate-700"
                />
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
                className="self-end mt-2"
              >
                <Text className="text-sm font-bold text-emerald-500">
                  Quên mật khẩu?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="w-full bg-emerald-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-black text-lg mr-2">
                    Đăng nhập ngay
                  </Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-500 font-medium">
                Chưa có tài khoản?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text className="text-emerald-600 font-bold">Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
