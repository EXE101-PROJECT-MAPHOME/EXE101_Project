import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
} from "lucide-react-native";
import api from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function PostRoomScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
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

  const toggleAmenity = (key: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePost = async () => {
    if (
      !formData.name ||
      !formData.price ||
      !formData.area ||
      !formData.address ||
      !formData.phone
    ) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ các thông tin bắt buộc (*).",
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        area: Number(formData.area),
        address: formData.address,
        description: formData.description,
        phone: formData.phone,
        amenities: amenities,
        // Dữ liệu mặc định do mobile chưa có map picker và upload ảnh
        location: [106.699317, 10.771663],
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        ],
        available: true,
        ownerName: user?.fullName || user?.username || "Chủ trọ",
        verificationLevel: "none",
      };

      const res = await api.post("/api/properties", payload);

      if (res.status === 201 || res.status === 200) {
        Alert.alert("Thành công", "Đăng tin phòng trọ thành công!", [
          { text: "Về trang chủ", onPress: () => router.push("/") },
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

  const AMENITY_LIST = [
    { key: "wifi", label: "Wifi", icon: Wifi },
    { key: "parking", label: "Chỗ để xe", icon: Car },
    { key: "ac", label: "Điều hòa", icon: Wind },
    { key: "water", label: "Nước nóng", icon: Info },
    { key: "tv", label: "Tivi", icon: Tv },
    { key: "furniture", label: "Đầy đủ nội thất", icon: Sofa },
    { key: "washingMachine", label: "Máy giặt", icon: WashingMachine },
    { key: "kitchen", label: "Nhà bếp", icon: Utensils },
    { key: "refrigerator", label: "Tủ lạnh", icon: Refrigerator },
  ] as const;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-4 py-4 bg-white border-b border-slate-200 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-emerald-600 font-bold">Hủy</Text>
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-black text-slate-800 text-center">
            Đăng tin mới
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView
          className="flex-1 px-4 pt-6 pb-20"
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Basic Info */}
          <View className="bg-white p-5 rounded-3xl mb-6 shadow-sm border border-slate-100">
            <View className="flex-row items-center mb-4">
              <Home size={20} color={tint} className="mr-2" />
              <Text className="text-base font-black text-emerald-800">
                Thông tin cơ bản
              </Text>
            </View>

            <Text className="text-sm font-bold text-slate-600 mb-2">
              Tên phòng trọ / Căn hộ *
            </Text>
            <TextInput
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-base"
              placeholder="VD: Cửa sổ trời - Quận 1"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text className="text-sm font-bold text-slate-600 mb-2">
              Số điện thoại liên hệ *
            </Text>
            <TextInput
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-2 text-base"
              placeholder="VD: 0901234567"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>

          {/* Section 2: Price & Area */}
          <View className="bg-white p-5 rounded-3xl mb-6 shadow-sm border border-slate-100">
            <View className="flex-row items-center mb-4">
              <DollarSign size={20} color={tint} className="mr-2" />
              <Text className="text-base font-black text-emerald-800">
                Chi phí & Diện tích
              </Text>
            </View>

            <View className="flex-row justify-between space-x-4">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-bold text-slate-600 mb-2">
                  Giá thuê (VNĐ) *
                </Text>
                <TextInput
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-base"
                  placeholder="3000000"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(text) =>
                    setFormData({ ...formData, price: text })
                  }
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-sm font-bold text-slate-600 mb-2">
                  Diện tích (m²) *
                </Text>
                <TextInput
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-base"
                  placeholder="25"
                  keyboardType="numeric"
                  value={formData.area}
                  onChangeText={(text) =>
                    setFormData({ ...formData, area: text })
                  }
                />
              </View>
            </View>
          </View>

          {/* Section 3: Address */}
          <View className="bg-white p-5 rounded-3xl mb-6 shadow-sm border border-slate-100">
            <View className="flex-row items-center mb-4">
              <MapPin size={20} color={tint} className="mr-2" />
              <Text className="text-base font-black text-emerald-800">
                Địa chỉ chi tiết
              </Text>
            </View>
            <Text className="text-sm font-bold text-slate-600 mb-2">
              Địa chỉ đầy đủ *
            </Text>
            <TextInput
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-base"
              placeholder="VD: Số 123, Phường Bến Nghé, Quận 1, TP.HCM"
              multiline
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
            />
          </View>

          {/* Section 4: Amenities */}
          <View className="bg-white p-5 rounded-3xl mb-6 shadow-sm border border-slate-100">
            <View className="flex-row items-center mb-4">
              <Wifi size={20} color={tint} className="mr-2" />
              <Text className="text-base font-black text-emerald-800">
                Tiện nghi phòng
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {AMENITY_LIST.map((item) => {
                const Icon = item.icon;
                const isActive = amenities[item.key];
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => toggleAmenity(item.key)}
                    className={`w-[30%] mb-3 p-3 rounded-2xl items-center border ${
                      isActive
                        ? "bg-emerald-50 border-emerald-500"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Icon size={24} color={isActive ? tint : "#94a3b8"} />
                    <Text
                      className={`text-[10px] text-center mt-2 font-bold ${
                        isActive ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 5: Description */}
          <View className="bg-white p-5 rounded-3xl mb-8 shadow-sm border border-slate-100">
            <View className="flex-row items-center mb-4">
              <FileText size={20} color={tint} className="mr-2" />
              <Text className="text-base font-black text-emerald-800">
                Mô tả thêm
              </Text>
            </View>
            <TextInput
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-base h-32"
              placeholder="Mô tả không gian, tiện ích xung quanh, nội quy..."
              multiline
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
            />
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="bg-white p-4 border-t border-slate-200">
          <TouchableOpacity
            onPress={handlePost}
            disabled={loading}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-sm ${
              loading ? "bg-emerald-400" : "bg-emerald-600"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <CheckCircle2 size={20} color="white" className="mr-2" />
                <Text className="text-white font-black text-lg">
                  Đăng bài ngay
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
