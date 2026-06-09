import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES, { navigateTo, safeBack } from "@/constants/routes";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  CalendarDays,
  AlertTriangle,
  CreditCard,
  Ticket,
  Plus,
  Settings,
  Save,
  Bell,
  Globe,
} from "lucide-react-native";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

type AdminView =
  | "dashboard"
  | "posts"
  | "users"
  | "verification"
  | "bookings"
  | "reports"
  | "transactions"
  | "vouchers"
  | "settings";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [view, setView] = useState<AdminView>("dashboard");
  const [screenLoading, setScreenLoading] = useState(true);

  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchData = async (active: AdminView) => {
    try {
      setScreenLoading(true);
      if (active === "dashboard") {
        const res = await api
          .get("/api/admin/stats")
          .catch(() => ({ data: null }));
        setStats(res.data);
      }
      if (active === "posts") {
        const res = await api
          .get("/api/admin/properties")
          .catch(() => ({ data: [] }));
        setPosts(res.data || []);
      }
      if (active === "users") {
        const res = await api
          .get("/api/admin/users")
          .catch(() => ({ data: [] }));
        setUsers(res.data || []);
      }
      if (active === "verification") {
        const res = await api
          .get("/api/admin/verification-requests")
          .catch(() => ({ data: [] }));
        setVerifications(res.data || []);
      }
      if (active === "bookings") {
        const res = await api
          .get("/api/admin/bookings")
          .catch(() => ({ data: [] }));
        setBookings(res.data || []);
      }
      if (active === "reports") {
        const res = await api.get("/api/reports").catch(() => ({ data: [] }));
        setReports(res.data || []);
      }
      if (active === "transactions") {
        const res = await api
          .get("/api/admin/transactions")
          .catch(() => ({ data: { transactions: [] } }));
        setTransactions(res.data?.transactions || []);
      }
      if (active === "vouchers") {
        const res = await api.get("/api/vouchers").catch(() => ({ data: [] }));
        setVouchers(res.data || []);
      }
      if (active === "settings") {
        const res = await api
          .get("/api/admin/settings")
          .catch(() => ({ data: null }));
        setSystemSettings(res.data);
      }
    } finally {
      setScreenLoading(false);
    }
  };

  const handleUpdateVerificationStatus = async (
    id: string,
    status: "approved" | "rejected" | "completed",
  ) => {
    try {
      await api.put(`/api/admin/verifications/${id}/status`, { status });
      Alert.alert("Thành công", "Đã cập nhật trạng thái yêu cầu xác thực");
      setVerifications((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status } : v)),
      );
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setIsSavingSettings(true);
      const res = await api.put("/api/admin/settings", systemSettings);
      if (res.status === 200) {
        Alert.alert("Thành công", "Cài đặt hệ thống đã được cập nhật!");
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể lưu cài đặt hệ thống",
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setScreenLoading(false);
      return;
    }
    fetchData(view);
  }, [isAuthenticated, user, view]);

  if (loading || screenLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
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
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => safeBack(router)}
          className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
        >
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-black text-emerald-700">
            Admin Dashboard
          </Text>
          <Text className="text-xs text-slate-500 font-semibold">
            Quản trị hệ thống MapHome
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
            { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
            { id: "posts", label: "Tin đăng", icon: FileText },
            { id: "users", label: "Người dùng", icon: Users },
            { id: "verification", label: "Xác thực", icon: ShieldCheck },
            { id: "bookings", label: "Lịch hẹn", icon: CalendarDays },
            { id: "reports", label: "Báo cáo", icon: AlertTriangle },
            { id: "transactions", label: "Giao dịch", icon: CreditCard },
            { id: "vouchers", label: "Voucher", icon: Ticket },
            { id: "settings", label: "Cài đặt", icon: Settings },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setView(item.id as AdminView)}
              className={`px-4 py-2 rounded-full mr-2 border flex-row items-center ${view === item.id ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200"}`}
            >
              <item.icon
                size={14}
                color={view === item.id ? "white" : "#334155"}
              />
              <Text
                className={`font-bold text-xs ml-1 ${view === item.id ? "text-white" : "text-slate-700"}`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {view === "dashboard" && (
          <View className="flex-row flex-wrap justify-between">
            {[
              {
                label: "Doanh thu",
                value: stats?.totalRevenue
                  ? `${(stats.totalRevenue / 1000000).toFixed(1)}M`
                  : "0đ",
              },
              { label: "Tổng người dùng", value: stats?.totalUsers || 0 },
              { label: "Tổng tin đăng", value: stats?.totalProperties || 0 },
              { label: "Lịch hẹn", value: stats?.totalBookings || 0 },
              {
                label: "Yêu cầu xác thực",
                value: stats?.pendingVerifications || 0,
              },
            ].map((item, idx) => (
              <View
                key={idx}
                className="w-[48%] bg-white rounded-2xl p-4 border border-slate-100 mb-3"
              >
                <Text className="text-2xl font-black text-emerald-700">
                  {item.value}
                </Text>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {view === "vouchers" && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-black text-emerald-700">
                Danh sách Voucher
              </Text>
              <TouchableOpacity
                onPress={() => navigateTo(router, "/admin-voucher-add")}
                className="bg-emerald-100 px-3 py-1.5 rounded-full flex-row items-center"
              >
                <Plus size={14} color="#16a34a" />
                <Text className="text-emerald-700 font-bold text-xs ml-1">
                  Tạo mới
                </Text>
              </TouchableOpacity>
            </View>

            {vouchers.length === 0 ? (
              <Text className="text-slate-500">Chưa có voucher nào.</Text>
            ) : (
              vouchers.map((v) => (
                <View
                  key={v._id}
                  className="py-3 border-b border-slate-100 flex-row justify-between items-center"
                >
                  <View>
                    <Text className="font-bold text-emerald-700">
                      {v.code} - Giảm {v.discountPercentage}%
                    </Text>
                    <Text className="text-xs text-slate-500">
                      HSD: {new Date(v.endDate).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      v.isActive ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        v.isActive ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {v.isActive ? "Hoạt động" : "Đã khóa"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {view === "verification" && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <Text className="text-base font-black text-emerald-700 mb-4">
              Quản lý Yêu cầu Xác thực
            </Text>

            {verifications.length === 0 ? (
              <Text className="text-slate-500">
                Không có yêu cầu xác thực nào.
              </Text>
            ) : (
              verifications.map((item) => (
                <View
                  key={item._id}
                  className="py-4 border-b border-slate-100 mb-2 bg-slate-50 p-4 rounded-2xl"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text
                        className="font-bold text-emerald-700 text-base"
                        numberOfLines={1}
                      >
                        {item.propertyName || "Căn trọ"}
                      </Text>
                      <Text className="text-xs text-slate-500 mt-1">
                        Chủ trọ: {item.landlordName || "Không rõ"}
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-1 rounded-full ${item.status === "pending" ? "bg-amber-100" : item.status === "approved" ? "bg-blue-100" : item.status === "completed" ? "bg-emerald-100" : "bg-red-100"}`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${item.status === "pending" ? "text-amber-700" : item.status === "approved" ? "text-blue-700" : item.status === "completed" ? "text-emerald-700" : "text-red-700"}`}
                      >
                        {item.status === "pending"
                          ? "Chờ duyệt"
                          : item.status === "approved"
                            ? "Đã duyệt lịch"
                            : item.status === "completed"
                              ? "Đã cấp tích xanh"
                              : "Từ chối"}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-white p-3 rounded-xl border border-slate-100 mb-3">
                    <Text className="text-xs font-bold text-slate-700">
                      Lịch hẹn:
                    </Text>
                    <Text className="text-xs text-slate-600">
                      {item.scheduledDate
                        ? new Date(item.scheduledDate).toLocaleDateString(
                            "vi-VN",
                          )
                        : ""}{" "}
                      lúc {item.scheduledTime}
                    </Text>
                    {item.notes && (
                      <Text className="text-xs text-slate-500 mt-1 italic">
                        Ghi chú: {item.notes}
                      </Text>
                    )}
                  </View>

                  {item.status === "pending" && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() =>
                          handleUpdateVerificationStatus(item._id, "approved")
                        }
                        className="flex-1 bg-blue-600 py-2 rounded-xl items-center"
                      >
                        <Text className="text-white text-xs font-bold">
                          Duyệt lịch hẹn
                        </Text>
                      </TouchableOpacity>
                      {/* 
                      <TouchableOpacity
                        onPress={() =>
                          handleUpdateVerificationStatus(item._id, "rejected")
                        }
                        className="flex-1 bg-red-100 py-2 rounded-xl items-center"
                      >
                        <Text className="text-red-700 text-xs font-bold">
                          Từ chối
                        </Text>
                      </TouchableOpacity>
                      */}
                    </View>
                  )}
                  {item.status === "approved" && (
                    <TouchableOpacity
                      onPress={() =>
                        handleUpdateVerificationStatus(item._id, "completed")
                      }
                      className="bg-emerald-600 py-2 rounded-xl items-center"
                    >
                      <Text className="text-white text-xs font-bold">
                        Cấp Tích Xanh & Hoàn tất
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {view === "settings" && systemSettings && (
          <View className="space-y-6">
            <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
              <View className="flex-row items-center mb-4">
                <Globe size={20} color="#16a34a" />
                <Text className="text-base font-black text-emerald-700 ml-2">Thông tin chung</Text>
              </View>
              <View className="space-y-4">
                <View>
                  <Text className="text-xs font-bold text-slate-500 uppercase mb-2">Tên Website</Text>
                  <TextInput
                    value={systemSettings.siteName}
                    onChangeText={(val) => setSystemSettings({ ...systemSettings, siteName: val })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-500 uppercase mb-2">Email Hỗ trợ</Text>
                  <TextInput
                    value={systemSettings.contactEmail}
                    onChangeText={(val) => setSystemSettings({ ...systemSettings, contactEmail: val })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-500 uppercase mb-2">Hotline</Text>
                  <TextInput
                    value={systemSettings.contactPhone}
                    onChangeText={(val) => setSystemSettings({ ...systemSettings, contactPhone: val })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800"
                  />
                </View>
                <View className="flex-row items-center justify-between bg-rose-50 p-4 rounded-2xl border border-rose-100">
                  <View>
                    <Text className="font-bold text-rose-900">Chế độ Bảo trì</Text>
                    <Text className="text-xs text-rose-600">Tạm khóa người dùng truy cập</Text>
                  </View>
                  <Switch
                    value={systemSettings.maintenanceMode}
                    onValueChange={(val) => setSystemSettings({ ...systemSettings, maintenanceMode: val })}
                    trackColor={{ false: "#cbd5e1", true: "#e11d48" }}
                  />
                </View>
              </View>
            </View>

            <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
              <View className="flex-row items-center mb-4">
                <Bell size={20} color="#16a34a" />
                <Text className="text-base font-black text-emerald-700 ml-2">Truyền thông hệ thống</Text>
              </View>
              <View className="space-y-4">
                <View>
                  <Text className="text-xs font-bold text-slate-500 uppercase mb-2">Nội dung thông báo</Text>
                  <TextInput
                    value={systemSettings.broadcastMessage}
                    onChangeText={(val) => setSystemSettings({ ...systemSettings, broadcastMessage: val })}
                    multiline
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-32 font-bold text-slate-800"
                    textAlignVertical="top"
                  />
                </View>
                <View className="flex-row items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <View>
                    <Text className="font-bold text-emerald-900">Bật thông báo</Text>
                    <Text className="text-xs text-emerald-600">Hiển thị thông báo trên trang chủ</Text>
                  </View>
                  <Switch
                    value={systemSettings.isBroadcastEnabled}
                    onValueChange={(val) => setSystemSettings({ ...systemSettings, isBroadcastEnabled: val })}
                    trackColor={{ false: "#cbd5e1", true: "#16a34a" }}
                  />
                </View>
              </View>
            </View>

            <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
              <View className="flex-row items-center mb-4">
                <Settings size={20} color="#16a34a" />
                <Text className="text-base font-black text-emerald-700 ml-2">SEO & Tự động hóa</Text>
              </View>
              <View className="space-y-4">
                <View>
                  <Text className="text-xs font-bold text-slate-500 uppercase mb-2">Tiêu đề SEO</Text>
                  <TextInput
                    value={systemSettings.seo?.title || ""}
                    onChangeText={(val) => setSystemSettings({ ...systemSettings, seo: { ...systemSettings.seo, title: val } })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-500 uppercase mb-2">Thời hạn tin đăng mặc định (Ngày)</Text>
                  <TextInput
                    value={String(systemSettings.automation?.defaultExpiryDays || 30)}
                    onChangeText={(val) => setSystemSettings({ ...systemSettings, automation: { ...systemSettings.automation, defaultExpiryDays: Number(val) } })}
                    keyboardType="numeric"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleUpdateSettings}
              disabled={isSavingSettings}
              className="bg-emerald-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-600/30 mb-8"
            >
              {isSavingSettings ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Save size={20} color="white" />
                  <Text className="text-white font-black ml-2">Lưu Cài Đặt Hệ Thống</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {view !== "dashboard" &&
          view !== "vouchers" &&
          view !== "verification" &&
          view !== "settings" && (
            <View className="bg-white rounded-3xl p-5 border border-slate-100">
              <Text className="text-base font-black text-emerald-700 mb-3">
                Dữ liệu {view}
              </Text>
              {(view === "posts"
                ? posts
                : view === "users"
                  ? users
                  : view === "bookings"
                    ? bookings
                    : view === "reports"
                      ? reports
                      : transactions
              ).length === 0 ? (
                <Text className="text-slate-500">Chưa có dữ liệu.</Text>
              ) : (
                (view === "posts"
                  ? posts
                  : view === "users"
                    ? users
                    : view === "bookings"
                      ? bookings
                      : view === "reports"
                        ? reports
                        : transactions
                )
                  .slice(0, 12)
                  .map((item: any, idx: number) => (
                    <View
                      key={item._id || idx}
                      className="py-2 border-b border-slate-100"
                    >
                      <Text
                        className="font-bold text-emerald-700"
                        numberOfLines={1}
                      >
                        {item.name ||
                          item.title ||
                          item.fullName ||
                          item.username ||
                          "Bản ghi hệ thống"}
                      </Text>
                      <Text
                        className="text-xs text-slate-500"
                        numberOfLines={1}
                      >
                        {item.email ||
                          item.address ||
                          item.status ||
                          item.message ||
                          item._id}
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
