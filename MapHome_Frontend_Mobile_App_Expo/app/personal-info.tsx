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
import { ArrowLeft, User, Phone, Save, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

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
        <View className="px-4 py-4 bg-emerald-600 flex-row items-center">
          <TouchableOpacity
            onPress={() => safeBack(router)}
            className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-white">
            Thông tin cá nhân
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
        >
          <View className="bg-white rounded-3xl p-6 border border-slate-100 mb-6 shadow-sm">
            <View className="items-center mb-6">
              <TouchableOpacity onPress={handlePickImage} className="relative active:opacity-80">
                <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center border-4 border-white shadow-md overflow-hidden">
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#16a34a" />
                  ) : avatar ? (
                    <Image source={{ uri: avatar }} className="w-full h-full" />
                  ) : (
                    <User size={40} color="#94a3b8" />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full items-center justify-center border-2 border-white shadow-sm">
                  <Camera size={14} color="white" />
                </View>
              </TouchableOpacity>
              <Text className="text-slate-500 text-[11px] mt-3 font-semibold uppercase tracking-wider">
                Đổi ảnh đại diện
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  Họ và tên
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12">
                  <User size={16} color="#94a3b8" />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    className="flex-1 ml-3 font-bold text-slate-800"
                    placeholder="Nhập họ và tên"
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  Tên đăng nhập
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12">
                  <User size={16} color="#94a3b8" />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    className="flex-1 ml-3 font-bold text-slate-800"
                    placeholder="Nhập tên đăng nhập"
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  Số điện thoại
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12">
                  <Phone size={16} color="#94a3b8" />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    className="flex-1 ml-3 font-bold text-slate-800"
                    placeholder="Nhập số điện thoại"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSaving}
                className="mt-4 bg-emerald-600 h-12 rounded-2xl flex-row items-center justify-center shadow-md"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Save size={18} color="white" />
                    <Text className="text-white font-black text-sm ml-2">
                      Lưu thay đổi
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
