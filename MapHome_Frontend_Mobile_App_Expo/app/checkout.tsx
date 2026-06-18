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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  Shield,
  Tag,
  X,
  Ticket,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/hooks/use-theme-color";
import ROUTES, { navigateTo, safeBack } from "@/constants/routes";
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

  const [savedVouchers, setSavedVouchers] = useState<any[]>([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [fetchingSavedVouchers, setFetchingSavedVouchers] = useState(false);

  useEffect(() => {
    const fetchSavedVouchers = async () => {
      if (isAuthenticated) {
        setFetchingSavedVouchers(true);
        try {
          const res = await api.get("/api/vouchers/me/saved");
          setSavedVouchers(res.data || []);
        } catch (error) {
          console.log("Failed to fetch saved vouchers", error);
        } finally {
          setFetchingSavedVouchers(false);
        }
      }
    };
    fetchSavedVouchers();
  }, [isAuthenticated, isVoucherModalOpen]);

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

  const handleApplyVoucherWithCode = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    setValidatingVoucher(true);
    try {
      const res = await api.post("/api/vouchers/validate", {
        code: codeToApply,
        planId: isInspection ? "inspection" : planId,
      });
      setAppliedVoucher({
        discountPercentage: res.data.discountPercentage,
        voucherId: res.data.voucherId,
        code: codeToApply.toUpperCase(),
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

  const handleApplyVoucher = async () => {
    await handleApplyVoucherWithCode(voucherCode);
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      Alert.alert("Thông báo", "Vui lòng đồng ý với điều khoản sử dụng.");
      return;
    }

    try {
      setIsProcessing(true);
      const appReturnUrl = ExpoLinking.createURL('/');
      const res = await api.post("/api/payments/create", {
        amount: totalAmount,
        description: isInspection
          ? `Thanh toan kiem tra can tro`
          : `Nang cap goi ${planId} (${billingCycle})`,
        planId: isInspection ? "inspection" : planId,
        voucherId: appliedVoucher?.voucherId || null,
        appReturnUrl,
      });

      if (res.status === 200 && res.data.url) {
        // Mở cổng thanh toán trong ứng dụng bằng WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(res.data.url, appReturnUrl);
        
        if (result.type === "success") {
          // Parse URL trả về để lấy thông tin route
          const parsed = ExpoLinking.parse(result.url);
          
          if (parsed.path?.includes("payment-success")) {
             router.push({ pathname: "/payment-success", params: parsed.queryParams as any });
          } else if (parsed.path?.includes("payment-failure")) {
             router.push({ pathname: "/payment-failure", params: parsed.queryParams as any });
          } else if (parsed.path?.includes("user/dashboard") || parsed.path?.includes("dashboard")) {
             router.push({ pathname: "/user-dashboard", params: parsed.queryParams as any });
          } else {
             // Fallback
             router.replace("/(tabs)");
          }
        } else if (result.type === "cancel" || result.type === "dismiss") {
          Alert.alert("Đã hủy", "Bạn đã hủy quá trình thanh toán.");
        }
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
            onPress={() => safeBack(router)}
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

            {!appliedVoucher && isAuthenticated && (
              <TouchableOpacity
                onPress={() => setIsVoucherModalOpen(true)}
                className="mt-3 flex-row items-center justify-center py-2.5 bg-emerald-50 rounded-xl border border-dashed border-emerald-300 active:opacity-80"
              >
                <Tag size={16} color="#059669" className="mr-2" />
                <Text className="text-emerald-700 font-black text-sm">Chọn từ ví voucher</Text>
              </TouchableOpacity>
            )}
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

      <Modal
        visible={isVoucherModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVoucherModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[32px] h-[70vh] flex-col overflow-hidden">
            {/* Modal Header */}
            <View className="px-6 py-5 border-b border-slate-100 flex-row justify-between items-center bg-white">
              <View className="flex-row items-center">
                <Ticket size={20} color="#059669" className="mr-2" />
                <Text className="text-lg font-black text-emerald-950">Chọn Voucher từ ví</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsVoucherModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={16} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Scrollable list of vouchers */}
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              className="flex-1 bg-slate-50"
            >
              {fetchingSavedVouchers ? (
                <View className="py-20 items-center justify-center">
                  <ActivityIndicator size="large" color="#059669" />
                  <Text className="text-slate-500 font-bold mt-2">Đang tải ví voucher...</Text>
                </View>
              ) : savedVouchers.length === 0 ? (
                <View className="py-20 items-center justify-center">
                  <Ticket size={48} color="#94a3b8" className="mb-3" />
                  <Text className="text-slate-500 font-bold text-center">Ví voucher của bạn trống.</Text>
                  <Text className="text-slate-400 text-xs text-center mt-1">Lưu voucher ở trang chủ để sử dụng.</Text>
                </View>
              ) : (
                savedVouchers.map((voucher) => {
                  const currentTierId = isInspection ? "inspection" : planId;
                  
                  // Check applicability
                  const isApplicable =
                    !voucher.applicableTiers ||
                    voucher.applicableTiers.length === 0 ||
                    voucher.applicableTiers.includes(currentTierId);

                  return (
                    <View
                      key={voucher._id || voucher.id}
                      className="mb-4 bg-white rounded-2xl overflow-hidden border border-slate-200"
                      style={{
                        opacity: isApplicable ? 1 : 0.6,
                        elevation: 2,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                      }}
                    >
                      <View className="flex-row relative">
                        {/* Left Side: Ticket Stub */}
                        <View className="w-[30%] py-4 items-center justify-center overflow-hidden relative">
                          <LinearGradient
                            colors={isApplicable ? ['#059669', '#0ea5e9'] : ['#94a3b8', '#cbd5e1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="absolute inset-0"
                          />
                          <Text className="text-white/85 text-[8px] font-black uppercase tracking-wider mb-1">
                            VOUCHER
                          </Text>
                          <Text className="text-white text-2xl font-black">{voucher.discountPercentage}%</Text>
                          <Text className="text-white/95 text-[9px] font-bold mt-1">OFF</Text>
                        </View>

                        {/* Dashed Separator */}
                        <View className="absolute left-[30%] top-0 bottom-0 w-[1px] border-l border-dashed border-slate-300 z-10" />

                        {/* Cutouts */}
                        <View className="absolute left-[30%] top-0 w-3 h-3 bg-slate-50 rounded-full -translate-x-1.5 -translate-y-1.5 z-20 border-b border-slate-200" />
                        <View className="absolute left-[30%] bottom-0 w-3 h-3 bg-slate-50 rounded-full -translate-x-1.5 translate-y-1.5 z-20 border-t border-slate-200" />

                        {/* Right Side: Info & Actions */}
                        <View className="w-[70%] p-3 justify-between">
                          <View>
                            <Text className="font-black text-slate-800 text-sm mb-0.5" numberOfLines={1}>
                              {voucher.title || `Mã giảm giá ${voucher.discountPercentage}%`}
                            </Text>
                            <Text className="text-slate-500 text-[10px] leading-tight" numberOfLines={2}>
                              {voucher.description || "Áp dụng giảm giá hóa đơn nâng cấp dịch vụ."}
                            </Text>
                            
                            {!isApplicable && voucher.applicableTiers && voucher.applicableTiers.length > 0 && (
                              <Text className="text-red-500 font-bold text-[9px] mt-1">
                                ✕ Chỉ áp dụng cho gói: {voucher.applicableTiers.join(", ").toUpperCase()}
                              </Text>
                            )}
                          </View>

                          <View className="flex-row items-center justify-between mt-2">
                            <View className="bg-slate-50 px-2 py-0.5 rounded border border-dashed border-slate-200">
                              <Text className="font-black text-slate-600 text-[10px] uppercase tracking-wider">
                                {voucher.code}
                              </Text>
                            </View>

                            <TouchableOpacity
                              disabled={!isApplicable}
                              onPress={() => {
                                setVoucherCode(voucher.code);
                                setIsVoucherModalOpen(false);
                                setTimeout(() => {
                                  handleApplyVoucherWithCode(voucher.code);
                                }, 150);
                              }}
                              className={`px-3 py-1 rounded-lg ${
                                isApplicable ? "bg-emerald-600 active:opacity-80" : "bg-slate-200"
                              }`}
                            >
                              <Text className={`font-black text-xs ${isApplicable ? "text-white" : "text-slate-400"}`}>
                                Áp dụng
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
