import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import { PropertyCard } from "@/components/PropertyCard";
import { Heart, Search, User, ArrowLeft } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { mapBackendProperty } from "../../contexts/PropertiesContext";

export default function SavedScreen() {
  const router = useRouter();
  const { user, loading, toggleFavorite, isAuthenticated } = useAuth();

  // If auth is loading, show spinner
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  // If guest (not authenticated), show login prompt screen with premium styling
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
        <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.USER_DASHBOARD)}
            className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color="#16a34a" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-emerald-700">
            Phòng đã lưu
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-6 py-12">
          <View className="w-24 h-24 bg-emerald-50 rounded-full mb-6 items-center justify-center border border-emerald-100 shadow-sm">
            <User size={40} color="#16a34a" />
          </View>
          <Text className="text-2xl font-black text-emerald-700 text-center mb-2">
            Đăng nhập để xem
          </Text>
          <Text className="text-slate-500 text-center text-sm font-semibold max-w-xs mb-8">
            Hãy đăng nhập tài khoản của bạn để lưu và quản lý danh sách phòng
            trọ yêu thích của bạn.
          </Text>

          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.LOGIN)}
            className="w-full bg-emerald-600 h-14 rounded-2xl items-center justify-center shadow-md mb-4"
          >
            <Text className="text-white font-black text-base">
              Đăng nhập ngay
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.REGISTER)}
            className="w-full bg-white border border-emerald-600 h-14 rounded-2xl items-center justify-center"
          >
            <Text className="text-emerald-700 font-black text-base">
              Tạo tài khoản mới
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Map backend favorites array (using mapBackendProperty)
  const savedProperties = (user.favorites || []).map(mapBackendProperty);

  const handleToggleFavorite = async (propertyId: string) => {
    await toggleFavorite(propertyId);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.USER_DASHBOARD)}
            className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color="#16a34a" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-emerald-700">
            Phòng đã lưu
          </Text>
        </View>
        <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          <Text className="text-emerald-700 font-bold text-xs">
            {savedProperties.length} phòng
          </Text>
        </View>
      </View>

      {savedProperties.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-emerald-50 rounded-full items-center justify-center mb-4 border border-emerald-100">
            <Heart size={36} color="#16a34a" opacity={0.6} />
          </View>
          <Text className="text-xl font-bold text-emerald-700 mb-2">
            Chưa lưu phòng nào
          </Text>
          <Text className="text-slate-500 text-center mb-8 max-w-xs font-medium">
            Hãy khám phá các tin đăng và lưu lại những căn phòng bạn ưng ý nhất.
          </Text>
          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.MAP)}
            className="bg-emerald-600 px-8 py-4 rounded-2xl flex-row items-center shadow-md"
          >
            <Search size={18} color="white" />
            <Text className="text-white font-bold text-base ml-2">
              Tìm trọ trên Bản đồ
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {savedProperties.map((property) => (
            <View key={property.id} className="relative">
              <PropertyCard
                property={property}
                isFavorite={true}
                onFavoritePress={() => handleToggleFavorite(property.id)}
                onPress={() => navigateTo(router, ROUTES.ROOM(property.id))}
              />
            </View>
          ))}
          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
