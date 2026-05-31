import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
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
} from "lucide-react-native";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

type DashboardTab =
  | "overview"
  | "posts"
  | "bookings"
  | "leads"
  | "verification"
  | "notifications";

export default function LandlordDashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [screenLoading, setScreenLoading] = useState(true);

  const [analytics, setAnalytics] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchData = async (active: DashboardTab) => {
    try {
      setScreenLoading(true);
      if (active === "overview") {
        const [aRes, pRes] = await Promise.all([
          api.get("/api/landlord/analytics").catch(() => ({ data: null })),
          api.get("/api/landlord/properties").catch(() => ({ data: [] })),
        ]);
        setAnalytics(aRes.data);
        setPosts(pRes.data || []);
      }
      if (active === "posts") {
        const res = await api
          .get("/api/landlord/properties")
          .catch(() => ({ data: [] }));
        setPosts(res.data || []);
      }
      if (active === "bookings") {
        const res = await api
          .get("/api/landlord/bookings")
          .catch(() => ({ data: [] }));
        setBookings(res.data || []);
      }
      if (active === "leads") {
        const res = await api
          .get("/api/landlord/leads")
          .catch(() => ({ data: { leads: [] } }));
        setLeads(res.data?.leads || []);
      }
      if (active === "verification") {
        const res = await api
          .get("/api/landlord/verification-requests")
          .catch(() => ({ data: [] }));
        setVerifications(res.data || []);
      }
      if (active === "notifications") {
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
    fetchData(tab);
  }, [isAuthenticated, user, tab]);

  const stats = useMemo(
    () => [
      { label: "Tin đăng", value: analytics?.totalProperties || posts.length },
      { label: "Đã duyệt", value: analytics?.approvedProperties || 0 },
      { label: "Lượt xem", value: analytics?.totalViews || 0 },
      { label: "Lịch hẹn", value: analytics?.totalBookings || bookings.length },
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
          onPress={() => setTab("posts")}
          className="bg-amber-600 h-12 rounded-xl flex-row items-center justify-center"
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

  if (loading || screenLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user || user.role !== "landlord") {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-emerald-950 font-black text-xl text-center mb-3">
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
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
        >
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-black text-emerald-950">
            Landlord Dashboard
          </Text>
          <Text className="text-xs text-slate-500 font-semibold">
            Quản lý tin đăng và lịch hẹn
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {[
            { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
            { id: "posts", label: "Tin đăng", icon: FileText },
            { id: "bookings", label: "Lịch hẹn", icon: CalendarDays },
            { id: "leads", label: "Khách tiềm năng", icon: Users },
            { id: "verification", label: "Xác thực", icon: ShieldCheck },
            { id: "notifications", label: "Thông báo", icon: Bell },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setTab(item.id as DashboardTab)}
              className={`px-4 py-2 rounded-full mr-2 border flex-row items-center ${tab === item.id ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200"}`}
            >
              <item.icon
                size={14}
                color={tab === item.id ? "white" : "#334155"}
              />
              <Text
                className={`font-bold text-xs ml-1 ${tab === item.id ? "text-white" : "text-slate-700"}`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {tab === "overview" && (
          <View>
            <ExpiryWarningBanner />
            <View className="flex-row flex-wrap justify-between mb-4">
              {stats.map((item, idx) => (
                <View
                  key={idx}
                  className="w-[48%] bg-white rounded-2xl p-4 border border-slate-100 mb-3"
                >
                  <Text className="text-2xl font-black text-emerald-950">
                    {item.value}
                  </Text>
                  <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => navigateTo(router, ROUTES.PROFILE)}
              className="bg-emerald-600 h-12 rounded-xl items-center justify-center"
            >
              <Text className="text-white font-black">Quay về tài khoản</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === "posts" && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <Text className="text-base font-black text-emerald-950 mb-3">
              Danh sách tin đăng
            </Text>
            {posts.length === 0 ? (
              <Text className="text-slate-500">Chưa có tin đăng.</Text>
            ) : (
              posts.slice(0, 10).map((post, idx) => (
                <View
                  key={post._id || idx}
                  className="py-3 border-b border-slate-100"
                >
                  <Text
                    className="font-bold text-emerald-950"
                    numberOfLines={1}
                  >
                    {post.name || "Phòng trọ"}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {(post.price || 0).toLocaleString("vi-VN")}đ/tháng
                  </Text>

                  {post.status === "expired" ||
                  (post.expiryDate &&
                    new Date(post.expiryDate) < new Date()) ? (
                    <View className="mt-2 bg-red-50 p-2 rounded flex-row items-center justify-between">
                      <Text className="text-xs text-red-600 font-bold">
                        Đã hết hạn
                      </Text>
                      <TouchableOpacity
                        onPress={() => navigateTo(router, ROUTES.PROFILE)} // Hoặc redirect sang checkout gia hạn
                        className="bg-red-600 px-3 py-1.5 rounded-lg"
                      >
                        <Text className="text-white text-xs font-bold">
                          Gia hạn
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="flex-row mt-2">
                      <TouchableOpacity
                        onPress={() => handleToggleAvailability(post)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 mr-2"
                      >
                        <Text className="text-xs font-bold text-slate-700">
                          {post.available
                            ? "Đánh dấu hết phòng"
                            : "Mở lại còn phòng"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {tab === "bookings" && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <Text className="text-base font-black text-emerald-950 mb-3">
              Lịch hẹn khách thuê
            </Text>
            {bookings.length === 0 ? (
              <Text className="text-slate-500">Chưa có lịch hẹn.</Text>
            ) : (
              bookings.slice(0, 10).map((booking, idx) => (
                <View
                  key={booking._id || idx}
                  className="py-3 border-b border-slate-100"
                >
                  <Text
                    className="font-bold text-emerald-950"
                    numberOfLines={1}
                  >
                    {booking.propertyId?.name || "Phòng trọ"}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    Khách:{" "}
                    {booking.customerName ||
                      booking.userId?.fullName ||
                      "Khách thuê"}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {booking.bookingDate} - {booking.bookingTime}
                  </Text>
                  {booking.status === "pending" && (
                    <View className="flex-row mt-2">
                      <TouchableOpacity
                        onPress={() =>
                          handleBookingStatus(booking._id, "confirmed")
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 mr-2"
                      >
                        <Text className="text-xs font-bold text-white">
                          Duyệt
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleBookingStatus(booking._id, "cancelled")
                        }
                        className="px-3 py-1.5 rounded-xl bg-red-100"
                      >
                        <Text className="text-xs font-bold text-red-700">
                          Từ chối
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {tab === "leads" && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-black text-emerald-950">
                Khách hàng tiềm năng (AI)
              </Text>
              <View className="bg-purple-100 w-8 h-8 rounded-full items-center justify-center">
                <Bot size={16} color="#7e22ce" />
              </View>
            </View>

            <Text className="text-xs text-slate-500 mb-4">
              Hệ thống AI tự động phân tích và đề xuất khách hàng đang có nhu
              cầu phù hợp với phòng của bạn.
            </Text>

            {leads.length === 0 ? (
              <View className="items-center py-6">
                <Bot size={40} color="#cbd5e1" className="mb-2" />
                <Text className="text-slate-400 font-bold">
                  Chưa có dữ liệu phân tích
                </Text>
              </View>
            ) : (
              leads.slice(0, 10).map((lead, idx) => (
                <View
                  key={lead._id || idx}
                  className="p-4 border border-slate-100 rounded-2xl mb-3 bg-slate-50"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="font-bold text-emerald-950 text-base">
                        {lead.name || lead.fullName || "Khách hàng"}
                      </Text>
                      <Text className="text-xs font-semibold text-slate-500 mt-0.5">
                        {lead.phone || lead.email || "Không có liên hệ"}
                      </Text>
                    </View>
                    <View className="bg-emerald-100 px-2 py-1 rounded">
                      <Text className="text-[10px] font-black text-emerald-700">
                        ĐỘ PHÙ HỢP: 95%
                      </Text>
                    </View>
                  </View>

                  <View className="bg-white p-3 rounded-xl border border-slate-100 mt-2">
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

                  <TouchableOpacity className="mt-3 bg-emerald-600 h-10 rounded-xl items-center justify-center flex-row">
                    <Text className="text-white font-bold text-sm">
                      Liên hệ ngay
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {tab === "verification" && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-black text-emerald-950">
                Yêu cầu xác thực
              </Text>
              <TouchableOpacity
                onPress={() => navigateTo(router, "/verification-service")}
                className="bg-emerald-600 px-3 py-1.5 rounded-xl flex-row items-center"
              >
                <ShieldCheck size={14} color="white" />
                <Text className="text-white text-xs font-bold ml-1">
                  Đăng ký mới
                </Text>
              </TouchableOpacity>
            </View>

            {verifications.length === 0 ? (
              <Text className="text-slate-500">Không có yêu cầu xác thực.</Text>
            ) : (
              verifications.slice(0, 10).map((item, idx) => (
                <View
                  key={item._id || idx}
                  className="py-2 border-b border-slate-100"
                >
                  <Text className="font-bold text-emerald-950">
                    {item.propertyId?.name || "Tin đăng"}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Trạng thái: {item.status || "pending"}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === "notifications" && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <Text className="text-base font-black text-emerald-950 mb-3">
              Thông báo
            </Text>
            {notifications.length === 0 ? (
              <Text className="text-slate-500">Chưa có thông báo.</Text>
            ) : (
              notifications.slice(0, 10).map((item, idx) => (
                <View
                  key={item._id || idx}
                  className="py-2 border-b border-slate-100"
                >
                  <Text className="font-bold text-emerald-950">
                    {item.title || "Thông báo"}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {item.message || ""}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
