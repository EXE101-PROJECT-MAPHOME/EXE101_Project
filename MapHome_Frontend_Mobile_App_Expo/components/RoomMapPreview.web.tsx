import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";

type RoomMapPreviewProps = {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
};

export function RoomMapPreview({
  latitude,
  longitude,
  name,
  address,
}: RoomMapPreviewProps) {
  const handleOpenMaps = async () => {
    const query = encodeURIComponent(address || `${latitude},${longitude}`);
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
    );
  };

  return (
    <View className="w-full h-full items-center justify-center bg-emerald-50 px-4 py-6">
      <Text className="text-center text-emerald-700 font-black text-base mb-2">
        {name}
      </Text>
      <Text className="text-center text-slate-600 text-sm font-medium mb-4">
        {address}
      </Text>
      <TouchableOpacity
        onPress={handleOpenMaps}
        className="px-4 py-3 rounded-2xl bg-emerald-600"
      >
        <Text className="text-white font-bold">Mở trên Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}
