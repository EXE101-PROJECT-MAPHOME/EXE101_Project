import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Calendar,
  Clock3,
  CheckCircle2,
  BookOpen,
  MapPin,
  Settings,
  GitCompare,
  KeyRound,
  UserCircle,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import ROUTES, { navigateTo } from "@/constants/routes";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { useCompare } from "../contexts/CompareContext";

export default function UserDashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [screenLoading, setScreenLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [myBlogs, setMyBlogs] = useState<any[]>([]);
  const [savedBlogs, setSavedBlogs] = useState<any[]>([]);
  const { compareList } = useCompare();
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");
  const info = useThemeColor({}, "info");
  const warning = useThemeColor({}, "warning");
  const danger = useThemeColor({}, "danger");
  const success = useThemeColor({}, "success");

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) {
        setScreenLoading(false);
        return;
      }
      try {
        setScreenLoading(true);
        const [favRes, bookingRes, inspectRes, myBlogsRes, savedBlogsRes] =
          await Promise.all([
            api.get("/api/user/me/favorites").catch(() => ({ data: [] })),
            api.get("/api/user/bookings").catch(() => ({ data: [] })),
            api.get("/api/user/inspections").catch(() => ({ data: [] })),
            api.get("/api/blogs/my-blogs").catch(() => ({ data: [] })),
            api.get("/api/blogs/me/saved").catch(() => ({ data: [] })),
          ]);

        setFavorites(favRes.data || []);
        setAppointments(bookingRes.data || []);
        setInspections(inspectRes.data || []);
        setMyBlogs(myBlogsRes.data || []);
        setSavedBlogs(savedBlogsRes.data || []);
      } finally {
        setScreenLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  const stats = useMemo(
    () => [
      {
        label: "Trọ yêu thích",
        value: favorites.length,
        icon: Heart,
        color: "bg-red-500",
      },
      {
        label: "Lịch hẹn",
        value: appointments.length,
        icon: Calendar,
        color: "bg-blue-500",
      },
      {
        label: "Chờ duyệt",
        value: appointments.filter((item) => item.status === "pending").length,
        icon: Clock3,
        color: "bg-amber-500",
      },
      {
        label: "Hoàn tất",
        value: appointments.filter((item) => item.status === "completed")
          .length,
        icon: CheckCircle2,
        color: "bg-emerald-500",
      },
    ],
    [favorites.length, appointments],
  );

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
          <ArrowLeft size={18} color={icon} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-black text-emerald-950">
            User Dashboard
          </Text>
          <Text className="text-xs text-slate-500 font-semibold">
            Quản lý hành trình tìm trọ
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
          <Text className="text-lg font-black text-emerald-950">
            Xin chào, {user.fullName || user.username}
          </Text>
          <Text className="text-slate-500 mt-1">
            Theo dõi phòng yêu thích, lịch hẹn và bài viết của bạn.
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between mb-4">
          {stats.map((item, index) => (
            <View
              key={index}
              className="w-[48%] bg-white rounded-2xl p-4 border border-slate-100 mb-3"
            >
              <View
                className={`w-9 h-9 rounded-xl ${item.color} items-center justify-center mb-2`}
              >
                <item.icon size={16} color="white" />
              </View>
              <Text className="text-2xl font-black text-emerald-950">
                {item.value}
              </Text>
              <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
          <Text className="text-base font-black text-emerald-950 mb-3">
            Lịch hẹn gần đây
          </Text>
          {appointments.length === 0 ? (
            <Text className="text-slate-500">Bạn chưa có lịch hẹn nào.</Text>
          ) : (
            appointments.slice(0, 4).map((item, idx) => (
              <View
                key={item._id || idx}
                className="py-2 border-b border-slate-100"
              >
                <Text className="font-bold text-emerald-950" numberOfLines={1}>
                  {item.propertyId?.name || "Phòng trọ"}
                </Text>
                <View className="flex-row items-center mt-1">
                  <MapPin size={12} color={icon} />
                  <Text
                    className="text-xs text-slate-500 ml-1"
                    numberOfLines={1}
                  >
                    {item.propertyId?.address || "Chưa cập nhật địa chỉ"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
          <Text className="text-base font-black text-emerald-950 mb-3">
            Nội dung của bạn
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <BookOpen size={16} color={info} />
              <Text className="text-2xl font-black text-emerald-950 mt-1">
                {savedBlogs.length}
              </Text>
              <Text className="text-[11px] text-slate-500 font-bold">
                Blog đã lưu
              </Text>
            </View>
            <View className="items-center flex-1">
              <BookOpen size={16} color={tint} />
              <Text className="text-2xl font-black text-emerald-950 mt-1">
                {myBlogs.length}
              </Text>
              <Text className="text-[11px] text-slate-500 font-bold">
                Blog của tôi
              </Text>
            </View>
            <View className="items-center flex-1">
              <Calendar size={16} color={warning} />
              <Text className="text-2xl font-black text-emerald-950 mt-1">
                {inspections.length}
              </Text>
              <Text className="text-[11px] text-slate-500 font-bold">
                Lượt kiểm tra
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row mb-6">
          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.SAVED)}
            className="flex-1 bg-emerald-600 h-12 rounded-xl items-center justify-center mr-2 shadow-sm"
          >
            <Text className="text-white font-black">Xem trọ yêu thích</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.COMPARE)}
            className="flex-1 bg-white border border-slate-200 h-12 rounded-xl items-center justify-center ml-2 relative"
          >
            {compareList?.length > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center z-10">
                <Text className="text-[10px] text-white font-bold">
                  {compareList.length}
                </Text>
              </View>
            )}
            <Text className="text-slate-700 font-black flex-row items-center">
              <GitCompare size={14} color={icon} /> So sánh
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
          <Text className="text-base font-black text-emerald-950 mb-3 flex-row items-center">
            <Settings size={18} color={tint} /> Cài đặt tài khoản
          </Text>

          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.PROFILE)}
            className="flex-row items-center py-3 border-b border-slate-100"
          >
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
              <UserCircle size={20} color={info} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-800">
                Thông tin cá nhân
              </Text>
              <Text className="text-xs text-slate-500">
                Cập nhật tên, avatar, số điện thoại
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.PROFILE)}
            className="flex-row items-center py-3"
          >
            <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center mr-3">
              <KeyRound size={20} color={warning} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-800">Đổi mật khẩu</Text>
              <Text className="text-xs text-slate-500">
                Bảo mật tài khoản của bạn
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
