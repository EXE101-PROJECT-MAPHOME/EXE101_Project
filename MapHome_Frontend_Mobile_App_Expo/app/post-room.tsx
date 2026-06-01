import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function PostRoomScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, "tint");

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="p-4">
        <Text className="text-2xl font-black text-emerald-700 mb-4">
          Đăng tin phòng trọ
        </Text>
        <Text className="text-slate-600 mb-6">
          Giao diện đăng tin tạm thời — hoàn thiện trên web hoặc mở rộng mobile
          sau.
        </Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Thao tác", "Tạo nháp thành công. Hoàn tất trên web.")
          }
          className="bg-emerald-600 py-3 rounded-2xl items-center"
        >
          <Text className="text-white font-bold">Lưu nháp</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
