import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
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
  Quote,
  Star,
  TrendingUp,
  Clock,
  Eye,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProperties } from "../../contexts/PropertiesContext";
import api from "../../utils/api";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

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

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [statsRes, reviewsRes, blogsRes] = await Promise.allSettled([
          api.get("/api/properties/stats/public"),
          api.get("/api/reviews/latest"),
          api.get("/api/blogs?limit=3"),
        ]);
        
        if (statsRes.status === "fulfilled" && statsRes.value?.data) {
          setStats({
            totalProperties: statsRes.value.data.totalProperties || 10,
            totalUsers: statsRes.value.data.totalUsers || 50,
            totalDistricts: statsRes.value.data.totalDistricts || 12,
            satisfactionRate: statsRes.value.data.satisfactionRate || 98,
          });
        }
        
        if (reviewsRes.status === "fulfilled" && reviewsRes.value?.data) {
          setTestimonials(reviewsRes.value.data);
        }
        
        if (blogsRes.status === "fulfilled" && blogsRes.value?.data) {
          setBlogPosts(blogsRes.value.data);
        }
      } catch (e) {
        console.log("Failed to fetch home data", e);
      }
    };
    fetchHomeData();
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
          <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-2 border border-slate-100/50 shadow-md overflow-hidden">
            <Image
              source={require("../../assets/images/MapHome_logo_2.png")}
              className="w-[120%] h-[120%]"
              resizeMode="cover"
            />
          </View>
          <Text className="text-xl font-black text-emerald-950 tracking-tighter">
            MapHome
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigateTo(router, ROUTES.BLOG)}
          className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center relative shadow-sm border border-slate-100"
        >
          <Bell size={20} color="#145231" />
          <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </TouchableOpacity>
      </Animated.View>

      <HeroCarousel />

      {/* Stats Section with Gradient Aura feel */}
      <Animated.View entering={FadeInRight.delay(200).springify()} className="py-10 px-4 relative overflow-hidden">
        <LinearGradient
          colors={['#16a34a', '#059669', '#0d9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <View className="flex-row flex-wrap justify-between relative z-10">
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
            <View key={i} className="w-[45%] items-center mb-6">
              <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center mb-3 border border-white/20">
                <stat.icon size={28} color="#bbf7d0" />
              </View>
              <Text className="text-3xl font-black text-white mb-1 tracking-tight">
                {stat.target}
              </Text>
              <Text className="text-green-100/80 text-xs font-bold uppercase tracking-widest">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Features Section */}
      <View className="py-12 px-4 relative">
        <View className="items-center mb-10">
          <Text className="text-3xl font-black text-emerald-900 text-center mb-3 tracking-tighter">
            Tại Sao Chọn MapHome?
          </Text>
          <Text className="text-slate-600 text-center px-4 font-medium leading-relaxed">
            Nền tảng tìm trọ hiện đại với công nghệ tiên tiến, giúp bạn tìm được
            ngôi nhà thứ hai một cách dễ dàng và nhanh chóng nhất.
          </Text>
        </View>

        {[
          {
            icon: MapPin,
            title: "Bản đồ tương tác",
            desc: "Xem vị trí chính xác và khám phá các tiện ích xung quanh như bệnh viện, trường học, siêu thị.",
            colors: ['#22c55e', '#059669'],
          },
          {
            icon: Home,
            title: "Thông tin đầy đủ",
            desc: "Chi tiết về giá cả, diện tích, tiện nghi, hình ảnh thực tế 100%.",
            colors: ['#3b82f6', '#4f46e5'],
          },
          {
            icon: Shield,
            title: "Hệ thống xác thực",
            desc: "Cơ chế Trust is King xác thực vị trí GPS tại chỗ, đảm bảo an toàn tuyệt đối.",
            colors: ['#a855f7', '#db2777'],
          },
        ].map((f, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(300 + i * 100).springify()}
            className="bg-white rounded-[32px] p-6 mb-6 shadow-xl shadow-slate-200/50 border border-slate-100 items-center overflow-hidden"
          >
            <View className="w-20 h-20 rounded-[28px] overflow-hidden items-center justify-center mb-5 shadow-lg">
              <LinearGradient
                colors={f.colors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
              <f.icon size={36} color="white" />
            </View>
            <Text className="font-black text-2xl text-emerald-950 mb-3 tracking-tight text-center">
              {f.title}
            </Text>
            <Text className="text-slate-500 text-center leading-relaxed font-medium">
              {f.desc}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* How it Works Section */}
      <View className="py-12 px-4 bg-slate-50 border-t border-slate-100">
        <View className="items-center mb-10">
          <Text className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3">
            Hành trình trải nghiệm
          </Text>
          <Text className="text-3xl font-black text-emerald-900 text-center mb-2 tracking-tighter">
            Tìm trọ chỉ với 4 bước
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between">
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
              desc: "Khám phá vị trí",
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
              desc: "Gọi chủ trọ",
              color: "bg-orange-600",
            },
          ].map((s, i) => (
            <Animated.View
              key={i}
              entering={ZoomIn.delay(400 + i * 100).springify()}
              className="w-[48%] mb-6 items-center"
            >
              <View
                className={`w-20 h-20 ${s.color} rounded-3xl items-center justify-center mb-4 shadow-lg relative`}
              >
                <s.icon size={32} color="white" />
                <View className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full items-center justify-center shadow-md border-2 border-slate-50">
                  <Text className="text-sm font-black text-slate-800">
                    {s.step}
                  </Text>
                </View>
              </View>
              <Text className="font-black text-lg text-emerald-950 mb-1 text-center">
                {s.title}
              </Text>
              <Text className="text-slate-500 text-xs text-center font-medium px-2">
                {s.desc}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Verified Properties Section */}
      <View className="py-12 px-0 bg-white">
        <View className="items-center mb-8 px-4">
          <View className="flex-row items-center bg-emerald-50 px-5 py-2.5 rounded-full mb-5 border border-emerald-100">
            <View className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2" />
            <Text className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em]">
              Hệ thống đã xác thực
            </Text>
          </View>
          <Text className="text-3xl font-black text-emerald-900 mb-3 tracking-tighter">
            Nhà Trọ Uy Tín
          </Text>
          <Text className="text-emerald-950/60 text-center font-medium">
            Các tin đăng được xác thực trực tiếp tại chỗ qua hệ thống Trust is
            King
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#16a34a" className="my-8" />
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
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {verifiedProperties.map((item) => (
              <View key={item.id} className="w-[300px] mr-4 pb-4">
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
          className="mx-4 mt-6 overflow-hidden rounded-[24px]"
        >
          <LinearGradient
            colors={['#16a34a', '#15803d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 flex-row justify-center items-center shadow-xl"
          >
            <Text className="text-white font-black text-lg mr-3">
              Xem tất cả trên bản đồ
            </Text>
            <ArrowRight size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Browse by District */}
      <View className="py-12 px-4 bg-slate-50 border-t border-slate-100">
        <View className="items-center mb-10">
          <Text className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3">
            Thành phố Hồ Chí Minh
          </Text>
          <Text className="text-3xl font-black text-emerald-900 mb-2 tracking-tighter">
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
                className="rounded-3xl overflow-hidden relative h-48 w-full border border-slate-100 shadow-sm"
              >
                <Image
                  source={{ uri: d.image }}
                  className="w-full h-full absolute"
                />
                <LinearGradient
                  colors={['rgba(5, 46, 22, 0.9)', 'rgba(20, 82, 49, 0.3)', 'transparent']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  className="absolute inset-0"
                />
                <View className="absolute bottom-4 left-4">
                  <Text className="text-white font-black text-xl mb-1 tracking-tight">
                    {d.name}
                  </Text>
                  <Text className="text-emerald-50/90 text-[10px] font-bold uppercase tracking-widest">
                    {d.count.toLocaleString("vi-VN")} phòng trọ
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <View className="py-12 bg-white">
          <View className="items-center mb-10 px-4">
            <Text className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
              Cảm nhận từ khách hàng
            </Text>
            <Text className="text-3xl font-black text-emerald-900 mb-3 tracking-tighter text-center">
              Người Dùng Nói Gì?
            </Text>
            <Text className="text-emerald-950/70 text-center font-medium">
              Lắng nghe những câu chuyện tìm thấy tổ ấm thực sự từ cộng đồng.
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {testimonials.map((t) => (
              <View key={t.id} className="w-[320px] mr-4 pb-6 pt-4">
                <View className="bg-white rounded-[40px] p-6 shadow-xl shadow-green-900/10 border border-slate-50 relative">
                  <View className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-md items-center justify-center border border-green-50 z-10">
                    <Quote size={20} color="#22c55e" opacity={0.5} />
                  </View>

                  <View className="flex-row items-center mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        color={i < t.rating ? "#fbbf24" : "#f1f5f9"}
                        fill={i < t.rating ? "#fbbf24" : "transparent"}
                        className="mr-1"
                      />
                    ))}
                  </View>

                  <Text className="text-slate-600 text-base leading-relaxed mb-6 font-medium italic">
                    "{t.text}"
                  </Text>

                  <View className="flex-row items-center pt-5 border-t border-slate-50">
                    <View className="relative">
                      <LinearGradient
                        colors={['#4ade80', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3 shadow-md"
                      >
                        <Text className="text-white text-lg font-black">{t.avatar}</Text>
                      </LinearGradient>
                      <View className="absolute -bottom-1 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white items-center justify-center">
                        <CheckCircle2 size={12} color="white" />
                      </View>
                    </View>
                    <View>
                      <Text className="font-black text-[15px] text-emerald-950 tracking-tight">
                        {t.name}
                      </Text>
                      <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {t.role}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Blog / Tips */}
      {blogPosts.length > 0 && (
        <View className="py-12 px-4 bg-slate-50">
          <View className="flex-row justify-between items-end mb-8">
            <View className="flex-1">
              <View className="flex-row items-center bg-green-50 self-start px-3 py-1 rounded-lg mb-3 border border-green-100">
                <TrendingUp size={12} color="#16a34a" className="mr-2" />
                <Text className="text-green-600 text-[10px] font-black uppercase tracking-widest">
                  Xu hướng tìm trọ
                </Text>
              </View>
              <Text className="text-3xl font-black text-emerald-900 tracking-tighter">
                Kinh Nghiệm Thuê Trọ
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigateTo(router, ROUTES.BLOG)}
              className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center"
            >
              <ArrowRight size={18} color="#16a34a" />
            </TouchableOpacity>
          </View>

          {blogPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              onPress={() => navigateTo(router, ROUTES.BLOG)}
              className="bg-white rounded-[24px] overflow-hidden mb-6 shadow-lg shadow-slate-200/50 border border-slate-100"
            >
              <View className="h-48 relative">
                <Image
                  source={{ uri: post.image }}
                  className="w-full h-full absolute"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/20" />
                <View className="absolute top-4 left-4 bg-white/90 px-4 py-2 rounded-xl shadow-md">
                  <Text className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    {post.category}
                  </Text>
                </View>
              </View>
              <View className="p-6">
                <Text className="font-black text-lg mb-2 text-emerald-950 leading-snug">
                  {post.title}
                </Text>
                <Text className="text-slate-600 text-sm leading-relaxed mb-5 font-medium" numberOfLines={2}>
                  {post.excerpt}
                </Text>
                <View className="flex-row items-center justify-between pt-4 border-t border-slate-50">
                  <View className="flex-row items-center">
                    <View className="flex-row items-center mr-4">
                      <Clock size={12} color="#16a34a" className="mr-1.5" />
                      <Text className="text-[11px] font-bold text-slate-500">{post.readTime}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Eye size={12} color="#2563eb" className="mr-1.5" />
                      <Text className="text-[11px] font-bold text-slate-500">
                        {post.views?.toLocaleString("vi-VN")}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {post.date}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Landlord CTA */}
      <View className="my-10 mx-4 rounded-[32px] overflow-hidden shadow-2xl relative">
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1649663724528-3bd2ce98b6e3?w=800&q=80" }}
          className="p-8 items-center"
        >
          <LinearGradient
            colors={['rgba(5, 46, 22, 0.95)', 'rgba(20, 82, 49, 0.9)', 'rgba(6, 78, 59, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="absolute inset-0"
          />
          
          <View className="flex-row items-center bg-white/20 px-4 py-2 rounded-full mb-6 border border-white/30 z-10">
            <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            <Text className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">
              Dành riêng cho chủ trọ
            </Text>
          </View>

          <Text className="text-3xl font-black text-white text-center mb-4 tracking-tighter leading-tight z-10">
            Tối Ưu Doanh Thu{"\n"}
            <Text className="text-emerald-400">Từ Bất Động Sản</Text>
          </Text>

          <Text className="text-green-50 text-center mb-8 font-medium leading-relaxed z-10 px-2">
            Gia nhập cộng đồng hơn 5.000+ chủ trọ đang kinh doanh hiệu quả
            trên MapHome.
          </Text>

          <TouchableOpacity
            onPress={() => navigateTo(router, ROUTES.POST_ROOM)}
            className="w-full z-10"
          >
            <LinearGradient
              colors={['#10b981', '#22c55e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 rounded-[20px] flex-row items-center justify-center shadow-lg"
            >
              <FileText size={20} color="white" className="mr-2" />
              <Text className="text-white font-black text-lg">Đăng tin miễn phí ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ImageBackground>
      </View>
      
      <View className="h-10" />
    </ScrollView>
  );
}
