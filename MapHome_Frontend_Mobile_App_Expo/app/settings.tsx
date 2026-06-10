import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES, { navigateTo, safeBack } from "@/constants/routes";
import { ArrowLeft, User, Phone, Save, Lock, Key, Shield, Clock } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(user.security?.twoFactorEnabled || false);
      setLoginHistory(user.security?.loginHistory || []);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const userId = user.id || user._id;
      const res = await api.put(`/api/user/${userId}`, {
        security: {
          twoFactorEnabled,
          loginHistory,
        }
      });
      if (res.status === 200) {
        await updateUser(res.data);
        Alert.alert("Thành công", "Đã cập nhật thông tin tài khoản!");
      }
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể cập nhật thông tin.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordForm(!showPasswordForm);
  };

  const submitChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin mật khẩu.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const res = await api.put("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      if (res.status === 200) {
        Alert.alert("Thành công", "Đổi mật khẩu thành công! Bạn có thể cần đăng nhập lại.");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors && errorData.errors.length > 0) {
        Alert.alert("Lỗi", errorData.errors[0].message);
      } else {
        Alert.alert("Lỗi", errorData?.message || "Mật khẩu hiện tại không chính xác.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-4 py-4 bg-emerald-600 flex-row items-center">
          <TouchableOpacity
            onPress={() => safeBack(router)}
            className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-white">
            Cài đặt tài khoản
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
        >
          {/* Bảo mật */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-6">
            <Text className="text-base font-black text-emerald-700 mb-4">
              Bảo mật
            </Text>

            {/* Xác thực 2 lớp */}
            <View className="flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center mr-3">
                  <Shield size={18} color="#d97706" />
                </View>
                <View>
                  <Text className="font-bold text-slate-800">Xác thực 2 lớp (2FA)</Text>
                  <Text className="text-[10px] text-slate-500 font-medium">
                    Tăng cường bảo mật khi đăng nhập
                  </Text>
                </View>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={(val) => {
                  setTwoFactorEnabled(val);
                }}
                trackColor={{ false: "#cbd5e1", true: "#16a34a" }}
              />
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              className="flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                  <Lock size={18} color="#4f46e5" />
                </View>
                <View>
                  <Text className="font-bold text-slate-800">Đổi mật khẩu</Text>
                  <Text className="text-xs text-slate-500 font-medium">
                    Bảo vệ tài khoản của bạn
                  </Text>
                </View>
              </View>
              <View className={`px-3 py-1.5 rounded-lg border shadow-sm ${showPasswordForm ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-200'}`}>
                <Text className={`text-xs font-bold ${showPasswordForm ? 'text-white' : 'text-slate-600'}`}>
                  {showPasswordForm ? 'Hủy' : 'Thay đổi'}
                </Text>
              </View>
            </TouchableOpacity>

            {showPasswordForm && (
              <View className="mt-4 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <View className="space-y-4">
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                      Mật khẩu hiện tại
                    </Text>
                    <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-12">
                      <Lock size={16} color="#94a3b8" />
                      <TextInput
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                        className="flex-1 ml-3 font-bold text-slate-800"
                        placeholder="••••••••"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                      Mật khẩu mới
                    </Text>
                    <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-12">
                      <Key size={16} color="#94a3b8" />
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        className="flex-1 ml-3 font-bold text-slate-800"
                        placeholder="••••••••"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex-row mt-2">
                    <Text className="text-[10px] text-amber-800 font-bold leading-relaxed flex-1 ml-2">
                      Lưu ý: Mật khẩu phải có ít nhất 8 ký tự. Bạn có thể phải đăng nhập lại sau khi đổi.
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={submitChangePassword}
                    disabled={isChangingPassword}
                    className="mt-2 bg-indigo-600 h-12 rounded-2xl flex-row items-center justify-center shadow-md"
                  >
                    {isChangingPassword ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-black text-sm">
                        Xác nhận đổi mật khẩu
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Lịch sử đăng nhập */}
            <View className="mt-6 border-t border-slate-100 pt-5">
              <View className="flex-row items-center mb-4">
                <Clock size={16} color="#16a34a" />
                <Text className="text-sm font-black text-emerald-700 ml-2">Lịch sử đăng nhập (10 phiên gần nhất)</Text>
              </View>
              
              {loginHistory && loginHistory.length > 0 ? (
                loginHistory.map((session: any, index: number) => (
                  <View key={index} className="py-3 border-b border-slate-50 flex-row justify-between items-center">
                    <View>
                      <Text className="font-bold text-slate-700 text-xs">
                        {session.os || "Thiết bị không rõ"} • {session.browser || "Trình duyệt không rõ"}
                      </Text>
                      <Text className="text-[10px] text-slate-500 mt-1">
                        IP: {session.ip || "Unknown IP"}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] text-slate-500 font-medium">
                        {session.lastLogin ? new Date(session.lastLogin).toLocaleString("vi-VN") : "Gần đây"}
                      </Text>
                      <View className="px-2 py-0.5 bg-emerald-50 rounded-full mt-1 border border-emerald-100">
                        <Text className="text-[9px] font-bold text-emerald-600 uppercase">Thành công</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-slate-500 italic text-center py-2">
                  Chưa có dữ liệu lịch sử đăng nhập.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
