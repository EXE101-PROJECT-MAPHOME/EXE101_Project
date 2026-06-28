import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Check,
  Home as HomeIcon,
  MapPin,
  Rocket,
  Shield,
  Star,
  Zap,
  ArrowLeft,
  Sparkles,
  Building2,
  Briefcase,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import api from "@/utils/api";
import ROUTES, { navigateTo, safeBack } from "@/constants/routes";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/contexts/AuthContext";

type BillingCycle = "monthly" | "yearly";

interface PricingPlan {
  id?: string;
  _id?: string;
  planId: string;
  name: string;
  price: number;
  yearlyPrice: number;
  badge?: string;
  icon?: string;
  description: string;
  features: Array<{ text: string; included: boolean } | string>;
  highlighted?: boolean;
}

const iconMap: Record<string, any> = {
  Home: HomeIcon,
  MapPin,
  Star,
  Rocket,
  Shield,
  Zap,
};

interface PlanTheme {
  gradientColors: readonly [string, string, ...string[]];
  themeColor: string;
  highlighted: boolean;
  isDark: boolean;
  textColor: string;
  descColor: string;
  cardBg: string;
}

const getPlanTheme = (planName: string = "", planId: string = "", index: number = 0): PlanTheme => {
  const id = (planId || "").toLowerCase();

  // Basic / Gói Cơ Bản (Free)
  if (id === "free") {
    return {
      gradientColors: ["#f8fafc", "#ffffff"],
      themeColor: "#475569", // slate
      highlighted: false,
      isDark: false,
      textColor: "#0f172a",
      descColor: "#64748b",
      cardBg: "#ffffff",
    };
  }

  // Basic / Gói Cơ Bản (Basic)
  if (id === "basic") {
    return {
      gradientColors: ["#eff6ff", "#ffffff"],
      themeColor: "#2563eb", // blue
      highlighted: false,
      isDark: false,
      textColor: "#0f172a",
      descColor: "#64748b",
      cardBg: "#ffffff",
    };
  }
  
  // Standard (Premium Dark Indigo)
  if (id === "standard") {
    return {
      gradientColors: ["#1e1b4b", "#312e81"], // indigo-950 to indigo-900
      themeColor: "#818cf8", // indigo-400
      highlighted: true,
      isDark: true,
      textColor: "#ffffff",
      descColor: "#c7d2fe", // indigo-200
      cardBg: "#0f172a", // slate-900
    };
  }

  // Pro (Obsidian Black + Rose)
  if (id === "pro") {
    return {
      gradientColors: ["#09090b", "#18181b"], // zinc-950 to zinc-900
      themeColor: "#fb7185", // rose-400
      highlighted: false,
      isDark: true,
      textColor: "#ffffff",
      descColor: "#fecdd3", // rose-200
      cardBg: "#09090b",
    };
  }

  // Broker Lite
  if (id === "broker-lite") {
    return {
      gradientColors: ["#f0f9ff", "#ffffff"],
      themeColor: "#0284c7", // sky
      highlighted: false,
      isDark: false,
      textColor: "#0f172a",
      descColor: "#64748b",
      cardBg: "#ffffff",
    };
  }

  // Broker Pro (Dark Violet)
  if (id === "broker-pro") {
    return {
      gradientColors: ["#2e1065", "#4c1d95"], // violet-950 to violet-900
      themeColor: "#a78bfa", // violet-400
      highlighted: true,
      isDark: true,
      textColor: "#ffffff",
      descColor: "#ddd6fe", // violet-200
      cardBg: "#1e1b4b",
    };
  }

  // Broker Agency (Dark Amber)
  if (id === "broker-agency") {
    return {
      gradientColors: ["#451a03", "#78350f"], // amber-950 to amber-900
      themeColor: "#fbbf24", // amber-400
      highlighted: false,
      isDark: true,
      textColor: "#ffffff",
      descColor: "#fde68a", // amber-200
      cardBg: "#292524",
    };
  }

  // Fallbacks
  const fallbacks = [
    { gradientColors: ["#f0fdf4", "#ffffff"] as const, themeColor: "#16a34a", textColor: "#0f172a", descColor: "#64748b", cardBg: "#ffffff", highlighted: false, isDark: false },
    { gradientColors: ["#fdf2f8", "#ffffff"] as const, themeColor: "#db2777", textColor: "#0f172a", descColor: "#64748b", cardBg: "#ffffff", highlighted: false, isDark: false },
    { gradientColors: ["#fff7ed", "#ffffff"] as const, themeColor: "#ea580c", textColor: "#0f172a", descColor: "#64748b", cardBg: "#ffffff", highlighted: false, isDark: false },
    { gradientColors: ["#083344", "#164e63"] as const, themeColor: "#22d3ee", textColor: "#ffffff", descColor: "#a5f3fc", cardBg: "#0f172a", highlighted: true, isDark: true },
  ];

  return fallbacks[index % fallbacks.length];
};

function getIconComponent(name: string = "Home") {
  return iconMap[name] || HomeIcon;
}

export default function PricingScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");
  const { user } = useAuth();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Xác định tab mặc định dựa theo role đăng nhập
  const isBroker = user?.role === "broker";
  const isLandlord = user?.role === "landlord";
  const showRoleSwitcher = !isBroker && !isLandlord;

  const defaultRole = isBroker ? "broker" : "landlord";
  const [activeRole, setActiveRole] = useState<"landlord" | "broker">(defaultRole);

  // Sync khi user thay đổi
  useEffect(() => {
    if (user?.role === "broker") setActiveRole("broker");
    else if (user?.role === "landlord") setActiveRole("landlord");
  }, [user?.role]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      // Gọi API kèm query param role để lấy đúng gói
      const res = await api.get(`/api/subscriptions/plans?role=${activeRole}`);
      if (res.status === 200 && res.data && res.data.length > 0) {
        // Normalize and map feature formats if they come as raw strings
        const mapped = res.data.map((plan: any) => {
          const planFeatures = plan.features || [];
          const normalizedFeatures = planFeatures.map((f: any) => {
            if (typeof f === "string") {
              return { text: f, included: true };
            }
            return f;
          });
          return {
            ...plan,
            features: normalizedFeatures,
            icon: plan.icon || (plan.planId === "pro" ? "Rocket" : plan.planId === "standard" ? "Zap" : "Home"),
            badge: plan.badge || (plan.planId === "pro" ? "VIP" : plan.planId === "standard" ? "Phổ biến" : undefined),
            highlighted: plan.highlighted || plan.planId === "standard" || plan.planId === "broker-pro",
          };
        });
        setPlans(mapped.filter((p: any) => p.isActive !== false));
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.log("Failed to fetch plans from backend:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [activeRole]); // Re-fetch khi activeRole thay đổi

  const handleSelectPlan = (plan: PricingPlan) => {
    router.push({
      pathname: "/checkout",
      params: {
        planId: plan.planId,
        billingCycle: billingCycle,
        type: "subscription",
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => safeBack(router)}
          className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
        >
          <ArrowLeft size={18} color={iconColor} />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-black text-emerald-700">Gói Dịch Vụ</Text>
          <Text className="text-xs text-slate-500 font-bold">
            Nâng cấp dịch vụ để tăng doanh số thuê trọ
          </Text>
        </View>
      </View>

      {/* Role Switcher: Chủ nhà / Môi giới */}
      {showRoleSwitcher && (
        <View className="mx-4 mt-4 mb-2">
          <View className="bg-slate-100 rounded-2xl p-1 flex-row">
            <TouchableOpacity
              onPress={() => setActiveRole("landlord")}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
                activeRole === "landlord" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Building2
                size={14}
                color={activeRole === "landlord" ? "#2563eb" : "#94a3b8"}
              />
              <Text
                className={`text-xs font-black ${
                  activeRole === "landlord" ? "text-blue-600" : "text-slate-400"
                }`}
              >
                Chủ Nhà
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveRole("broker")}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
                activeRole === "broker" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Briefcase
                size={14}
                color={activeRole === "broker" ? "#7c3aed" : "#94a3b8"}
              />
              <Text
                className={`text-xs font-black ${
                  activeRole === "broker" ? "text-violet-600" : "text-slate-400"
                }`}
              >
                Môi Giới
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="text-slate-500 font-bold mt-2">Đang tải bảng giá...</Text>
        </View>
      ) : plans.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4">
            <Rocket size={32} color="#94a3b8" />
          </View>
          <Text className="text-lg font-black text-slate-800">Chưa tìm thấy gói dịch vụ</Text>
          <Text className="text-slate-400 text-xs text-center mt-2 px-6 leading-relaxed">
            Hiện tại không có gói dịch vụ nào đang hoạt động trên hệ thống. Vui lòng bấm thử lại.
          </Text>
          <TouchableOpacity
            onPress={fetchPlans}
            activeOpacity={0.9}
            className="mt-6 bg-emerald-600 px-6 py-3.5 rounded-2xl shadow-md"
          >
            <Text className="text-white font-black text-sm">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header Mesh Text */}
          <View className="items-center px-6 pt-6 pb-4">
            <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-3">
              <Sparkles size={12} color="#059669" />
              <Text className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                MapHome Premium
              </Text>
            </View>
            <Text className="text-2xl font-black text-center text-slate-800 tracking-tight">
              Đăng tin nổi bật, chốt khách hàng nhanh hơn
            </Text>
            <Text className="text-xs text-slate-500 text-center font-medium mt-2 leading-relaxed px-4">
              Chọn gói đăng tin phù hợp để tin của bạn hiển thị trên vị trí ưu tiên và tiếp cận hàng nghìn khách hàng mỗi ngày.
            </Text>
          </View>

          {/* Billing Cycle Switcher */}
          <View className="flex-row justify-center mt-3 mb-6">
            <View className="bg-slate-200/60 p-1.5 rounded-2xl flex-row w-[85%] max-w-sm">
              <TouchableOpacity
                onPress={() => setBillingCycle("monthly")}
                activeOpacity={0.8}
                className="flex-1 py-3 rounded-xl items-center justify-center"
                style={
                  billingCycle === "monthly"
                    ? {
                        backgroundColor: "#ffffff",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : { backgroundColor: "transparent" }
                }
              >
                <Text
                  className="text-xs font-black"
                  style={{ color: billingCycle === "monthly" ? "#047857" : "#64748b" }}
                >
                  Theo tháng
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBillingCycle("yearly")}
                activeOpacity={0.8}
                className="flex-1 py-3 rounded-xl items-center justify-center flex-row"
                style={
                  billingCycle === "yearly"
                    ? {
                        backgroundColor: "#ffffff",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : { backgroundColor: "transparent" }
                }
              >
                <Text
                  className="text-xs font-black"
                  style={{ color: billingCycle === "yearly" ? "#047857" : "#64748b" }}
                >
                  Theo năm
                </Text>
                <View className="ml-1.5 bg-emerald-500 px-1.5 py-0.5 rounded-md">
                  <Text className="text-[8px] text-white font-extrabold">
                    GIẢM 20%
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* List of Tiers */}
          <View className="px-4 space-y-6">
            {plans.map((tier, index) => {
              const IconComponent = getIconComponent(tier.icon);
              const price = billingCycle === "monthly" ? tier.price : tier.yearlyPrice;
              
              // Get dynamic theme matching the web exactly
              const theme = getPlanTheme(tier.name, tier.planId, index);

              return (
                <View
                  key={tier.planId || tier._id}
                  className="rounded-[32px] overflow-hidden border mb-4"
                  style={
                    theme.highlighted
                      ? {
                          borderColor: theme.themeColor,
                          shadowColor: theme.themeColor,
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.08,
                          shadowRadius: 16,
                          elevation: 8,
                        }
                      : {
                          borderColor: "#f1f5f9",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.03,
                          shadowRadius: 8,
                          elevation: 4,
                        }
                  }
                >
                  <LinearGradient
                    colors={theme.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ padding: 24 }}
                  >
                    {/* Badge and Icon */}
                    <View className="flex-row justify-between items-center mb-4">
                      <View
                        className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center"
                        style={{
                          shadowColor: theme.themeColor,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 6,
                          elevation: 2,
                        }}
                      >
                        <IconComponent size={24} color={theme.themeColor} strokeWidth={2.2} />
                      </View>
                      
                      {tier.badge && (
                        <View 
                          className="px-3 py-1 rounded-full bg-white border flex-row items-center"
                          style={{ borderColor: `${theme.themeColor}20` }}
                        >
                          <View 
                            className="w-1.5 h-1.5 rounded-full mr-1.5" 
                            style={{ backgroundColor: theme.themeColor }}
                          />
                          <Text 
                            className="text-[9px] font-black uppercase tracking-wider text-slate-700"
                          >
                            {tier.badge}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Title & Description */}
                    <Text className="text-xl font-black mb-1" style={{ color: theme.textColor }}>{tier.name}</Text>
                    <Text className="text-xs font-semibold leading-relaxed mb-4" style={{ color: theme.descColor }}>
                      {tier.description}
                    </Text>

                    {/* Pricing Display */}
                    <View className="flex-row items-baseline mb-2">
                      <Text className="text-3xl font-black" style={{ color: theme.textColor }}>
                        {price.toLocaleString("vi-VN")}
                      </Text>
                      <Text className="font-black text-base ml-0.5" style={{ color: theme.textColor }}>đ</Text>
                      <Text className="text-xs font-bold ml-1.5 uppercase tracking-wider" style={{ color: theme.isDark ? theme.descColor : "#94a3b8" }}>
                        / {billingCycle === "monthly" ? "tháng" : "năm"}
                      </Text>
                    </View>

                    {billingCycle === "yearly" && (
                      <View className="bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 self-start mb-4">
                        <Text className="text-[10px] text-emerald-700 font-extrabold italic">
                          Tiết kiệm 20% khi thanh toán theo năm
                        </Text>
                      </View>
                    )}

                    <View className="h-px my-4" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />

                    {/* Features List */}
                    <Text className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: theme.isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                      Quyền lợi đi kèm
                    </Text>
                    
                    <View className="space-y-3 mb-6">
                      {tier.features.map((feature: any, idx: number) => {
                        const isIncluded = typeof feature === "string" ? true : feature.included;
                        const textContent = typeof feature === "string" ? feature : feature.text;
                        
                        return (
                          <View key={idx} className="flex-row items-center mb-2">
                            <View
                              className="w-5 h-5 rounded-md items-center justify-center mr-3"
                              style={{
                                backgroundColor: isIncluded ? theme.themeColor : (theme.isDark ? 'rgba(255,255,255,0.1)' : "#cbd5e1"),
                              }}
                            >
                              {isIncluded 
                                ? <Check size={12} color="white" strokeWidth={3.5} />
                                : <Text style={{ color: theme.isDark ? 'rgba(255,255,255,0.3)' : 'white', fontSize: 10, fontWeight: 'bold' }}>✕</Text>
                              }
                            </View>
                            <Text
                              className="text-xs font-bold flex-1"
                              style={{
                                color: isIncluded ? theme.textColor : (theme.isDark ? 'rgba(255,255,255,0.3)' : "#cbd5e1"),
                                textDecorationLine: isIncluded ? "none" : "line-through",
                              }}
                            >
                              {textContent}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Button */}
                    <TouchableOpacity
                      onPress={() => handleSelectPlan(tier)}
                      activeOpacity={0.85}
                      className="h-12 rounded-2xl items-center justify-center flex-row shadow-lg"
                      style={{
                        backgroundColor: theme.themeColor,
                        shadowColor: theme.themeColor,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Text className="text-white font-black text-sm">
                        {theme.highlighted ? "Chọn Gói Tiêu Biểu" : "Đăng Ký Ngay"}
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
