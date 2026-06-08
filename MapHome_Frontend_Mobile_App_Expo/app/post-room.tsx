import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker } from "react-native-maps";
import {
  Wifi,
  Car,
  Wind,
  Tv,
  Sofa,
  WashingMachine,
  Utensils,
  Refrigerator,
  Info,
  MapPin,
  FileText,
  DollarSign,
  Phone,
  Home,
  CheckCircle2,
  Map as MapIcon,
  ShieldCheck,
  Camera,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import api from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

type Step = "info" | "pin-map" | "verify" | "upload-photos" | "preview";

export default function PostRoomScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    area: "",
    address: "",
    description: "",
    phone: "",
  });

  const [amenities, setAmenities] = useState({
    wifi: false,
    parking: false,
    ac: false,
    water: false,
    tv: false,
    furniture: false,
    washingMachine: false,
    kitchen: false,
    refrigerator: false,
  });

  const [pinnedLocation, setPinnedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  };

  const AMENITY_LIST = [
    { key: "wifi", label: "Wifi", icon: Wifi },
    { key: "parking", label: "Chỗ để xe", icon: Car },
    { key: "ac", label: "Điều hòa", icon: Wind },
    { key: "water", label: "Nước nóng", icon: Info },
    { key: "tv", label: "Tivi", icon: Tv },
    { key: "furniture", label: "Nội thất", icon: Sofa },
    { key: "washingMachine", label: "Máy giặt", icon: WashingMachine },
    { key: "kitchen", label: "Nhà bếp", icon: Utensils },
    { key: "refrigerator", label: "Tủ lạnh", icon: Refrigerator },
  ] as const;

  const stepsInfo = [
    { key: "info", label: "Thông tin", icon: FileText },
    { key: "pin-map", label: "Ghim bản đồ", icon: MapIcon },
    { key: "verify", label: "Xác thực GPS", icon: ShieldCheck },
    { key: "upload-photos", label: "Tải ảnh", icon: Camera },
    { key: "preview", label: "Xem trước", icon: Sparkles },
  ];

  const currentStepIndex = stepsInfo.findIndex((s) => s.key === step);

  const toggleAmenity = (key: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const goNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepsInfo.length) {
      setStep(stepsInfo[nextIndex].key as Step);
    }
  };

  const handleNext = () => {
    if (step === "info") {
      if (!formData.name || !formData.price || !formData.area || !formData.address || !formData.phone) {
        Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các thông tin bắt buộc (*).");
        return;
      }
    } else if (step === "pin-map") {
      if (!pinnedLocation) {
        Alert.alert("Chưa ghim vị trí", "Vui lòng ghim vị trí phòng trọ trên bản đồ.");
        return;
      }
    } else if (step === "verify") {
      if (!gpsLocation) {
        Alert.alert(
          "Chưa xác thực GPS",
          "Bạn chưa xác thực vị trí hiện tại. Nếu tiếp tục, tin đăng sẽ không có nhãn xác thực.",
          [
            { text: "Hủy", style: "cancel" },
            { text: "Tiếp tục", style: "default", onPress: goNextStep }
          ]
        );
        return;
      } else {
        const distance = calculateDistance(pinnedLocation!.latitude, pinnedLocation!.longitude, gpsLocation.lat, gpsLocation.lng) * 1000;
        if (distance > 100) {
          Alert.alert(
            "Cảnh báo khoảng cách",
            `Vị trí bạn đứng cách điểm ghim ${Math.round(distance)}m. Bạn có muốn tiếp tục không?`,
            [
              { text: "Xem lại", style: "cancel" },
              { text: "Vẫn tiếp tục", style: "default", onPress: goNextStep }
            ]
          );
          return;
        }
      }
    } else if (step === "upload-photos") {
      if (uploadedImages.length === 0) {
        Alert.alert("Chưa có ảnh", "Phòng trọ không có ảnh sẽ rất khó cho thuê.", [
          { text: "Tải ảnh", style: "cancel" },
          { text: "Tiếp tục", style: "default", onPress: goNextStep }
        ]);
        return;
      }
    }
    
    goNextStep();
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(stepsInfo[prevIndex].key as Step);
    } else {
      router.back();
    }
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Từ chối quyền", "Không thể lấy vị trí GPS vì chưa được cấp quyền.");
        setIsGettingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setGpsLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
      });
      Alert.alert("Thành công", "Đã xác thực vị trí GPS thành công!");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lấy vị trí. Hãy bật GPS và thử lại.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - uploadedImages.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setLoading(true);
        const uploadedUrls: string[] = [];

        for (const asset of result.assets) {
          const formDataUpload = new FormData();
          formDataUpload.append("image", {
            uri: asset.uri,
            name: "upload.jpg",
            type: "image/jpeg",
          } as any);

          try {
            const res = await api.post("/api/upload/single", formDataUpload, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.status === 200 || res.status === 201) {
              uploadedUrls.push(res.data.url);
            }
          } catch (err) {
            console.error("Upload error for image", err);
          }
        }

        setUploadedImages((prev) => [...prev, ...uploadedUrls]);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi chọn ảnh.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    setLoading(true);
    try {
      const verificationLevel = gpsLocation ? "verified" : "none";
      
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        area: Number(formData.area),
        address: formData.address,
        description: formData.description,
        phone: formData.phone,
        amenities: amenities,
        location: pinnedLocation ? [pinnedLocation.longitude, pinnedLocation.latitude] : [106.699317, 10.771663],
        images: uploadedImages.length > 0 ? uploadedImages : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
        image: uploadedImages[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        available: true,
        ownerName: user?.fullName || user?.username || "Chủ trọ",
        verificationLevel: verificationLevel,
      };

      const res = await api.post("/api/properties", payload);

      if (res.status === 201 || res.status === 200) {
        Alert.alert("Thành công", "Đăng tin phòng trọ thành công!", [
          { text: "Về trang chủ", onPress: () => router.push("/landlord-dashboard") },
        ]);
      }
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message ||
          "Không thể đăng tin. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4 bg-white border-b border-slate-200 flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center bg-slate-100 rounded-full">
            <ArrowLeft size={20} color="#475569" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-black text-slate-800 text-center tracking-tight">
            Đăng tin mới
          </Text>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="bg-white px-4 py-6 border-b border-slate-100 relative">
          <View className="absolute top-[42px] left-8 right-8 h-1 bg-slate-100 rounded-full" />
          <View 
            className="absolute top-[42px] left-8 h-1 bg-indigo-600 rounded-full" 
            style={{ width: `${(currentStepIndex / (stepsInfo.length - 1)) * 100}%` }}
          />
          
          <View className="flex-row justify-between relative z-10">
            {stepsInfo.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = i === currentStepIndex;
              const isCompleted = i < currentStepIndex;
              return (
                <View key={s.key} className="items-center">
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${
                    isCompleted ? "bg-emerald-500" : isActive ? "bg-indigo-600 shadow-lg" : "bg-white border-2 border-slate-200"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 size={20} color="white" />
                    ) : (
                      <StepIcon size={18} color={isActive ? "white" : "#94a3b8"} />
                    )}
                  </View>
                  <Text className={`text-[9px] font-bold uppercase tracking-widest ${
                    isActive ? "text-indigo-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                  }`}>
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <ScrollView className="flex-1 px-4 pt-6 pb-32" showsVerticalScrollIndicator={false}>
          {/* STEP 1: INFO */}
          {step === "info" && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <View className="bg-white p-5 rounded-[24px] mb-6 shadow-sm border border-slate-100">
                <Text className="text-sm font-bold text-slate-600 mb-2">Tên phòng trọ / Căn hộ *</Text>
                <TextInput
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-base"
                  placeholder="VD: Cửa sổ trời - Quận 1"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />

                <Text className="text-sm font-bold text-slate-600 mb-2">Số điện thoại liên hệ *</Text>
                <TextInput
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-base"
                  placeholder="VD: 0901234567"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </View>

              <View className="bg-white p-5 rounded-[24px] mb-6 shadow-sm border border-slate-100">
                <View className="flex-row space-x-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold text-slate-600 mb-2">Giá thuê (VNĐ) *</Text>
                    <TextInput
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-base"
                      placeholder="3000000"
                      keyboardType="numeric"
                      value={formData.price}
                      onChangeText={(text) => setFormData({ ...formData, price: text })}
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-bold text-slate-600 mb-2">Diện tích (m²) *</Text>
                    <TextInput
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-base"
                      placeholder="25"
                      keyboardType="numeric"
                      value={formData.area}
                      onChangeText={(text) => setFormData({ ...formData, area: text })}
                    />
                  </View>
                </View>
              </View>

              <View className="bg-white p-5 rounded-[24px] mb-6 shadow-sm border border-slate-100">
                <Text className="text-sm font-bold text-slate-600 mb-2">Địa chỉ đầy đủ *</Text>
                <TextInput
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-base min-h-[100px]"
                  placeholder="VD: Số 123, Phường Bến Nghé, Quận 1, TP.HCM"
                  multiline
                  textAlignVertical="top"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>

              <View className="bg-white p-5 rounded-[24px] mb-6 shadow-sm border border-slate-100">
                <Text className="text-sm font-bold text-slate-600 mb-4">Tiện nghi phòng</Text>
                <View className="flex-row flex-wrap justify-between">
                  {AMENITY_LIST.map((item) => {
                    const Icon = item.icon;
                    const isActive = amenities[item.key];
                    return (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => toggleAmenity(item.key)}
                        className={`w-[31%] mb-3 p-3 rounded-[16px] items-center border ${
                          isActive ? "bg-indigo-50 border-indigo-500" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <Icon size={24} color={isActive ? "#4f46e5" : "#94a3b8"} />
                        <Text className={`text-[10px] text-center mt-2 font-bold ${
                          isActive ? "text-indigo-700" : "text-slate-500"
                        }`}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="bg-white p-5 rounded-[24px] mb-6 shadow-sm border border-slate-100">
                <Text className="text-sm font-bold text-slate-600 mb-2">Mô tả thêm</Text>
                <TextInput
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-base h-32"
                  placeholder="Mô tả không gian, tiện ích xung quanh, nội quy..."
                  multiline
                  textAlignVertical="top"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                />
              </View>
            </Animated.View>
          )}

          {/* STEP 2: PIN MAP */}
          {step === "pin-map" && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <View className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 h-[500px]">
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: 10.762622,
                    longitude: 106.660172,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  onPress={(e) => setPinnedLocation(e.nativeEvent.coordinate)}
                >
                  {pinnedLocation && (
                    <Marker coordinate={pinnedLocation}>
                      <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center border-2 border-indigo-600 shadow-lg">
                        <MapPin size={24} color="#4f46e5" />
                      </View>
                    </Marker>
                  )}
                </MapView>
                <View className="absolute bottom-6 left-6 right-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
                  <View className="flex-row items-center mb-2">
                    <Info size={20} color="#4f46e5" className="mr-2" />
                    <Text className="font-bold text-slate-800 text-lg">Hướng dẫn</Text>
                  </View>
                  <Text className="text-slate-600">
                    Chạm vào bản đồ để chọn vị trí chính xác của phòng trọ. Điều này giúp khách thuê tìm thấy dễ dàng hơn.
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* STEP 3: VERIFY GPS */}
          {step === "verify" && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <View className="bg-white p-8 rounded-[24px] items-center text-center shadow-sm border border-slate-100 mb-6">
                <View className="w-24 h-24 bg-emerald-50 rounded-full items-center justify-center mb-6">
                  <ShieldCheck size={48} color="#22c55e" />
                </View>
                <Text className="text-2xl font-black text-emerald-900 mb-4 tracking-tighter">
                  Xác thực Trust is King
                </Text>
                <Text className="text-slate-600 text-center mb-8 leading-relaxed">
                  Chúng tôi cần xác nhận bạn đang ở tại vị trí phòng trọ để cấp nhãn xác thực cho tin đăng của bạn.
                </Text>

                {gpsLocation ? (
                  <View className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex-row items-center justify-center">
                    <CheckCircle2 size={24} color="#22c55e" className="mr-3" />
                    <Text className="text-emerald-800 font-bold text-lg">Đã xác thực thành công</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleGetLocation}
                    disabled={isGettingLocation}
                    className="w-full"
                  >
                    <LinearGradient
                      colors={['#22c55e', '#16a34a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="py-4 rounded-xl flex-row items-center justify-center shadow-lg"
                    >
                      {isGettingLocation ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <MapPin size={20} color="white" className="mr-2" />
                          <Text className="text-white font-black text-lg">Lấy vị trí hiện tại</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}

          {/* STEP 4: UPLOAD PHOTOS */}
          {step === "upload-photos" && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <View className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 mb-6">
                <View className="items-center mb-6">
                  <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
                    <Camera size={32} color="#3b82f6" />
                  </View>
                  <Text className="text-xl font-black text-slate-800 mb-2">Hình ảnh thực tế</Text>
                  <Text className="text-slate-500 text-center">Tải lên tối đa 5 hình ảnh rõ nét (phòng ngủ, bếp, nhà vệ sinh,...)</Text>
                </View>

                {uploadedImages.length < 5 && (
                  <TouchableOpacity onPress={handlePickImage} disabled={loading} className="w-full mb-6">
                    <View className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-10 rounded-2xl items-center justify-center">
                      {loading ? (
                        <ActivityIndicator size="large" color="#4f46e5" />
                      ) : (
                        <>
                          <Upload size={36} color="#6366f1" className="mb-3" />
                          <Text className="font-bold text-indigo-600 text-base">Nhấn để chọn ảnh</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                <View className="flex-row flex-wrap -mx-1">
                  {uploadedImages.map((uri, index) => (
                    <View key={index} className="w-1/3 p-1 relative">
                      <View className="rounded-xl overflow-hidden aspect-square border border-slate-200">
                        <Image source={{ uri }} className="w-full h-full" />
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                      >
                        <X size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* STEP 5: PREVIEW */}
          {step === "preview" && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <View className="bg-white rounded-[24px] overflow-hidden shadow-lg border border-slate-100 mb-6">
                {uploadedImages.length > 0 ? (
                  <Image source={{ uri: uploadedImages[0] }} className="w-full h-60" />
                ) : (
                  <View className="w-full h-60 bg-slate-200 items-center justify-center">
                    <Camera size={48} color="#94a3b8" />
                  </View>
                )}
                
                <View className="p-6">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 mr-4">
                      <Text className="text-2xl font-black text-slate-800 mb-2">{formData.name}</Text>
                      <View className="flex-row items-center bg-indigo-50 self-start px-3 py-1 rounded-full">
                        <Text className="text-indigo-600 font-bold text-lg">{Number(formData.price).toLocaleString()} VNĐ/tháng</Text>
                      </View>
                    </View>
                    {gpsLocation && (
                      <View className="bg-emerald-50 p-2 rounded-full border border-emerald-200">
                        <ShieldCheck size={24} color="#22c55e" />
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center mb-2">
                    <MapPin size={16} color="#64748b" className="mr-2" />
                    <Text className="text-slate-600 flex-1">{formData.address}</Text>
                  </View>
                  
                  <View className="flex-row items-center mb-6">
                    <Phone size={16} color="#64748b" className="mr-2" />
                    <Text className="text-slate-600">{formData.phone}</Text>
                  </View>

                  <Text className="font-bold text-slate-800 text-lg mb-3">Tiện nghi</Text>
                  <View className="flex-row flex-wrap">
                    {AMENITY_LIST.filter(a => amenities[a.key]).map(a => {
                      const Icon = a.icon;
                      return (
                        <View key={a.key} className="flex-row items-center bg-slate-50 px-3 py-2 rounded-lg mr-2 mb-2 border border-slate-100">
                          <Icon size={14} color="#475569" className="mr-2" />
                          <Text className="text-slate-600 text-xs font-bold">{a.label}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

        </ScrollView>

        {/* Fixed Bottom Navigation */}
        <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-slate-200 flex-row">
          {step === "preview" ? (
            <TouchableOpacity
              onPress={handlePost}
              disabled={loading}
              className="flex-1"
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 rounded-xl flex-row items-center justify-center shadow-lg"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <CheckCircle2 size={20} color="white" className="mr-2" />
                    <Text className="text-white font-black text-lg">Đăng bài ngay</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              className="flex-1"
            >
              <LinearGradient
                colors={['#4f46e5', '#4338ca']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 rounded-xl flex-row items-center justify-center shadow-lg"
              >
                <Text className="text-white font-black text-lg mr-2">Tiếp tục</Text>
                <ArrowRight size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
