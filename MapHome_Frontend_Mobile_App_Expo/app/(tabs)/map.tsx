import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  ShieldCheck,
  Map as MapIcon,
  List,
  Check,
  Navigation as NavIcon,
  Loader2,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  useProperties,
  type RentalProperty,
} from "../../contexts/PropertiesContext";

// Ho Chi Minh City Opera House area as central coordinate
const HCM_REGION = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const GOONG_MAPTILES_KEY =
  process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY ??
  "zkJufOSOzrjhp0HuujejyHhJ2S3G2O6SkK56wiSF";

const buildMapHtml = (tint: string, text: string, key: string) => `
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
        @keyframes pin-glow {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
            50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        @keyframes pulse-aura {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        @keyframes ripple-aura {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        goongjs.accessToken = '${key}';
        var map = new goongjs.Map({
            container: 'map',
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: [106.7009, 10.7769],
            zoom: 13,
            attributionControl: false
        });
        
        var currentMarkers = [];
        var userMarker = null;

        function createPropertyIcon(available, isVerified, isSelected) {
            var color = available ? "#16a34a" : "#9ca3af";
            var el = document.createElement("div");
            el.className = "custom-marker";
            el.style.width = "32px";
            el.style.height = "32px";
            el.style.transition = "transform 0.2s ease, z-index 0.2s ease";
            if (isSelected) {
                el.style.transform = "scale(1.2)";
                el.style.zIndex = "100";
            }

            var verifiedBadge = isVerified
                ? '<div style="position: absolute; top: -4px; right: -4px; background: linear-gradient(135deg, #22c55e, #16a34a); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 8px rgba(20,82,49,0.3); display: flex; align-items: center; justify-content: center; z-index: 10;">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>' +
                  '</div>'
                : "";

            el.innerHTML = 
                '<div style="position: relative;">' +
                verifiedBadge +
                '<div style="background-color: ' + color + '; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 6px 12px rgba(20,82,49,0.2); display: flex; align-items: center; justify-content: center; opacity: 0.95;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' +
                '</div>' +
                '</div>';
            return el;
        }

        function createPinnedPropertyIcon(available, isSelected) {
            var gradient = available
                ? "linear-gradient(135deg, #16a34a, #145231)"
                : "linear-gradient(135deg, #f97316, #ea580c)";
            var glowColor = available ? "rgba(22,163,74,0.4)" : "rgba(249,115,22,0.4)";

            var el = document.createElement("div");
            el.className = "pinned-marker";
            el.style.width = "42px";
            el.style.height = "42px";
            el.style.transition = "transform 0.2s ease, z-index 0.2s ease";
            if (isSelected) {
                el.style.transform = "scale(1.2)";
                el.style.zIndex = "100";
            }

            el.innerHTML = 
                '<div style="position: relative;">' +
                '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 64px; height: 64px; border-radius: 50%; background: ' + glowColor + '; animation: pin-glow 2s infinite;"></div>' +
                '<div style="background: ' + gradient + '; width: 42px; height: 42px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 8px 16px rgba(20,82,49,0.3); display: flex; align-items: center; justify-content: center; position: relative; z-index: 2;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">' +
                    '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>' +
                    '<polyline points="9 22 9 12 15 12 15 22"></polyline>' +
                    '</svg>' +
                '</div>' +
                '</div>';
            return el;
        }

        function createUserLocationIcon() {
            var el = document.createElement("div");
            el.className = "user-location-marker";
            el.innerHTML = 
                '<div style="position: relative;">' +
                '<div style="background-color: #22c55e; width: 44px; height: 44px; border-radius: 50%; border: 4px solid white; box-shadow: 0 8px 16px rgba(20,82,49,0.4); display: flex; align-items: center; justify-content: center; animation: pulse-aura 2.5s infinite ease-out; z-index: 10; position: relative;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>' +
                    '<circle cx="12" cy="10" r="3"></circle>' +
                    '</svg>' +
                '</div>' +
                '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90px; height: 90px; border-radius: 50%; background-color: rgba(34, 197, 94, 0.15); border: 2px solid rgba(34, 197, 94, 0.3); animation: ripple-aura 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1);"></div>' +
                '</div>';
            return el;
        }
        
        window.updateMarkers = function(properties, selectedId) {
            currentMarkers.forEach(function(m) { m.remove(); });
            currentMarkers = [];
            
            properties.forEach(function(prop) {
                var isSelected = prop.id === selectedId;
                var isPinned = !!prop.pinInfo;
                var isVerified = prop.verificationLevel === "verified" || prop.greenBadge?.level === "verified";
                var available = prop.available;
                
                var el = isPinned 
                    ? createPinnedPropertyIcon(available, isSelected)
                    : createPropertyIcon(available, isVerified, isSelected);
                
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PROPERTY_CLICK', id: prop.id }));
                });
                
                var marker = new goongjs.Marker(el)
                    .setLngLat([prop.location[0], prop.location[1]])
                    .addTo(map);
                    
                currentMarkers.push(marker);
            });
        };
        
        map.on('click', function() {
             window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
        });
        
        window.zoomToLocation = function(lng, lat, zoom) {
            var z = zoom || 15;
            map.easeTo({ center: [lng, lat], zoom: z });
            if (!userMarker) {
                userMarker = new goongjs.Marker(createUserLocationIcon())
                    .setLngLat([lng, lat])
                    .addTo(map);
            } else {
                userMarker.setLngLat([lng, lat]);
            }
        };
    </script>
</body>
</html>
`;

export default function MapScreen() {
  const router = useRouter();
  const { properties, searchProperties } = useProperties();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] =
    useState<RentalProperty | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const webViewRef = React.useRef<WebView>(null);
  const tint = useThemeColor({}, "tint");
  const text = useThemeColor({}, "text");
  const icon = useThemeColor({}, "icon");

  const handleUseMyLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // Inject JavaScript to zoom map to current location
      if (webViewRef.current) {
        const script = `window.zoomToLocation(${longitude}, ${latitude}, 16); true;`;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (error) {
      // Avoid console.error to prevent red screen in Expo Dev Client
      console.log("Error getting location:", error);
      Alert.alert("Lỗi GPS", "Không thể lấy vị trí hiện tại. Nếu bạn đang dùng Simulator, hãy bật giả lập vị trí (Features > Location).");
    } finally {
      setIsLocating(false);
    }
  };

  const performSearch = (
    term: string,
    prFilter: string,
    arFilter: string,
    vrFilter: boolean,
    amFilter: Record<string, boolean>,
  ) => {
    const activeAmenities = Object.entries(amFilter)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(",");

    const queryParams: any = {
      q: term.trim() || undefined,
      verified: vrFilter ? "true" : undefined,
      amenities: activeAmenities || undefined,
    };

    if (prFilter === "under3") queryParams.maxPrice = 3000000;
    else if (prFilter === "3to5") {
      queryParams.minPrice = 3000000;
      queryParams.maxPrice = 5000000;
    } else if (prFilter === "over5") queryParams.minPrice = 5000000;

    if (arFilter === "under20") queryParams.maxArea = 20;
    else if (arFilter === "20to30") {
      queryParams.minArea = 20;
      queryParams.maxArea = 30;
    } else if (arFilter === "over30") queryParams.minArea = 30;

    searchProperties(queryParams);
  };

  // Filters State
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [tempPriceFilter, setTempPriceFilter] = useState<string>("all"); // 'all', 'under3', '3to5', 'over5'
  const [tempAreaFilter, setTempAreaFilter] = useState<string>("all"); // 'all', 'under20', '20to30', 'over30'
  const [tempVerifyFilter, setTempVerifyFilter] = useState<boolean>(false);
  const [tempAmenities, setTempAmenities] = useState<Record<string, boolean>>({
    wifi: false,
    parking: false,
    ac: false,
    kitchen: false,
    refrigerator: false,
  });

  // Applied Filters State
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [verifyFilter, setVerifyFilter] = useState<boolean>(false);
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
    wifi: false,
    parking: false,
    ac: false,
    kitchen: false,
    refrigerator: false,
  });

  // Apply filters logic
  const handleApplyFilters = () => {
    setPriceFilter(tempPriceFilter);
    setAreaFilter(tempAreaFilter);
    setVerifyFilter(tempVerifyFilter);
    setAmenities({ ...tempAmenities });
    setIsFilterVisible(false);
    setSelectedProperty(null); // Reset selection

    performSearch(
      searchTerm,
      tempPriceFilter,
      tempAreaFilter,
      tempVerifyFilter,
      tempAmenities,
    );
  };

  const handleResetFilters = () => {
    setTempPriceFilter("all");
    setTempAreaFilter("all");
    setTempVerifyFilter(false);
    setTempAmenities({
      wifi: false,
      parking: false,
      ac: false,
      kitchen: false,
      refrigerator: false,
    });
  };

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      // Text Search Filter
      const matchesSearch =
        searchTerm.trim() === "" ||
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Price Filter
      if (priceFilter === "under3" && property.price >= 3000000) return false;
      if (
        priceFilter === "3to5" &&
        (property.price < 3000000 || property.price > 5000000)
      )
        return false;
      if (priceFilter === "over5" && property.price <= 5000000) return false;

      // Area Filter
      if (areaFilter === "under20" && property.area >= 20) return false;
      if (areaFilter === "20to30" && (property.area < 20 || property.area > 30))
        return false;
      if (areaFilter === "over30" && property.area <= 30) return false;

      // Verification Filter
      if (verifyFilter && property.verificationLevel !== "verified")
        return false;

      // Amenities Filter
      const matchesAmenities = Object.entries(amenities).every(
        ([key, value]) => {
          if (!value) return true; // Filter is not active
          return (
            property.amenities[key as keyof typeof property.amenities] === true
          );
        },
      );

      return matchesAmenities;
    });
  }, [
    properties,
    searchTerm,
    priceFilter,
    areaFilter,
    verifyFilter,
    amenities,
  ]);

  // Sync markers to WebView
  React.useEffect(() => {
    if (webViewRef.current && viewMode === "map") {
      const script = `if (window.updateMarkers) { window.updateMarkers(${JSON.stringify(filteredProperties)}, ${selectedProperty ? JSON.stringify(selectedProperty.id) : "null"}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [filteredProperties, selectedProperty, viewMode]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priceFilter !== "all") count++;
    if (areaFilter !== "all") count++;
    if (verifyFilter) count++;
    count += Object.values(amenities).filter(Boolean).length;
    return count;
  }, [priceFilter, areaFilter, verifyFilter, amenities]);

  return (
    <View className="flex-1 bg-white">
      {/* Search and Header Section */}
      <SafeAreaView
        className="bg-white border-b border-slate-100 z-10 px-4 pb-3"
        edges={["top"]}
      >
        <View className="flex-row items-center space-x-2 mt-2">
          {/* Search Box */}
          <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-200 h-12 rounded-2xl px-3 mr-2">
            <Search size={18} color={icon} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={() =>
                performSearch(
                  searchTerm,
                  priceFilter,
                  areaFilter,
                  verifyFilter,
                  amenities,
                )
              }
              returnKeyType="search"
              placeholder="Nhập tên đường, quận..."
              className="flex-1 ml-2 text-sm font-semibold text-slate-700 h-full"
            />
            {searchTerm !== "" && (
              <TouchableOpacity
                onPress={() => {
                  setSearchTerm("");
                  performSearch(
                    "",
                    priceFilter,
                    areaFilter,
                    verifyFilter,
                    amenities,
                  );
                }}
              >
                <X size={16} color={icon} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Trigger */}
          <TouchableOpacity
            onPress={() => {
              setTempPriceFilter(priceFilter);
              setTempAreaFilter(areaFilter);
              setTempVerifyFilter(verifyFilter);
              setTempAmenities({ ...amenities });
              setIsFilterVisible(true);
            }}
            className={`w-12 h-12 rounded-2xl items-center justify-center border relative ${activeFiltersCount > 0 ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}
          >
            <SlidersHorizontal
              size={18}
              color={activeFiltersCount > 0 ? tint : icon}
            />
            {activeFiltersCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-[10px] text-white font-bold">
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main View Area */}
      {viewMode === "map" ? (
        <View className="flex-1 relative">
          <WebView
            ref={webViewRef}
            className="w-full h-full"
            source={{ html: buildMapHtml(tint, text, GOONG_MAPTILES_KEY) }}
            originWhitelist={["*"]}
            javaScriptEnabled={true}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === "PROPERTY_CLICK") {
                  const prop = filteredProperties.find((p) => p.id === data.id);
                  if (prop) setSelectedProperty(prop);
                } else if (data.type === "MAP_CLICK") {
                  setSelectedProperty(null);
                }
              } catch (e) {
                console.error("WebView message error", e);
              }
            }}
            onLoadEnd={() => {
              const script = `if (window.updateMarkers) { window.updateMarkers(${JSON.stringify(filteredProperties)}, ${selectedProperty ? JSON.stringify(selectedProperty.id) : "null"}); } true;`;
              webViewRef.current?.injectJavaScript(script);
            }}
          />

          {/* GPS Location Button */}
          <View className="absolute top-4 right-4 z-20 gap-2">
            <TouchableOpacity
              onPress={handleUseMyLocation}
              disabled={isLocating}
              className={`w-12 h-12 rounded-2xl items-center justify-center shadow-xl border ${isLocating ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-white'}`}
            >
              {isLocating ? (
                <Loader2 size={22} color="#4f46e5" />
              ) : (
                <NavIcon size={22} color="#4f46e5" />
              )}
            </TouchableOpacity>
          </View>

          {/* Selected Property Preview Sliding Panel */}
          {selectedProperty && (
            <View className="absolute bottom-6 left-4 right-4 z-20">
              <View className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex-row p-3">
                <Image
                  source={{ uri: selectedProperty.image }}
                  className="w-28 h-28 rounded-2xl"
                />

                <View className="flex-1 ml-3 justify-between">
                  <View>
                    <View className="flex-row justify-between items-start">
                      <Text
                        className="text-sm font-black text-emerald-700 flex-1 mr-2"
                        numberOfLines={1}
                      >
                        {selectedProperty.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedProperty(null)}
                        className="p-1"
                      >
                        <X size={16} color={icon} />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center mt-1">
                      <MapPin size={12} color={tint} />
                      <Text
                        className="text-[10px] text-slate-500 ml-0.5 flex-1"
                        numberOfLines={1}
                      >
                        {selectedProperty.address}
                      </Text>
                    </View>

                    {selectedProperty.verificationLevel === "verified" && (
                      <View className="flex-row items-center mt-1 bg-emerald-50 self-start px-2 py-0.5 rounded-lg">
                        <ShieldCheck size={10} color={tint} />
                        <Text className="text-[9px] text-emerald-700 font-bold ml-0.5">
                          Xác thực GPS
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row justify-between items-end">
                    <View>
                      <Text className="text-emerald-600 font-black text-base">
                        {selectedProperty.price.toLocaleString("vi-VN")}đ
                      </Text>
                      <Text className="text-[8px] text-slate-400 font-bold uppercase">
                        / tháng
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        navigateTo(router, ROUTES.ROOM(selectedProperty.id))
                      }
                      className="bg-emerald-600 px-3 py-1.5 rounded-xl"
                    >
                      <Text className="text-white text-xs font-bold">
                        Chi tiết
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Quick Info Stats */}
          <View className="absolute top-4 left-4 bg-emerald-950/90 px-3 py-1.5 rounded-xl border border-white/10 shadow-lg pointer-events-none">
            <Text className="text-white text-[10px] font-black uppercase tracking-wider">
              Tìm thấy {filteredProperties.length} kết quả
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {filteredProperties.length === 0 ? (
            <View className="flex-1 py-20 items-center justify-center">
              <Text className="text-slate-500 font-bold text-base text-center">
                Không tìm thấy phòng trọ phù hợp
              </Text>
              <Text className="text-slate-400 text-xs mt-2 text-center">
                Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.
              </Text>
            </View>
          ) : (
            filteredProperties.map((property) => (
              <TouchableOpacity
                key={property.id}
                activeOpacity={0.9}
                onPress={() => navigateTo(router, ROUTES.ROOM(property.id))}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 mb-6 flex-row p-3"
              >
                <Image
                  source={{ uri: property.image }}
                  className="w-24 h-24 rounded-2xl"
                />
                <View className="flex-1 ml-3 justify-between py-1">
                  <View>
                    <Text
                      className="text-base font-black text-emerald-700"
                      numberOfLines={1}
                    >
                      {property.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <MapPin size={12} color={tint} />
                      <Text
                        className="text-xs text-slate-500 ml-0.5 flex-1"
                        numberOfLines={1}
                      >
                        {property.address}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-end">
                    <View>
                      <Text className="text-base font-black text-emerald-600">
                        {property.price.toLocaleString("vi-VN")}đ
                      </Text>
                      <Text className="text-[8px] text-slate-400 font-bold">
                        / tháng • {property.area}m²
                      </Text>
                    </View>
                    {property.verificationLevel === "verified" && (
                      <View className="bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        <Text className="text-[10px] text-emerald-700 font-bold">
                          ✓ Verified
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View className="h-10" />
        </ScrollView>
      )}

      {/* Floating Toggle View Button (Map/List) */}
      <TouchableOpacity
        onPress={() => setViewMode(viewMode === "map" ? "list" : "map")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-600 rounded-full items-center justify-center shadow-xl border border-white/20 z-30"
      >
        {viewMode === "map" ? (
          <List size={22} color="white" />
        ) : (
          <MapIcon size={22} color="white" />
        )}
      </TouchableOpacity>

      {/* Filter Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterVisible}
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setIsFilterVisible(false)}
          />
          <View className="bg-white rounded-t-[40px] px-6 py-6 max-h-[85%]">
            {/* Filter Header */}
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <Text className="text-xl font-black text-emerald-700">
                Bộ lọc tìm kiếm
              </Text>
              <TouchableOpacity
                onPress={() => setIsFilterVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={16} color={icon} />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              {/* Price Filter Section */}
              <View className="mb-6">
                <Text className="text-sm font-black text-emerald-700 mb-3">
                  Khoảng giá thuê
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "under3", label: "Dưới 3 triệu" },
                    { id: "3to5", label: "3 - 5 triệu" },
                    { id: "over5", label: "Trên 5 triệu" },
                  ].map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setTempPriceFilter(p.id)}
                      className={`px-4 py-2.5 rounded-xl border ${tempPriceFilter === p.id ? "bg-emerald-600 border-emerald-600" : "bg-slate-50 border-slate-200"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${tempPriceFilter === p.id ? "text-white" : "text-slate-600"}`}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Area Filter Section */}
              <View className="mb-6">
                <Text className="text-sm font-black text-emerald-700 mb-3">
                  Diện tích phòng
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "under20", label: "Dưới 20m²" },
                    { id: "20to30", label: "20m² - 30m²" },
                    { id: "over30", label: "Trên 30m²" },
                  ].map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => setTempAreaFilter(a.id)}
                      className={`px-4 py-2.5 rounded-xl border ${tempAreaFilter === a.id ? "bg-emerald-600 border-emerald-600" : "bg-slate-50 border-slate-200"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${tempAreaFilter === a.id ? "text-white" : "text-slate-600"}`}
                      >
                        {a.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Verification Toggle */}
              <View className="mb-6 flex-row justify-between items-center bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <View className="flex-1 mr-4">
                  <Text className="text-sm font-black text-emerald-700">
                    Chỉ hiển thị tin đã xác thực
                  </Text>
                  <Text className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    Xác thực GPS trực tiếp tại chỗ (Trust is King)
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setTempVerifyFilter(!tempVerifyFilter)}
                  className={`w-6 h-6 rounded-lg items-center justify-center border ${tempVerifyFilter ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-300"}`}
                >
                  {tempVerifyFilter && <Check size={14} color="white" />}
                </TouchableOpacity>
              </View>

              {/* Amenities checklist */}
              <View className="mb-6">
                <Text className="text-sm font-black text-emerald-700 mb-3">
                  Tiện nghi có sẵn
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { id: "wifi", label: "Wifi" },
                    { id: "parking", label: "Chỗ để xe" },
                    { id: "ac", label: "Điều hòa" },
                    { id: "kitchen", label: "Nhà bếp" },
                    { id: "refrigerator", label: "Tủ lạnh" },
                  ].map((am) => (
                    <TouchableOpacity
                      key={am.id}
                      onPress={() =>
                        setTempAmenities((prev) => ({
                          ...prev,
                          [am.id]: !prev[am.id],
                        }))
                      }
                      className={`px-4 py-2.5 rounded-xl border flex-row items-center ${tempAmenities[am.id] ? "bg-emerald-600 border-emerald-600" : "bg-slate-50 border-slate-200"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${tempAmenities[am.id] ? "text-white" : "text-slate-600"}`}
                      >
                        {am.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="flex-row mt-4 pt-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={handleResetFilters}
                className="flex-1 bg-slate-50 border border-slate-200 h-12 rounded-2xl items-center justify-center mr-3"
              >
                <Text className="text-slate-600 font-black text-sm">
                  Đặt lại
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyFilters}
                className="flex-[2] bg-emerald-600 h-12 rounded-2xl items-center justify-center shadow-lg"
              >
                <Text className="text-white font-black text-sm">
                  Áp dụng bộ lọc
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
