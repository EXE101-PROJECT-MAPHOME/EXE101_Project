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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES, { navigateTo, safeBack } from "@/constants/routes";
import { ArrowLeft, User, Phone, Save, Camera, Check, ShieldCheck } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/utils/api";

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setUsername(user.username || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền truy cập", "Cần cấp quyền truy cập thư viện ảnh để thay đổi avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setIsUploadingAvatar(true);
      const formDataUpload = new FormData() as any;
      formDataUpload.append("file", {
        uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      });
      const res = await api.post("/api/upload/single", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data && res.data.url) {
        setAvatar(res.data.url);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const userId = user.id || user._id;
      // We also need to send the existing security object so it isn't overwritten.
      const res = await api.put(`/api/user/${userId}`, {
        fullName,
        phone,
        username,
        avatar,
        security: user.security,
      });
      if (res.status === 200) {
        await updateUser(res.data);
        Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân!");
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header - Modern transparent style */}
        <View className="px-4 py-4 flex-row items-center justify-between z-10">
          <TouchableOpacity
            onPress={() => safeBack(router)}
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-slate-100"
          >
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-lg font-black text-slate-800 tracking-tight">Hồ sơ cá nhân</Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Avatar Section - Big and bold */}
          <View className="items-center mt-2 mb-8">
            <View className="relative">
              <View className="w-32 h-32 rounded-[40px] bg-white shadow-xl shadow-emerald-900/10 items-center justify-center border-4 border-white overflow-hidden">
                {isUploadingAvatar ? (
                  <ActivityIndicator size="large" color="#10b981" />
                ) : avatar ? (
                  <Image source={{ uri: avatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full bg-emerald-50 items-center justify-center">
                    <User size={50} color="#10b981" opacity={0.5} />
                  </View>
                )}
              </View>
              <TouchableOpacity 
                onPress={handlePickImage}
                className="absolute -bottom-2 -right-2 w-11 h-11 bg-emerald-500 rounded-full items-center justify-center border-4 border-slate-50 shadow-lg active:scale-95"
              >
                <Camera size={18} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-2xl font-black text-slate-800 mt-6">{fullName || "Người dùng"}</Text>
            <View className="flex-row items-center mt-2 bg-emerald-100/80 px-3 py-1.5 rounded-full border border-emerald-200">
              <View className="w-2 h-2 bg-emerald-500 rounded-full mr-2 shadow-sm" />
              <Text className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Tài khoản MapHome</Text>
            </View>
          </View>

          {/* Form Section */}
          <View className="px-5 space-y-4">
            <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <Text className="text-[13px] font-black text-slate-800 mb-6 uppercase tracking-wider">Thông tin cơ bản</Text>
              
              <View className="mb-5">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Họ và tên
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 h-14">
                  <View className="w-8 h-8 bg-white rounded-xl items-center justify-center shadow-sm border border-slate-100 mr-3">
                    <User size={14} color="#64748b" />
                  </View>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    className="flex-1 font-bold text-slate-800 text-[15px]"
                    placeholder="Nhập họ và tên"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View className="mb-5">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Tên đăng nhập
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 h-14">
                  <View className="w-8 h-8 bg-white rounded-xl items-center justify-center shadow-sm border border-slate-100 mr-3">
                    <User size={14} color="#64748b" />
                  </View>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    className="flex-1 font-bold text-slate-800 text-[15px]"
                    placeholder="Nhập tên đăng nhập"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="mb-2">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Số điện thoại
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 h-14">
                  <View className="w-8 h-8 bg-white rounded-xl items-center justify-center shadow-sm border border-slate-100 mr-3">
                    <Phone size={14} color="#64748b" />
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    className="flex-1 font-bold text-slate-800 text-[15px]"
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Action */}
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 pb-8">
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={isSaving}
            className="overflow-hidden rounded-2xl shadow-lg shadow-emerald-500/30"
          >
            {isSaving ? (
               <View className="h-14 bg-emerald-600 flex-row items-center justify-center">
                 <ActivityIndicator size="small" color="white" />
               </View>
            ) : (
               <View className="h-14 bg-emerald-600 flex-row items-center justify-center">
                 <Save size={20} color="white" strokeWidth={2.5} />
                 <Text className="text-white font-black text-base ml-2 tracking-wide">
                   LƯU THAY ĐỔI
                 </Text>
               </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
