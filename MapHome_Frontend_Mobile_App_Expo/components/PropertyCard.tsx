import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MapPin, Heart, Phone, Calendar } from 'lucide-react-native';

export function PropertyCard({ 
  property, 
  onPress,
  isFavorite = false,
  onFavoritePress
}: { 
  property: any; 
  onPress?: () => void;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}) {
  
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 mb-6"
    >
      <View className="relative h-48 w-full">
        <Image 
          source={{ uri: property.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267" }} 
          className="w-full h-full"
        />
        <View className="absolute top-2 left-2 bg-emerald-600 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">{property.available ? "Còn phòng" : "Hết phòng"}</Text>
        </View>
        <TouchableOpacity 
          onPress={onFavoritePress}
          className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm"
        >
          <Heart 
            size={20} 
            color={isFavorite ? "#ef4444" : "#064e3b"} 
            fill={isFavorite ? "#ef4444" : "transparent"} 
          />
        </TouchableOpacity>
      </View>

      <View className="p-4">
        <Text className="text-lg font-black text-emerald-950 mb-1" numberOfLines={1}>
          {property.name || "Phòng trọ cao cấp"}
        </Text>
        
        <View className="flex-row items-center mb-3">
          <MapPin size={14} color="#064e3b" opacity={0.6} />
          <Text className="text-xs text-slate-500 ml-1 flex-1" numberOfLines={1}>
            {property.address || "Quận 1, TP.HCM"}
          </Text>
        </View>

        <View className="flex-row justify-between items-center py-3 border-y border-emerald-50 mb-3">
          <View>
            <Text className="text-xl font-black text-emerald-600">
              {(property.price || 3000000).toLocaleString("vi-VN")}đ
            </Text>
            <Text className="text-[10px] font-bold text-emerald-950/40 uppercase">/ tháng</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-black text-emerald-950">{property.area || 25}m²</Text>
            <Text className="text-[10px] font-bold text-emerald-950/40 uppercase">Diện tích</Text>
          </View>
        </View>

        <View className="flex-row justify-between mt-2">
          <TouchableOpacity className="flex-1 flex-row items-center justify-center py-2 px-3 border border-slate-200 rounded-xl mr-2">
            <Phone size={14} color="#334155" />
            <Text className="text-slate-700 text-xs ml-1 font-bold">Gọi điện</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 flex-row items-center justify-center py-2 px-3 bg-emerald-600 rounded-xl">
            <Calendar size={14} color="white" />
            <Text className="text-white text-xs ml-1 font-bold">Đặt lịch</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
