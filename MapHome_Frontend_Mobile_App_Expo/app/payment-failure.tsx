import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function PaymentFailureScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, "tint");

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 items-center justify-center"
      edges={["top"]}
    >
      <View className="p-6 bg-white rounded-3xl shadow-sm items-center">
        <Text className="text-3xl font-black text-rose-600 mb-2">
          Thanh toán thất bại
        </Text>
        <Text className="text-slate-600 mb-4">
          Vui lòng thử lại hoặc liên hệ hỗ trợ.
        </Text>
        <TouchableOpacity
          onPress={() => navigateTo(router, ROUTES.CHECKOUT)}
          className="bg-emerald-600 py-2 px-6 rounded-2xl"
        >
          <Text className="text-white font-bold">Thử lại thanh toán</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
