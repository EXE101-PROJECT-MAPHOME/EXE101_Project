import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES, { safeBack } from "@/constants/routes";
import {
  ArrowLeft,
  ShieldCheck,
  Award,
  CheckCircle,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  FileText,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import api from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useProperties } from "@/contexts/PropertiesContext";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { LinearGradient } from "expo-linear-gradient";

export default function VerificationServiceScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { properties } = useProperties();

  const [landlordProperties, setLandlordProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000),
  );
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricing, setPricing] = useState({ basicVerification: 119000 });
  const [loading, setLoading] = useState(true);

  const tintColor = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");
  const infoColor = useThemeColor({}, "info");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "landlord") {
      Alert.alert("Thông báo", "Vui lòng đăng nhập với tài khoản chủ trọ");
      safeBack(router);
      return;
    }

    const fetchData = async () => {
      try {
        const [propRes, priceRes] = await Promise.all([
          api.get("/api/landlord/properties"),
          api
            .get("/api/verifications/pricing")
            .catch(() => ({ data: { basicVerification: 119000 } })),
        ]);
        setLandlordProperties(propRes.data);
        if (priceRes.data) setPricing(priceRes.data);
      } catch (err) {
        console.error("Failed to load verification data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, user]);

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      Alert.alert("Lỗi", "Vui lòng chọn căn trọ cần xác thực");
      return;
    }

    const property = landlordProperties.find(
      (p) => (p._id || p.id) === selectedPropertyId,
    );
    if (!property) return;

    setIsSubmitting(true);
    try {
      const payload = {
        propertyId: property._id || property.id,
        propertyName: property.name,
        landlordId: user?._id || user?.id,
        landlordName: user?.fullName || "Chủ trọ",
        scheduledDate: scheduledDate.toISOString().split("T")[0],
        scheduledTime,
        notes,
        address: property.address,
        phone: user?.phone || "",
      };

      const res = await api.post("/api/verifications", payload);

      if (res.status === 200 || res.status === 201) {
        Alert.alert(
          "Thành công",
          "Yêu cầu kiểm tra đã được gửi! Admin sẽ liên hệ với bạn sớm.",
          [{ text: "OK", onPress: () => safeBack(router, ROUTES.USER_DASHBOARD) }],
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể gửi yêu cầu",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDate = (date: Date) => {
    setScheduledDate(date);
    setDatePickerVisibility(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={tintColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <LinearGradient
          colors={['#16a34a', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-4 flex-row items-center"
        >
          <TouchableOpacity
            onPress={() => safeBack(router)}
            className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-white">
              Yêu cầu Tích Xanh
            </Text>
            <Text className="text-xs text-emerald-100 font-bold">
              Nâng cao độ tin cậy tin đăng
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        >
          {/* Lợi ích */}
          <View className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 mb-6">
            <Text className="text-base font-black text-emerald-700 mb-4 flex-row items-center">
              <Award size={18} color={tintColor} /> Lợi ích khi
              có Tích Xanh
            </Text>
            <View className="flex-row justify-between">
              <View className="bg-white rounded-2xl p-3 border border-emerald-50 w-[31%] items-center shadow-sm">
                <Text className="text-2xl mb-1">⭐</Text>
                <Text className="text-[10px] font-black text-slate-800 text-center">
                  Lên top tìm kiếm
                </Text>
              </View>
              <View className="bg-white rounded-2xl p-3 border border-emerald-50 w-[31%] items-center shadow-sm">
                <Text className="text-2xl mb-1">🛡️</Text>
                <Text className="text-[10px] font-black text-slate-800 text-center">
                  Tăng độ tin cậy
                </Text>
              </View>
              <View className="bg-white rounded-2xl p-3 border border-emerald-50 w-[31%] items-center shadow-sm">
                <Text className="text-2xl mb-1">📈</Text>
                <Text className="text-[10px] font-black text-slate-800 text-center">
                  +50% lượt xem
                </Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-6 shadow-sm">
            <Text className="font-bold text-slate-700 mb-2">
              Chọn căn trọ cần kiểm tra *
            </Text>
            {landlordProperties.length === 0 ? (
              <Text className="text-sm text-red-500 mb-4 font-bold">
                Bạn chưa có tin đăng nào.
              </Text>
            ) : (
              <View className="mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {landlordProperties.map((p) => (
                    <TouchableOpacity
                      key={p._id || p.id}
                      onPress={() => setSelectedPropertyId(p._id || p.id)}
                      className={`p-3 border rounded-xl mr-2 w-48 ${selectedPropertyId === (p._id || p.id) ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
                    >
                      <Text
                        className="font-bold text-slate-800"
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                      <Text
                        className="text-[10px] text-slate-500 mt-1"
                        numberOfLines={1}
                      >
                        {p.address}
                      </Text>
                      {p.greenBadge && (
                        <Text className="text-[10px] text-emerald-600 font-bold mt-1">
                          Đã có tích xanh
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="flex-row justify-between mb-4">
              <View className="w-[48%]">
                <Text className="font-bold text-slate-700 mb-2 flex-row">
                  <CalendarIcon size={14} color={iconColor} />{" "}
                  Ngày hẹn *
                </Text>
                <TouchableOpacity
                  onPress={() => setDatePickerVisibility(true)}
                  className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 justify-center"
                >
                  <Text className="font-bold text-slate-800">
                    {scheduledDate.toLocaleDateString("vi-VN")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="w-[48%]">
                <Text className="font-bold text-slate-700 mb-2 flex-row">
                  <ClockIcon size={14} color={iconColor} /> Giờ
                  hẹn *
                </Text>
                {/* Dùng ScrollView ngang cho giờ */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  {["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"].map(
                    (time) => (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setScheduledTime(time)}
                        className={`h-12 px-4 justify-center rounded-xl border mr-2 ${scheduledTime === time ? "bg-emerald-600 border-emerald-600" : "bg-slate-50 border-slate-200"}`}
                      >
                        <Text
                          className={`font-bold ${scheduledTime === time ? "text-white" : "text-slate-800"}`}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </ScrollView>
              </View>
            </View>

            <Text className="font-bold text-slate-700 mb-2 flex-row">
              <FileText size={14} color={iconColor} /> Ghi chú
              (Tùy chọn)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="VD: Hẹn tại cổng chính..."
              multiline
              numberOfLines={3}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 font-semibold h-24"
              textAlignVertical="top"
            />
          </View>

          {/* Quy trình */}
          <View className="bg-blue-50 rounded-3xl p-5 border border-blue-100 mb-4">
            <Text className="font-black text-blue-900 mb-3 flex-row items-center">
              <CheckCircle size={18} color={infoColor} /> Quy
              trình kiểm tra
            </Text>
            <Text className="text-xs text-blue-800 font-bold mb-1">
              1. Admin xác nhận lịch hẹn (trong 24h)
            </Text>
            <Text className="text-xs text-blue-800 font-bold mb-1">
              2. Đội ngũ kiểm tra đến hiện trường
            </Text>
            <Text className="text-xs text-blue-800 font-bold mb-1">
              3. Đánh giá vị trí, điều kiện, pháp lý
            </Text>
            <Text className="text-xs text-blue-800 font-bold mb-3">
              4. Cấp Tích Xanh nếu đạt yêu cầu
            </Text>
            <View className="h-px bg-blue-200 w-full mb-3" />
            <Text className="text-sm font-black text-blue-900">
              Chi phí: {pricing.basicVerification.toLocaleString("vi-VN")}đ /
              lần
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 shadow-lg"
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedPropertyId || isSubmitting}
          className={`${!selectedPropertyId || isSubmitting ? "bg-emerald-800/50" : "bg-emerald-600"} h-14 rounded-2xl flex-row items-center justify-center`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <ShieldCheck size={18} color="white" />
              <Text className="text-white font-black text-lg ml-2">
                Gửi yêu cầu xác thực
              </Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
        minimumDate={new Date()}
      />
    </SafeAreaView>
  );
}
