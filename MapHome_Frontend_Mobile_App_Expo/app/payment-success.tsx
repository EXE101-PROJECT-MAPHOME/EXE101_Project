import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, "tint");

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 items-center justify-center"
      edges={["top"]}
    >
      <View className="p-6 bg-white rounded-3xl shadow-sm items-center">
        <Text className="text-3xl font-black text-emerald-600 mb-2">
          Thanh toán thành công
        </Text>
        <Text className="text-slate-600 mb-4">
          Cảm ơn bạn đã sử dụng MapHome.
        </Text>
        <TouchableOpacity
          onPress={() => navigateTo(router, ROUTES.HOME)}
          className="bg-emerald-600 py-2 px-6 rounded-2xl"
        >
          <Text className="text-white font-bold">Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
