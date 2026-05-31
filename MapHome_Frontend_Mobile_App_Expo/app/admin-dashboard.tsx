import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
  | "vouchers";

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
        const res = await api
          .get("/api/vouchers")
          .catch(() => ({ data: [] }));
        setVouchers(res.data || []);
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
    fetchData(view);
  }, [isAuthenticated, user, view]);

  if (loading || screenLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-emerald-950 font-black text-xl text-center mb-3">
          Bạn không có quyền truy cập trang này
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
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
                <Text className="text-2xl font-black text-emerald-950">
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
              <Text className="text-base font-black text-emerald-950">
                Danh sách Voucher
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/admin-voucher-add")}
                className="bg-emerald-100 px-3 py-1.5 rounded-full flex-row items-center"
              >
                <Plus size={14} color="#059669" />
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
                    <Text className="font-bold text-emerald-950">
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

        {view !== "dashboard" && view !== "vouchers" && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <Text className="text-base font-black text-emerald-950 mb-3">
              Dữ liệu {view}
            </Text>
            {(view === "posts"
              ? posts
              : view === "users"
                ? users
                : view === "verification"
                  ? verifications
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
                  : view === "verification"
                    ? verifications
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
                      className="font-bold text-emerald-950"
                      numberOfLines={1}
                    >
                      {item.name ||
                        item.title ||
                        item.fullName ||
                        item.username ||
                        "Bản ghi hệ thống"}
                    </Text>
                    <Text className="text-xs text-slate-500" numberOfLines={1}>
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
