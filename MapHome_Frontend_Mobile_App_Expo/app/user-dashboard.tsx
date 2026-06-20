import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Calendar,
  Clock3,
  CheckCircle2,
  CheckCheck,
  Shield,
  BookOpen,
  MapPin,
  Settings,
  GitCompare,
  KeyRound,
  UserCircle,
  Eye,
  Star,
  Phone,
  MessageSquare,
  Bell,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import ROUTES, { navigateTo, safeBack } from "@/constants/routes";
import api from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCompare } from "@/contexts/CompareContext";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";

type DashboardTab = "overview" | "bookings" | "blogs" | "notifications";

export default function UserDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>((params.tab as DashboardTab) || "overview");

  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as DashboardTab);
    }
  }, [params.tab]);
  const [screenLoading, setScreenLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [favorites, setFavorites] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [myBlogs, setMyBlogs] = useState<any[]>([]);
  const [savedBlogs, setSavedBlogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { compareList } = useCompare();
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");
  const info = useThemeColor({}, "info");
  const warning = useThemeColor({}, "warning");
  const danger = useThemeColor({}, "danger");
  const success = useThemeColor({}, "success");

  const fetchData = async () => {
    if (!isAuthenticated || !user) {
      setScreenLoading(false);
      return;
    }

    try {
      setScreenLoading(true);
      const [
        favRes,
        bookingRes,
        inspectRes,
        myBlogsRes,
        savedBlogsRes,
        notifRes,
      ] = await Promise.all([
        api.get("/api/user/me/favorites").catch(() => ({ data: [] })),
        api.get("/api/user/bookings").catch(() => ({ data: [] })),
        api.get("/api/user/inspections").catch(() => ({ data: [] })),
        api.get("/api/blogs/my-blogs").catch(() => ({ data: [] })),
        api.get("/api/blogs/me/saved").catch(() => ({ data: [] })),
        api.get("/api/notifications").catch(() => ({ data: [] })),
      ]);

      setFavorites(favRes.data || []);
      setAppointments(bookingRes.data || []);
      setInspections(inspectRes.data || []);
      setMyBlogs(myBlogsRes.data || []);
      setSavedBlogs(savedBlogsRes.data || []);
      setNotifications(notifRes.data || []);
    } catch (e) {
      console.error("Error fetching user data", e);
    } finally {
      setScreenLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, user]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [isAuthenticated, user]);

  const stats = useMemo(
    () => [
      {
        label: "Trọ yêu thích",
        value: favorites.length,
        icon: Heart,
        color: "bg-red-500",
        iconColor: "#ef4444",
      },
      {
        label: "Lịch hẹn",
        value: appointments.length,
        icon: Calendar,
        color: "bg-blue-500",
        iconColor: "#3b82f6",
      },
      {
        label: "Chờ duyệt",
        value: appointments.filter((item) => item.status === "pending").length,
        icon: Clock3,
        color: "bg-amber-500",
        iconColor: "#f59e0b",
      },
      {
        label: "Hoàn tất",
        value: appointments.filter((item) => item.status === "completed")
          .length,
        icon: CheckCircle2,
        color: "bg-emerald-500",
        iconColor: "#22c55e",
      },
    ],
    [favorites, appointments],
  );

  const menuItems: Array<{ id: DashboardTab; label: string; icon: any }> = [
    { id: "overview", label: "Tổng quan", icon: Eye },
    { id: "bookings", label: "Lịch hẹn", icon: Calendar },
    { id: "blogs", label: "Bài viết", icon: BookOpen },
    { id: "notifications", label: "Thông báo", icon: Bell },
  ];

  const handleInspectionPayment = async (booking: any) => {
    try {
      setScreenLoading(true);
      // Lấy phí xác minh (có thể gọi API hoặc dùng cứng, ở đây ta gọi API)
      const feeRes = await api.get("/api/payments/inspection-fee").catch(() => ({ data: { fee: 119000 } }));
      const fee = feeRes.data.fee || 119000;

      const appReturnUrl = ExpoLinking.createURL("/");
      const res = await api.post("/api/payments/create", {
        amount: fee,
        planId: "inspection",
        bookingId: booking._id,
        description: "Phi xac minh tro",
        appReturnUrl,
      });

      if (res.status === 200 && res.data.url) {
        // Mở PayOS trong in-app browser
        const result = await WebBrowser.openAuthSessionAsync(res.data.url, appReturnUrl);
        
        if (result.type === "success") {
          Alert.alert("Thành công", "Đã xử lý thanh toán. Dữ liệu đang được làm mới.");
          await fetchData();
        } else if (result.type === "cancel" || result.type === "dismiss") {
          Alert.alert("Đã hủy", "Bạn đã hủy thanh toán.");
        }
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi thanh toán",
        error.response?.data?.message || "Không thể khởi tạo thanh toán."
      );
    } finally {
      setScreenLoading(false);
    }
  };

  if (loading || screenLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={tint} />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user || user.role !== "user") {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-emerald-700 font-black text-xl text-center mb-3">
          Bạn không có quyền truy cập trang này
        </Text>
        <TouchableOpacity
          onPress={() => navigateTo(router, ROUTES.LOGIN, true)}
          className="bg-emerald-600 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold">Đăng nhập lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => safeBack(router)}
            className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color={icon} />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-black text-emerald-700">
              Dashboard
            </Text>
            <Text className="text-xs text-slate-500 font-semibold">
              Quản lý hành trình tìm trọ
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="px-4 py-3 bg-white border-b border-slate-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveTab(item.id)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                activeTab === item.id
                  ? "bg-emerald-600"
                  : "bg-slate-100 border border-slate-200"
              }`}
            >
              <item.icon
                size={16}
                color={activeTab === item.id ? "white" : icon}
              />
              <Text
                className={`ml-2 font-bold text-sm ${
                  activeTab === item.id ? "text-white" : "text-slate-700"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <View>
            {/* Welcome Card */}
            <LinearGradient
              colors={['#16a34a', '#0ea5e9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-[2rem] p-6 mb-4 shadow-md"
            >
              <Text className="text-white font-black text-2xl mb-1">
                Xin chào, {user.fullName || user.username}! 👋
              </Text>
              <Text className="text-emerald-50 text-sm font-bold">
                Nơi quản lý hành trình tìm kiếm ngôi nhà mơ ước của bạn
              </Text>
            </LinearGradient>

            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between mb-4">
              {stats.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-[48%] active:opacity-80 mb-3 shadow-sm"
                >
                  <LinearGradient
                    colors={["#ffffff", "#f8fafc"]}
                    className="flex-1 rounded-[1.5rem] p-4 border border-slate-100"
                  >
                    <View
                      className={`w-10 h-10 rounded-2xl ${
                        item.color === "bg-red-500"
                          ? "bg-red-50 border border-red-100"
                          : item.color === "bg-blue-500"
                          ? "bg-blue-50 border border-blue-100"
                          : item.color === "bg-amber-500"
                          ? "bg-orange-50 border border-orange-100"
                          : "bg-green-50 border border-green-100"
                      } items-center justify-center mb-2`}
                    >
                      <item.icon
                        size={18}
                        color={
                          item.color === "bg-red-500"
                            ? "#ef4444"
                            : item.color === "bg-blue-500"
                            ? "#3b82f6"
                            : item.color === "bg-amber-500"
                            ? "#f97316"
                            : "#22c55e"
                        }
                      />
                    </View>
                    <Text className="text-3xl font-black text-indigo-600 mb-1">
                      {item.value}
                    </Text>
                    <Text className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest leading-none">
                      {item.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Bookings */}
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 mb-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-black text-emerald-700">
                  Lịch hẹn gần đây
                </Text>
                {appointments.length > 0 && (
                  <Text className="text-xs text-slate-500 font-bold">
                    {appointments.length} lịch
                  </Text>
                )}
              </View>

              {appointments.length === 0 ? (
                <View className="items-center py-6">
                  <Calendar size={32} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-2 text-center">
                    Bạn chưa có lịch hẹn nào.
                  </Text>
                </View>
              ) : (
                appointments.slice(0, 3).map((item, idx) => (
                  <TouchableOpacity
                    key={item._id || idx}
                    className="py-3 border-b border-slate-100 flex-row items-center active:bg-slate-50 px-2 rounded-lg"
                  >
                    {item.propertyId?.image && (
                      <Image
                        source={{ uri: item.propertyId.image }}
                        className="w-12 h-12 rounded-lg mr-3"
                      />
                    )}
                    <View className="flex-1">
                      <Text
                        className="font-bold text-emerald-700 mb-1"
                        numberOfLines={1}
                      >
                        {item.propertyId?.name || "Phòng trọ"}
                      </Text>
                      <View className="flex-row items-center">
                        <MapPin size={12} color={icon} />
                        <Text
                          className="text-xs text-slate-500 ml-1"
                          numberOfLines={1}
                        >
                          {item.propertyId?.address || "Chưa cập nhật"}
                        </Text>
                      </View>
                      <Text className="text-[10px] text-slate-400 mt-1">
                        {item.bookingDate
                          ? new Date(item.bookingDate).toLocaleDateString(
                              "vi-VN",
                            )
                          : ""}
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-1 rounded-full ${
                        item.status === "completed"
                          ? "bg-emerald-50"
                          : "bg-amber-50"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          item.status === "completed"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {item.status === "completed" ? "✓ Hoàn tất" : "⏳ Chờ"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {appointments.length > 3 && (
                <TouchableOpacity
                  onPress={() => setActiveTab("bookings")}
                  className="mt-3 py-2 px-3 rounded-xl bg-emerald-50 items-center"
                >
                  <Text className="text-emerald-700 font-bold text-sm">
                    Xem tất cả {appointments.length} lịch hẹn
                  </Text>
                </TouchableOpacity>
              )}
            </LinearGradient>

            {/* Content Stats */}
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 mb-4 shadow-sm"
            >
              <Text className="text-lg font-black text-emerald-700 mb-4">
                Nội dung của bạn
              </Text>
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => setActiveTab("blogs")}
                  className="items-center flex-1 py-3 px-2 rounded-xl active:bg-slate-50"
                >
                  <Heart size={20} color={danger} />
                  <Text className="text-2xl font-black text-emerald-700 mt-2">
                    {favorites.length}
                  </Text>
                  <Text className="text-[10px] text-slate-500 font-bold uppercase">
                    Yêu thích
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab("blogs")}
                  className="items-center flex-1 py-3 px-2 rounded-xl active:bg-slate-50"
                >
                  <BookOpen size={20} color={info} />
                  <Text className="text-2xl font-black text-emerald-700 mt-2">
                    {savedBlogs.length}
                  </Text>
                  <Text className="text-[10px] text-slate-500 font-bold uppercase">
                    Blog đã lưu
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab("blogs")}
                  className="items-center flex-1 py-3 px-2 rounded-xl active:bg-slate-50"
                >
                  <BookOpen size={20} color={tint} />
                  <Text className="text-2xl font-black text-emerald-700 mt-2">
                    {myBlogs.length}
                  </Text>
                  <Text className="text-[10px] text-slate-500 font-bold uppercase">
                    Blog của tôi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center flex-1 py-3 px-2 rounded-xl active:bg-slate-50">
                  <Eye size={20} color={warning} />
                  <Text className="text-2xl font-black text-emerald-700 mt-2">
                    {inspections.length}
                  </Text>
                  <Text className="text-[10px] text-slate-500 font-bold uppercase">
                    Lượt kiểm tra
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Quick Actions */}
            <View className="flex-row mb-4 gap-2">
              <TouchableOpacity
                onPress={() => navigateTo(router, ROUTES.SAVED)}
                className="flex-1 h-12 rounded-2xl shadow-sm active:opacity-80 overflow-hidden"
              >
                <LinearGradient
                  colors={["#16a34a", "#0ea5e9"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-1 flex-row items-center justify-center"
                >
                  <Heart size={16} color="white" />
                  <Text className="text-white font-black ml-2">Yêu thích</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateTo(router, ROUTES.COMPARE)}
                className="flex-1 bg-white border border-slate-200 h-12 rounded-2xl items-center justify-center active:opacity-80 flex-row relative shadow-sm"
              >
                {compareList?.length > 0 && (
                  <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center z-10">
                    <Text className="text-[10px] text-white font-bold">
                      {compareList.length}
                    </Text>
                  </View>
                )}
                <GitCompare size={16} color={icon} />
                <Text className="text-slate-700 font-black ml-2">So sánh</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <View>
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 mb-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-black text-emerald-700">
                  Lịch hẹn của bạn
                </Text>
                <View className="bg-emerald-50 px-3 py-1 rounded-full">
                  <Text className="text-emerald-700 font-bold text-sm">
                    {appointments.length}
                  </Text>
                </View>
              </View>

              {appointments.length === 0 ? (
                <View className="items-center py-8">
                  <Calendar size={40} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-3 text-center font-semibold">
                    Không có lịch hẹn nào
                  </Text>
                </View>
              ) : (
                appointments.map((item, idx) => (
                  <TouchableOpacity
                    key={item._id || idx}
                    className="bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100 active:bg-slate-100"
                  >
                    {item.propertyId?.image && (
                      <Image
                        source={{ uri: item.propertyId.image }}
                        className="w-full h-40 rounded-xl mb-3"
                      />
                    )}
                    <Text className="font-black text-emerald-700 text-base mb-1">
                      {item.propertyId?.name || "Phòng trọ"}
                    </Text>
                    <View className="flex-row items-center mb-2">
                      <MapPin size={14} color={icon} />
                      <Text className="text-sm text-slate-600 ml-1 flex-1">
                        {item.propertyId?.address}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      <Calendar size={14} color={icon} />
                      <Text className="text-sm text-slate-600 ml-1">
                        {item.bookingDate
                          ? new Date(item.bookingDate).toLocaleDateString(
                              "vi-VN",
                            )
                          : ""}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock3 size={14} color={icon} />
                      <Text className="text-sm text-slate-600 ml-1">
                        {item.bookingTime}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-200">
                      <View
                        className={`px-3 py-1 rounded-full ${
                          item.status === "completed"
                            ? "bg-emerald-50"
                            : item.status === "confirmed"
                            ? "bg-blue-50"
                            : "bg-amber-50"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            item.status === "completed"
                              ? "text-emerald-700"
                              : item.status === "confirmed"
                              ? "text-blue-700"
                              : "text-amber-700"
                          }`}
                        >
                          {item.status === "completed"
                            ? "✓ Hoàn tất"
                            : item.status === "confirmed"
                            ? "✓ Đã xác nhận"
                            : "⏳ Chờ duyệt"}
                        </Text>
                      </View>
                      {item.propertyId?.phone && (
                        <TouchableOpacity className="flex-row items-center px-3 py-1 rounded-full bg-slate-100">
                          <Phone size={12} color={icon} />
                          <Text className="text-xs font-bold text-slate-700 ml-1">
                            Liên hệ
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Nút thanh toán phí xác minh */}
                    {item.status === "confirmed" && (
                      <View className="mt-3 pt-3 border-t border-slate-100">
                        {inspections.some((insp) => String(insp.bookingId) === String(item._id)) ? (
                          <View className="flex-row items-center px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                            <CheckCheck size={16} color={success} />
                            <Text className="text-sm font-bold text-emerald-700 ml-2">Yêu cầu xác minh đã gửi</Text>
                          </View>
                        ) : (
                          <TouchableOpacity 
                            onPress={() => handleInspectionPayment(item)}
                            className="flex-row items-center justify-center px-4 py-3 bg-blue-600 rounded-xl shadow-sm active:opacity-80"
                          >
                            <Shield size={16} color="white" />
                            <Text className="text-sm font-black text-white ml-2">Thanh toán xác minh trọ</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </LinearGradient>
          </View>
        )}

        {/* Blogs Tab */}
        {activeTab === "blogs" && (
          <View>
            {/* Saved Blogs */}
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 mb-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-black text-emerald-700">
                  Bài viết đã lưu
                </Text>
                <View className="bg-red-50 px-3 py-1 rounded-full">
                  <Text className="text-red-700 font-bold text-sm">
                    {savedBlogs.length}
                  </Text>
                </View>
              </View>

              {savedBlogs.length === 0 ? (
                <View className="items-center py-6">
                  <BookOpen size={32} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-2 text-center">
                    Không có bài viết đã lưu
                  </Text>
                </View>
              ) : (
                savedBlogs.slice(0, 3).map((blog, idx) => (
                  <TouchableOpacity
                    key={blog._id || idx}
                    className="py-3 px-3 border-b border-slate-100 rounded-lg active:bg-slate-50"
                  >
                    <Text className="font-bold text-emerald-700 mb-1">
                      {blog.title || "Bài viết không tiêu đề"}
                    </Text>
                    <Text className="text-xs text-slate-500 line-clamp-2">
                      {blog.description || blog.content || ""}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </LinearGradient>

            {/* My Blogs */}
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 mb-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-black text-emerald-700">
                  Bài viết của tôi
                </Text>
                <View className="bg-emerald-50 px-3 py-1 rounded-full">
                  <Text className="text-emerald-700 font-bold text-sm">
                    {myBlogs.length}
                  </Text>
                </View>
              </View>

              {myBlogs.length === 0 ? (
                <View className="items-center py-6">
                  <BookOpen size={32} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-2 text-center">
                    Bạn chưa viết bài viết nào
                  </Text>
                </View>
              ) : (
                myBlogs.slice(0, 3).map((blog, idx) => (
                  <TouchableOpacity
                    key={blog._id || idx}
                    className="py-3 px-3 border-b border-slate-100 rounded-lg active:bg-slate-50"
                  >
                    <Text className="font-bold text-emerald-700 mb-1">
                      {blog.title || "Bài viết không tiêu đề"}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Star size={12} color={warning} fill={warning} />
                      <Text className="text-xs text-slate-500 ml-1">
                        {blog.rating || 0} sao
                      </Text>
                      <View className="w-1 h-1 bg-slate-300 rounded-full mx-2" />
                      <MessageSquare size={12} color={icon} />
                      <Text className="text-xs text-slate-500 ml-1">
                        {blog.comments?.length || 0} bình luận
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </LinearGradient>
          </View>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <View>
            {/* Notifications Section */}
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-black text-emerald-700">
                  Thông báo của bạn
                </Text>
                {notifications.length > 0 && (
                  <View className="bg-blue-50 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 font-bold text-sm">
                      {notifications.length}
                    </Text>
                  </View>
                )}
              </View>

              {notifications.length === 0 ? (
                <Text className="text-slate-500 text-center py-4">
                  Không có thông báo nào
                </Text>
              ) : (
                notifications.map((notif, idx) => (
                  <View
                    key={notif._id || idx}
                    className="py-3 border-b border-slate-100"
                  >
                    <Text className="font-bold text-slate-800 text-sm">
                      {notif.title}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-1">
                      {notif.message}
                    </Text>
                  </View>
                ))
              )}
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
