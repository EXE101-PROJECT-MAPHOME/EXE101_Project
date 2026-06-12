import React from "react";
import { View, Text, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wrench } from "lucide-react-native";
import { router } from "expo-router";
import api from "../utils/api";

export default function MaintenanceScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const checkStatus = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/api/settings/public");
      if (res.data && res.data.maintenanceMode === false) {
        // Maintenance is over, go back to splash screen to route normally
        router.replace("/");
      }
    } catch (e) {
      console.log("Error checking maintenance status", e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={checkStatus} />
        }
      >
        <View className="w-24 h-24 bg-rose-100 rounded-full items-center justify-center mb-8">
          <Wrench size={48} color="#e11d48" />
        </View>
        <Text className="text-3xl font-black text-rose-600 text-center mb-4">
          Hệ thống bảo trì
        </Text>
        <Text className="text-base text-slate-500 text-center mb-8 leading-relaxed">
          MapHome đang được nâng cấp để mang lại trải nghiệm tốt hơn cho bạn. Vui lòng quay lại sau ít phút!
        </Text>
        <TouchableOpacity
          onPress={checkStatus}
          disabled={refreshing}
          className="bg-rose-500 w-full h-14 rounded-2xl items-center justify-center shadow-lg shadow-rose-200"
        >
          <Text className="text-white font-bold text-lg">Thử lại</Text>
        </TouchableOpacity>
        
        <Text className="text-xs text-slate-400 text-center mt-6">
          Kéo xuống để tải lại trang
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
