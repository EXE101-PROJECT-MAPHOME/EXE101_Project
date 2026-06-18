import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Modal,
  Animated as RNAnimated,
  PanResponder,
  Alert,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  ZoomIn,
} from "react-native-reanimated";
import { HeroCarousel } from "@/components/HeroCarousel";
import { PropertyCard } from "@/components/PropertyCard";
import {
  Building2,
  Users,
  Map as MapIcon,
  CheckCircle2,
  MapPin,
  Home,
  Shield,
  Search,
  FileText,
  PhoneCall,
  ArrowRight,
  Bell,
  Quote,
  Star,
  TrendingUp,
  Clock,
  Eye,
  X,
  CalendarDays,
  AlertTriangle,
  Tag,
  Copy,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import ROUTES, { navigateTo } from "@/constants/routes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProperties } from "../../contexts/PropertiesContext";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function HomePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { properties, loading } = useProperties();
  const { user } = useAuth();

  const panY = useRef(new RNAnimated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.2) {
          setIsNotifModalVisible(false);
          setTimeout(() => panY.setValue(0), 300);
        } else {
          RNAnimated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  // Helper to translate old English notifications in the database to Vietnamese
  const translateNotification = (text: string) => {
    if (!text) return text;
    let t = text;

    // Translate specific Titles
    if (t === "Appointment Reminder") return "Nhắc nhở lịch hẹn";
    if (t === "New Viewing Appointment!") return "Lịch hẹn xem phòng mới!";
    if (t.includes("Viewing Appointment Cancelled")) return "Lịch hẹn đã bị hủy";
    if (t.includes("Booking Confirmed")) return "Xác nhận lịch hẹn";
    
    // Translate specific Messages using Regex
    t = t.replace(/You have a viewing appointment for "(.*?)" at (.*?)\./g, "Bạn có lịch hẹn xem phòng \"$1\" vào lúc $2.");
    t = t.replace(/(.*?) has requested to view "(.*?)" on [a-zA-Z]+, (.*?) at (.*?)\./g, "$1 đã yêu cầu xem phòng \"$2\" vào ngày $3 lúc $4.");

    // Fallbacks
    t = t.replace(/has requested to view/g, "đã yêu cầu xem");
    t = t.replace(/You have a viewing appointment/g, "Bạn có lịch hẹn xem phòng");
    
    const tLower = t.toLowerCase();
    if (tLower.includes("welcome")) return "Chào mừng đến với MapHome";
    if (tLower.includes("payment")) return "Thanh toán thành công";
    if (tLower.includes("verified")) return "Phòng trọ đã được xác thực";
    
    return t; 
  };

  const getNotificationStyle = (type: string, title: string = "") => {
    const t = type || "";
    const titleLower = title.toLowerCase();
    
    if (t === "success" || titleLower.includes("xác nhận") || titleLower.includes("thành công")) {
      return {
        icon: CheckCircle2,
        colors: ['#22c55e', '#15803d'] as [string, string],
        bgColor: 'bg-green-50/90',
        textColor: 'text-green-950',
        borderColor: 'border-green-200',
        iconColor: '#16a34a',
        accentColor: 'bg-green-500'
      };
    }
    if (t === "warning" || t === "error" || titleLower.includes("hủy") || titleLower.includes("từ chối")) {
      return {
        icon: AlertTriangle,
        colors: ['#ef4444', '#b91c1c'] as [string, string],
        bgColor: 'bg-red-50/90',
        textColor: 'text-red-950',
        borderColor: 'border-red-200',
        iconColor: '#dc2626',
        accentColor: 'bg-red-500'
      };
    }
    if (t === "booking" || titleLower.includes("lịch hẹn") || titleLower.includes("xem phòng")) {
      return {
        icon: CalendarDays,
        colors: ['#8b5cf6', '#6d28d9'] as [string, string],
        bgColor: 'bg-purple-50/90',
        textColor: 'text-purple-950',
        borderColor: 'border-purple-200',
        iconColor: '#7c3aed',
        accentColor: 'bg-purple-500'
      };
    }
    // Default info
    return {
      icon: Bell,
      colors: ['#3b82f6', '#1d4ed8'] as [string, string],
      bgColor: 'bg-blue-50/90',
      textColor: 'text-blue-950',
      borderColor: 'border-blue-200',
      iconColor: '#2563eb',
      accentColor: 'bg-blue-500'
    };
  };

  const handleNotificationPress = async () => {
    if (!user) {
      navigateTo(router, ROUTES.LOGIN);
      return;
    }

    setIsNotifModalVisible(true);
    setIsNotifLoading(true);
    try {
      const res = await api.get("/api/notifications").catch(() => ({ data: [] }));
      let data = res.data || [];

      // If API returns empty or we want to ensure Vietnamese mock data for testing
      if (data.length === 0) {
        data = [
          { _id: "1", title: "Chào mừng đến với MapHome", message: "Cập nhật hồ sơ để trải nghiệm tốt nhất.", isRead: false },
          { _id: "2", title: "Tính năng mới", message: "Hệ thống xác thực GPS đã sẵn sàng hoạt động.", isRead: false },
          { _id: "3", title: "Gợi ý phòng trọ", message: "Có 5 phòng trọ mới gần khu vực bạn quan tâm.", isRead: false },
        ];
      } else {
        // Translate English notifications to Vietnamese
        data = data.map((n: any) => ({
          ...n,
          title: translateNotification(n.title) || n.title,
          message: translateNotification(n.message) || n.message,
        }));
      }
      setNotifications(data);
    } catch (e) {
      console.log("Failed to fetch notifications", e);
    } finally {
      setIsNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await api.put(`/api/notifications/${id}/read`).catch(() => { });
    } catch (e) {
      console.log("Error marking as read", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.put(`/api/notifications/read-all`).catch(() => { });
    } catch (e) {
      console.log("Error marking all as read", e);
    }
  };

  const [stats, setStats] = useState({
    totalProperties: 10,
    totalUsers: 50,
    totalDistricts: 12,
    satisfactionRate: 98,
  });
  const [promotedVouchers, setPromotedVouchers] = useState<any[]>([]);
  const [savedVoucherIds, setSavedVoucherIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSavedVouchers = async () => {
      if (user) {
        try {
          const res = await api.get("/api/vouchers/me/saved");
          if (res.data) {
            setSavedVoucherIds(res.data.map((v: any) => v._id || v.id));
          }
        } catch (error) {
          console.log("Failed to fetch saved vouchers", error);
        }
      } else {
        setSavedVoucherIds([]);
      }
    };
    fetchSavedVouchers();
  }, [user]);

  const handleToggleSaveVoucher = async (voucher: any) => {
    const vId = voucher._id || voucher.id;
    if (!vId) return;

    if (!user) {
      await Clipboard.setStringAsync(voucher.code);
      Alert.alert(
        "Đã sao chép mã",
        "Đã sao chép mã voucher vào bộ nhớ tạm. Bạn hãy đăng nhập để lưu vào Ví Voucher nhé!"
      );
      return;
    }

    const isSaved = savedVoucherIds.includes(vId);
    if (isSaved) {
      Alert.alert(
        "Bỏ lưu voucher",
        `Bạn có chắc chắn muốn bỏ lưu mã "${voucher.code}" khỏi ví của mình không?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Bỏ lưu",
            style: "destructive",
            onPress: async () => {
              try {
                await api.post(`/api/vouchers/${vId}/unsave`);
                setSavedVoucherIds((prev) => prev.filter((id) => id !== vId));
                Alert.alert("Thành công", "Đã gỡ voucher khỏi ví của bạn.");
              } catch (error) {
                Alert.alert("Lỗi", "Không thể gỡ voucher khỏi ví.");
              }
            },
          },
        ]
      );
    } else {
      try {
        await api.post(`/api/vouchers/${vId}/save`);
        setSavedVoucherIds((prev) => [...prev, vId]);
        Alert.alert("Thành công", "Lưu voucher thành công! Bạn có thể sử dụng mã này trong trang thanh toán.");
      } catch (error: any) {
        Alert.alert(
          "Lỗi",
          error.response?.data?.message || "Không thể lưu voucher vào ví."
        );
      }
    }
  };



  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [statsRes, reviewsRes, blogsRes, vouchersRes] = await Promise.allSettled([
          api.get("/api/properties/stats/public"),
          api.get("/api/reviews/latest"),
          api.get("/api/blogs?limit=3"),
          api.get("/api/vouchers/promoted"),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value?.data) {
          setStats({
            totalProperties: statsRes.value.data.totalProperties || 10,
            totalUsers: statsRes.value.data.totalUsers || 50,
            totalDistricts: statsRes.value.data.totalDistricts || 12,
            satisfactionRate: statsRes.value.data.satisfactionRate || 98,
          });
        }

        if (reviewsRes.status === "fulfilled" && reviewsRes.value?.data) {
          setTestimonials(reviewsRes.value.data);
        }

        if (blogsRes.status === "fulfilled" && blogsRes.value?.data) {
          setBlogPosts(blogsRes.value.data);
        }
        if (vouchersRes.status === "fulfilled" && vouchersRes.value?.data) {
          setPromotedVouchers(vouchersRes.value.data);
        }
      } catch (error) {
        console.log("Failed to fetch home data", error);
      }
    };
    fetchHomeData();
  }, []);

  const verifiedProperties = useMemo(() => {
    const verified = properties.filter(
      (p) => p.verificationLevel === "verified",
    );
    return verified.length > 0 ? verified.slice(0, 6) : properties.slice(0, 6);
  }, [properties]);

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
          className="flex-row justify-between items-center px-4 pb-4 bg-white border-b border-slate-100"
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-2 border border-slate-100/50 shadow-md overflow-hidden">
              <Image
                source={require("../../assets/images/MapHome_logo_2.png")}
                className="w-[120%] h-[120%]"
                resizeMode="cover"
              />
            </View>
            <Text className="text-xl font-black text-emerald-950 tracking-tighter">
              MapHome
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleNotificationPress}
            className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center relative shadow-sm border border-slate-100"
          >
            <Bell size={20} color="#145231" />
            <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </TouchableOpacity>
        </Animated.View>

        <HeroCarousel />

        {/* ━━━ Promoted Vouchers ━━━ */}
        {user?.role === "landlord" && promotedVouchers.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-slate-50 py-6 border-b border-slate-100">
            <View className="px-4 flex-row items-center mb-4">
              <View className="bg-emerald-100 p-2 rounded-xl mr-2">
                <Tag size={20} color="#059669" />
              </View>
              <Text className="text-xl font-black text-emerald-950">Ưu Đãi Hôm Nay</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 32 }}
              snapToInterval={width * 0.85 + 16}
              decelerationRate="fast"
            >
              {promotedVouchers.map((voucher) => {
                // Flash sale logic
                let progressPercent = 0;
                let progressText = "Còn lại rất ít";
                if (voucher.maxUses) {
                  progressPercent = Math.min(100, (voucher.usedCount / voucher.maxUses) * 100);
                  progressText = `Đã dùng ${Math.round(progressPercent)}%`;
                } else {
                  progressPercent = 85;
                  progressText = "Sắp hết hạn";
                }

                const isSaved = savedVoucherIds.includes(voucher._id || voucher.id);
                return (
                  <View 
                    key={voucher._id || voucher.id} 
                    className="w-[85vw] mr-4 bg-white rounded-2xl shadow-sm"
                    style={{ 
                      elevation: 3,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                    }}
                  >
                    <View className="flex-row relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {/* Left Side: Gradient Ticket stub */}
                      <View className="w-[35%] overflow-hidden relative justify-center items-center py-4">
                      <LinearGradient
                        colors={['#059669', '#0ea5e9']} // Emerald Green to Teal gradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="absolute inset-0"
                      />
                      <View className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                      
                      <Text className="text-white/90 text-[10px] font-black uppercase tracking-widest mb-1">
                        VOUCHER
                      </Text>
                      <View className="flex-row items-baseline justify-center">
                        <Text className="text-3xl font-black text-white">{voucher.discountPercentage}</Text>
                        <Text className="text-base font-bold text-white ml-0.5">%</Text>
                      </View>
                      <View className="bg-white/20 px-2 py-0.5 rounded-full mt-1">
                        <Text className="text-white/90 text-[9px] font-bold">GIẢM</Text>
                      </View>
                    </View>

                    {/* Dashed Line separator */}
                    <View className="absolute left-[35%] top-0 bottom-0 w-[1px] border-l border-dashed border-slate-300 z-10" />

                    {/* Cutouts (Top and Bottom) */}
                    <View className="absolute left-[35%] top-0 w-4 h-4 bg-slate-50 rounded-full -translate-x-2 -translate-y-2 z-20 border-b border-slate-200" />
                    <View className="absolute left-[35%] bottom-0 w-4 h-4 bg-slate-50 rounded-full -translate-x-2 translate-y-2 z-20 border-t border-slate-200" />

                    {/* Right Side: Details */}
                    <View className="w-[65%] p-3 flex-col justify-between bg-white z-10">
                      <View>
                        <Text className="font-black text-slate-800 text-[15px] mb-1" numberOfLines={1}>
                          {voucher.title || "Siêu Sale Bất Ngờ"}
                        </Text>
                        <Text className="text-slate-500 text-[11px] h-8 leading-tight" numberOfLines={2}>
                          {voucher.description || `Sử dụng mã ${voucher.code} để được giảm ${voucher.discountPercentage}%`}
                        </Text>
                      </View>
                      
                      <View className="mt-2">
                        {/* Progress Bar */}
                        <View className="w-full h-3.5 bg-emerald-100 rounded-full overflow-hidden justify-center relative mb-2">
                          <LinearGradient
                            colors={['#10b981', '#0ea5e9']} // Emerald to Teal/Blue
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="absolute top-0 left-0 bottom-0 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                          <Text className="absolute w-full text-center text-[8px] font-black text-white uppercase tracking-widest" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }}>
                            {progressText}
                          </Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                          <View className="bg-slate-50 px-2 py-1 rounded border border-dashed border-slate-200 flex-1 mr-2">
                            <Text className="font-black text-slate-700 tracking-widest text-[11px] text-center">{voucher.code}</Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => handleToggleSaveVoucher(voucher)}
                            className={`rounded-full px-3 py-1.5 flex-row items-center shadow-sm ${
                              isSaved ? "bg-slate-100 border border-slate-200" : "bg-emerald-600"
                            }`}
                          >
                            <Text className={`font-bold text-[11px] ${
                              isSaved ? "text-slate-500" : "text-white"
                            }`}>
                              {isSaved ? "Đã lưu" : "Lưu mã"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Stats Section with Gradient Aura feel */}
        <Animated.View entering={FadeInRight.delay(200).springify()} className="py-10 px-4 relative overflow-hidden">
          <LinearGradient
            colors={['#16a34a', '#059669', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
          <View className="flex-row flex-wrap justify-between relative z-10">
            {[
              {
                icon: Building2,
                target: `${stats.totalProperties.toLocaleString("vi-VN")}+`,
                label: "Phòng trọ",
              },
              {
                icon: Users,
                target: `${stats.totalUsers.toLocaleString("vi-VN")}+`,
                label: "Người dùng",
              },
              {
                icon: MapIcon,
                target: `${stats.totalDistricts}`,
                label: "Quận / Huyện",
              },
              {
                icon: CheckCircle2,
                target: `${stats.satisfactionRate}%`,
                label: "Hài lòng",
              },
            ].map((stat, i) => (
              <View key={i} className="w-[45%] items-center mb-6">
                <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center mb-3 border border-white/20">
                  <stat.icon size={28} color="#bbf7d0" />
                </View>
                <Text className="text-3xl font-black text-white mb-1 tracking-tight">
                  {stat.target}
                </Text>
                <Text className="text-green-100/80 text-xs font-bold uppercase tracking-widest">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Features Section */}
        <View className="py-12 px-4 relative">
          <View className="items-center mb-10">
            <Text className="text-3xl font-black text-emerald-900 text-center mb-3 tracking-tighter">
              Tại Sao Chọn MapHome?
            </Text>
            <Text className="text-slate-600 text-center px-4 font-medium leading-relaxed">
              Nền tảng tìm trọ hiện đại với công nghệ tiên tiến, giúp bạn tìm được
              ngôi nhà thứ hai một cách dễ dàng và nhanh chóng nhất.
            </Text>
          </View>

          {[
            {
              icon: MapPin,
              title: "Bản đồ tương tác",
              desc: "Xem vị trí chính xác và khám phá các tiện ích xung quanh như bệnh viện, trường học, siêu thị.",
              colors: ['#22c55e', '#059669'],
            },
            {
              icon: Home,
              title: "Thông tin đầy đủ",
              desc: "Chi tiết về giá cả, diện tích, tiện nghi, hình ảnh thực tế 100%.",
              colors: ['#3b82f6', '#4f46e5'],
            },
            {
              icon: Shield,
              title: "Hệ thống xác thực",
              desc: "Cơ chế Trust is King xác thực vị trí GPS tại chỗ, đảm bảo an toàn tuyệt đối.",
              colors: ['#a855f7', '#db2777'],
            },
          ].map((f, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(300 + i * 100).springify()}
              className="bg-white rounded-[32px] p-6 mb-6 shadow-xl shadow-slate-200/50 border border-slate-100 items-center overflow-hidden"
            >
              <View className="w-20 h-20 rounded-[28px] overflow-hidden items-center justify-center mb-5 shadow-lg">
                <LinearGradient
                  colors={f.colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0"
                />
                <f.icon size={36} color="white" />
              </View>
              <Text className="font-black text-2xl text-emerald-950 mb-3 tracking-tight text-center">
                {f.title}
              </Text>
              <Text className="text-slate-500 text-center leading-relaxed font-medium">
                {f.desc}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* How it Works Section */}
        <View className="py-12 px-4 bg-slate-50 border-t border-slate-100">
          <View className="items-center mb-10">
            <Text className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3">
              Hành trình trải nghiệm
            </Text>
            <Text className="text-3xl font-black text-emerald-900 text-center mb-2 tracking-tighter">
              Tìm trọ chỉ với 4 bước
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {[
              {
                step: 1,
                icon: Search,
                title: "Tìm kiếm",
                desc: "Nhập khu vực, mức giá",
                color: "bg-blue-600",
              },
              {
                step: 2,
                icon: MapIcon,
                title: "Xem bản đồ",
                desc: "Khám phá vị trí",
                color: "bg-green-600",
              },
              {
                step: 3,
                icon: FileText,
                title: "So sánh",
                desc: "Đánh giá tiện nghi",
                color: "bg-purple-600",
              },
              {
                step: 4,
                icon: PhoneCall,
                title: "Liên hệ",
                desc: "Gọi chủ trọ",
                color: "bg-orange-600",
              },
            ].map((s, i) => (
              <Animated.View
                key={i}
                entering={ZoomIn.delay(400 + i * 100).springify()}
                className="w-[48%] mb-6 items-center"
              >
                <View
                  className={`w-20 h-20 ${s.color} rounded-3xl items-center justify-center mb-4 shadow-lg relative`}
                >
                  <s.icon size={32} color="white" />
                  <View className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full items-center justify-center shadow-md border-2 border-slate-50">
                    <Text className="text-sm font-black text-slate-800">
                      {s.step}
                    </Text>
                  </View>
                </View>
                <Text className="font-black text-lg text-emerald-950 mb-1 text-center">
                  {s.title}
                </Text>
                <Text className="text-slate-500 text-xs text-center font-medium px-2">
                  {s.desc}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Verified Properties Section */}
        <View className="py-12 px-0 bg-white">
          <View className="items-center mb-8 px-4">
            <View className="flex-row items-center bg-emerald-50 px-5 py-2.5 rounded-full mb-5 border border-emerald-100">
              <View className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2" />
              <Text className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em]">
                Hệ thống đã xác thực
              </Text>
            </View>
            <Text className="text-3xl font-black text-emerald-900 mb-3 tracking-tighter">
              Nhà Trọ Uy Tín
            </Text>
            <Text className="text-emerald-950/60 text-center font-medium">
              Các tin đăng được xác thực trực tiếp tại chỗ qua hệ thống Trust is
              King
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#16a34a" className="my-8" />
          ) : verifiedProperties.length === 0 ? (
            <View className="py-8 items-center justify-center">
              <Text className="text-slate-400 font-bold">
                Chưa có phòng trọ nào trên hệ thống.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {verifiedProperties.map((item, index) => (
                <View key={item._id || item.id || index} className="w-[300px] mr-4 pb-4">
                  <PropertyCard
                    property={item}
                    onPress={() => navigateTo(router, ROUTES.ROOM(item.id))}
                  />
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.MAP)}
            className="mx-4 mt-6 overflow-hidden rounded-[24px]"
          >
            <LinearGradient
              colors={['#16a34a', '#15803d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 flex-row justify-center items-center shadow-xl"
            >
              <Text className="text-white font-black text-lg mr-3">
                Xem tất cả trên bản đồ
              </Text>
              <ArrowRight size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Browse by District */}
        <View className="py-12 px-4 bg-slate-50 border-t border-slate-100">
          <View className="items-center mb-10">
            <Text className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3">
              Thành phố Hồ Chí Minh
            </Text>
            <Text className="text-3xl font-black text-emerald-900 mb-2 tracking-tighter">
              Khám Phá Theo Quận
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {[
              {
                name: "Quận 1",
                count: 1250,
                image:
                  "https://images.unsplash.com/photo-1559592442-7e18ad73d800?w=500&q=80",
              },
              {
                name: "Quận 7",
                count: 850,
                image:
                  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&q=80",
              },
              {
                name: "Bình Thạnh",
                count: 920,
                image:
                  "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=500&q=80",
              },
              {
                name: "Thủ Đức",
                count: 1100,
                image:
                  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80",
              },
            ].map((d, i) => (
              <Animated.View
                key={i}
                entering={ZoomIn.delay(500 + i * 100).springify()}
                className="w-[48%] mb-4"
              >
                <TouchableOpacity
                  onPress={() => navigateTo(router, ROUTES.MAP)}
                  className="rounded-3xl overflow-hidden relative h-48 w-full border border-slate-100 shadow-sm"
                >
                  <Image
                    source={{ uri: d.image }}
                    className="w-full h-full absolute"
                  />
                  <LinearGradient
                    colors={['rgba(5, 46, 22, 0.9)', 'rgba(20, 82, 49, 0.3)', 'transparent']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    className="absolute inset-0"
                  />
                  <View className="absolute bottom-4 left-4">
                    <Text className="text-white font-black text-xl mb-1 tracking-tight">
                      {d.name}
                    </Text>
                    <Text className="text-emerald-50/90 text-[10px] font-bold uppercase tracking-widest">
                      {d.count.toLocaleString("vi-VN")} phòng trọ
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <View className="py-12 bg-white">
            <View className="items-center mb-10 px-4">
              <Text className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
                Cảm nhận từ khách hàng
              </Text>
              <Text className="text-3xl font-black text-emerald-900 mb-3 tracking-tighter text-center">
                Người Dùng Nói Gì?
              </Text>
              <Text className="text-emerald-950/70 text-center font-medium">
                Lắng nghe những câu chuyện tìm thấy tổ ấm thực sự từ cộng đồng.
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {testimonials.map((t, index) => (
                <View key={t._id || t.id || index} className="w-[320px] mr-4 pb-6 pt-4">
                  <View className="bg-white rounded-[40px] p-6 shadow-xl shadow-green-900/10 border border-slate-50 relative">
                    <View className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-md items-center justify-center border border-green-50 z-10">
                      <Quote size={20} color="#22c55e" opacity={0.5} />
                    </View>

                    <View className="flex-row items-center mb-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          color={i < t.rating ? "#fbbf24" : "#f1f5f9"}
                          fill={i < t.rating ? "#fbbf24" : "transparent"}
                          className="mr-1"
                        />
                      ))}
                    </View>

                    <Text className="text-slate-600 text-base leading-relaxed mb-6 font-medium italic">
                      "{t.text}"
                    </Text>

                    <View className="flex-row items-center pt-5 border-t border-slate-50">
                      <View className="relative">
                        <LinearGradient
                          colors={['#4ade80', '#059669']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className="w-12 h-12 rounded-2xl items-center justify-center mr-3 shadow-md"
                        >
                          <Text className="text-white text-lg font-black">{t.avatar}</Text>
                        </LinearGradient>
                        <View className="absolute -bottom-1 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white items-center justify-center">
                          <CheckCircle2 size={12} color="white" />
                        </View>
                      </View>
                      <View>
                        <Text className="font-black text-[15px] text-emerald-950 tracking-tight">
                          {t.name}
                        </Text>
                        <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {t.role}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Blog / Tips */}
        {blogPosts.length > 0 && (
          <View className="py-12 px-4 bg-slate-50">
            <View className="flex-row justify-between items-end mb-8">
              <View className="flex-1">
                <View className="flex-row items-center bg-green-50 self-start px-3 py-1 rounded-lg mb-3 border border-green-100">
                  <TrendingUp size={12} color="#16a34a" className="mr-2" />
                  <Text className="text-green-600 text-[10px] font-black uppercase tracking-widest">
                    Xu hướng tìm trọ
                  </Text>
                </View>
                <Text className="text-3xl font-black text-emerald-900 tracking-tighter">
                  Kinh Nghiệm Thuê Trọ
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigateTo(router, ROUTES.BLOG)}
                className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center"
              >
                <ArrowRight size={18} color="#16a34a" />
              </TouchableOpacity>
            </View>

            {blogPosts.slice(0, 3).map((post, index) => (
              <TouchableOpacity
                key={post._id || post.id || index}
                onPress={() => router.push(`/blog/${post._id || post.id}` as any)}
                className="bg-white rounded-[24px] overflow-hidden mb-6 shadow-lg shadow-slate-200/50 border border-slate-100"
              >
                <View className="h-48 relative">
                  <Image
                    source={{ uri: post.image }}
                    className="w-full h-full absolute"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/20" />
                  <View className="absolute top-4 left-4 bg-white/90 px-4 py-2 rounded-xl shadow-md">
                    <Text className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                      {post.category}
                    </Text>
                  </View>
                </View>
                <View className="p-6">
                  <Text className="font-black text-lg mb-2 text-emerald-950 leading-snug">
                    {post.title}
                  </Text>
                  <Text className="text-slate-600 text-sm leading-relaxed mb-5 font-medium" numberOfLines={2}>
                    {post.excerpt}
                  </Text>
                  <View className="flex-row items-center justify-between pt-4 border-t border-slate-50">
                    <View className="flex-row items-center">
                      <View className="flex-row items-center mr-4">
                        <Clock size={12} color="#16a34a" className="mr-1.5" />
                        <Text className="text-[11px] font-bold text-slate-500">{post.readTime}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Eye size={12} color="#2563eb" className="mr-1.5" />
                        <Text className="text-[11px] font-bold text-slate-500">
                          {post.views?.toLocaleString("vi-VN")}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {post.date}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Landlord CTA */}
        <View className="my-10 mx-4 rounded-[32px] overflow-hidden shadow-2xl relative">
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1649663724528-3bd2ce98b6e3?w=800&q=80" }}
            className="p-8 items-center"
          >
            <LinearGradient
              colors={['rgba(5, 46, 22, 0.95)', 'rgba(20, 82, 49, 0.9)', 'rgba(6, 78, 59, 0.8)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="absolute inset-0"
            />

            <View className="flex-row items-center bg-white/20 px-4 py-2 rounded-full mb-6 border border-white/30 z-10">
              <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              <Text className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">
                Dành riêng cho chủ trọ
              </Text>
            </View>

            <Text className="text-3xl font-black text-white text-center mb-4 tracking-tighter leading-tight z-10">
              Tối Ưu Doanh Thu{"\n"}
              <Text className="text-emerald-400">Từ Bất Động Sản</Text>
            </Text>

            <Text className="text-green-50 text-center mb-8 font-medium leading-relaxed z-10 px-2">
              Gia nhập cộng đồng hơn 5.000+ chủ trọ đang kinh doanh hiệu quả
              trên MapHome.
            </Text>

            <TouchableOpacity
              onPress={() => navigateTo(router, ROUTES.POST_ROOM)}
              className="w-full z-10"
            >
              <LinearGradient
                colors={['#10b981', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 rounded-[20px] flex-row items-center justify-center shadow-lg"
              >
                <FileText size={20} color="white" className="mr-2" />
                <Text className="text-white font-black text-lg">Đăng tin miễn phí ngay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ImageBackground>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Notification Bottom Sheet Modal */}
      <Modal
        visible={isNotifModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsNotifModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setIsNotifModalVisible(false)}
          />
          <RNAnimated.View
            style={{ 
              transform: [{ translateY: panY }],
              paddingBottom: Math.max(insets.bottom, 24)
            }}
            className="bg-white rounded-t-[32px] max-h-[85%] shadow-2xl"
          >
            <View {...panResponder.panHandlers} className="w-full items-center pt-4 pb-2 z-20">
              <View className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </View>

            <View className="px-6 pb-4 border-b border-slate-100 flex-row justify-between items-center bg-white rounded-t-[32px] z-10">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center mr-4 border border-emerald-100">
                  <Bell size={24} color="#059669" />
                </View>
                <View>
                  <Text className="text-xl font-black text-emerald-950 tracking-tight mb-0.5">Thông báo</Text>
                  <Text className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cập nhật mới nhất</Text>
                </View>
              </View>
            </View>

            <View className="px-6 py-3 flex-row justify-end">
              {notifications.some(n => !n.isRead) && (
                <TouchableOpacity onPress={handleMarkAllAsRead} className="py-1">
                  <Text className="text-emerald-600 font-bold text-sm">Đánh dấu tất cả đã đọc</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
              {isNotifLoading ? (
                <ActivityIndicator size="large" color="#16a34a" className="my-8" />
              ) : notifications.length === 0 ? (
                <View className="py-12 items-center justify-center">
                  <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-6">
                    <Bell size={40} color="#cbd5e1" />
                  </View>
                  <Text className="text-center text-slate-400 font-bold text-base">Không có thông báo nào mới</Text>
                </View>
              ) : (
                notifications.map((notif, idx) => {
                  const style = getNotificationStyle(notif.type, notif.title);
                  const IconComponent = style.icon;
                  return (
                    <TouchableOpacity
                      key={notif._id || idx}
                      onPress={() => !notif.isRead && handleMarkAsRead(notif._id)}
                      activeOpacity={0.7}
                      className={`p-4 mb-4 rounded-[24px] border ${notif.isRead ? 'bg-white border-slate-100 shadow-sm' : `${style.bgColor} ${style.borderColor} shadow-lg shadow-slate-200/50`} flex-row items-start relative overflow-hidden`}
                    >
                      {!notif.isRead && <View className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accentColor}`} />}
                      
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 overflow-hidden ${notif.isRead ? 'bg-white border border-slate-50' : 'bg-white shadow-sm border border-white/50'}`}>
                        <LinearGradient
                          colors={style.colors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className={`absolute inset-0 ${notif.isRead ? 'opacity-5' : 'opacity-15'}`}
                        />
                        <IconComponent size={24} color={style.iconColor} style={{ opacity: notif.isRead ? 0.6 : 1 }} />
                      </View>
                      
                      <View className="flex-1 pt-1">
                        <View className="flex-row items-center mb-1">
                          <Text className={`font-black text-[15px] flex-1 ${style.textColor} ${notif.isRead ? 'opacity-70' : ''}`}>
                            {translateNotification(notif.title)}
                          </Text>
                          {!notif.isRead && (
                            <View className={`w-2 h-2 rounded-full ${style.accentColor} ml-2`} />
                          )}
                        </View>
                        <Text className={`text-[13px] leading-relaxed ${notif.isRead ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                          {translateNotification(notif.message)}
                        </Text>
                        {notif.createdAt && (
                          <Text className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-wider">
                            {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setIsNotifModalVisible(false);
                    if (user?.role === "landlord") router.push("/landlord-dashboard?tab=notifications");
                    else router.push("/user-dashboard?tab=notifications");
                  }}
                  className="mt-2 mb-6 py-4 bg-emerald-600 rounded-[20px] items-center shadow-lg shadow-emerald-600/30"
                >
                  <Text className="text-white font-black text-[15px]">Xem toàn bộ thông báo</Text>
                </TouchableOpacity>
              )}
              <View className="h-6" />
            </ScrollView>
          </RNAnimated.View>
        </View>
      </Modal>
    </>
  );
}

