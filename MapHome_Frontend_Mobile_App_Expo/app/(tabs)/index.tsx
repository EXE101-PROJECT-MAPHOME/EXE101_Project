import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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
} from "lucide-react-native";
import { useRouter, type Href } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProperties } from "../../contexts/PropertiesContext";
import api from "../../utils/api";

export default function HomePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { properties, loading } = useProperties();

  const [stats, setStats] = useState({
    totalProperties: 10,
    totalUsers: 50,
    totalDistricts: 12,
    satisfactionRate: 98,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/api/properties/stats/public");
        if (res.status === 200 && res.data) {
          setStats({
            totalProperties: res.data.totalProperties || 10,
            totalUsers: res.data.totalUsers || 50,
            totalDistricts: res.data.totalDistricts || 12,
            satisfactionRate: res.data.satisfactionRate || 98,
          });
        }
      } catch (e) {
        console.log("Failed to fetch stats", e);
      }
    };
    fetchStats();
  }, []);

  const verifiedProperties = useMemo(() => {
    const verified = properties.filter(
      (p) => p.verificationLevel === "verified",
    );
    return verified.length > 0 ? verified.slice(0, 6) : properties.slice(0, 6);
  }, [properties]);

  return (
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
          <View className="w-10 h-10 bg-emerald-600 rounded-xl items-center justify-center mr-2">
            <Home size={24} color="white" />
          </View>
          <Text className="text-xl font-black text-emerald-700 tracking-tighter">
            MapHome
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigateTo(router, ROUTES.BLOG)}
          className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center relative"
        >
          <Bell size={20} color="#064e3b" />
          <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </TouchableOpacity>
      </Animated.View>

      <HeroCarousel />

      {/* Stats Section */}
      <Animated.View entering={FadeInRight.delay(200).springify()} className="py-10 px-4 bg-emerald-600">
        <View className="flex-row flex-wrap justify-between">
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
            <View key={i} className="w-1/2 items-center mb-6">
              <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mb-2">
                <stat.icon size={24} color="#bbf7d0" />
              </View>
              <Text className="text-2xl font-bold text-white mb-1">
                {stat.target}
              </Text>
              <Text className="text-green-100/80 text-xs font-medium uppercase">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Features Section */}
      <View className="py-12 px-4">
        <View className="items-center mb-10">
          <Text className="text-3xl font-black text-emerald-700 text-center mb-2">
            Tại Sao Chọn MapHome?
          </Text>
          <Text className="text-slate-600 text-center px-4">
            Nền tảng tìm trọ hiện đại với công nghệ tiên tiến, giúp bạn tìm được
            ngôi nhà thứ hai một cách dễ dàng và nhanh chóng nhất.
          </Text>
        </View>

        {[
          {
            icon: MapPin,
            title: "Bản đồ tương tác",
            desc: "Xem vị trí chính xác và khám phá các tiện ích xung quanh như bệnh viện, trường học, siêu thị.",
            color: "bg-green-500",
          },
          {
            icon: Home,
            title: "Thông tin đầy đủ",
            desc: "Chi tiết về giá cả, diện tích, tiện nghi, hình ảnh thực tế 100%.",
            color: "bg-blue-500",
          },
          {
            icon: Shield,
            title: "Hệ thống xác thực",
            desc: "Cơ chế Trust is King xác thực vị trí GPS tại chỗ, đảm bảo an toàn tuyệt đối.",
            color: "bg-purple-500",
          },
        ].map((f, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(300 + i * 100).springify()}
            className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-slate-100 items-center"
          >
            <View
              className={`w-16 h-16 ${f.color} rounded-2xl items-center justify-center mb-4`}
            >
              <f.icon size={32} color="white" />
            </View>
            <Text className="font-black text-xl text-emerald-700 mb-2">
              {f.title}
            </Text>
            <Text className="text-slate-600 text-center">{f.desc}</Text>
          </Animated.View>
        ))}
      </View>

      {/* How it Works Section */}
      <View className="py-12 px-4 bg-slate-50">
        <View className="items-center mb-10">
          <Text className="text-green-600 font-black text-xs uppercase tracking-widest mb-2">
            Hành trình trải nghiệm
          </Text>
          <Text className="text-3xl font-black text-emerald-700 text-center mb-2">
            Tìm trọ chỉ với 4 bước
          </Text>
        </View>

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
            desc: "Khám phá vị trí thực tế",
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
            desc: "Gọi trực tiếp chủ trọ",
            color: "bg-orange-600",
          },
        ].map((s, i) => (
          <Animated.View
            key={i}
            entering={FadeInRight.delay(400 + i * 100).springify()}
            className="flex-row items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
          >
            <View
              className={`w-16 h-16 ${s.color} rounded-2xl items-center justify-center mr-4 relative`}
            >
              <s.icon size={28} color="white" />
              <View className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full items-center justify-center shadow-sm">
                <Text className="text-xs font-bold text-slate-800">
                  {s.step}
                </Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg text-emerald-700 mb-1">
                {s.title}
              </Text>
              <Text className="text-slate-500 text-sm">{s.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Verified Properties Section */}
      <View className="py-12 px-4 bg-white">
        <View className="items-center mb-8">
          <View className="flex-row items-center bg-emerald-50 px-4 py-2 rounded-full mb-4 border border-emerald-100">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <Text className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              Hệ thống đã xác thực
            </Text>
          </View>
          <Text className="text-3xl font-black text-emerald-700 mb-2">
            Nhà Trọ Uy Tín
          </Text>
          <Text className="text-emerald-700/60 text-center px-4">
            Các tin đăng được xác thực trực tiếp tại chỗ qua hệ thống Trust is
            King
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#059669" className="my-8" />
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
            className="pl-2"
          >
            {verifiedProperties.map((item) => (
              <View key={item.id} className="w-[300px] mr-4">
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
          className="bg-emerald-600 mx-8 py-4 rounded-2xl flex-row justify-center items-center mt-4"
        >
          <Text className="text-white font-bold mr-2">
            Xem tất cả trên bản đồ
          </Text>
          <ArrowRight size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Browse by District */}
      <View className="py-12 px-4 bg-slate-50">
        <View className="items-center mb-8">
          <Text className="text-emerald-600 font-black text-xs uppercase tracking-widest mb-2">
            Thành phố Hồ Chí Minh
          </Text>
          <Text className="text-3xl font-black text-emerald-700 mb-2">
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
                className="rounded-3xl overflow-hidden relative h-40 w-full"
              >
                <Image
                  source={{ uri: d.image }}
                  className="w-full h-full absolute"
                />
                <View className="absolute inset-0 bg-black/40" />
                <View className="absolute bottom-4 left-4">
                  <Text className="text-white font-black text-xl mb-1">
                    {d.name}
                  </Text>
                  <Text className="text-emerald-50/80 text-[10px] font-bold uppercase">
                    {d.count} phòng trọ
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
