import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Trash2,
  MapPin,
  X,
  Check,
  DollarSign,
  Maximize2,
  ShieldCheck,
  User,
  Phone,
  Info,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import ROUTES, { navigateTo } from "@/constants/routes";
import { useCompare } from "../../contexts/CompareContext";

const { width } = Dimensions.get("window");

export default function CompareScreen() {
  const router = useRouter();
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const tint = useThemeColor({}, "tint");
  const info = useThemeColor({}, "info");
  const danger = useThemeColor({}, "danger");
  const icon = useThemeColor({}, "icon");

  if (compareList.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-slate-50 items-center justify-center p-6"
        edges={["top"]}
      >
        <View className="w-16 h-16 bg-slate-200 rounded-full items-center justify-center mb-4">
          <Info size={32} color={icon} />
        </View>
        <Text className="text-xl font-black text-slate-800 mb-2">
          Chưa có phòng so sánh
        </Text>
        <Text className="text-slate-500 text-center mb-6">
          Vui lòng chọn ít nhất 2 phòng trọ để bắt đầu so sánh
        </Text>
        <TouchableOpacity
          onPress={() => navigateTo(router, ROUTES.MAP)}
          className="bg-emerald-600 px-6 py-3 rounded-2xl flex-row items-center"
        >
          <MapPin size={18} color="white" />
          <Text className="text-white font-bold ml-2">Tìm phòng trọ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (compareList.length === 1) {
    return (
      <SafeAreaView
        className="flex-1 bg-slate-50 items-center justify-center p-6"
        edges={["top"]}
      >
        <View className="w-16 h-16 bg-amber-100 rounded-full items-center justify-center mb-4">
          <Info size={32} color={useThemeColor({}, "warning")} />
        </View>
        <Text className="text-xl font-black text-slate-800 mb-2 text-center">
          Cần thêm phòng để so sánh
        </Text>
        <Text className="text-slate-500 text-center mb-6">
          Bạn đã chọn 1 phòng. Hãy chọn thêm ít nhất 1 phòng nữa để bắt đầu so
          sánh chi tiết.
        </Text>

        <View className="flex-row space-x-3 w-full justify-center">
          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.MAP)}
            className="bg-emerald-600 px-4 py-3 rounded-2xl flex-row items-center mr-2"
          >
            <MapPin size={18} color="white" />
            <Text className="text-white font-bold ml-2">Tìm thêm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={clearCompare}
            className="bg-red-50 px-4 py-3 rounded-2xl flex-row items-center"
          >
            <Trash2 size={18} color={danger} />
            <Text className="text-red-500 font-bold ml-2">Xóa phòng</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between z-10 shadow-sm">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color={icon} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-black text-emerald-700">
              So sánh phòng trọ
            </Text>
            <Text className="text-xs text-slate-500 font-bold">
              {compareList.length} phòng đang so sánh
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={clearCompare}
          className="p-2 bg-red-50 rounded-lg"
        >
          <Trash2 size={18} color={danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {/* Attributes Column (Fixed Width) */}
          <View className="w-28 mr-2">
            <View className="h-44 justify-center items-start border-b border-slate-200">
              <Text className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                Tiêu chí
              </Text>
            </View>

            <View className="py-4 border-b border-slate-100 justify-center h-16">
              <Text className="font-bold text-slate-700 text-sm flex-row">
                <DollarSign size={14} color={tint} /> Giá thuê
              </Text>
            </View>
            <View className="py-4 border-b border-slate-100 justify-center h-16">
              <Text className="font-bold text-slate-700 text-sm flex-row">
                <Maximize2 size={14} color={info} /> Diện tích
              </Text>
            </View>
            <View className="py-4 border-b border-slate-100 justify-center h-16">
              <Text className="font-bold text-slate-700 text-sm flex-row">
                Trạng thái
              </Text>
            </View>
            <View className="py-4 border-b border-slate-100 justify-center h-16">
              <Text className="font-bold text-slate-700 text-sm flex-row">
                <ShieldCheck size={14} color={tint} /> Xác thực
              </Text>
            </View>
            <View className="py-4 border-b border-slate-200 justify-center h-16">
              <Text className="font-bold text-slate-700 text-sm flex-row">
                <User size={14} color={info} /> Chủ trọ
              </Text>
            </View>

            {/* Amenities Labels */}
            <View className="py-2 mt-2">
              <Text className="font-black text-emerald-800 text-xs uppercase">
                Tiện nghi
              </Text>
            </View>
            <View className="py-3 border-b border-slate-100 h-12 justify-center">
              <Text className="font-semibold text-slate-600 text-sm">WiFi</Text>
            </View>
            <View className="py-3 border-b border-slate-100 h-12 justify-center">
              <Text className="font-semibold text-slate-600 text-sm">
                Nội thất
              </Text>
            </View>
            <View className="py-3 border-b border-slate-100 h-12 justify-center">
              <Text className="font-semibold text-slate-600 text-sm">
                Điều hòa
              </Text>
            </View>
            <View className="py-3 border-b border-slate-100 h-12 justify-center">
              <Text className="font-semibold text-slate-600 text-sm">
                Máy giặt
              </Text>
            </View>
            <View className="py-3 border-b border-slate-100 h-12 justify-center">
              <Text className="font-semibold text-slate-600 text-sm">
                Tủ lạnh
              </Text>
            </View>
            <View className="py-3 border-b border-slate-100 h-12 justify-center">
              <Text className="font-semibold text-slate-600 text-sm">Bếp</Text>
            </View>
          </View>

          {/* Properties Columns */}
          {compareList.map((property) => (
            <View
              key={property._id || property.id}
              className="w-[180px] bg-white border border-slate-200 rounded-3xl overflow-hidden mr-3 shadow-sm pb-4"
            >
              {/* Header Image & Name */}
              <View className="h-44 p-2 border-b border-slate-200">
                <View className="relative h-24 w-full rounded-2xl overflow-hidden mb-2">
                  <Image
                    source={{ uri: property.image || property.images?.[0] }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() =>
                      removeFromCompare(property._id || property.id)
                    }
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                  >
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
                <Text
                  className="font-bold text-emerald-700 text-sm mb-1 leading-tight"
                  numberOfLines={2}
                >
                  {property.name}
                </Text>
              </View>

              {/* Data Rows */}
              <View className="px-3">
                <View className="py-4 border-b border-slate-100 justify-center items-center h-16">
                  <Text className="font-black text-red-500 text-base">
                    {(property.price || 0).toLocaleString("vi-VN")}đ
                  </Text>
                </View>
                <View className="py-4 border-b border-slate-100 justify-center items-center h-16">
                  <Text className="font-bold text-slate-800">
                    {property.area || 0} m²
                  </Text>
                </View>
                <View className="py-4 border-b border-slate-100 justify-center items-center h-16">
                  <View
                    className={`px-2 py-1 rounded ${property.available !== false ? "bg-emerald-100" : "bg-slate-100"}`}
                  >
                    <Text
                      className={`text-xs font-bold ${property.available !== false ? "text-emerald-700" : "text-slate-500"}`}
                    >
                      {property.available !== false ? "Còn trống" : "Đã thuê"}
                    </Text>
                  </View>
                </View>
                <View className="py-4 border-b border-slate-100 justify-center items-center h-16">
                  {property.verificationLevel === "verified" ? (
                    <View className="bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <Text className="text-[10px] font-bold text-emerald-600">
                        Đã xác thực
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-slate-400">Cơ bản</Text>
                  )}
                </View>
                <View className="py-4 border-b border-slate-200 justify-center items-center h-16">
                  <Text
                    className="font-bold text-slate-700 text-xs"
                    numberOfLines={1}
                  >
                    {property.landlordId?.fullName ||
                      property.ownerName ||
                      "Chủ trọ"}
                  </Text>
                  <Text className="text-[10px] text-slate-500">
                    {property.phone || property.landlordId?.phone}
                  </Text>
                </View>

                {/* Amenities Rows */}
                <View className="py-2 mt-2 h-6" />
                <View className="py-3 border-b border-slate-100 items-center justify-center h-12">
                  {property.amenities?.wifi ? (
                    <Check size={18} color={tint} />
                  ) : (
                    <X size={18} color={danger} />
                  )}
                </View>
                <View className="py-3 border-b border-slate-100 items-center justify-center h-12">
                  {property.amenities?.furniture ? (
                    <Check size={18} color={tint} />
                  ) : (
                    <X size={18} color={danger} />
                  )}
                </View>
                <View className="py-3 border-b border-slate-100 items-center justify-center h-12">
                  {property.amenities?.ac ||
                  property.amenities?.airConditioner ? (
                    <Check size={18} color={tint} />
                  ) : (
                    <X size={18} color={danger} />
                  )}
                </View>
                <View className="py-3 border-b border-slate-100 items-center justify-center h-12">
                  {property.amenities?.washingMachine ? (
                    <Check size={18} color={tint} />
                  ) : (
                    <X size={18} color={danger} />
                  )}
                </View>
                <View className="py-3 border-b border-slate-100 items-center justify-center h-12">
                  {property.amenities?.refrigerator ? (
                    <Check size={18} color={tint} />
                  ) : (
                    <X size={18} color={danger} />
                  )}
                </View>
                <View className="py-3 border-b border-slate-100 items-center justify-center h-12">
                  {property.amenities?.kitchen ? (
                    <Check size={18} color={tint} />
                  ) : (
                    <X size={18} color={danger} />
                  )}
                </View>

                <View className="mt-4">
                  <TouchableOpacity
                    onPress={() =>
                      navigateTo(
                        router,
                        ROUTES.ROOM(property._id || property.id),
                      )
                    }
                    className="bg-slate-100 py-2 rounded-xl items-center"
                  >
                    <Text className="text-emerald-700 font-bold text-xs">
                      Xem chi tiết
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}
