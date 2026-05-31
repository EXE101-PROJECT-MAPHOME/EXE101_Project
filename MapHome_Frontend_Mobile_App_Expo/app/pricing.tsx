import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function PricingScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, "tint");

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="p-4">
        <Text className="text-2xl font-black text-emerald-950 mb-4">
          Bảng giá
        </Text>
        <Text className="text-slate-600 mb-6">
          Các gói dịch vụ đang được cung cấp trên MapHome.
        </Text>

        <TouchableOpacity
          onPress={() => navigateTo(router, ROUTES.CHECKOUT)}
          className="bg-emerald-600 py-3 rounded-2xl items-center"
        >
          <Text className="text-white font-bold">Nâng cấp ngay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
