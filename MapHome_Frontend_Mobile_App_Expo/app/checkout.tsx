import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  Shield,
  Tag,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import ROUTES, { navigateTo } from "@/constants/routes";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();

  const type = (params.type as string) || "subscription";
  const planId = (params.planId as string) || "standard";
  const billingCycle = (params.billingCycle as string) || "monthly";
  const paramPrice = params.price ? parseInt(params.price as string) : 0;

  const isInspection = type === "inspection";

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState("");
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    discountPercentage: number;
    voucherId: string;
    code: string;
  } | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isInspection);
  const tint = useThemeColor({}, "tint");
  const success = useThemeColor({}, "success");
  const icon = useThemeColor({}, "icon");

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thanh toán", [
        { text: "Đăng nhập", onPress: () => navigateTo(router, ROUTES.LOGIN) },
      ]);
      return;
    }

    if (!isInspection) {
      const fetchPlans = async () => {
        try {
          const res = await api.get("/api/subscriptions/plans");
          setPlans(res.data || []);
        } catch (error) {
          Alert.alert("Lỗi", "Không thể tải cấu hình gói dịch vụ.");
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    }
  }, [isAuthenticated, isInspection]);

  const selectedTier = plans.find((p) => p.planId === planId);
  const baseAmount = isInspection
    ? 199000
    : selectedTier
      ? selectedTier.price
      : paramPrice;
  const serviceFee = 0;
  const discountAmount = appliedVoucher
    ? (baseAmount * appliedVoucher.discountPercentage) / 100
    : 0;
  const totalAmount = baseAmount - discountAmount + serviceFee;

  const durationText = isInspection
    ? "1 lần kiểm tra"
    : billingCycle === "monthly"
      ? "1 tháng"
      : "12 tháng";

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setValidatingVoucher(true);
    try {
      const res = await api.post("/api/vouchers/validate", {
        code: voucherCode,
        planId: isInspection ? "inspection" : planId,
      });
      setAppliedVoucher({
        discountPercentage: res.data.discountPercentage,
        voucherId: res.data.voucherId,
        code: voucherCode.toUpperCase(),
      });
      Alert.alert(
        "Thành công",
        res.data.message || "Áp dụng mã giảm giá thành công!",
      );
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Mã giảm giá không hợp lệ",
      );
      setAppliedVoucher(null);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      Alert.alert("Thông báo", "Vui lòng đồng ý với điều khoản sử dụng.");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await api.post("/api/payments/create", {
        amount: totalAmount,
        description: isInspection
          ? `Thanh toan kiem tra can tro`
          : `Nang cap goi ${planId} (${billingCycle})`,
        planId: isInspection ? "inspection" : planId,
        voucherId: appliedVoucher?.voucherId || null,
      });

      if (res.status === 200 && res.data.url) {
        // Redirect to PayOS
        Linking.openURL(res.data.url);
        // After redirect, backend redirects to success page. For mobile we might need deep linking
        // For now, let user manually return
        Alert.alert(
          "Chuyển hướng",
          "Trình duyệt sẽ mở cổng thanh toán. Sau khi thanh toán xong hãy quay lại ứng dụng.",
          [{ text: "OK", onPress: () => router.back() }],
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi thanh toán",
        error.response?.data?.message || "Không thể khởi tạo thanh toán.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={tint} />
        <Text className="text-slate-500 font-bold mt-2">
          Đang tải dữ liệu...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color={icon} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-emerald-700">
              Thanh toán
            </Text>
            <Text className="text-xs text-slate-500 font-bold">
              Xác nhận thông tin giao dịch
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        >
          {/* Order details */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
            <Text className="text-base font-black text-emerald-700 mb-4 flex-row items-center">
              <CreditCard size={18} color={tint} /> Thông tin đơn hàng
            </Text>

            <View className="flex-row justify-between mb-3">
              <Text className="text-slate-600 font-semibold">
                {isInspection
                  ? "Kiểm tra thực địa"
                  : `Gói ${selectedTier?.name || planId}`}
              </Text>
              <Text className="text-emerald-700 font-black">
                {baseAmount.toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-slate-600 font-semibold">Thời hạn</Text>
              <Text className="text-emerald-700 font-black">
                {durationText}
              </Text>
            </View>

            {appliedVoucher && (
              <View className="flex-row justify-between mb-3 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                <Text className="text-emerald-700 font-semibold flex-row items-center">
                  <Tag size={14} color={success} /> Giảm giá (
                  {appliedVoucher.discountPercentage}%)
                </Text>
                <Text className="text-emerald-700 font-black">
                  -{discountAmount.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}

            <View className="h-px bg-slate-100 my-2" />

            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-slate-800 font-black text-base">
                Tổng thanh toán
              </Text>
              <Text className="text-2xl font-black text-emerald-600">
                {totalAmount.toLocaleString("vi-VN")}đ
              </Text>
            </View>
          </View>

          {/* Voucher Input */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
            <Text className="text-base font-black text-emerald-700 mb-3 flex-row items-center">
              <Tag size={18} color={tint} /> Mã giảm giá
            </Text>

            <View className="flex-row gap-2">
              <TextInput
                value={voucherCode}
                onChangeText={(text) => setVoucherCode(text.toUpperCase())}
                placeholder="Nhập mã ưu đãi"
                editable={!appliedVoucher && !validatingVoucher}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800 uppercase"
              />
              {appliedVoucher ? (
                <TouchableOpacity
                  onPress={() => {
                    setAppliedVoucher(null);
                    setVoucherCode("");
                  }}
                  className="bg-red-50 border border-red-200 px-4 rounded-xl items-center justify-center h-12"
                >
                  <Text className="text-red-600 font-bold">Hủy</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleApplyVoucher}
                  disabled={!voucherCode || validatingVoucher}
                  className={`${voucherCode ? "bg-emerald-600" : "bg-slate-300"} px-4 rounded-xl items-center justify-center h-12`}
                >
                  {validatingVoucher ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold">Áp dụng</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Terms */}
          <TouchableOpacity
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            className="flex-row items-start p-4 bg-white rounded-2xl border border-slate-100 mb-6"
          >
            <View
              className={`w-6 h-6 rounded border items-center justify-center mr-3 mt-0.5 ${agreedToTerms ? "bg-emerald-600 border-emerald-600" : "border-slate-300"}`}
            >
              {agreedToTerms && <CheckCircle2 size={16} color="white" />}
            </View>
            <Text className="flex-1 text-sm text-slate-600 leading-tight">
              Tôi đã đọc và đồng ý với các{" "}
              <Text className="font-bold text-emerald-600">
                điều khoản sử dụng
              </Text>{" "}
              và{" "}
              <Text className="font-bold text-emerald-600">
                chính sách bảo mật
              </Text>{" "}
              của MapHome liên quan đến giao dịch này.
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]"
      >
        <TouchableOpacity
          onPress={handlePayment}
          disabled={!agreedToTerms || isProcessing}
          className={`${!agreedToTerms || isProcessing ? "bg-emerald-800/50" : "bg-emerald-600"} h-14 rounded-2xl flex-row items-center justify-center`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Lock size={18} color="white" />
              <Text className="text-white font-black text-lg ml-2">
                Thanh toán qua PayOS
              </Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}
