import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  Zap,
  Bot,
  Eye,
  Clock,
  CheckCircle2,
  Ticket,
} from "lucide-react-native";
import api from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as Clipboard from "expo-clipboard";

type DashboardTab =
  | "overview"
  | "posts"
  | "bookings"
  | "leads"
  | "verification"
  | "notifications";

export default function LandlordDashboardScreen() {
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
    if (queryTab) {
      setActiveTab(queryTab as DashboardTab);
    }
  }, [queryTab]);

  const [analytics, setAnalytics] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);

  const fetchData = async (activeTab: DashboardTab) => {
    try {
      setScreenLoading(true);
      if (activeTab === "overview") {
        const [aRes, pRes, vRes] = await Promise.all([
          api.get("/api/landlord/analytics").catch(() => ({ data: null })),
          api.get("/api/landlord/properties").catch(() => ({ data: [] })),
          api.get("/api/vouchers").catch(() => ({ data: [] })),
        ]);
        setAnalytics(aRes.data);
        setPosts(pRes.data || []);
        setVouchers(vRes.data || []);
      }
      if (activeTab === "posts") {
        const res = await api
          .get("/api/landlord/properties")
          .catch(() => ({ data: [] }));
        setPosts(res.data || []);
      }
      if (activeTab === "bookings") {
        const res = await api
          .get("/api/landlord/bookings")
          .catch(() => ({ data: [] }));
        setBookings(res.data || []);
      }
      if (activeTab === "leads") {
        const res = await api
          .get("/api/landlord/leads")
          .catch(() => ({ data: { leads: [] } }));
        setLeads(res.data?.leads || []);
      }
      if (activeTab === "verification") {
        const res = await api
          .get("/api/landlord/verification-requests")
          .catch(() => ({ data: [] }));
        setVerifications(res.data || []);
      }
      if (activeTab === "notifications") {
        const res = await api
          .get("/api/notifications")
          .catch(() => ({ data: [] }));
        setNotifications(res.data || []);
      }
    } finally {
      setScreenLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setScreenLoading(false);
      return;
    }
    fetchData(activeTab);
  }, [isAuthenticated, user, activeTab]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData(activeTab).finally(() => setRefreshing(false));
  }, [activeTab]);

  const stats = useMemo(
    () => [
      {
        label: "Tin đăng",
        value: analytics?.totalProperties || posts.length,
        icon: FileText,
        color: "bg-blue-500",
      },
      {
        label: "Đã duyệt",
        value: analytics?.approvedProperties || 0,
        icon: CheckCircle2,
        color: "bg-emerald-500",
      },
      {
        label: "Lượt xem",
        value: analytics?.totalViews || 0,
        icon: Eye,
        color: "bg-purple-500",
      },
      {
        label: "Lịch hẹn",
        value: bookings.length,
        icon: CalendarDays,
        color: "bg-orange-500",
      },
    ],
    [analytics, posts.length, bookings.length],
  );

  const { expiredCount, soonToExpireCount } = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    let expired = 0;
    let soon = 0;

    posts.forEach((post) => {
      if (post.status === "expired") {
        expired++;
      } else if (post.expiryDate) {
        const expiry = new Date(post.expiryDate);
        if (expiry < now) {
          expired++;
        } else if (expiry < threeDaysFromNow) {
          soon++;
        }
      }
    });

    return { expiredCount: expired, soonToExpireCount: soon };
  }, [posts]);

  const ExpiryWarningBanner = () => {
    if (expiredCount === 0 && soonToExpireCount === 0) return null;

    return (
      <View className="mb-4 rounded-3xl bg-amber-50 border border-amber-200 p-5 shadow-sm">
        <View className="flex-row items-start mb-3">
          <View className="w-10 h-10 rounded-xl bg-amber-500 items-center justify-center mr-3">
            <AlertTriangle size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-amber-900 leading-tight">
              {expiredCount > 0
                ? `Bạn có ${expiredCount} tin đăng đã hết hạn!`
                : `Bạn có ${soonToExpireCount} tin đăng sắp hết hạn!`}
            </Text>
            <Text className="text-amber-700 font-bold text-xs mt-1">
              Gia hạn ngay để tiếp tục tiếp cận khách hàng.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setActiveTab("posts")}
          className="bg-amber-600 h-12 rounded-2xl flex-row items-center justify-center shadow-sm active:opacity-80"
        >
          <Zap size={16} color="white" />
          <Text className="text-white font-black ml-2">Gia hạn ngay</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleToggleAvailability = async (post: any) => {
    const next = !post.available;
    try {
      await api.put(`/api/properties/${post._id || post.id}`, {
        available: next,
      });
      setPosts((prev) =>
        prev.map((p) =>
          (p._id || p.id) === (post._id || post.id)
            ? { ...p, available: next }
            : p,
        ),
      );
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái phòng.");
    }
  };

  const handleBookingStatus = async (
    bookingId: string,
    status: "confirmed" | "cancelled" | "completed",
  ) => {
    try {
      await api.put(`/api/bookings/${bookingId}/status`, { status });
      setBookings((prev) =>
        prev.map((item) =>
          item._id === bookingId ? { ...item, status } : item,
        ),
      );
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật lịch hẹn.");
    }
  };

  const copyToClipboard = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Thành công", `Đã sao chép mã voucher: ${code}`);
  };

  if (loading || screenLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={tint} />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user || user.role !== "landlord") {
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

  const menuItems = [
    {
      id: "overview" as DashboardTab,
      label: "Tổng quan",
      icon: LayoutDashboard,
    },
    { id: "posts" as DashboardTab, label: "Tin đăng", icon: FileText },
    { id: "bookings" as DashboardTab, label: "Lịch hẹn", icon: CalendarDays },
    { id: "leads" as DashboardTab, label: "Khách", icon: Users },
    {
      id: "verification" as DashboardTab,
      label: "Xác thực",
      icon: ShieldCheck,
    },
    { id: "notifications" as DashboardTab, label: "Thông báo", icon: Bell },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
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
            Quản lý tin đăng và lịch hẹn
          </Text>
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
              colors={['#16a34a', '#15803d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl p-5 mb-4 shadow-sm"
            >
              <Text className="text-white font-black text-xl mb-1">
                Xin chào, {user.fullName || user.username}! 👋
              </Text>
              <Text className="text-emerald-100 text-sm font-medium">
                Quản lý tin đăng và lịch hẹn khách thuê
              </Text>
            </LinearGradient>

            <ExpiryWarningBanner />

            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between mb-4">
              {stats.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  className="w-[48%] bg-white rounded-2xl p-4 border border-slate-100 mb-3 shadow-sm active:opacity-80"
                >
                  <View
                    className={`w-9 h-9 rounded-xl ${item.color} items-center justify-center mb-2`}
                  >
                    <item.icon size={16} color="white" />
                  </View>
                  <Text className="text-2xl font-black text-emerald-700">
                    {item.value}
                  </Text>
                  <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Voucher Section */}
            {vouchers.length > 0 && (
              <LinearGradient
                colors={['#10b981', '#3b82f6', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-5 mb-4 shadow-sm"
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 items-center justify-center bg-white/20 rounded-2xl mr-3">
                    <Ticket size={20} color="white" />
                  </View>
                  <View>
                    <Text className="text-white font-black text-lg">
                      Ưu Đãi Đặc Quyền Hôm Nay
                    </Text>
                    <Text className="text-emerald-50 text-xs font-semibold">
                      Nhập mã khi thanh toán để nhận khuyến mãi
                    </Text>
                  </View>
                </View>

                {vouchers.map((voucher) => (
                  <View
                    key={voucher._id || voucher.id}
                    className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between border border-slate-100"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="items-center justify-center bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl mr-3">
                        <Text className="text-emerald-700 font-black text-lg">
                          {voucher.discountPercentage}%
                        </Text>
                        <Text className="text-emerald-600 font-bold text-[9px] uppercase tracking-wider">
                          GIẢM
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-black text-slate-800 text-sm" numberOfLines={1}>
                          Giảm {voucher.discountPercentage}% hóa đơn
                        </Text>
                        <Text className="text-[10px] text-slate-500 mt-0.5" numberOfLines={1}>
                          {voucher.description || "Áp dụng cho mọi dịch vụ tin đăng"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => copyToClipboard(voucher.code)}
                      className="bg-emerald-600 px-3 py-2 rounded-xl active:opacity-80"
                    >
                      <Text className="text-white font-black text-xs uppercase">
                        Lưu mã
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </LinearGradient>
            )}

            {/* Recent Posts */}
            <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-black text-emerald-700">
                  Tin đăng gần đây
                </Text>
                {posts.length > 0 && (
                  <Text className="text-xs text-slate-500 font-bold">
                    {posts.length} tin
                  </Text>
                )}
              </View>

              {posts.length === 0 ? (
                <View className="items-center py-6">
                  <FileText size={32} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-2 text-center">
                    Bạn chưa đăng tin nào
                  </Text>
                </View>
              ) : (
                posts.slice(0, 3).map((item, idx) => (
                  <TouchableOpacity
                    key={item._id || idx}
                    className="py-3 border-b border-slate-100 flex-row items-center active:bg-slate-50 px-2 rounded-lg"
                  >
                    {item.images && item.images.length > 0 && (
                      <Image
                        source={{ uri: item.images[0] }}
                        className="w-12 h-12 rounded-lg mr-3"
                      />
                    )}
                    <View className="flex-1">
                      <Text
                        className="font-bold text-emerald-700 mb-1"
                        numberOfLines={1}
                      >
                        {item.name || "Phòng trọ"}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {(item.price || 0).toLocaleString("vi-VN")}đ/tháng
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-1 rounded-full ${
                        item.available ? "bg-emerald-50" : "bg-red-50"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          item.available ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {item.available ? "✓ Còn" : "✕ Hết"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setActiveTab("posts")}
                className="flex-1 bg-emerald-600 h-12 rounded-2xl items-center justify-center shadow-sm active:opacity-80"
              >
                <Text className="text-white font-black">Xem tin đăng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("bookings")}
                className="flex-1 bg-white border border-slate-200 h-12 rounded-2xl items-center justify-center active:opacity-80"
              >
                <Text className="text-slate-700 font-black">Lịch hẹn</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <View>
            <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-black text-emerald-700">
                  Danh sách tin đăng
                </Text>
                <View className="bg-emerald-50 px-3 py-1 rounded-full">
                  <Text className="text-emerald-700 font-bold text-sm">
                    {posts.length}
                  </Text>
                </View>
              </View>

              {posts.length === 0 ? (
                <View className="items-center py-8">
                  <FileText size={40} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-3 text-center font-semibold">
                    Chưa có tin đăng
                  </Text>
                </View>
              ) : (
                posts.map((post, idx) => (
                  <TouchableOpacity
                    key={post._id || idx}
                    className="bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100 active:bg-slate-100"
                  >
                    {post.images && post.images.length > 0 && (
                      <Image
                        source={{ uri: post.images[0] }}
                        className="w-full h-40 rounded-xl mb-3"
                      />
                    )}
                    <Text className="font-black text-emerald-700 text-base mb-1">
                      {post.name || "Phòng trọ"}
                    </Text>
                    <Text className="text-sm text-slate-600 mb-2">
                      {(post.price || 0).toLocaleString("vi-VN")}đ/tháng
                    </Text>

                    {post.status === "expired" ||
                    (post.expiryDate &&
                      new Date(post.expiryDate) < new Date()) ? (
                      <View className="mt-3 bg-red-50 p-3 rounded-xl flex-row items-center justify-between border border-red-100">
                        <Text className="text-xs text-red-600 font-bold">
                          ⏰ Đã hết hạn
                        </Text>
                        <TouchableOpacity
                          onPress={() => navigateTo(router, ROUTES.PROFILE)}
                          className="bg-red-600 px-3 py-1.5 rounded-lg"
                        >
                          <Text className="text-white text-xs font-bold">
                            Gia hạn
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View className="flex-row mt-3">
                        <TouchableOpacity
                          onPress={() => handleToggleAvailability(post)}
                          className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200"
                        >
                          <Text className="text-xs font-bold text-emerald-700 text-center">
                            {post.available ? "🔒 Hết phòng" : "✓ Còn phòng"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <View>
            <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-black text-emerald-700">
                  Lịch hẹn khách thuê
                </Text>
                <View className="bg-blue-50 px-3 py-1 rounded-full">
                  <Text className="text-blue-700 font-bold text-sm">
                    {bookings.length}
                  </Text>
                </View>
              </View>

              {bookings.length === 0 ? (
                <View className="items-center py-8">
                  <CalendarDays size={40} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-3 text-center font-semibold">
                    Chưa có lịch hẹn
                  </Text>
                </View>
              ) : (
                bookings.map((booking, idx) => (
                  <View
                    key={booking._id || idx}
                    className="bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="font-black text-emerald-700 text-base">
                          {booking.propertyId?.name || "Phòng trọ"}
                        </Text>
                        <Text className="text-xs text-slate-600 mt-1">
                          Khách:{" "}
                          {booking.customerName ||
                            booking.userId?.fullName ||
                            "Khách thuê"}
                        </Text>
                      </View>
                      {(() => {
                        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                          pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "⏳ Chờ xác nhận" },
                          confirmed: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "✓ Đã xác nhận" },
                          cancelled: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "✕ Đã hủy" },
                          completed: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "✓ Đã hoàn thành" },
                        };
                        const config = statusConfig[booking.status] || {
                          bg: "bg-slate-50 border-slate-200",
                          text: "text-slate-700",
                          label: booking.status,
                        };
                        return (
                          <View className={`px-2.5 py-1 rounded-full border ${config.bg}`}>
                            <Text className={`text-[10px] font-black uppercase ${config.text}`}>
                              {config.label}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>

                    <View className="flex-row items-center mt-2 mb-3">
                      <Clock size={12} color={icon} />
                      <Text className="text-xs text-slate-600 ml-1">
                        {booking.bookingDate} {booking.bookingTime}
                      </Text>
                    </View>

                    {booking.status === "pending" && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() =>
                            handleBookingStatus(booking._id, "confirmed")
                          }
                          className="flex-1 px-3 py-2 rounded-xl bg-emerald-600"
                        >
                          <Text className="text-xs font-bold text-white text-center">
                            ✓ Duyệt
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleBookingStatus(booking._id, "cancelled")
                          }
                          className="flex-1 px-3 py-2 rounded-xl bg-red-100 border border-red-200"
                        >
                          <Text className="text-xs font-bold text-red-700 text-center">
                            ✕ Từ chối
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <View>
            <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-black text-emerald-700">
                  Khách hàng tiềm năng (AI)
                </Text>
                <View className="bg-purple-100 w-8 h-8 rounded-full items-center justify-center">
                  <Bot size={16} color="#7e22ce" />
                </View>
              </View>

              <Text className="text-xs text-slate-500 mb-4">
                Hệ thống AI tự động phân tích khách hàng phù hợp.
              </Text>

              {leads.length === 0 ? (
                <View className="items-center py-8">
                  <Bot size={40} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-3 font-semibold">
                    Chưa có dữ liệu phân tích
                  </Text>
                </View>
              ) : (
                leads.slice(0, 10).map((lead, idx) => (
                  <View
                    key={lead._id || idx}
                    className="bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100"
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="font-bold text-emerald-700 text-base">
                          {lead.name || lead.fullName || "Khách hàng"}
                        </Text>
                        <Text className="text-xs font-semibold text-slate-500 mt-1">
                          {lead.phone || lead.email || "Không có liên hệ"}
                        </Text>
                      </View>
                      <View className="bg-emerald-100 px-2 py-1 rounded-lg">
                        <Text className="text-[10px] font-black text-emerald-700">
                          95%
                        </Text>
                      </View>
                    </View>

                    <View className="bg-white p-3 rounded-xl border border-slate-100 mb-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase">
                          Ngân sách
                        </Text>
                        <Text className="text-xs font-bold text-emerald-600">
                          ~
                          {lead.budget
                            ? lead.budget.toLocaleString("vi-VN")
                            : "3.000.000"}
                          đ
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase">
                          Khu vực
                        </Text>
                        <Text className="text-xs font-bold text-slate-700">
                          {lead.preferredDistrict || "Quận 1"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity className="bg-emerald-600 py-2 rounded-xl items-center justify-center">
                      <Text className="text-white font-bold text-sm">
                        📞 Liên hệ ngay
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Verification Tab */}
        {activeTab === "verification" && (
          <View>
            <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-black text-emerald-700">
                  Yêu cầu xác thực
                </Text>
                <TouchableOpacity
                  onPress={() => navigateTo(router, "/verification-service")}
                  className="bg-emerald-600 px-3 py-1.5 rounded-xl flex-row items-center active:opacity-80"
                >
                  <ShieldCheck size={14} color="white" />
                  <Text className="text-white text-xs font-bold ml-1">
                    Đăng ký
                  </Text>
                </TouchableOpacity>
              </View>

              {verifications.length === 0 ? (
                <View className="items-center py-8">
                  <ShieldCheck size={40} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-3 text-center font-semibold">
                    Không có yêu cầu xác thực
                  </Text>
                </View>
              ) : (
                verifications.slice(0, 10).map((item, idx) => (
                  <View
                    key={item._id || idx}
                    className="bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100"
                  >
                    <Text className="font-bold text-emerald-700">
                      {item.propertyId?.name || "Tin đăng"}
                    </Text>
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-xs text-slate-500">
                        Trạng thái:
                      </Text>
                      <View
                        className={`px-2 py-1 rounded-full ${
                          item.status === "approved"
                            ? "bg-emerald-50"
                            : "bg-amber-50"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            item.status === "approved"
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {item.status || "Chờ"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <View>
            <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-black text-emerald-700">
                  Thông báo
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
                <View className="items-center py-8">
                  <Bell size={40} color={icon} opacity={0.5} />
                  <Text className="text-slate-500 mt-3 text-center font-semibold">
                    Chưa có thông báo
                  </Text>
                </View>
              ) : (
                notifications.slice(0, 10).map((item, idx) => (
                  <View
                    key={item._id || idx}
                    className="bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100"
                  >
                    <Text className="font-bold text-emerald-700">
                      {item.title || "Thông báo"}
                    </Text>
                    <Text className="text-xs text-slate-600 mt-1">
                      {item.message || ""}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
