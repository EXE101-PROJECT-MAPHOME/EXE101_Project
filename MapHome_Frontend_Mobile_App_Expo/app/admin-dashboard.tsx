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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  Trash2,
  MapPin,
  Clock,
  Home,
  Search,
  Newspaper,
  Star,
  Send,
  Lock,
  LockOpen,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

type AdminView =
  | "dashboard"
  | "posts"
  | "users"
  | "verification"
  | "bookings"
  | "reviews"
  | "reports"
  | "notifications"
  | "transactions"
  | "blogs"
  | "vouchers"
  | "settings";

const TABS = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "posts", label: "Tin đăng", icon: FileText },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "verification", label: "Xác thực", icon: ShieldCheck },
  { id: "bookings", label: "Lịch hẹn", icon: CalendarDays },
  { id: "reviews", label: "Đánh giá", icon: Star },
  { id: "reports", label: "Báo cáo", icon: AlertTriangle },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "transactions", label: "Giao dịch", icon: CreditCard },
  { id: "blogs", label: "Blog", icon: Newspaper },
  { id: "vouchers", label: "Voucher", icon: Ticket },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

const LoadingState = () => (
  <View className="flex-1 items-center justify-center p-10">
    <ActivityIndicator size="large" color="#10b981" />
    <Text className="text-emerald-600 font-bold mt-4 text-xs">Đang tải dữ liệu...</Text>
  </View>
);

const EmptyState = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <View className="items-center justify-center py-16 px-6 bg-white rounded-[32px] border border-slate-100 shadow-sm mt-4">
    <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-5">
      {icon}
    </View>
    <Text className="text-lg font-black text-slate-800 mb-2">{title}</Text>
    <Text className="text-sm text-slate-500 text-center font-medium leading-relaxed">{desc}</Text>
  </View>
);

// --- TAB COMPONENTS ---

const DashboardTab = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const KPICard = ({ title, value, icon, color }: any) => (
    <View className="w-[48%] bg-white rounded-3xl p-5 border border-slate-100 mb-4 shadow-sm">
      <View className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3`} style={{ backgroundColor: `${color}15` }}>
        {icon}
      </View>
      <Text className="text-2xl font-black text-slate-800">{value}</Text>
      <Text className="text-[11px] font-bold text-slate-400 uppercase mt-1">{title}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Premium Dashboard Welcome Banner */}
      <View className="rounded-[28px] overflow-hidden mb-5 shadow-lg shadow-blue-100">
        <LinearGradient
          colors={["#10b981", "#3b82f6", "#6366f1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6"
        >
          <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 mb-1">Hệ Thống Quản Trị</Text>
          <Text className="text-2xl font-black text-white tracking-tight">MapHome Dashboard</Text>
          <Text className="text-xs font-bold text-white/95 mt-2 leading-relaxed">
            Tổng quan số liệu vận hành và cấu hình hệ thống thời gian thực.
          </Text>
        </LinearGradient>
      </View>

      <View className="flex-row flex-wrap justify-between">
        <KPICard title="Doanh thu" value={stats?.totalRevenue ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` : "0đ"} icon={<CreditCard size={20} color="#10b981" />} color="#10b981" />
        <KPICard title="Người dùng" value={stats?.totalUsers || 0} icon={<Users size={20} color="#3b82f6" />} color="#3b82f6" />
        <KPICard title="Tin đăng" value={stats?.totalProperties || 0} icon={<FileText size={20} color="#f59e0b" />} color="#f59e0b" />
        <KPICard title="Lịch hẹn" value={stats?.totalBookings || 0} icon={<CalendarDays size={20} color="#8b5cf6" />} color="#8b5cf6" />
      </View>

      <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mt-2">
        <Text className="text-sm font-black uppercase text-emerald-600 tracking-widest mb-4">Hoạt động hệ thống</Text>
        <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <Text className="text-slate-600 font-medium text-sm leading-relaxed">
            Hệ thống đang hoạt động ổn định. Tỷ lệ hài lòng đạt <Text className="font-black text-emerald-600">{stats?.satisfactionRate || 98}%</Text>.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const PostsTab = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/api/admin/properties")
      .then((res) => setPosts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/admin/properties/${id}/status`, { status });
      setPosts(posts.map((p) => (p._id === id ? { ...p, status } : p)));
      Alert.alert("Thành công", `Đã chuyển sang: ${status}`);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
    }
  };

  if (loading) return <LoadingState />;

  const filtered = posts.filter((p) => {
    const isExpired = p.status === "expired" || (p.status === "approved" && p.expiryDate && new Date(p.expiryDate) < new Date());
    const matchedStatus = filter === "expired" ? isExpired : filter === "all" ? true : p.status === filter && !isExpired;
    const matchedSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
    return matchedStatus && matchedSearch;
  });

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }} stickyHeaderIndices={[0]}>
      <View className="bg-slate-50 pb-2">
        <View className="flex-row items-center bg-white px-4 py-3 rounded-2xl border border-slate-100 mb-3 shadow-sm">
          <Search size={18} color="#94a3b8" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Tìm tin đăng..." className="flex-1 ml-3 font-medium text-slate-800" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2">
          {["all", "pending", "approved", "reported", "expired"].map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} className={`px-5 py-2.5 rounded-full mr-2 border ${filter === f ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"}`}>
              <Text className={`font-black text-[11px] uppercase tracking-wider ${filter === f ? "text-white" : "text-slate-500"}`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={32} color="#94a3b8" />} title="Không tìm thấy" desc="Không có tin đăng nào phù hợp với bộ lọc hiện tại." />
      ) : (
        filtered.map((post) => (
          <View key={post._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-4">
                <Text className="font-black text-slate-800 text-[15px] mb-1.5">{post.name}</Text>
                <View className="flex-row items-center">
                  <MapPin size={12} color="#94a3b8" />
                  <Text className="text-xs text-slate-500 ml-1 font-medium" numberOfLines={1}>{post.address}</Text>
                </View>
              </View>
              <View className={`px-2.5 py-1.5 rounded-lg ${post.status === "approved" ? "bg-emerald-100" : post.status === "pending" ? "bg-amber-100" : "bg-rose-100"}`}>
                <Text className={`text-[9px] font-black uppercase tracking-widest ${post.status === "approved" ? "text-emerald-700" : post.status === "pending" ? "text-amber-700" : "text-rose-700"}`}>{post.status}</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-slate-50">
              <View>
                <Text className="font-black text-emerald-600 text-lg">{post.price?.toLocaleString()}đ</Text>
                <Text className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{formatDate(post.createdAt)}</Text>
              </View>
              <View className="flex-row gap-2">
                {post.status === "pending" && (
                  <>
                    <TouchableOpacity onPress={() => updateStatus(post._id, "approved")} className="px-4 py-2 bg-emerald-500 rounded-xl"><Text className="text-white text-xs font-black">Duyệt</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => updateStatus(post._id, "rejected")} className="px-4 py-2 bg-rose-50 rounded-xl"><Text className="text-rose-600 text-xs font-black">Từ chối</Text></TouchableOpacity>
                  </>
                )}
                {post.status === "approved" && (
                  <TouchableOpacity onPress={() => updateStatus(post._id, "expired")} className="px-4 py-2 bg-slate-100 rounded-xl"><Text className="text-slate-600 text-xs font-black">Ẩn tin</Text></TouchableOpacity>
                )}
                {post.status === "expired" && (
                  <TouchableOpacity onPress={() => updateStatus(post._id, "approved")} className="px-4 py-2 bg-blue-500 rounded-xl"><Text className="text-white text-xs font-black">Tái đăng</Text></TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/api/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await api.put(`/api/admin/users/${id}/status`);
      const newStatus = currentStatus === "blocked" ? "active" : "blocked";
      setUsers(users.map((u) => (u._id === id ? { ...u, status: newStatus } : u)));
    } catch (e) {
      Alert.alert("Lỗi", "Không thể cập nhật");
    }
  };

  const deleteUser = async (id: string) => {
    Alert.alert("Xác nhận", "Xoá vĩnh viễn user này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/admin/users/${id}`);
            setUsers(users.filter((u) => u._id !== id));
            Alert.alert("Thành công", "Đã xoá người dùng");
          } catch (e) {
            Alert.alert("Lỗi", "Không thể xóa");
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState />;

  const filtered = users.filter((u) => {
    const matchedFilter = filter === "all" || u.role === filter;
    const matchedSearch = (u.fullName || u.username || u.email || "").toLowerCase().includes(search.toLowerCase());
    return matchedFilter && matchedSearch;
  });

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }} stickyHeaderIndices={[0]}>
      <View className="bg-slate-50 pb-2">
        <View className="flex-row items-center bg-white px-4 py-3 rounded-2xl border border-slate-100 mb-3 shadow-sm">
          <Search size={18} color="#94a3b8" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Tìm tên, email..." className="flex-1 ml-3 font-medium text-slate-800" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2">
          {[{ id: "all", name: "Tất cả" }, { id: "landlord", name: "Chủ trọ" }, { id: "user", name: "Người thuê" }, { id: "admin", name: "Admin" }].map((f) => (
            <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} className={`px-5 py-2.5 rounded-full mr-2 border ${filter === f.id ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"}`}>
              <Text className={`font-black text-[11px] uppercase tracking-wider ${filter === f.id ? "text-white" : "text-slate-500"}`}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={32} color="#94a3b8" />} title="Không tìm thấy" desc="Không có người dùng nào khớp với tìm kiếm." />
      ) : (
        filtered.map((u) => (
          <View key={u._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm flex-row items-center justify-between">
            <View className="flex-1 pr-4 flex-row items-center gap-4">
              <View className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm ${u.role === "admin" ? "bg-indigo-100" : u.role === "landlord" ? "bg-amber-100" : "bg-blue-100"}`}>
                <Text className="font-black text-slate-600">{(u.fullName || u.username || "U").charAt(0).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-black text-slate-800 text-[15px] mb-0.5">{u.fullName || u.username}</Text>
                <Text className="text-[11px] text-slate-500 mb-1" numberOfLines={1}>{u.email}</Text>
                <View className={`self-start px-2 py-0.5 rounded-md ${u.status === "blocked" ? "bg-rose-100" : "bg-emerald-100"}`}>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${u.status === "blocked" ? "text-rose-600" : "text-emerald-600"}`}>{u.status}</Text>
                </View>
              </View>
            </View>
            <View className="flex gap-2">
              <TouchableOpacity onPress={() => toggleStatus(u._id, u.status)} className={`p-3 rounded-xl ${u.status === "blocked" ? "bg-emerald-50" : "bg-slate-50"}`}>
                {u.status === "blocked" ? <LockOpen size={16} color="#10b981" /> : <Lock size={16} color="#64748b" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteUser(u._id)} className="p-3 bg-rose-50 rounded-xl">
                <Trash2 size={16} color="#e11d48" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const VerificationTab = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promptData, setPromptData] = useState<{ visible: boolean; id: string; type: string; value: string }>({ visible: false, id: "", type: "date", value: "" });

  useEffect(() => {
    api.get("/api/admin/verification-requests")
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async () => {
    if (!promptData.value) {
      Alert.alert("Lỗi", "Vui lòng nhập thông tin");
      return;
    }
    try {
      if (promptData.type === "date") {
        await api.put(`/api/admin/verification/${promptData.id}/approve`, { scheduledDate: promptData.value });
        setItems(items.map((i) => (i._id === promptData.id ? { ...i, status: "approved", scheduledDate: promptData.value } : i)));
      } else {
        await api.put(`/api/admin/verification/${promptData.id}/reject`, { reason: promptData.value });
        setItems(items.map((i) => (i._id === promptData.id ? { ...i, status: "rejected" } : i)));
      }
      setPromptData({ visible: false, id: "", type: "", value: "" });
      Alert.alert("Thành công", "Đã xử lý yêu cầu");
    } catch (e) {
      Alert.alert("Lỗi", "Thao tác thất bại");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.put(`/api/admin/verification/${id}/complete`, { badgeAwarded: "blue" });
      setItems(items.map((i) => (i._id === id ? { ...i, status: "completed" } : i)));
      Alert.alert("Thành công", "Đã cấp Tích Xanh");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể hoàn tất");
    }
  };

  if (loading) return <LoadingState />;

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {items.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={32} color="#94a3b8" />} title="Chưa có yêu cầu" desc="Không có yêu cầu xác thực nào đang chờ xử lý." />
        ) : (
          items.map((item) => (
            <View key={item._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-4">
                  <Text className="font-black text-slate-800 text-[15px] mb-1">{item.propertyId?.name || "Tin đăng"}</Text>
                  <Text className="text-xs text-slate-500 mb-1">Chủ trọ: <Text className="font-bold">{item.landlordId?.name}</Text></Text>
                  {item.scheduledDate && <Text className="text-[11px] text-blue-600 font-bold mt-1">Lịch: {formatDate(item.scheduledDate)}</Text>}
                </View>
                <View className={`px-2.5 py-1.5 rounded-lg ${item.status === "completed" ? "bg-emerald-100" : item.status === "pending" ? "bg-amber-100" : item.status === "rejected" ? "bg-rose-100" : "bg-blue-100"}`}>
                  <Text className={`text-[9px] font-black uppercase tracking-widest ${item.status === "completed" ? "text-emerald-700" : item.status === "pending" ? "text-amber-700" : item.status === "rejected" ? "text-rose-700" : "text-blue-700"}`}>{item.status}</Text>
                </View>
              </View>
              <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-50 justify-end">
                {item.status === "pending" && (
                  <>
                    <TouchableOpacity onPress={() => setPromptData({ visible: true, id: item._id, type: "date", value: "" })} className="px-4 py-2 bg-indigo-600 rounded-xl"><Text className="text-white text-xs font-black">Phân công</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setPromptData({ visible: true, id: item._id, type: "reject", value: "" })} className="px-4 py-2 bg-rose-50 rounded-xl"><Text className="text-rose-600 text-xs font-black">Từ chối</Text></TouchableOpacity>
                  </>
                )}
                {item.status === "approved" && (
                  <TouchableOpacity onPress={() => handleComplete(item._id)} className="px-4 py-2 bg-emerald-500 rounded-xl"><Text className="text-white text-xs font-black">Cấp Tích Xanh</Text></TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Basic Prompt Modal */}
      <Modal visible={promptData.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white w-full rounded-[32px] p-6">
            <Text className="text-lg font-black text-slate-800 mb-4">{promptData.type === "date" ? "Nhập ngày kiểm tra (YYYY-MM-DD)" : "Lý do từ chối"}</Text>
            <TextInput value={promptData.value} onChangeText={(v) => setPromptData({ ...promptData, value: v })} placeholder={promptData.type === "date" ? "2026-10-25" : "Thiếu giấy tờ..."} className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 font-medium mb-6" />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setPromptData({ ...promptData, visible: false })} className="flex-1 py-3 bg-slate-100 rounded-xl items-center"><Text className="font-bold text-slate-600">Hủy</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleApprove} className="flex-1 py-3 bg-indigo-600 rounded-xl items-center"><Text className="font-bold text-white">Xác nhận</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const BookingsTab = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/bookings")
      .then((res) => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteBooking = async (id: string) => {
    Alert.alert("Xác nhận", "Hủy lịch hẹn này?", [
      { text: "Đóng", style: "cancel" },
      {
        text: "Hủy lịch",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/admin/bookings/${id}`);
            setBookings(bookings.filter((b) => b._id !== id));
          } catch (e) {
            Alert.alert("Lỗi", "Không thể xóa");
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      {bookings.length === 0 ? (
        <EmptyState icon={<CalendarDays size={32} color="#94a3b8" />} title="Chưa có lịch hẹn" desc="Hiện tại hệ thống chưa ghi nhận lượt đặt lịch nào." />
      ) : (
        bookings.map((b) => (
          <View key={b._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-black text-slate-800 text-[15px] mb-1">{b.propertyId?.name || "Căn hộ"}</Text>
              <Text className="text-xs text-slate-500 mb-1">Khách: <Text className="font-bold text-slate-700">{b.userId?.fullName || b.userId?.username}</Text></Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Clock size={12} color="#3b82f6" />
                <Text className="text-[11px] font-bold text-blue-600">{formatDate(b.bookingDate)} - {b.bookingTime}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteBooking(b._id)} className="p-3 bg-rose-50 rounded-xl">
              <Trash2 size={16} color="#e11d48" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const ReviewsTab = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/reviews")
      .then((res) => setReviews(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteReview = async (id: string) => {
    try {
      await api.delete(`/api/admin/reviews/${id}`);
      setReviews(reviews.filter((r) => r._id !== id));
      Alert.alert("Thành công", "Đã xóa đánh giá");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể xóa");
    }
  };

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      {reviews.length === 0 ? (
        <EmptyState icon={<Star size={32} color="#94a3b8" />} title="Chưa có đánh giá" desc="Không có đánh giá nào từ người dùng." />
      ) : (
        reviews.map((r) => (
          <View key={r._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-4">
                <Text className="font-black text-slate-800 text-[14px] mb-1">{r.propertyId?.name}</Text>
                <Text className="text-[10px] text-slate-400 font-bold uppercase">Bởi: {r.userId?.username || "Ẩn danh"}</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <Text className="text-[11px] font-black text-amber-600">{r.rating}</Text>
              </View>
            </View>
            <View className="bg-slate-50 p-4 rounded-2xl mb-3 border border-slate-100">
              <Text className="text-xs text-slate-600 italic font-medium">"{r.comment}"</Text>
            </View>
            <TouchableOpacity onPress={() => deleteReview(r._id)} className="self-end px-4 py-2 bg-rose-50 rounded-xl flex-row items-center gap-2">
              <Trash2 size={12} color="#e11d48" />
              <Text className="text-rose-600 text-[10px] font-black uppercase">Gỡ bỏ</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const ReportsTab = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/reports")
      .then((res) => setReports(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resolveReport = async (id: string, status: string) => {
    try {
      await api.put(`/api/reports/${id}`, { status, adminNotes: "Đã xử lý qua Mobile App" });
      setReports(reports.map((r) => (r._id === id ? { ...r, status } : r)));
      Alert.alert("Thành công", "Đã cập nhật trạng thái");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể thao tác");
    }
  };

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      {reports.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={32} color="#94a3b8" />} title="Tuyệt vời" desc="Hiện tại không có tin đăng nào bị báo cáo vi phạm." />
      ) : (
        reports.map((r) => (
          <View key={r._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-4">
                <Text className="font-black text-slate-800 text-[15px] mb-1">{r.propertyId?.name || "Tin bị xóa"}</Text>
                <Text className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{r.reason}</Text>
              </View>
              <View className={`px-2 py-1 rounded-md ${r.status === "pending" ? "bg-rose-100" : "bg-emerald-100"}`}>
                <Text className={`text-[9px] font-black uppercase tracking-widest ${r.status === "pending" ? "text-rose-700" : "text-emerald-700"}`}>{r.status}</Text>
              </View>
            </View>
            <View className="bg-rose-50/50 p-4 rounded-2xl mb-4 border border-rose-50">
              <Text className="text-xs text-slate-600 font-medium leading-relaxed">{r.description || "Không có chi tiết"}</Text>
            </View>
            {r.status === "pending" && (
              <View className="flex-row gap-2 border-t border-slate-50 pt-4 mt-2">
                <TouchableOpacity onPress={() => resolveReport(r._id, "resolved")} className="flex-1 py-2.5 bg-emerald-500 rounded-xl items-center"><Text className="text-white text-xs font-black">Giải quyết</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => resolveReport(r._id, "dismissed")} className="flex-1 py-2.5 bg-slate-100 rounded-xl items-center"><Text className="text-slate-600 text-xs font-black">Bỏ qua</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const NotificationsTab = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }
    setSending(true);
    try {
      await api.post("/api/admin/notifications/broadcast", { title, message, type, targetRole: "all" });
      Alert.alert("Thành công", "Đã gửi thông báo hệ thống");
      setTitle("");
      setMessage("");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể gửi thông báo");
    }
    setSending(false);
  };

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <View className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
          <Send size={24} color="#4f46e5" />
        </View>
        <Text className="text-lg font-black text-slate-800 mb-6">Soạn thông báo hệ thống</Text>
        
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Tiêu đề</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề..." className="bg-slate-50 px-4 py-3 rounded-xl font-bold mb-4 border border-slate-100 text-slate-800" />
        
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Nội dung chi tiết</Text>
        <TextInput value={message} onChangeText={setMessage} placeholder="Nhập nội dung..." multiline numberOfLines={4} className="bg-slate-50 px-4 py-3 rounded-xl font-medium mb-6 border border-slate-100 h-28 text-slate-800" textAlignVertical="top" />
        
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Mức độ cảnh báo</Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {[{ id: "info", name: "Thông tin" }, { id: "success", name: "Thành công" }, { id: "warning", name: "Cảnh báo" }, { id: "error", name: "Khẩn cấp" }].map((t) => (
            <TouchableOpacity key={t.id} onPress={() => setType(t.id)} className={`px-4 py-2.5 rounded-xl border ${type === t.id ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200"}`}>
              <Text className={`text-xs font-black ${type === t.id ? "text-indigo-700" : "text-slate-600"}`}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={sending}
          className="rounded-[20px] overflow-hidden shadow-lg shadow-blue-200"
        >
          {sending ? (
            <View className="py-4 items-center bg-slate-300">
              <ActivityIndicator color="white" />
            </View>
          ) : (
            <LinearGradient
              colors={["#10b981", "#3b82f6", "#6366f1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 flex-row items-center justify-center"
            >
              <Send size={18} color="white" />
              <Text className="text-white font-black ml-2 text-sm uppercase tracking-wider">Phát thông báo</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/transactions")
      .then((res) => setTransactions(res.data?.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      {transactions.length === 0 ? (
        <EmptyState icon={<CreditCard size={32} color="#94a3b8" />} title="Chưa có giao dịch" desc="Hệ thống chưa ghi nhận giao dịch thanh toán nào." />
      ) : (
        transactions.map((t) => (
          <View key={t._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-black text-slate-400 uppercase">Mã GD: #{t._id.slice(-6).toUpperCase()}</Text>
              <View className={`px-2 py-1 rounded-md ${t.status === "success" ? "bg-emerald-100" : t.status === "pending" ? "bg-amber-100" : "bg-rose-100"}`}>
                <Text className={`text-[8px] font-black uppercase tracking-widest ${t.status === "success" ? "text-emerald-700" : t.status === "pending" ? "text-amber-700" : "text-rose-700"}`}>{t.status}</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-end mb-4">
              <View>
                <Text className="text-xs text-slate-500 mb-1">Thanh toán bởi</Text>
                <Text className="font-black text-slate-800 text-[15px]">{t.userId?.fullName || t.userId?.username || "Ẩn danh"}</Text>
              </View>
              <Text className="font-black text-xl text-emerald-600">+{t.amount.toLocaleString()}đ</Text>
            </View>
            <View className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Text className="text-[11px] text-slate-600 font-medium" numberOfLines={2}>{t.description || "Thanh toán dịch vụ"}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const BlogsTab = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/blogs/admin/all")
      .then((res) => setBlogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteBlog = async (id: string) => {
    Alert.alert("Xác nhận", "Xóa bài viết này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/blogs/${id}`);
            setBlogs(blogs.filter((b) => b._id !== id));
          } catch (e) {
            Alert.alert("Lỗi", "Không thể xóa");
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="flex-row justify-between items-center mb-4 px-2">
        <Text className="text-lg font-black text-slate-800 tracking-tight">Bài viết cộng đồng</Text>
        <TouchableOpacity onPress={() => Alert.alert("Thông báo", "Vui lòng sử dụng Web Admin để soạn thảo bài viết chi tiết với đầy đủ công cụ.")} className="bg-indigo-50 px-4 py-2 rounded-xl flex-row items-center gap-1">
          <Plus size={14} color="#4f46e5" />
          <Text className="text-indigo-600 font-black text-[11px] uppercase tracking-wider">Tạo mới</Text>
        </TouchableOpacity>
      </View>
      {blogs.length === 0 ? (
        <EmptyState icon={<Newspaper size={32} color="#94a3b8" />} title="Chưa có blog" desc="Hãy đăng tải bài viết đầu tiên trên nền tảng web." />
      ) : (
        blogs.map((b) => (
          <View key={b._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-black text-slate-800 text-[14px] leading-snug mb-2" numberOfLines={2}>{b.title}</Text>
              <View className="flex-row items-center gap-1">
                <Clock size={10} color="#94a3b8" />
                <Text className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(b.createdAt)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteBlog(b._id)} className="p-3 bg-rose-50 rounded-xl">
              <Trash2 size={16} color="#e11d48" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const VouchersTab = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get("/api/vouchers")
      .then((res) => setVouchers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="flex-row justify-between items-center mb-4 px-2">
        <Text className="text-lg font-black text-slate-800 tracking-tight">Mã giảm giá</Text>
        <TouchableOpacity onPress={() => navigateTo(router, "/admin-voucher-add")} className="bg-indigo-50 px-4 py-2 rounded-xl flex-row items-center gap-1">
          <Plus size={14} color="#4f46e5" />
          <Text className="text-indigo-600 font-black text-[11px] uppercase tracking-wider">Tạo mới</Text>
        </TouchableOpacity>
      </View>
      {vouchers.length === 0 ? (
        <EmptyState icon={<Ticket size={32} color="#94a3b8" />} title="Chưa có Voucher" desc="Hãy tạo mã giảm giá đầu tiên để kích thích thanh toán." />
      ) : (
        vouchers.map((v) => (
          <View key={v._id} className="bg-white p-5 rounded-[28px] border border-slate-100 mb-4 shadow-sm flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="font-black text-emerald-600 text-lg uppercase">{v.code}</Text>
                <View className={`px-2 py-0.5 rounded-md ${v.isActive ? "bg-emerald-50" : "bg-rose-50"}`}>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${v.isActive ? "text-emerald-500" : "text-rose-500"}`}>{v.isActive ? "Active" : "Locked"}</Text>
                </View>
              </View>
              <Text className="text-xs text-slate-600 font-medium mb-1">Giảm {v.discountPercentage}%</Text>
              <Text className="text-[10px] text-slate-400 font-bold uppercase">HSD: {formatDate(v.endDate)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const SettingsTab = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/admin/settings")
      .then((res) => setSettings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/admin/settings", settings);
      Alert.alert("Thành công", "Đã lưu cài đặt hệ thống");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lưu cài đặt");
    }
    setSaving(false);
  };

  if (loading || !settings) return <LoadingState />;

  return (
    <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="bg-white rounded-[32px] p-6 border border-slate-100 mb-6 shadow-sm">
        <View className="flex-row items-center gap-3 mb-6">
          <Settings size={20} color="#10b981" />
          <Text className="font-black text-emerald-700 text-lg tracking-tight">Thông tin chung</Text>
        </View>
        
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Tên Website</Text>
        <TextInput value={settings.siteName} onChangeText={(v) => setSettings({ ...settings, siteName: v })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 mb-4 font-bold text-slate-800" />
        
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Email Hỗ trợ</Text>
        <TextInput value={settings.contactEmail} onChangeText={(v) => setSettings({ ...settings, contactEmail: v })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 mb-4 font-bold text-slate-800" keyboardType="email-address" />
        
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Hotline</Text>
        <TextInput value={settings.contactPhone} onChangeText={(v) => setSettings({ ...settings, contactPhone: v })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 mb-6 font-bold text-slate-800" keyboardType="phone-pad" />

        <View className="flex-row items-center justify-between bg-rose-50 p-5 rounded-[24px] border border-rose-100">
          <View className="flex-1 pr-4">
            <Text className="font-black text-rose-900 text-sm mb-1">Chế độ Bảo trì</Text>
            <Text className="text-[11px] text-rose-600 font-medium">Tạm khóa toàn bộ người dùng truy cập vào hệ thống</Text>
          </View>
          <Switch value={settings.maintenanceMode} onValueChange={(v) => setSettings({ ...settings, maintenanceMode: v })} trackColor={{ false: "#cbd5e1", true: "#e11d48" }} />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className="rounded-[20px] overflow-hidden shadow-lg shadow-blue-200"
      >
        {saving ? (
          <View className="py-4 items-center bg-slate-300">
            <ActivityIndicator color="white" />
          </View>
        ) : (
          <LinearGradient
            colors={["#10b981", "#3b82f6", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 flex-row items-center justify-center"
          >
            <Save size={18} color="white" />
            <Text className="text-white font-black ml-2 text-sm uppercase tracking-wider">Lưu Cài Đặt</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- MAIN EXPORT ---

export default function AdminDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const [view, setView] = useState<AdminView>((params.view as AdminView) || "dashboard");

  useEffect(() => {
    if (params.view) {
      setView(params.view as AdminView);
    }
  }, [params.view]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-8">
        <AlertTriangle size={48} color="#e11d48" className="mb-4" />
        <Text className="text-rose-600 font-black text-xl text-center mb-2 tracking-tight">Từ chối truy cập</Text>
        <Text className="text-slate-500 font-medium text-center text-sm mb-8">Bạn không có quyền quản trị viên để xem trang này.</Text>
        <TouchableOpacity onPress={() => navigateTo(router, ROUTES.LOGIN, true)} className="bg-slate-900 px-8 py-4 rounded-2xl w-full items-center shadow-xl shadow-slate-200">
          <Text className="text-white font-black uppercase tracking-wider text-xs">Đăng nhập lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Premium Header */}
      <View className="px-5 py-4 bg-white/80 border-b border-slate-100 flex-row items-center justify-between z-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => safeBack(router)} className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
            <ArrowLeft size={18} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-0.5">Admin Panel</Text>
            <Text className="text-lg font-black text-slate-800 tracking-tight leading-none">MapHome System</Text>
          </View>
        </View>
        <View className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-blue-200">
          <LinearGradient
            colors={["#10b981", "#3b82f6", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full h-full items-center justify-center"
          >
            <Home size={18} color="white" />
          </LinearGradient>
        </View>
      </View>

      {/* Horizontal Tabs */}
      <View className="bg-white border-b border-slate-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          {TABS.map((item) => {
            const isActive = view === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setView(item.id as AdminView)}
                className="mr-2"
              >
                {isActive ? (
                  <LinearGradient
                    colors={["#10b981", "#3b82f6", "#6366f1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 16 }}
                    className="px-4 py-2.5 flex-row items-center shadow-lg shadow-blue-200"
                  >
                    <item.icon size={14} color="white" />
                    <Text className="font-black text-[11px] uppercase tracking-wider ml-1.5 text-white">
                      {item.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white flex-row items-center">
                    <item.icon size={14} color="#64748b" />
                    <Text className="font-black text-[11px] uppercase tracking-wider ml-1.5 text-slate-500">
                      {item.label}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* View Switcher */}
      <View className="flex-1">
        {view === "dashboard" && <DashboardTab />}
        {view === "posts" && <PostsTab />}
        {view === "users" && <UsersTab />}
        {view === "verification" && <VerificationTab />}
        {view === "bookings" && <BookingsTab />}
        {view === "reviews" && <ReviewsTab />}
        {view === "reports" && <ReportsTab />}
        {view === "notifications" && <NotificationsTab />}
        {view === "transactions" && <TransactionsTab />}
        {view === "blogs" && <BlogsTab />}
        {view === "vouchers" && <VouchersTab />}
        {view === "settings" && <SettingsTab />}
      </View>
    </SafeAreaView>
  );
}
