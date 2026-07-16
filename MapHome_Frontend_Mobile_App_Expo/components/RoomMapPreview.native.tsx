import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

type RoomMapPreviewProps = {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
};

const GOONG_MAPTILES_KEY =
  process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY ??
  "zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF";

export function RoomMapPreview({
  latitude,
  longitude,
  name,
  address,
}: RoomMapPreviewProps) {
  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css" rel="stylesheet" />
      <style>
          body { margin: 0; padding: 0; overflow: hidden; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; }
          .custom-marker {
            width: 30px;
            height: 30px;
            background-color: #16a34a;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
      </style>
  </head>
  <body>
      <div id="map"></div>
      <script>
          goongjs.accessToken = '${GOONG_MAPTILES_KEY}';
          var map = new goongjs.Map({
              container: 'map',
              style: 'https://tiles.goong.io/assets/goong_map_web.json',
              center: [${longitude}, ${latitude}],
              zoom: 15,
              interactive: false,
              attributionControl: false
          });

          var el = document.createElement("div");
          el.className = "custom-marker";

          new goongjs.Marker(el)
              .setLngLat([${longitude}, ${latitude}])
              .addTo(map);
      </script>
  </body>
  </html>
  `;

  return (
    <View style={{ width: "100%", height: "100%", backgroundColor: "#e2e8f0" }}>
      <WebView
        source={{ html: mapHtml }}
        style={{ flex: 1 }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
