import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import {
  MapPin,
  Heart,
  Phone,
  Calendar,
  Wifi,
  Wind,
  Car,
  Refrigerator,
  WashingMachine,
  Utensils,
  Tv,
  Sofa,
  Droplets,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import Animated, { FadeInUp } from "react-native-reanimated";

const amenityMeta: Record<string, { label: string; icon: React.ElementType }> =
  {
    wifi: { label: "Wifi", icon: Wifi },
    furniture: { label: "Đầy đủ nội thất", icon: Sofa },
    tv: { label: "Tivi", icon: Tv },
    washingMachine: { label: "Máy giặt", icon: WashingMachine },
    kitchen: { label: "Bếp", icon: Utensils },
    refrigerator: { label: "Tủ lạnh", icon: Refrigerator },
    airConditioner: { label: "Máy lạnh", icon: Wind },
    ac: { label: "Máy lạnh", icon: Wind },
    parking: { label: "Chỗ để xe", icon: Car },
    water: { label: "Nước nóng", icon: Droplets },
  };

const isAmenityEnabled = (value: unknown) =>
  value === true || value === "true" || value === 1;

const formatAmenityLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (char) => char.toUpperCase());

export function PropertyCard({
  property,
  onPress,
  isFavorite = false,
  onFavoritePress,
}: {
  property: any;
  onPress?: () => void;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}) {
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");
  const danger = useThemeColor({}, "danger");

  const activeAmenities = Object.entries(property?.amenities || {})
    .filter(([, value]) => isAmenityEnabled(value))
    .map(([key]) => key);

  return (
    <Animated.View entering={FadeInUp.springify()} className="mb-6">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100"
      >
        <View className="relative h-48 w-full">
          <Image
            source={{
              uri:
                property.image ||
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            }}
            className="w-full h-full"
          />
          <View className="absolute top-2 left-2 bg-maphome-500 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">
              {property.available ? "Còn phòng" : "Hết phòng"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onFavoritePress}
            className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm"
          >
            <Heart
              size={20}
              color={isFavorite ? danger : icon}
              fill={isFavorite ? danger : "transparent"}
            />
          </TouchableOpacity>
        </View>

        <View className="p-4">
          <Text
            className="text-lg font-black text-emerald-700 mb-1"
            numberOfLines={1}
          >
            {property.name || "Phòng trọ cao cấp"}
          </Text>

          <View className="flex-row items-center mb-3">
            <MapPin size={14} color={icon} opacity={0.6} />
            <Text
              className="text-xs text-slate-500 ml-1 flex-1"
              numberOfLines={1}
            >
              {property.address || "Quận 1, TP.HCM"}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-3 border-y border-emerald-50 mb-3">
            <View>
              <Text className="text-xl font-black text-maphome-500">
                {(property.price || 3000000).toLocaleString("vi-VN")}đ
              </Text>
              <Text className="text-[10px] font-bold text-maphome-900/40 uppercase">
                / tháng
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-lg font-black text-maphome-900">
                {property.area || 25}m²
              </Text>
              <Text className="text-[10px] font-bold text-maphome-900/40 uppercase">
                Diện tích
              </Text>
            </View>
          </View>

          {/* Tiện ích (Amenities) */}
          {activeAmenities.length > 0 && (
            <View className="mb-3">
              <Text className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tiện nghi:
              </Text>
              <View className="flex-row flex-wrap">
                {activeAmenities.slice(0, 4).map((key) => {
                  const meta = amenityMeta[key];
                  const Icon = meta?.icon;
                  const label = meta?.label || formatAmenityLabel(key);

                  return (
                    <View
                      key={key}
                      className="mr-2 mb-2 flex-row items-center rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 shadow-sm"
                    >
                      {Icon ? <Icon size={12} color={tint} /> : null}
                      <Text className="ml-1.5 text-[10px] font-bold text-slate-700">
                        {label}
                      </Text>
                    </View>
                  );
                })}
                {activeAmenities.length > 4 && (
                  <View className="mb-2 ml-1 justify-center">
                    <Text className="text-[10px] text-slate-400 font-bold">
                      +{activeAmenities.length - 4} khác
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View className="flex-row justify-between mt-2">
            <TouchableOpacity className="flex-1 flex-row items-center justify-center py-2 px-3 border border-slate-200 rounded-xl mr-2">
              <Phone size={14} color={icon} />
              <Text className="text-slate-700 text-xs ml-1 font-bold">
                Gọi điện
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 flex-row items-center justify-center py-2 px-3 bg-emerald-600 rounded-xl">
              <Calendar size={14} color="white" />
              <Text className="text-white text-xs ml-1 font-bold">
                Đặt lịch
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
