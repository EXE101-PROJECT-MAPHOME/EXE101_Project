import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar, Clock, Tag, Percent } from "lucide-react-native";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

export default function AdminVoucherAddScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [maxUses, setMaxUses] = useState("");

  // Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "admin") {
      router.replace("/");
      return;
    }
    fetchPlans();
  }, [isAuthenticated, user]);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await api.get("/api/subscriptions/plans");
      setPlans(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Error fetching plans", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const togglePlan = (id: string) => {
    if (selectedPlans.includes(id)) {
      setSelectedPlans(selectedPlans.filter((p) => p !== id));
    } else {
      setSelectedPlans([...selectedPlans, id]);
    }
  };

  const handleCreate = async () => {
    if (!code || !discountPercentage || !startDate || !endDate) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ các trường bắt buộc.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/vouchers", {
        code,
        discountPercentage: Number(discountPercentage),
        applicablePlans: selectedPlans,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive,
        maxUses: maxUses ? Number(maxUses) : null,
      });
      Alert.alert("Thành công", "Đã tạo voucher mới.");
      router.back();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể tạo voucher."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
        >
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-emerald-950">Tạo Voucher</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-4 rounded-2xl border border-slate-100 mb-6">
          <Text className="text-sm font-bold text-slate-700 mb-1">Mã Voucher *</Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12 mb-4 bg-slate-50">
            <Tag size={18} color="#64748b" />
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="VD: SUMMER20"
              className="flex-1 ml-2 font-bold text-slate-700"
              autoCapitalize="characters"
            />
          </View>

          <Text className="text-sm font-bold text-slate-700 mb-1">Giảm giá (%) *</Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12 mb-4 bg-slate-50">
            <Percent size={18} color="#64748b" />
            <TextInput
              value={discountPercentage}
              onChangeText={setDiscountPercentage}
              placeholder="0 - 100"
              keyboardType="numeric"
              className="flex-1 ml-2 text-slate-700"
            />
          </View>

          <Text className="text-sm font-bold text-slate-700 mb-1">Ngày bắt đầu *</Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12 mb-4 bg-slate-50">
            <Calendar size={18} color="#64748b" />
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD HH:mm (VD: 2026-06-01 00:00)"
              className="flex-1 ml-2 text-slate-700"
            />
          </View>

          <Text className="text-sm font-bold text-slate-700 mb-1">Ngày kết thúc *</Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12 mb-4 bg-slate-50">
            <Calendar size={18} color="#64748b" />
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD HH:mm (VD: 2026-12-31 23:59)"
              className="flex-1 ml-2 text-slate-700"
            />
          </View>

          <Text className="text-sm font-bold text-slate-700 mb-1">Số lượt dùng tối đa</Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12 mb-4 bg-slate-50">
            <Clock size={18} color="#64748b" />
            <TextInput
              value={maxUses}
              onChangeText={setMaxUses}
              placeholder="Để trống nếu không giới hạn"
              keyboardType="numeric"
              className="flex-1 ml-2 text-slate-700"
            />
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-bold text-slate-700">Trạng thái (Kích hoạt)</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: "#cbd5e1", true: "#059669" }}
            />
          </View>

          <Text className="text-sm font-bold text-slate-700 mb-2">Áp dụng cho gói (Tùy chọn)</Text>
          {loadingPlans ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            plans.map((plan) => (
              <TouchableOpacity
                key={plan._id}
                onPress={() => togglePlan(plan._id)}
                className={`p-3 rounded-xl border mb-2 flex-row justify-between items-center ${
                  selectedPlans.includes(plan._id)
                    ? "bg-emerald-50 border-emerald-500"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text className={`font-bold ${selectedPlans.includes(plan._id) ? "text-emerald-700" : "text-slate-700"}`}>
                  {plan.name}
                </Text>
                {selectedPlans.includes(plan._id) && (
                  <View className="w-4 h-4 rounded-full bg-emerald-500" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          className={`h-14 rounded-2xl items-center justify-center mb-10 ${
            loading ? "bg-slate-300" : "bg-emerald-600"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Tạo Voucher</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
