import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation, type Href } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import { LinearGradient } from "expo-linear-gradient";
import {
  User as UserIcon,
  LogOut,
  ChevronRight,
  PlusCircle,
  Building2,
  Calendar,
  ShieldCheck,
  Mail,
  Phone,
  Settings,
  CreditCard,
} from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import CustomAlert from "@/components/CustomAlert";

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();

  const [loadingData, setLoadingData] = useState(false);
  const [tenantBookings, setTenantBookings] = useState<any[]>([]);
  const [landlordStats, setLandlordStats] = useState<any>(null);
  const [landlordBookings, setLandlordBookings] = useState<any[]>([]);
  const [landlordProperties, setLandlordProperties] = useState<any[]>([]);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success" as "success" | "error" | "info",
    onConfirm: () => {},
    confirmText: "OK",
    onCancel: undefined as (() => void) | undefined,
    cancelText: "Hủy",
  });

  // Function to load all data based on user role
  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingData(true);
      if (user.role === "user") {
        const res = await api.get("/api/user/bookings");
        setTenantBookings(res.data || []);
      } else if (user.role === "landlord" || user.role === "broker") {
        const endpointPrefix = user.role === "broker" ? "/api/broker" : "/api/landlord";
        const [statsRes, bookingsRes, propertiesRes] = await Promise.all([
          api.get(`${endpointPrefix}/analytics`).catch(() => ({ data: null })),
          api.get(`${endpointPrefix}/bookings`).catch(() => ({ data: [] })),
          api.get(`${endpointPrefix}/properties`).catch(() => ({ data: [] })),
        ]);

        setLandlordStats(statsRes.data);
        setLandlordBookings(bookingsRes.data || []);
        setLandlordProperties(propertiesRes.data || []);
      }
    } catch (e) {
      console.error("Error fetching profile dashboard data", e);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  // Fetch data on mount and whenever screen focuses
  useEffect(() => {
    fetchProfileData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchProfileData();
    });
    return unsubscribe;
  }, [navigation, fetchProfileData]);

  const handleLogout = () => {
    setAlertConfig({
      visible: true,
      title: "Đăng Xuất",
      message: "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      type: "info",
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      onConfirm: async () => {
        await logout();
        setAlertConfig({
          visible: true,
          title: "Đăng xuất thành công",
          message: "Bạn đã đăng xuất khỏi tài khoản.",
          type: "success",
          confirmText: "OK",
          onCancel: undefined,
          cancelText: "",
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            navigateTo(router, ROUTES.HOME, true);
          }
        });
      }
    });
  };

  const handlePostRoom = () => {
    navigateTo(router, ROUTES.POST_ROOM);
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      "Hủy lịch hẹn",
      "Bạn có chắc chắn muốn hủy lịch hẹn xem phòng này?",
      [
        { text: "Quay lại", style: "cancel" },
        {
          text: "Xác nhận hủy",
          style: "destructive",
          onPress: async () => {
            try {
              setLoadingData(true);
              await api.put(`/api/bookings/${bookingId}/cancel`);
              Alert.alert("Thành công", "Đã hủy lịch hẹn xem phòng.");
              fetchProfileData();
            } catch (err: any) {
              console.error(err);
              Alert.alert(
                "Lỗi",
                err.response?.data?.message || "Không thể hủy lịch hẹn.",
              );
            } finally {
              setLoadingData(false);
            }
          },
        },
      ],
    );
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: "confirmed" | "cancelled" | "completed",
  ) => {
    const statusText =
      status === "confirmed"
        ? "Duyệt"
        : status === "completed"
          ? "Hoàn tất"
          : "Hủy";
    Alert.alert(
      `${statusText} lịch hẹn`,
      `Bạn có chắc chắn muốn cập nhật lịch hẹn này thành: ${statusText}?`,
      [
        { text: "Quay lại", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: async () => {
            try {
              setLoadingData(true);
              await api.put(`/api/bookings/${bookingId}/status`, { status });
              Alert.alert("Thành công", `Đã cập nhật trạng thái lịch hẹn.`);
              fetchProfileData();
            } catch (err: any) {
              console.error(err);
              Alert.alert(
                "Lỗi",
                err.response?.data?.message || "Không thể cập nhật lịch hẹn.",
              );
            } finally {
              setLoadingData(false);
            }
          },
        },
      ],
    );
  };

  const formatBookingDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
            <Text className="text-[10px] text-amber-700 font-bold">
              Chờ duyệt
            </Text>
          </View>
        );
      case "confirmed":
        return (
          <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
            <Text className="text-[10px] text-emerald-700 font-bold">
              Đã duyệt
            </Text>
          </View>
        );
      case "completed":
        return (
          <View className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
            <Text className="text-[10px] text-blue-700 font-bold">
              Hoàn tất
            </Text>
          </View>
        );
      case "cancelled":
      default:
        return (
          <View className="bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
            <Text className="text-[10px] text-red-700 font-bold">Đã hủy</Text>
          </View>
        );
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Real app header without demo modes */}
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
        <Text className="text-2xl font-black text-emerald-700">Tài khoản</Text>
        {isAuthenticated && user && (
          <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <Text className="text-emerald-700 font-bold text-xs">
              {user.role === "landlord"
                ? "Chủ trọ"
                : user.role === "broker"
                  ? "Môi giới"
                  : user.role === "admin"
                    ? "Quản trị"
                    : "Khách thuê"}
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ================= GUEST VIEW ================= */}
        {(!isAuthenticated || !user) && (
          <View className="px-6 py-12 justify-center items-center">
            <LinearGradient
              colors={["#f0fdf4", "#dcfce7"]}
              className="w-24 h-24 rounded-full mb-6 items-center justify-center border border-emerald-100 shadow-sm"
            >
              <UserIcon size={40} color="#16a34a" />
            </LinearGradient>
            <Text className="text-2xl font-black text-emerald-700 text-center mb-2">
              Quản lý không gian sống
            </Text>
            <Text className="text-slate-500 text-center text-sm font-semibold max-w-xs mb-8">
              Hãy đăng nhập tài khoản của bạn để sử dụng các công cụ quản lý hợp
              đồng thuê, đăng tin phòng trọ, hóa đơn và lịch hẹn.
            </Text>

            <TouchableOpacity
              onPress={() => navigateTo(router, ROUTES.LOGIN)}
              className="w-full bg-emerald-600 h-14 rounded-2xl items-center justify-center shadow-md mb-4"
            >
              <Text className="text-white font-black text-base">Đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateTo(router, ROUTES.REGISTER)}
              className="w-full bg-white border border-emerald-600 h-14 rounded-2xl items-center justify-center mb-6"
            >
              <Text className="text-emerald-700 font-black text-base">
                Đăng ký tài khoản
              </Text>
            </TouchableOpacity>

            {/* Support and policy for guest */}
            <View className="flex-row flex-wrap justify-between w-full">
              {[
                {
                  title: "Liên hệ hỗ trợ",
                  desc: "Góp ý, báo lỗi, trợ giúp",
                  icon: Mail,
                  path: "/contact",
                },
                {
                  title: "Trợ giúp & Chính sách",
                  desc: "Điều khoản sử dụng và chính sách",
                  icon: ShieldCheck,
                  path: "/policy",
                },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => navigateTo(router, item.path)}
                  className="bg-white rounded-[24px] p-4 mb-3 border border-slate-100 shadow-sm"
                  style={{ width: "48%" }}
                >
                  <View className="w-10 h-10 bg-emerald-50 rounded-2xl items-center justify-center mb-3 border border-emerald-100">
                    <item.icon size={20} color="#16a34a" />
                  </View>
                  <Text className="text-[13px] font-black text-emerald-800 mb-1 leading-tight" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-[11px] text-slate-500 font-medium leading-tight" numberOfLines={2}>
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ================= TENANT VIEW ================= */}
        {isAuthenticated &&
          user &&
          (user.role === "user" || user.role === "admin") && (
            <View className="px-4 py-6 space-y-6">
              {/* Profile Header */}
              <LinearGradient
                colors={["#ffffff", "#f0fdf4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-[2rem] p-5 border border-emerald-100 shadow-sm flex-row items-center"
              >
                <Image
                  source={{
                    uri:
                      user.avatar ||
                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120",
                  }}
                  className="w-16 h-16 rounded-2xl mr-4"
                />
                <View className="flex-1">
                  <Text className="text-lg font-black text-emerald-700">
                    {user.fullName || user.username}
                  </Text>
                  <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {user.role === "admin" ? "Quản trị viên" : "Khách thuê trọ"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Mail size={12} color="#94a3b8" />
                    <Text className="text-xs text-slate-500 ml-1">
                      {user.email}
                    </Text>
                  </View>
                  {user.phone && (
                    <View className="flex-row items-center mt-1">
                      <Phone size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-500 ml-1">
                        {user.phone}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              {user.role === "user" && (
                <TouchableOpacity
                  onPress={() => navigateTo(router, ROUTES.USER_DASHBOARD)}
                  className="bg-emerald-600 h-12 rounded-2xl items-center justify-center"
                >
                  <Text className="text-white font-black">
                    Mở User Dashboard
                  </Text>
                </TouchableOpacity>
              )}

              {user.role === "admin" && (
                <TouchableOpacity
                  onPress={() => navigateTo(router, ROUTES.ADMIN_DASHBOARD)}
                  className="bg-indigo-600 h-12 rounded-2xl items-center justify-center"
                >
                  <Text className="text-white font-black">
                    Mở Admin Dashboard
                  </Text>
                </TouchableOpacity>
              )}

              {/* Stats Grid */}
              <View className="flex-row justify-between space-x-3">
                {[
                  {
                    label: "Lịch hẹn chờ",
                    value: String(
                      tenantBookings.filter((b) => b.status === "pending")
                        .length,
                    ),
                    icon: Calendar,
                    color: "bg-amber-500",
                  },
                  {
                    label: "Đã xác nhận",
                    value: String(
                      tenantBookings.filter((b) => b.status === "confirmed")
                        .length,
                    ),
                    icon: ShieldCheck,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Tổng lịch hẹn",
                    value: String(tenantBookings.length),
                    icon: Building2,
                    color: "bg-blue-500",
                  },
                ].map((stat, i) => (
                  <LinearGradient
                    key={i}
                    colors={["#ffffff", "#f8fafc"]}
                    className="flex-1 rounded-[2rem] p-3 border border-slate-100 shadow-sm items-center"
                  >
                    <LinearGradient
                      colors={
                        stat.color === "bg-emerald-500"
                          ? ["#34d399", "#10b981"]
                          : stat.color === "bg-blue-500"
                          ? ["#60a5fa", "#3b82f6"]
                          : ["#fbbf24", "#f59e0b"]
                      }
                      className="w-10 h-10 rounded-2xl items-center justify-center mb-2 shadow-sm"
                    >
                      <stat.icon size={18} color="white" />
                    </LinearGradient>
                    <Text className="text-lg font-black text-emerald-700">
                      {stat.value}
                    </Text>
                    <Text className="text-[10px] text-slate-500 font-bold text-center mt-1 leading-tight">
                      {stat.label}
                    </Text>
                  </LinearGradient>
                ))}
              </View>

              {/* Bookings Info */}
              <LinearGradient
                colors={["#ffffff", "#f8fafc"]}
                className="rounded-[2rem] p-5 border border-slate-100 shadow-sm"
              >
                <Text className="text-lg font-black text-emerald-700 mb-3">
                  Lịch hẹn xem phòng
                </Text>

                {loadingData ? (
                  <ActivityIndicator
                    size="small"
                    color="#16a34a"
                    className="py-4"
                  />
                ) : tenantBookings.length === 0 ? (
                  <View className="py-6 items-center">
                    <Text className="text-slate-400 text-xs font-semibold">
                      Bạn chưa có lịch hẹn xem phòng nào.
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {tenantBookings.slice(0, 5).map((booking, index) => (
                      <View
                        key={booking._id || index}
                        className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-2"
                      >
                        <View className="flex-row justify-between items-start mb-1">
                          <Text
                            className="text-sm font-bold text-emerald-700 flex-1 mr-2"
                            numberOfLines={1}
                          >
                            {booking.propertyId?.name || "Phòng trọ"}
                          </Text>
                          {getStatusBadge(booking.status)}
                        </View>

                        <Text
                          className="text-[11px] text-slate-500 mb-1"
                          numberOfLines={1}
                        >
                          Địa chỉ:{" "}
                          {booking.propertyId?.address || "Chưa cập nhật"}
                        </Text>

                        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-200/60">
                          <Text className="text-xs text-slate-500 font-medium">
                            {formatBookingDate(booking.bookingDate)} -{" "}
                            {booking.bookingTime}
                          </Text>

                          {booking.status === "pending" && (
                            <TouchableOpacity
                              onPress={() => handleCancelBooking(booking._id)}
                              className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl"
                            >
                              <Text className="text-[10px] text-red-600 font-black">
                                Hủy lịch
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>

              {/* Account Options Menu */}
              <View className="flex-row flex-wrap justify-between w-full">
                {[
                  {
                    title: "Thông tin cá nhân",
                    desc: "Họ tên, SĐT, CCCD",
                    icon: UserIcon,
                    path: "/personal-info",
                  },
                  {
                    title: "Cài đặt tài khoản",
                    desc: "Bảo mật, thông báo",
                    icon: Settings,
                    path: "/settings",
                  },
                  {
                    title: "Blog & Kiến thức",
                    desc: "Kinh nghiệm và tin tức",
                    icon: Building2,
                    path: "/blog",
                  },
                  {
                    title: "Liên hệ hỗ trợ",
                    desc: "Góp ý, báo lỗi, trợ giúp",
                    icon: Mail,
                    path: "/contact",
                  },
                  {
                    title: "Trợ giúp & Chính sách",
                    desc: "Điều khoản sử dụng",
                    icon: ShieldCheck,
                    path: "/policy",
                  },
                ].map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => navigateTo(router, item.path)}
                    className="bg-white rounded-[24px] p-4 mb-3 border border-slate-100 shadow-sm"
                    style={{ width: "48%" }}
                  >
                    <View className="w-10 h-10 bg-emerald-50 rounded-2xl items-center justify-center mb-3 border border-emerald-100">
                      <item.icon size={20} color="#16a34a" />
                    </View>
                    <Text className="text-[13px] font-black text-emerald-800 mb-1 leading-tight" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text className="text-[11px] text-slate-500 font-medium leading-tight" numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Logout */}
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-white border border-red-200 h-14 rounded-2xl flex-row items-center justify-center shadow-sm"
              >
                <LogOut size={18} color="#ef4444" />
                <Text className="text-red-500 font-bold text-base ml-2 px-1">
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* ================= LANDLORD & BROKER VIEW ================= */}
        {isAuthenticated && user && (user.role === "landlord" || user.role === "broker") && (
          <View className="px-4 py-6 space-y-6">
            {/* Landlord/Broker Header */}
            <LinearGradient
              colors={["#ffffff", "#f0fdf4", "#e0e7ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-[2rem] p-5 border border-emerald-200/50 shadow-md flex-row items-center"
            >
              <Image
                source={{
                  uri:
                    user.avatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
                }}
                className="w-16 h-16 rounded-2xl mr-4"
              />
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-lg font-black text-emerald-700">
                    {user.fullName || user.username}
                  </Text>
                  <View className="ml-2 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                    <Text className="text-[8px] text-emerald-700 font-bold">
                      {user.role === "broker" ? "Môi giới" : "Chính chủ"}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {user.role === "broker" ? "Người môi giới chuyên nghiệp" : "Chủ trọ nhà đầu tư"}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Mail size={12} color="#94a3b8" />
                  <Text className="text-xs text-slate-500 ml-1">
                    {user.email}
                  </Text>
                </View>
                {user.phone && (
                  <View className="flex-row items-center mt-1">
                    <Phone size={12} color="#94a3b8" />
                    <Text className="text-xs text-slate-500 ml-1">
                      {user.phone}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Quick Actions */}
            <TouchableOpacity
              onPress={() =>
                user.role === "broker"
                  ? navigateTo(router, ROUTES.BROKER_DASHBOARD)
                  : navigateTo(router, ROUTES.LANDLORD_DASHBOARD)
              }
              className="h-12 rounded-2xl shadow-sm overflow-hidden mb-3"
            >
              <LinearGradient
                colors={user.role === "broker" ? ["#7c3aed", "#4f46e5"] : ["#1e293b", "#0f172a"]}
                className="flex-1 flex-row items-center justify-center"
              >
                <Text className="text-white font-black text-base">
                  {user.role === "broker" ? "🤝 Mở Broker Dashboard" : "Mở Landlord Dashboard"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePostRoom}
              className="h-14 rounded-2xl shadow-md overflow-hidden"
            >
              <LinearGradient
                colors={["#10b981", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-1 flex-row items-center justify-center"
              >
                <PlusCircle size={20} color="white" />
                <Text className="text-white font-black text-base ml-2">
                  Đăng tin phòng trọ mới
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Stats Grid */}
            <View className="flex-row justify-between space-x-3">
              {[
                {
                  label: "Tổng tin đăng",
                  value: String(
                    landlordStats?.totalProperties || landlordProperties.length,
                  ),
                  icon: Building2,
                  color: "bg-emerald-500",
                },
                {
                  label: "Tổng lượt xem",
                  value: String(landlordStats?.totalViews || 0),
                  icon: ShieldCheck,
                  color: "bg-blue-500",
                },
                {
                  label: "Lịch hẹn trọ",
                  value: String(
                    landlordStats?.totalBookings || landlordBookings.length,
                  ),
                  icon: Calendar,
                  color: "bg-amber-500",
                },
              ].map((stat, i) => (
                <LinearGradient
                  key={i}
                  colors={["#ffffff", "#f8fafc"]}
                  className="flex-1 rounded-[2rem] p-3 border border-slate-100 shadow-sm items-center"
                >
                  <LinearGradient
                    colors={
                      stat.color === "bg-emerald-500"
                        ? ["#34d399", "#10b981"]
                        : stat.color === "bg-blue-500"
                        ? ["#60a5fa", "#3b82f6"]
                        : ["#fbbf24", "#f59e0b"]
                    }
                    className="w-10 h-10 rounded-2xl items-center justify-center mb-2 shadow-sm"
                  >
                    <stat.icon size={18} color="white" />
                  </LinearGradient>
                  <Text className="text-lg font-black text-emerald-700">
                    {stat.value}
                  </Text>
                  <Text className="text-[10px] text-slate-500 font-bold text-center mt-1 leading-tight">
                    {stat.label}
                  </Text>
                </LinearGradient>
              ))}
            </View>

            {/* Landlord Bookings (Lịch hẹn của khách) */}
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 shadow-sm"
            >
              <Text className="text-lg font-black text-emerald-700 mb-3">
                Lịch hẹn của khách
              </Text>

              {loadingData ? (
                <ActivityIndicator
                  size="small"
                  color="#16a34a"
                  className="py-4"
                />
              ) : landlordBookings.length === 0 ? (
                <View className="py-6 items-center">
                  <Text className="text-slate-400 text-xs font-semibold">
                    Chưa có khách đặt lịch hẹn xem phòng.
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {landlordBookings.slice(0, 5).map((booking, index) => (
                    <View
                      key={booking._id || index}
                      className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-2"
                    >
                      <View className="flex-row justify-between items-start mb-1">
                        <View className="flex-1 mr-2">
                          <Text className="text-sm font-bold text-emerald-700">
                            Khách:{" "}
                            {booking.customerName ||
                              booking.userId?.fullName ||
                              booking.userId?.username ||
                              "Khách thuê"}
                          </Text>
                          <Text className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            Phòng: {booking.propertyId?.name || "Phòng trọ"}
                          </Text>
                        </View>
                        {getStatusBadge(booking.status)}
                      </View>

                      <View className="flex-row items-center mt-1">
                        <Phone size={10} color="#64748b" />
                        <Text className="text-[11px] text-slate-500 ml-1">
                          SĐT:{" "}
                          {booking.customerPhone ||
                            booking.userId?.phone ||
                            "Chưa cung cấp"}
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-slate-200/60">
                        <Text className="text-xs text-slate-500 font-medium">
                          {formatBookingDate(booking.bookingDate)} -{" "}
                          {booking.bookingTime}
                        </Text>

                        {booking.status === "pending" && (
                          <View className="flex-row space-x-2">
                            <TouchableOpacity
                              onPress={() =>
                                handleUpdateBookingStatus(
                                  booking._id,
                                  "cancelled",
                                )
                              }
                              className="bg-red-50 border border-red-200 px-3 py-1 rounded-xl mr-2"
                            >
                              <Text className="text-[10px] text-red-600 font-black">
                                Từ chối
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                handleUpdateBookingStatus(
                                  booking._id,
                                  "confirmed",
                                )
                              }
                              className="bg-emerald-600 px-3 py-1 rounded-xl"
                            >
                              <Text className="text-[10px] text-white font-black">
                                Duyệt hẹn
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {booking.status === "confirmed" && (
                          <TouchableOpacity
                            onPress={() =>
                              handleUpdateBookingStatus(
                                booking._id,
                                "completed",
                              )
                            }
                            className="bg-blue-600 px-3 py-1 rounded-xl"
                          >
                            <Text className="text-[10px] text-white font-black">
                              Hoàn tất
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>

            {/* Landlord Actions Menu */}
            <View className="flex-row flex-wrap justify-between w-full">
              {[
                {
                  title: "Gói hội viên",
                  desc: "Nâng cấp, đẩy tin, ưu đãi",
                  icon: CreditCard,
                  path: ROUTES.PRICING,
                },
                {
                  title: "Danh sách trọ",
                  desc: `Đang có ${landlordProperties.length} tin đăng`,
                  icon: Building2,
                  path: ROUTES.LANDLORD_PROPERTIES(),
                },
                {
                  title: "Xác thực phòng",
                  desc: "Huy hiệu xanh Trust is King",
                  icon: ShieldCheck,
                  path: ROUTES.LANDLORD_VERIFICATION,
                },
                {
                  title: "Thông tin cá nhân",
                  desc: "Họ tên, SĐT, CCCD",
                  icon: UserIcon,
                  path: "/personal-info",
                },
                {
                  title: "Cài đặt tài khoản",
                  desc: "Bảo mật, đăng nhập",
                  icon: Settings,
                  path: ROUTES.LANDLORD_SETTINGS,
                },
                {
                  title: "Liên hệ hỗ trợ",
                  desc: "Góp ý, báo lỗi, trợ giúp",
                  icon: Mail,
                  path: "/contact",
                },
                {
                  title: "Chính sách",
                  desc: "Điều khoản sử dụng",
                  icon: ShieldCheck,
                  path: "/policy",
                },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => navigateTo(router, item.path)}
                  className="bg-white rounded-[24px] p-4 mb-3 border border-slate-100 shadow-sm"
                  style={{ width: "48%" }}
                >
                  <View className="w-10 h-10 bg-emerald-50 rounded-2xl items-center justify-center mb-3 border border-emerald-100">
                    <item.icon size={20} color="#16a34a" />
                  </View>
                  <Text className="text-[13px] font-black text-emerald-800 mb-1 leading-tight" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-[11px] text-slate-500 font-medium leading-tight" numberOfLines={2}>
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout */}
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white border border-red-200 h-14 rounded-2xl flex-row items-center justify-center shadow-sm"
            >
              <LogOut size={18} color="#ef4444" />
              <Text className="text-red-500 font-bold text-base ml-2 px-1">
                Đăng Xuất
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}
