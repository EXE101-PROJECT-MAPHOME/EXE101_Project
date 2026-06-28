import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import ROUTES, { navigateTo, safeBack } from "@/constants/routes";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  CalendarDays,
  Users,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle2,
  TrendingUp,
  Star,
  Phone,
  Mail,
  MapPin,
  PlusCircle,
  Trash2,
  Edit3,
  Sparkles,
  Zap,
  Bot,
} from "lucide-react-native";
import api from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/hooks/use-theme-color";

type DashboardTab = "overview" | "posts" | "bookings" | "leads" | "notifications";

const menuItems: Array<{ id: DashboardTab; label: string; icon: any }> = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "posts", label: "Tin quản lý", icon: FileText },
  { id: "bookings", label: "Lịch xem phòng", icon: CalendarDays },
  { id: "leads", label: "Khách hàng (AI)", icon: Users },
  { id: "notifications", label: "Thông báo", icon: Bell },
];

export default function BrokerDashboardScreen() {
  const router = useRouter();
  const { tab: queryTab } = useLocalSearchParams<{ tab: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    (queryTab as DashboardTab) || "overview",
  );
  const [screenLoading, setScreenLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");
  const warning = useThemeColor({}, "warning");
  const danger = useThemeColor({}, "danger");

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab as DashboardTab);
  }, [queryTab]);

  const [analytics, setAnalytics] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchData = useCallback(
    async (tab: DashboardTab) => {
      if (!isAuthenticated || !user) {
        setScreenLoading(false);
        return;
      }
      try {
        setScreenLoading(true);
        if (tab === "overview") {
          const [aRes, pRes] = await Promise.all([
            api.get("/api/broker/analytics").catch(() => ({ data: null })),
            api.get("/api/broker/properties").catch(() => ({ data: [] })),
          ]);
          setAnalytics(aRes.data);
          setPosts(pRes.data || []);
        }
        if (tab === "posts") {
          const res = await api.get("/api/broker/properties").catch(() => ({ data: [] }));
          setPosts(res.data || []);
        }
        if (tab === "bookings") {
          const res = await api.get("/api/broker/bookings").catch(() => ({ data: [] }));
          setBookings(res.data || []);
        }
        if (tab === "leads") {
          const res = await api
            .get("/api/broker/leads")
            .catch(() => ({ data: { leads: [] } }));
          setLeads(res.data?.leads || []);
        }
        if (tab === "notifications") {
          const res = await api.get("/api/notifications").catch(() => ({ data: [] }));
          setNotifications(res.data || []);
        }
      } finally {
        setScreenLoading(false);
      }
    },
    [isAuthenticated, user],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData(activeTab);
    }, [fetchData, activeTab]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(activeTab).finally(() => setRefreshing(false));
  }, [fetchData, activeTab]);

  const stats = useMemo(
    () => [
      {
        label: "Tin đăng",
        value: analytics?.totalProperties ?? posts.length,
        icon: FileText,
        colors: ["#4f46e5", "#7c3aed"] as [string, string],
        onPress: () => setActiveTab("posts"),
      },
      {
        label: "Lịch hẹn",
        value: analytics?.totalBookings ?? bookings.length,
        icon: CalendarDays,
        colors: ["#059669", "#0d9488"] as [string, string],
        onPress: () => setActiveTab("bookings"),
      },
      {
        label: "Chờ duyệt",
        value: bookings.filter((b) => b.status === "pending").length,
        icon: Clock,
        colors: ["#d97706", "#f59e0b"] as [string, string],
        onPress: () => setActiveTab("bookings"),
      },
      {
        label: "Lượt xem",
        value: analytics?.totalViews ?? 0,
        icon: Eye,
        colors: ["#db2777", "#9333ea"] as [string, string],
        onPress: () => setActiveTab("overview"),
      },
    ],
    [analytics, posts.length, bookings.length],
  );

  const handleDeletePost = (id: string) => {
    Alert.alert("Xóa tin đăng", "Bạn có chắc chắn muốn xóa tin đăng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/properties/${id}`);
            setPosts((prev) => prev.filter((p) => p._id !== id && p.id !== id));
            Alert.alert("Thành công", "Đã xóa tin đăng.");
          } catch {
            Alert.alert("Lỗi", "Không thể xóa tin đăng.");
          }
        },
      },
    ]);
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}/status`, { status });
      Alert.alert("Thành công", "Đã cập nhật trạng thái lịch hẹn.");
      fetchData("bookings");
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "⏳ Chờ duyệt";
      case "confirmed": return "✓ Đã xác nhận";
      case "completed": return "✓✓ Hoàn tất";
      case "cancelled": return "✗ Đã hủy";
      default: return status;
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case "confirmed": return { bg: "bg-emerald-50", text: "text-emerald-700" };
      case "completed": return { bg: "bg-blue-50", text: "text-blue-700" };
      case "cancelled": return { bg: "bg-red-50", text: "text-red-700" };
      default: return { bg: "bg-amber-50", text: "text-amber-700" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user || user.role !== "broker") {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-purple-700 font-black text-xl text-center mb-3">
          Chỉ dành cho Môi giới
        </Text>
        <TouchableOpacity
          onPress={() => navigateTo(router, ROUTES.LOGIN, true)}
          className="bg-purple-600 px-6 py-3 rounded-2xl"
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
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <View className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg overflow-hidden">
                <LinearGradient
                  colors={["#8b5cf6", "#4f46e5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0"
                />
                <Sparkles size={14} color="white" />
              </View>
              <Text className="text-2xl font-black text-purple-700">
                Môi giới
              </Text>
            </View>
            <Text className="text-xs text-slate-500 font-semibold">
              {user.fullName || user.username} • Gói {user.subscriptionTier && user.subscriptionTier.toLowerCase() !== "free" ? user.subscriptionTier : "Thường"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setActiveTab("notifications")}
          className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center relative"
        >
          <Bell size={18} color="#8b5cf6" />
          {notifications.some((n) => !n.isRead) && (
            <View className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white border-b border-slate-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveTab(item.id)}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                activeTab === item.id
                  ? "bg-purple-600"
                  : "bg-slate-100 border border-slate-200"
              }`}
            >
              <item.icon size={14} color={activeTab === item.id ? "white" : icon} />
              <Text
                className={`ml-1.5 font-bold text-xs ${
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
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <View>
            {/* Welcome banner */}
            <LinearGradient
              colors={["#7c3aed", "#4f46e5", "#0ea5e9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-[2rem] p-6 mb-4 shadow-md"
            >
              <View className="flex-row items-center mb-2">
                <Sparkles size={20} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/80 text-xs font-black ml-2 uppercase tracking-widest">
                  Môi giới Console
                </Text>
              </View>
              <Text className="text-white font-black text-2xl mb-1">
                Xin chào, {user.fullName || user.username}! 🤝
              </Text>
              <Text className="text-purple-100 text-sm font-semibold">
                Quản lý tin đăng và kết nối khách hàng hiệu quả
              </Text>
            </LinearGradient>

            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between mb-4">
              {stats.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-[48%] mb-3 shadow-sm active:opacity-80"
                  onPress={item.onPress}
                >
                  <LinearGradient
                    colors={["#ffffff", "#f8fafc"]}
                    className="rounded-[1.5rem] p-4 border border-slate-100"
                  >
                    <View className="w-10 h-10 rounded-2xl items-center justify-center mb-2 overflow-hidden">
                      <LinearGradient
                        colors={item.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="absolute inset-0"
                      />
                      <item.icon size={18} color="white" />
                    </View>
                    <Text className="text-3xl font-black text-indigo-600 mb-1">
                      {item.value}
                    </Text>
                    <Text className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest">
                      {item.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Posts */}
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 mb-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-black text-purple-700">Tin đăng gần đây</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab("posts")}
                  className="bg-purple-50 px-3 py-1 rounded-full"
                >
                  <Text className="text-purple-700 font-bold text-xs">Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              {posts.length === 0 ? (
                <View className="items-center py-6">
                  <FileText size={32} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-2 text-center">Chưa có tin đăng nào.</Text>
                </View>
              ) : (
                posts.slice(0, 3).map((post, idx) => (
                  <View
                    key={post._id || post.id || idx}
                    className="py-3 border-b border-slate-100 flex-row items-center"
                  >
                    {post.image && (
                      <Image
                        source={{ uri: post.image }}
                        className="w-12 h-12 rounded-xl mr-3"
                      />
                    )}
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800" numberOfLines={1}>
                        {post.name || post.title || "Bất động sản"}
                      </Text>
                      <Text className="text-xs text-slate-500" numberOfLines={1}>
                        {post.address || "Chưa có địa chỉ"}
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        post.status === "approved"
                          ? "bg-emerald-50"
                          : post.status === "pending"
                          ? "bg-amber-50"
                          : "bg-red-50"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          post.status === "approved"
                            ? "text-emerald-700"
                            : post.status === "pending"
                            ? "text-amber-700"
                            : "text-red-700"
                        }`}
                      >
                        {post.status === "approved"
                          ? "Đã duyệt"
                          : post.status === "pending"
                          ? "Chờ duyệt"
                          : "Đã hết hạn"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </LinearGradient>

            {/* Recent Bookings */}
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-black text-purple-700">Lịch hẹn gần đây</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab("bookings")}
                  className="bg-purple-50 px-3 py-1 rounded-full"
                >
                  <Text className="text-purple-700 font-bold text-xs">Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              {bookings.length === 0 ? (
                <View className="items-center py-6">
                  <CalendarDays size={32} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-2">Chưa có lịch hẹn nào.</Text>
                </View>
              ) : (
                bookings.slice(0, 3).map((b, idx) => {
                  const statusStyle = getStatusColors(b.status);
                  return (
                    <View
                      key={b._id || idx}
                      className="py-3 border-b border-slate-100 flex-row items-center"
                    >
                      <View className="flex-1">
                        <Text className="font-bold text-slate-800" numberOfLines={1}>
                          {b.propertyId?.name || b.propertyId?.title || "Phòng trọ"}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          {b.userId?.fullName || b.userId?.username || "Khách hàng"}
                        </Text>
                      </View>
                      <View className={`px-2 py-0.5 rounded-full ${statusStyle.bg}`}>
                        <Text className={`text-[10px] font-bold ${statusStyle.text}`}>
                          {getStatusLabel(b.status)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </LinearGradient>
          </View>
        )}

        {/* ─── POSTS TAB ─── */}
        {activeTab === "posts" && (
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-black text-purple-700">Tin đăng của tôi</Text>
              <TouchableOpacity
                onPress={() => navigateTo(router, ROUTES.POST_ROOM)}
                className="flex-row items-center bg-purple-600 px-4 py-2 rounded-2xl shadow-sm active:opacity-80"
              >
                <PlusCircle size={16} color="white" />
                <Text className="text-white font-bold text-sm ml-1.5">Đăng tin mới</Text>
              </TouchableOpacity>
            </View>

            {screenLoading ? (
              <ActivityIndicator size="large" color="#8b5cf6" />
            ) : posts.length === 0 ? (
              <LinearGradient
                colors={["#ffffff", "#f8fafc"]}
                className="rounded-[2rem] p-10 border border-slate-100 items-center"
              >
                <FileText size={48} color={icon} opacity={0.3} />
                <Text className="text-slate-500 mt-4 font-semibold text-center">
                  Bạn chưa có tin đăng nào.{"\n"}Hãy bắt đầu đăng tin ngay!
                </Text>
              </LinearGradient>
            ) : (
              posts.map((post, idx) => (
                <LinearGradient
                  key={post._id || post.id || idx}
                  colors={["#ffffff", "#f8fafc"]}
                  className="rounded-[2rem] p-4 border border-slate-100 mb-3 shadow-sm"
                >
                  <View className="flex-row">
                    {post.image ? (
                      <Image
                        source={{ uri: post.image }}
                        className="w-24 h-24 rounded-xl mr-4"
                      />
                    ) : (
                      <View className="w-24 h-24 rounded-xl mr-4 bg-purple-50 items-center justify-center">
                        <FileText size={28} color="#8b5cf6" opacity={0.5} />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-black text-slate-800 mb-1" numberOfLines={2}>
                        {post.name || post.title}
                      </Text>
                      <View className="flex-row items-center mb-1">
                        <MapPin size={12} color={icon} />
                        <Text className="text-xs text-slate-500 ml-1 flex-1" numberOfLines={1}>
                          {post.address}
                        </Text>
                      </View>
                      <Text className="text-purple-700 font-black text-sm">
                        {post.price
                          ? `${Number(post.price).toLocaleString("vi-VN")} đ/tháng`
                          : "Liên hệ"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <View
                      className={`px-3 py-1 rounded-full ${
                        post.status === "approved"
                          ? "bg-emerald-50"
                          : post.status === "expired"
                          ? "bg-red-50"
                          : "bg-amber-50"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          post.status === "approved"
                            ? "text-emerald-700"
                            : post.status === "expired"
                            ? "text-red-700"
                            : "text-amber-700"
                        }`}
                      >
                        {post.status === "approved"
                          ? "✓ Đã duyệt"
                          : post.status === "expired"
                          ? "Đã hết hạn"
                          : "⏳ Chờ duyệt"}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => navigateTo(router, ROUTES.ROOM(post._id || post.id))}
                        className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center"
                      >
                        <Eye size={16} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeletePost(post._id || post.id)}
                        className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              ))
            )}
          </View>
        )}

        {/* ─── BOOKINGS TAB ─── */}
        {activeTab === "bookings" && (
          <View>
            <Text className="text-lg font-black text-purple-700 mb-4">
              Lịch xem phòng ({bookings.length})
            </Text>
            {screenLoading ? (
              <ActivityIndicator size="large" color="#8b5cf6" />
            ) : bookings.length === 0 ? (
              <LinearGradient
                colors={["#ffffff", "#f8fafc"]}
                className="rounded-[2rem] p-10 border border-slate-100 items-center"
              >
                <CalendarDays size={48} color={icon} opacity={0.3} />
                <Text className="text-slate-500 mt-4 font-semibold">Chưa có lịch hẹn nào.</Text>
              </LinearGradient>
            ) : (
              bookings.map((b, idx) => {
                const statusStyle = getStatusColors(b.status);
                return (
                  <LinearGradient
                    key={b._id || idx}
                    colors={["#ffffff", "#f8fafc"]}
                    className="rounded-[2rem] p-5 border border-slate-100 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View>
                        <Text className="font-black text-slate-800">
                          {b.propertyId?.name || b.propertyId?.title || "Phòng trọ"}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          Khách: {b.userId?.fullName || b.userId?.username || "Ẩn danh"}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
                        <Text className={`text-xs font-bold ${statusStyle.text}`}>
                          {getStatusLabel(b.status)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-2">
                      <CalendarDays size={14} color={icon} />
                      <Text className="text-sm text-slate-600 ml-2">
                        {b.bookingDate
                          ? new Date(b.bookingDate).toLocaleDateString("vi-VN")
                          : "N/A"}{" "}
                        • {b.bookingTime || ""}
                      </Text>
                    </View>

                    {b.userId?.phone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${b.userId.phone}`)}
                        className="flex-row items-center mb-2"
                      >
                        <Phone size={14} color="#8b5cf6" />
                        <Text className="text-sm text-purple-700 ml-2 font-semibold">
                          {b.userId.phone}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {b.status === "pending" && (
                      <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100">
                        <TouchableOpacity
                          onPress={() => handleUpdateBookingStatus(b._id, "confirmed")}
                          className="flex-1 bg-emerald-600 py-2.5 rounded-xl items-center shadow-sm active:opacity-80"
                        >
                          <Text className="text-white font-black text-sm">✓ Duyệt</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleUpdateBookingStatus(b._id, "cancelled")}
                          className="flex-1 bg-red-50 border border-red-200 py-2.5 rounded-xl items-center active:opacity-80"
                        >
                          <Text className="text-red-700 font-black text-sm">✗ Từ chối</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {b.status === "confirmed" && (
                      <TouchableOpacity
                        onPress={() => handleUpdateBookingStatus(b._id, "completed")}
                        className="mt-3 pt-3 border-t border-slate-100 bg-blue-50 py-2.5 rounded-xl items-center active:opacity-80"
                      >
                        <Text className="text-blue-700 font-black text-sm">
                          ✓✓ Đánh dấu Hoàn tất
                        </Text>
                      </TouchableOpacity>
                    )}
                  </LinearGradient>
                );
              })
            )}
          </View>
        )}

        {/* ─── LEADS TAB ─── */}
        {activeTab === "leads" && (
          <View>
            <LinearGradient
              colors={["#7c3aed", "#4f46e5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-[2rem] p-5 mb-4 shadow-sm"
            >
              <View className="flex-row items-center mb-2">
                <Bot size={20} color="rgba(255,255,255,0.8)" />
                <Text className="text-white font-black text-base ml-2">Phân tích khách hàng AI</Text>
              </View>
              <Text className="text-purple-100 text-xs font-medium">
                Hệ thống AI phân tích hành vi và đề xuất khách hàng tiềm năng phù hợp
              </Text>
            </LinearGradient>

            {screenLoading ? (
              <ActivityIndicator size="large" color="#8b5cf6" />
            ) : leads.length === 0 ? (
              <LinearGradient
                colors={["#ffffff", "#f8fafc"]}
                className="rounded-[2rem] p-10 border border-slate-100 items-center"
              >
                <Users size={48} color={icon} opacity={0.3} />
                <Text className="text-slate-500 mt-4 font-semibold text-center">
                  Chưa có dữ liệu khách hàng tiềm năng.
                </Text>
              </LinearGradient>
            ) : (
              leads.map((lead, idx) => (
                <LinearGradient
                  key={lead._id || lead.id || idx}
                  colors={["#ffffff", "#f8fafc"]}
                  className="rounded-[2rem] p-5 border border-slate-100 mb-3 shadow-sm"
                >
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-2xl bg-purple-100 items-center justify-center mr-3">
                      <Text className="text-purple-700 font-black text-lg">
                        {(lead.fullName || lead.username || "?")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-slate-800">
                        {lead.fullName || lead.username}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-xs text-amber-700 font-bold ml-1">
                          Điểm phù hợp: {lead.matchScore || "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {lead.phone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${lead.phone}`)}
                      className="flex-row items-center mb-2"
                    >
                      <Phone size={14} color="#8b5cf6" />
                      <Text className="text-sm text-purple-700 ml-2 font-semibold">
                        {lead.phone}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {lead.email && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${lead.email}`)}
                      className="flex-row items-center"
                    >
                      <Mail size={14} color="#8b5cf6" />
                      <Text className="text-sm text-purple-700 ml-2 font-semibold">
                        {lead.email}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {lead.preferredArea && (
                    <View className="flex-row items-center mt-2 pt-2 border-t border-slate-100">
                      <MapPin size={12} color={icon} />
                      <Text className="text-xs text-slate-500 ml-1">
                        Khu vực mong muốn: {lead.preferredArea}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              ))
            )}
          </View>
        )}

        {/* ─── NOTIFICATIONS TAB ─── */}
        {activeTab === "notifications" && (
          <View>
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              className="rounded-[2rem] p-5 border border-slate-100 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-black text-purple-700">Thông báo</Text>
                {notifications.length > 0 && (
                  <View className="bg-purple-50 px-3 py-1 rounded-full">
                    <Text className="text-purple-700 font-bold text-sm">
                      {notifications.length}
                    </Text>
                  </View>
                )}
              </View>

              {screenLoading ? (
                <ActivityIndicator size="large" color="#8b5cf6" />
              ) : notifications.length === 0 ? (
                <View className="items-center py-8">
                  <Bell size={40} color={icon} opacity={0.3} />
                  <Text className="text-slate-500 mt-3 text-center font-semibold">
                    Không có thông báo nào
                  </Text>
                </View>
              ) : (
                notifications.map((notif, idx) => (
                  <View
                    key={notif._id || idx}
                    className={`py-3 border-b border-slate-100 ${
                      !notif.isRead ? "bg-purple-50/50" : ""
                    } rounded-lg px-2 mb-1`}
                  >
                    <View className="flex-row items-start">
                      {!notif.isRead && (
                        <View className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                      )}
                      <View className="flex-1">
                        <Text className="font-bold text-slate-800 text-sm mb-1">
                          {notif.title}
                        </Text>
                        <Text className="text-xs text-slate-500">{notif.message}</Text>
                      </View>
                    </View>
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
