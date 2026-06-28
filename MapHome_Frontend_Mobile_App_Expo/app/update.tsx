import React from "react";
import { View, Text, TouchableOpacity, Linking, Platform, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpCircle } from "lucide-react-native";
import Constants from "expo-constants";

export default function UpdateScreen() {
  const currentVersion = Constants.expoConfig?.version || "1.0.0";

  const handleUpdate = async () => {
    // Replace these with actual store URLs for MapHome
    const storeUrl = Platform.select({
      ios: "https://apps.apple.com/vn/app/maphome", // Example iOS App Store link
      android: "market://details?id=com.maphome.app", // Example Android Play Store market scheme
      default: "https://play.google.com/store/apps/details?id=com.maphome.app"
    });

    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        // Fallback for android if play store app is not installed
        if (Platform.OS === "android") {
          await Linking.openURL("https://play.google.com/store/apps/details?id=com.maphome.app");
        }
      }
    } catch (error) {
      console.log("Error opening store link:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between px-6 py-8">
      <View className="flex-1 justify-center items-center">
        {/* Animated-like Glowing Icon Container */}
        <View className="w-28 h-28 bg-indigo-50 rounded-full items-center justify-center mb-8 relative">
          <View className="absolute inset-0 bg-indigo-100 rounded-full scale-110 opacity-50 animate-ping" />
          <ArrowUpCircle size={56} color="#4f46e5" />
        </View>

        <Text className="text-3xl font-black text-slate-800 text-center mb-4">
          Cập nhật phiên bản mới
        </Text>
        
        <Text className="text-base text-slate-500 text-center mb-8 leading-relaxed px-4">
          Ứng dụng của bạn đã quá cũ. Vui lòng cập nhật lên phiên bản mới nhất để tiếp tục sử dụng các dịch vụ và tính năng hấp dẫn của MapHome.
        </Text>
      </View>

      <View className="w-full">
        <TouchableOpacity
          onPress={handleUpdate}
          className="bg-indigo-600 w-full h-14 rounded-2xl items-center justify-center shadow-lg shadow-indigo-200 active:opacity-90"
        >
          <Text className="text-white font-bold text-lg">Cập nhật ngay</Text>
        </TouchableOpacity>

        <Text className="text-xs text-slate-400 text-center mt-6">
          Phiên bản hiện tại: v{currentVersion}
        </Text>
      </View>
    </SafeAreaView>
  );
}
