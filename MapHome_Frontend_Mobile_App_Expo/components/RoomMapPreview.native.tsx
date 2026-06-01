import React from "react";
import MapView, { Marker } from "react-native-maps";

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
  return (
    <MapView
      className="w-full h-full"
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        title={name}
        description={address}
      />
    </MapView>
  );
}
